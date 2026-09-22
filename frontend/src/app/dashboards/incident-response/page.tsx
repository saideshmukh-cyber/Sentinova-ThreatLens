"use client";

import { useEffect, useState } from "react";
import { getIncidents } from "@/lib/api";
import type { Incident } from "@/types/incident";
import { LinkButton, MetricCard, Panel, PanelHeader, SeverityBadge } from "@/components/DashboardPrimitives";

export default function IncidentResponseDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; async function load() { try { const data = await getIncidents(); if (active) setIncidents(data); } finally { if (active) setLoading(false); } } void load(); return () => { active = false; }; }, []);
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading incident response workspace...</div>;
  const open = incidents.filter((item) => item.status !== "closed").length;
  const critical = incidents.filter((item) => item.severity === "critical").length;
  return <div className="p-5 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">Incident response</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Investigation workspace</h1><p className="mt-2 text-sm leading-6 text-slate-500">Track linked incidents, analyst actions and chronological response activity.</p></div><LinkButton href="/incidents">Open incidents</LinkButton></div>
    <div className="grid gap-4 md:grid-cols-3"><MetricCard label="Open incidents" value={open} detail="Not yet closed" /><MetricCard label="Critical incidents" value={critical} detail="Highest severity" tone="danger" /><MetricCard label="Total incidents" value={incidents.length} detail="Current incident corpus" tone="accent" /></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel><PanelHeader title="Incident workspace" subtitle="Most recent investigations" /><div className="divide-y divide-slate-800/80">{incidents.slice(0, 10).map((incident) => <div key={incident.id} className="flex items-center gap-4 px-5 py-4"><SeverityBadge severity={incident.severity} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-slate-200">{incident.title}</div><div className="mt-1 text-xs text-slate-500">{incident.assignee ?? "Unassigned"} · {incident.status}</div></div><LinkButton href={`/incidents/${incident.id}`}>Workspace</LinkButton></div>)}</div></Panel>
      <Panel><PanelHeader title="Response checklist" subtitle="Operational runbook surface" /><div className="space-y-3 p-5">{["Validate linked indicators", "Review correlated alerts", "Capture analyst actions", "Document containment decision", "Generate incident report"].map((item, index) => <label key={item} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-300"><input type="checkbox" defaultChecked={index < 2} className="h-4 w-4 accent-cyan-400" />{item}</label>)}</div></Panel>
    </div>
    <Panel className="mt-4"><PanelHeader title="Timeline posture" subtitle="Incident activity is maintained in the dedicated incident timeline view" /><div className="grid gap-3 p-5 sm:grid-cols-3"><div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="text-xs text-slate-500">Correlation</div><div className="mt-2 text-lg font-semibold text-cyan-300">Active</div></div><div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="text-xs text-slate-500">Timeline mode</div><div className="mt-2 text-lg font-semibold text-white">Append-only</div></div><div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="text-xs text-slate-500">Workflow</div><div className="mt-2 text-lg font-semibold text-white">Investigate → document</div></div></div></Panel>
  </div>;
}
