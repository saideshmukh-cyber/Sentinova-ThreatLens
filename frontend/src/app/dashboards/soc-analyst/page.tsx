"use client";

import { useEffect, useMemo, useState } from "react";
import { getAlerts, getIndicators, updateAlert } from "@/lib/api";
import type { Alert } from "@/types/alert";
import type { Indicator } from "@/types/indicator";
import { LinkButton, MetricCard, Panel, PanelHeader, SeverityBadge } from "@/components/DashboardPrimitives";

export default function SocAnalystDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selected, setSelected] = useState<Indicator | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { let active = true; async function load() { try { const [alertData, indicatorData] = await Promise.all([getAlerts(), getIndicators({ page: 1, size: 12 })]); if (!active) return; setAlerts(alertData); setIndicators(indicatorData.items); } finally { if (active) setLoading(false); } } void load(); return () => { active = false; }; }, []);

  const open = useMemo(() => alerts.filter((a) => a.status === "new" || a.status === "acknowledged" || a.status === "in-progress"), [alerts]);
  const unassigned = open.filter((a) => !a.assignee).length;
  const myQueue = open.filter((a) => a.assignee === "SOC Analyst").length;

  async function acknowledge(alert: Alert) { try { setBusyId(alert.id); const updated = await updateAlert(alert.id, { status: "acknowledged" }); setAlerts((current) => current.map((item) => item.id === updated.id ? updated : item)); } finally { setBusyId(null); } }

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading analyst workspace...</div>;

  return <div className="p-5 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">SOC analyst</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Prioritised triage workspace</h1><p className="mt-2 text-sm leading-6 text-slate-500">Focus on severity, ownership and fast access to indicator context.</p></div><LinkButton href="/alerts">Open full alert queue</LinkButton></div>
    <div className="grid gap-4 md:grid-cols-3"><MetricCard label="New / active alerts" value={open.length} detail="Current analyst queue" tone="danger" /><MetricCard label="Unassigned" value={unassigned} detail="Need an owner" /><MetricCard label="My queue" value={myQueue} detail="Assigned to SOC Analyst" tone="accent" /></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <Panel><PanelHeader title="Alert queue" subtitle="Sorted by severity score" />
        <div className="divide-y divide-slate-800/80">{open.slice().sort((a,b)=>b.severity_score-a.severity_score).slice(0, 10).map((alert) => <div key={alert.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><SeverityBadge severity={alert.severity_score >= 90 ? "critical" : alert.severity_score >= 70 ? "high" : alert.severity_score >= 40 ? "medium" : "low"} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-slate-200">{alert.rule}</div><div className="mt-1 text-xs text-slate-500">Indicator #{alert.indicator_id} · {alert.assignee ?? "Unassigned"}</div></div><div className="flex items-center gap-2"><span className="text-sm font-semibold text-white">{alert.severity_score}</span><button type="button" disabled={busyId === alert.id || alert.status !== "new"} onClick={() => void acknowledge(alert)} className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">Acknowledge</button></div></div>)}</div>
      </Panel>
      <Panel><PanelHeader title="Indicator context" subtitle="Click an IOC to inspect the record" />
        <div className="divide-y divide-slate-800/80">{indicators.map((indicator) => <button key={indicator.id} type="button" onClick={() => setSelected(indicator)} className={`block w-full px-5 py-4 text-left transition hover:bg-slate-900/70 ${selected?.id === indicator.id ? "bg-cyan-400/5" : ""}`}><div className="flex items-center justify-between gap-3"><SeverityBadge severity="low" label={indicator.indicator_type} /><span className="text-[10px] text-slate-600">#{indicator.id}</span></div><div className="mt-2 break-all text-sm text-slate-200">{indicator.value}</div><div className="mt-1 text-xs text-slate-600">Click for detail</div></button>)}</div>
      </Panel>
    </div>
    {selected && <Panel className="mt-4"><PanelHeader title="Indicator detail drawer" subtitle="Selected analyst context" action={<button type="button" onClick={() => setSelected(null)} className="text-xs text-slate-500 hover:text-white">Close</button>} /><div className="grid gap-4 p-5 sm:grid-cols-3"><div><div className="text-[10px] uppercase tracking-wider text-slate-600">Type</div><div className="mt-2 text-sm text-white">{selected.indicator_type}</div></div><div className="sm:col-span-2"><div className="text-[10px] uppercase tracking-wider text-slate-600">Value</div><div className="mt-2 break-all font-mono text-sm text-cyan-300">{selected.value}</div></div><div><LinkButton href={`/indicators/${selected.id}`}>Open full indicator</LinkButton></div><div className="sm:col-span-2 text-xs leading-5 text-slate-500">Use the full indicator view for enrichment, source provenance and scoring actions.</div></div></Panel>}
  </div>;
}
