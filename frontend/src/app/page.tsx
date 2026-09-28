"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAlerts, getDashboardAnalytics, getDashboardLayout, getDashboardSummary, saveDashboardLayout } from "@/lib/api";
import type { DashboardAnalytics } from "@/types/dashboard";
import { DonutLegend, GeoHeatmap, LinkButton, MetricCard, Panel, PanelHeader, ScoreRing, SeverityBadge, SeverityDistribution, TechniqueBreakdown, TrendChart, WidgetToggle } from "@/components/DashboardPrimitives";

 type Summary = { total_indicators:number; total_investigations:number; high_risk_investigations:number; total_alerts:number; open_alerts:number; total_incidents:number; open_incidents:number; total_security_events:number; indicator_distribution:Record<string,number> };

const widgets = [
  { id: "risk", label: "Risk posture" },
  { id: "trends", label: "Trends" },
  { id: "map", label: "Global activity" },
  { id: "sources", label: "Top sources" },
  { id: "severity", label: "Severity" },
  { id: "techniques", label: "ATT&CK" },
  { id: "queue", label: "Priority queue" },
];

const defaultVisible = Object.fromEntries(widgets.map((widget) => [widget.id, true]));

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<string, boolean>>(defaultVisible);
  const [alerts, setAlerts] = useState<Awaited<ReturnType<typeof getAlerts>>>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [s, a, al, layout] = await Promise.all([getDashboardSummary<Summary>(), getDashboardAnalytics(), getAlerts(), getDashboardLayout()]);
        if (!alive) return;
        const stored = Object.keys(layout.visible ?? {}).length ? layout.visible : (() => { try { return JSON.parse(localStorage.getItem("threatlens_widget_layout") || "{}"); } catch { return {}; } })();
        setSummary(s);
        setAnalytics(a);
        setAlerts(al);
        setVisible({ ...defaultVisible, ...stored });
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, []);

  const avg = useMemo(() => alerts.length ? Math.round(alerts.reduce((n, a) => n + a.severity_score, 0) / alerts.length) : 0, [alerts]);

  async function toggle(id: string) {
    const next = { ...visible, [id]: !visible[id] };
    setVisible(next);
    try { localStorage.setItem("threatlens_widget_layout", JSON.stringify(next)); } catch {}
    try { await saveDashboardLayout(next); } catch {}
  }

  if (loading || !summary || !analytics) return <div className="p-6 lg:p-8"><div className="h-5 w-64 animate-pulse rounded bg-slate-800"/><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-900"/>)}</div></div>;

  return <div className="p-5 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-400">Mission control</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">ThreatLens Command Center</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Unified CTI posture across intelligence, enrichment, alerts, correlation and incident response.</p></div><div className="flex flex-wrap gap-2"><LinkButton href="/dashboards/executive">Executive</LinkButton><LinkButton href="/dashboards/soc-analyst">Analyst workspace</LinkButton><a href="http://localhost:8000/api/v1/reports/executive.pdf" target="_blank" rel="noreferrer" className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200">PDF report</a></div></div>
    <div className="mb-5 rounded-2xl border border-slate-800 bg-[#0a1520]/75 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-600">Workspace layout</div><div className="mt-1 text-xs text-slate-500">Widget visibility is saved for the active user when authentication is enabled.</div></div><WidgetToggle labels={widgets} visible={visible} onToggle={(id) => void toggle(id)}/></div></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><MetricCard label="Risk score" value={analytics.risk_score} detail="Current top-50 indicator posture" tone="accent"/><MetricCard label="Indicators" value={summary.total_indicators} detail="Normalized intelligence corpus"/><MetricCard label="Critical / high" value={analytics.active_critical_high} detail="Score ≥ 70" tone="danger"/><MetricCard label="Open alerts" value={summary.open_alerts} detail={`${summary.total_alerts.toLocaleString()} total`} tone="danger"/><MetricCard label="Open incidents" value={summary.open_incidents} detail={`${summary.total_incidents.toLocaleString()} total`}/></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[.72fr_1.28fr]">{visible.risk && <Panel><PanelHeader title="Risk posture" subtitle="Transparent severity model"/><div className="flex items-center justify-center p-8"><ScoreRing score={analytics.risk_score}/></div><div className="grid grid-cols-2 gap-3 px-5 pb-5"><MetricCard label="Avg alert score" value={avg} detail="Current alert queue"/><MetricCard label="High-risk investigations" value={analytics.high_risk_investigations}/></div></Panel>}{visible.trends && <Panel><PanelHeader title="30-day activity" subtitle="Indicators and internal security events"/><div className="p-5"><TrendChart values={analytics.volume_trend.map(x=>x.indicators)} secondary={analytics.volume_trend.map(x=>x.events)} labels={analytics.volume_trend.map(x=>x.date)}/></div></Panel>}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-2">{visible.map && <Panel><PanelHeader title="Global threat activity" subtitle="Geographic activity from enrichment telemetry"/><div className="p-4"><GeoHeatmap points={analytics.geo_activity}/></div></Panel>}{visible.sources && <Panel><PanelHeader title="Threat source concentration" subtitle="Provenance represented in the indicator corpus"/><div className="p-5"><DonutLegend rows={analytics.source_breakdown.slice(0,6).map((r,i)=>({label:r.label,value:r.value,className:["bg-cyan-400","bg-sky-400","bg-violet-400","bg-amber-400","bg-emerald-400","bg-rose-400"][i%6]}))}/></div></Panel>}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-3">{visible.severity && <Panel><PanelHeader title="Severity distribution"/><div className="p-5"><SeverityDistribution values={analytics.severity_distribution}/></div></Panel>}{visible.techniques && <Panel><PanelHeader title="ATT&amp;CK technique coverage" subtitle="Mapped techniques across indicators"/><div className="p-5"><TechniqueBreakdown rows={analytics.attack_technique_breakdown}/></div></Panel>}{visible.queue && <Panel><PanelHeader title="Priority queue" subtitle="Highest-score alerts" action={<LinkButton href="/alerts">Open alerts</LinkButton>}/><div className="divide-y divide-slate-800/80">{alerts.slice().sort((a,b)=>b.severity_score-a.severity_score).slice(0,7).map(alert=><Link key={alert.id} href={`/alerts`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-950/40"><SeverityBadge severity={alert.severity_score>=90?"critical":alert.severity_score>=70?"high":alert.severity_score>=40?"medium":"low"}/><span className="min-w-0 flex-1 text-xs text-slate-300">Alert #{alert.id} · IOC #{alert.indicator_id}</span><span className="font-mono text-xs font-semibold text-white">{alert.severity_score}</span></Link>)}</div></Panel>}</div>
  </div>;
}
