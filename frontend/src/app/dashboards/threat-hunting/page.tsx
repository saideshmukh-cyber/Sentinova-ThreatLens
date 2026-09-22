"use client";

import { useEffect, useMemo, useState } from "react";
import { getIndicators } from "@/lib/api";
import type { Indicator } from "@/types/indicator";
import { LinkButton, MetricCard, Panel, PanelHeader, SeverityBadge } from "@/components/DashboardPrimitives";

export default function ThreatHuntingDashboard() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [items, setItems] = useState<Indicator[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; async function load() { setLoading(true); try { const data = await getIndicators({ query: query || undefined, indicatorType: type ? type as Indicator["indicator_type"] : undefined, page: 1, size: 30 }); if (!active) return; setItems(data.items); setTotal(data.total); } finally { if (active) setLoading(false); } } void load(); return () => { active = false; }; }, [query, type]);
  const grouped = useMemo(() => items.reduce<Record<string, number>>((acc, item) => { acc[item.indicator_type] = (acc[item.indicator_type] ?? 0) + 1; return acc; }, {}), [items]);
  return <div className="p-5 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">Threat hunting</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Explore and pivot</h1><p className="mt-2 text-sm leading-6 text-slate-500">Search the IOC corpus, slice by type and use indicator relationships as the starting point for hunts.</p></div><LinkButton href="/indicators">Open full intelligence search</LinkButton></div>
    <div className="grid gap-4 md:grid-cols-3"><MetricCard label="Search corpus" value={total} detail="Matching indicators" tone="accent" /><MetricCard label="Visible IPs" value={grouped.ip ?? 0} detail="Current result set" /><MetricCard label="Visible domains" value={grouped.domain ?? 0} detail="Current result set" /></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel><PanelHeader title="Advanced search" subtitle="Filter by indicator type and query" /><div className="space-y-4 p-5"><div><label className="mb-2 block text-xs text-slate-500">Query</label><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search value..." className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/30" /></div><div><label className="mb-2 block text-xs text-slate-500">Indicator type</label><select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/30"><option value="">All types</option><option value="ip">IP</option><option value="domain">Domain</option><option value="url">URL</option><option value="hash">Hash</option></select></div><div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs leading-5 text-slate-500">This workspace uses the existing paginated intelligence API so filters stay consistent with the main Indicators view.</div></div></Panel>
      <Panel><PanelHeader title="Hunt results" subtitle="Click an indicator to pivot into its full record" />{loading ? <div className="p-6 text-sm text-slate-500">Searching...</div> : <div className="divide-y divide-slate-800/80">{items.slice(0, 12).map((indicator) => <div key={indicator.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><SeverityBadge severity="info" label={indicator.indicator_type} /><div className="min-w-0 flex-1 break-all font-mono text-xs text-slate-300">{indicator.value}</div><LinkButton href={`/indicators/${indicator.id}`}>Pivot</LinkButton></div>)}{items.length === 0 && <div className="p-6 text-sm text-slate-500">No indicators match the current filter.</div>}</div>}</Panel>
    </div>
    <Panel className="mt-4"><PanelHeader title="Relationship graph" subtitle="Visual pivot surface for linked infrastructure" /><div className="grid gap-4 p-6 lg:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-5"><div className="text-[10px] uppercase tracking-wider text-cyan-300">Pivot A</div><div className="mt-3 text-sm text-white">Selected IOC</div><div className="mt-1 text-xs text-slate-500">Infrastructure / domain / IP</div></div><div className="flex items-center justify-center text-2xl text-slate-600">↔</div><div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5"><div className="text-[10px] uppercase tracking-wider text-slate-500">Pivot B</div><div className="mt-3 text-sm text-white">Related intelligence</div><div className="mt-1 text-xs text-slate-500">Use the indicator detail view for source and enrichment pivots.</div></div></div></Panel>
  </div>;
}
