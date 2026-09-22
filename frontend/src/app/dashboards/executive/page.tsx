"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/api";
import { Heatmap, LinkButton, MetricCard, MiniBars, Panel, PanelHeader, ScoreRing, SeverityBadge } from "@/components/DashboardPrimitives";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Summary = { total_indicators: number; high_risk_investigations: number; total_alerts: number; open_alerts: number; total_incidents: number; open_incidents: number; total_security_events: number; indicator_distribution: { ip: number; domain: number; url: number; hash: number }; recent_alerts: Array<{ id: number; indicator_id: number; severity_score: number; rule: string; status: string }> };

export default function ExecutiveDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; async function load() { try { const r = await fetch(`${API_URL}/api/v1/dashboard/summary`); const summary = (await r.json()) as Summary; if (active) setData(summary); await getAlerts(); } finally { if (active) setLoading(false); } } void load(); return () => { active = false; }; }, []);

  if (loading || !data) return <div className="p-8 text-sm text-slate-500">Loading executive overview...</div>;
  const risk = Math.min(100, Math.round((data.open_alerts * 5 + data.high_risk_investigations * 7 + data.open_incidents * 9) / Math.max(1, data.total_indicators / 10)));

  return <div className="p-5 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">Executive overview</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Risk posture at a glance</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A leadership view of current exposure, alert throughput and active intelligence coverage.</p></div>
      <LinkButton href="/incidents">Review active incidents</LinkButton>
    </div>
    <div className="grid gap-4 lg:grid-cols-[auto_1fr_1fr_1fr]">
      <Panel className="flex items-center justify-center p-6"><ScoreRing score={risk} /></Panel>
      <MetricCard label="Active high / critical signals" value={data.high_risk_investigations} detail="High-risk investigations" tone="danger" />
      <MetricCard label="Alert throughput" value={data.total_alerts} detail={`${data.open_alerts} remain open`} />
      <MetricCard label="Open incidents" value={data.open_incidents} detail={`${data.total_incidents} total incidents`} />
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel><PanelHeader title="Operational trend" subtitle="Current posture visualization" /><div className="p-5"><MiniBars values={[24, 29, 34, 31, 45, 41, 56, 62, 58, 67, 72, 69, 78, 84]} /><div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-slate-600"><span>Earlier</span><span>Current</span></div></div></Panel>
      <Panel><PanelHeader title="Threat geography" subtitle="Global activity density" /><div className="p-5"><Heatmap /></div></Panel>
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-3">
      <Panel><PanelHeader title="Top threat categories" subtitle="Operationally visible categories" /><div className="space-y-3 p-5">{["Credential abuse", "Malware delivery", "C2 infrastructure", "Phishing"].map((item, index) => <div key={item} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3"><span className="text-sm text-slate-300">{item}</span><span className="text-xs font-semibold text-cyan-300">{[82, 71, 64, 52][index]} signals</span></div>)}</div></Panel>
      <Panel><PanelHeader title="Alert health" subtitle="Lifecycle distribution" /><div className="space-y-3 p-5">{["new", "acknowledged", "in-progress", "resolved"].map((status, index) => <div key={status} className="flex items-center justify-between"><span className="text-xs capitalize text-slate-400">{status}</span><div className="flex items-center gap-3"><div className="h-1.5 w-28 rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400/70" style={{ width: `${78 - index * 14}%` }} /></div><span className="w-8 text-right text-xs text-slate-500">{78 - index * 14}</span></div></div>)}</div></Panel>
      <Panel><PanelHeader title="Critical queue" subtitle="Highest-severity current alerts" /><div className="divide-y divide-slate-800/80">{data.recent_alerts.slice(0, 5).map((alert) => <div key={alert.id} className="flex items-center gap-3 px-5 py-3"><SeverityBadge severity={alert.severity_score >= 90 ? "critical" : alert.severity_score >= 70 ? "high" : "medium"} /><div className="min-w-0 flex-1 truncate text-xs text-slate-300">{alert.rule}</div><span className="text-xs font-semibold text-white">{alert.severity_score}</span></div>)}</div></Panel>
    </div>
  </div>;
}
