"use client";

import { useEffect, useMemo, useState } from "react";
import { getAlerts } from "@/lib/api";
import { DonutLegend, Heatmap, LinkButton, MetricCard, MiniBars, Panel, PanelHeader, SeverityBadge } from "@/components/DashboardPrimitives";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type DashboardSummary = {
  total_indicators: number;
  total_investigations: number;
  high_risk_investigations: number;
  total_alerts: number;
  open_alerts: number;
  total_incidents: number;
  open_incidents: number;
  total_security_events: number;
  indicator_distribution: { ip: number; domain: number; url: number; hash: number };
  recent_alerts: Array<{ id: number; indicator_id: number; severity_score: number; rule: string; status: string; assignee: string | null; created_at: string }>;
};

type Alert = Awaited<ReturnType<typeof getAlerts>>[number];

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [summaryResponse, alertData] = await Promise.all([
          fetch(`${API_URL}/api/v1/dashboard/summary`),
          getAlerts(),
        ]);
        if (!summaryResponse.ok) throw new Error(`Failed to load dashboard: ${summaryResponse.status}`);
        const summary = (await summaryResponse.json()) as DashboardSummary;
        if (!active) return;
        setDashboard(summary);
        setAlerts(alertData);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const averageScore = useMemo(() => {
    if (alerts.length === 0) return 0;
    return Math.round(alerts.reduce((sum, alert) => sum + alert.severity_score, 0) / alerts.length);
  }, [alerts]);

  if (loading) return <div className="p-6 lg:p-8"><div className="h-6 w-56 animate-pulse rounded bg-slate-800" /><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-900" />)}</div></div>;
  if (error || !dashboard) return <div className="p-6 lg:p-8"><div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-sm text-rose-300">{error ?? "Dashboard data unavailable."}</div></div>;

  const distribution = dashboard.indicator_distribution;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">Operational snapshot</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">ThreatLens Command Center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A shared SOC workspace for indicators, alerts, incidents, correlation and live threat activity.</p>
        </div>
        <div className="flex gap-2"><LinkButton href="/dashboards/soc-analyst">Open analyst workspace</LinkButton><LinkButton href="/indicators">Search intelligence</LinkButton></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Indicators" value={dashboard.total_indicators} detail="Canonical IOC records" tone="accent" />
        <MetricCard label="Open Alerts" value={dashboard.open_alerts} detail={`${dashboard.total_alerts.toLocaleString()} total alerts`} tone="danger" />
        <MetricCard label="Open Incidents" value={dashboard.open_incidents} detail={`${dashboard.total_incidents.toLocaleString()} total incidents`} />
        <MetricCard label="Avg Alert Score" value={averageScore} detail="Current alert population" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.9fr_0.9fr]">
        <Panel>
          <PanelHeader title="Threat activity" subtitle="Live operational signal overview" />
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Security events</div>
                <div className="mt-2 text-3xl font-semibold text-white">{dashboard.total_security_events.toLocaleString()}</div>
                <div className="mt-1 text-xs text-slate-500">Received by the correlation layer</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Investigations</div>
                <div className="mt-2 text-3xl font-semibold text-white">{dashboard.total_investigations.toLocaleString()}</div>
                <div className="mt-1 text-xs text-slate-500">{dashboard.high_risk_investigations.toLocaleString()} high-risk investigations</div>
              </div>
            </div>
            <div className="mt-5"><MiniBars values={[28, 44, 38, 61, 52, 74, 63, 82, 69, 88, 78, 94]} /></div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Indicator mix" subtitle="Current normalized corpus" />
          <div className="p-5"><DonutLegend rows={[{ label: "IP", value: distribution.ip, className: "bg-cyan-400" }, { label: "Domain", value: distribution.domain, className: "bg-sky-400" }, { label: "URL", value: distribution.url, className: "bg-violet-400" }, { label: "Hash", value: distribution.hash, className: "bg-amber-400" }]} /></div>
        </Panel>

        <Panel>
          <PanelHeader title="Global activity" subtitle="Threat density visualization" />
          <div className="p-5"><Heatmap /></div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelHeader title="Priority alert queue" subtitle="Most recent alerts requiring analyst attention" action={<LinkButton href="/alerts">View all</LinkButton>} />
          <div className="divide-y divide-slate-800/80">
            {dashboard.recent_alerts.length === 0 ? <div className="p-6 text-sm text-slate-500">No alerts available.</div> : dashboard.recent_alerts.slice(0, 6).map((alert) => {
              const severity = alert.severity_score >= 90 ? "critical" : alert.severity_score >= 70 ? "high" : alert.severity_score >= 40 ? "medium" : "low";
              return <div key={alert.id} className="flex items-center gap-4 px-5 py-4"><SeverityBadge severity={severity} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-slate-200">{alert.rule}</div><div className="mt-1 text-xs text-slate-500">Indicator #{alert.indicator_id} · {alert.assignee ?? "Unassigned"}</div></div><div className="text-right"><div className="text-sm font-semibold text-white">{alert.severity_score}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">{alert.status}</div></div></div>;
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Coverage posture" subtitle="Operational counts from the current backend" />
          <div className="grid grid-cols-2 gap-3 p-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="text-xs text-slate-500">URLs</div><div className="mt-2 text-xl font-semibold text-white">{distribution.url.toLocaleString()}</div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="text-xs text-slate-500">Hashes</div><div className="mt-2 text-xl font-semibold text-white">{distribution.hash.toLocaleString()}</div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="text-xs text-slate-500">High-risk investigations</div><div className="mt-2 text-xl font-semibold text-white">{dashboard.high_risk_investigations.toLocaleString()}</div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="text-xs text-slate-500">Open alerts</div><div className="mt-2 text-xl font-semibold text-white">{dashboard.open_alerts.toLocaleString()}</div></div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
