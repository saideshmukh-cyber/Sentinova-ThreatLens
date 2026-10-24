"use client";

import { useEffect, useMemo, useState } from "react";
import { createRelationship, deleteHunt, getDashboardAnalytics, getIndicators, getRelationships, getSavedHunts, saveHunt } from "@/lib/api";
import type { DashboardAnalytics } from "@/types/dashboard";
import type { Indicator } from "@/types/indicator";
import { LinkButton, MetricCard, Panel, PanelHeader, SeverityBadge, TechniqueBreakdown } from "@/components/DashboardPrimitives";

type Relation = { id:number; source_indicator_id:number; target_indicator_id:number; relationship_type:string; created_at:string; source_value?:string|null; target_value?:string|null; source_type?:string|null; target_type?:string|null };

export default function ThreatHuntingDashboard() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [items, setItems] = useState<Indicator[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Indicator | null>(null);
  const [relationships, setRelationships] = useState<Relation[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [hunts, setHunts] = useState<Awaited<ReturnType<typeof getSavedHunts>>>([]);
  const [huntName, setHuntName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [data, a, saved] = await Promise.all([
          getIndicators({ query: query || undefined, indicatorType: type ? type as Indicator["indicator_type"] : undefined, page: 1, size: 40 }),
          getDashboardAnalytics(),
          getSavedHunts(),
        ]);
        if (alive) { setItems(data.items); setTotal(data.total); setAnalytics(a); setHunts(saved); }
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : "Threat hunt data failed to load."); }
    }
    void load();
    return () => { alive = false; };
  }, [query, type]);

  useEffect(() => {
    if (!selected) { setRelationships([]); return; }
    void getRelationships(selected.id).then(setRelationships).catch(() => setRelationships([]));
  }, [selected]);

  const grouped = useMemo(() => items.reduce<Record<string,number>>((acc, i) => { acc[i.indicator_type] = (acc[i.indicator_type] ?? 0) + 1; return acc; }, {}), [items]);

  async function link(first: Indicator, second: Indicator) {
    await createRelationship(first.id, second.id, "related-to");
    setRelationships(await getRelationships(first.id));
  }

  async function handleSaveHunt() {
    if (!huntName.trim() || !query.trim()) return;
    const saved = await saveHunt({ name: huntName.trim(), query: query.trim(), indicator_type: type || null });
    setHunts((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    setHuntName("");
  }

  async function handleDeleteHunt(id: number) {
    await deleteHunt(id);
    setHunts((current) => current.filter((item) => item.id !== id));
  }

  return <div className="p-5 sm:p-6 lg:p-8">
    <div className="mb-6"><div className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-400">Threat hunting</div><h1 className="mt-2 text-3xl font-semibold text-white">Explore and pivot</h1><p className="mt-2 text-sm text-slate-500">Advanced IOC search, reusable hunts, relationship pivoting and ATT&amp;CK context.</p></div>
    {error && <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300">{error}</div>}
    <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Search corpus" value={total} detail="Matching indicators" tone="accent"/><MetricCard label="IPs" value={grouped.ip ?? 0}/><MetricCard label="Domains" value={grouped.domain ?? 0}/><MetricCard label="Saved hunts" value={hunts.length}/></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[.82fr_1.18fr]">
      <Panel><PanelHeader title="Advanced search" subtitle="Facet by type and free-text"/><div className="space-y-4 p-5"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search IOC, note or observable..." className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/30"/><select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 outline-none"><option value="">All types</option><option value="ip">IP</option><option value="domain">Domain</option><option value="url">URL</option><option value="hash">Hash</option><option value="email">Email</option><option value="cve">CVE</option></select><div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500"><div>IP {grouped.ip ?? 0}</div><div>Domain {grouped.domain ?? 0}</div><div>URL {grouped.url ?? 0}</div><div>Hash {grouped.hash ?? 0}</div><div>Email {grouped.email ?? 0}</div><div>CVE {grouped.cve ?? 0}</div></div><div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Save current hunt</div><div className="mt-3 flex gap-2"><input value={huntName} onChange={e=>setHuntName(e.target.value)} placeholder="Hunt name" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"/><button type="button" onClick={()=>void handleSaveHunt()} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950">Save</button></div></div></div></Panel>
      <Panel><PanelHeader title="Hunt results" subtitle="Select an IOC to pivot"/><div className="max-h-[520px] overflow-y-auto divide-y divide-slate-800/80">{items.slice(0,30).map(i=><button type="button" key={i.id} onClick={()=>setSelected(i)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-950/50"><SeverityBadge severity={i.severity_score>=90?"critical":i.severity_score>=70?"high":i.severity_score>=40?"medium":"low"} label={i.indicator_type}/><div className="min-w-0 flex-1 break-all font-mono text-xs text-slate-300">{i.value}</div><span className="text-xs font-semibold text-white">{i.severity_score}</span></button>)}</div></Panel>
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <Panel><PanelHeader title="Relationship graph" subtitle="Source/target relationships persisted by ThreatLens"/><div className="p-6">{selected ? <div className="space-y-5"><div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"><div className="min-w-0 max-w-md rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5"><div className="text-[10px] uppercase tracking-wider text-cyan-300">Selected IOC</div><div className="mt-2 break-all font-mono text-sm text-white">{selected.value}</div><div className="mt-2 text-xs text-slate-500">{selected.indicator_type.toUpperCase()} · ATT&amp;CK {selected.attack_techniques.length ? selected.attack_techniques.join(", ") : "unmapped"}</div></div><div className="text-2xl text-slate-600">↔</div><div className="flex max-w-md flex-wrap justify-center gap-2">{relationships.length ? relationships.map(r=><LinkButton key={r.id} href={`/indicators/${r.target_indicator_id === selected.id ? r.source_indicator_id : r.target_indicator_id}`}>{r.relationship_type}: {(r.target_indicator_id === selected.id ? r.source_value : r.target_value) ?? `IOC #${r.target_indicator_id === selected.id ? r.source_indicator_id : r.target_indicator_id}`}</LinkButton>) : <span className="rounded-xl border border-dashed border-slate-700 p-5 text-xs text-slate-500">No relationships yet.</span>}</div></div><div className="flex flex-wrap gap-2">{items.filter(i=>i.id!==selected.id).slice(0,6).map(i=><button key={i.id} type="button" onClick={()=>void link(selected,i)} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-400 hover:border-cyan-400/25 hover:text-cyan-200">Relate to {i.value.slice(0,28)}</button>)}</div></div> : <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">Select an IOC from the hunt results to inspect its relationship graph.</div>}</div></Panel>
      <Panel><PanelHeader title="ATT&amp;CK overlay" subtitle="Technique coverage across matching indicators"/><div className="p-5"><TechniqueBreakdown rows={analytics?.attack_technique_breakdown ?? []}/></div></Panel>
    </div>
    <Panel className="mt-4"><PanelHeader title="Saved hunts" subtitle="Reusable queries saved for the active user"/><div className="divide-y divide-slate-800/80">{hunts.length ? hunts.map(hunt=><div key={hunt.id} className="flex items-center gap-3 px-5 py-3"><div className="min-w-0 flex-1"><div className="text-sm font-medium text-slate-200">{hunt.name}</div><div className="mt-1 font-mono text-[11px] text-slate-500">{hunt.query}{hunt.indicator_type ? ` · ${hunt.indicator_type}` : ""}</div></div><button type="button" onClick={()=>{setQuery(hunt.query);setType(hunt.indicator_type ?? "")}} className="rounded-lg border border-slate-800 px-3 py-2 text-[10px] text-slate-400 hover:text-white">Load</button><button type="button" onClick={()=>void handleDeleteHunt(hunt.id)} className="rounded-lg border border-rose-400/20 px-3 py-2 text-[10px] text-rose-300">Delete</button></div>) : <div className="p-6 text-xs text-slate-500">No saved hunts yet.</div>}</div></Panel>
  </div>;
}
