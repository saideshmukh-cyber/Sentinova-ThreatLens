"use client";

import { useCallback, useEffect, useState } from "react";
import { createInvestigation, getInvestigations, getInvestigation } from "@/lib/api";
import type { InvestigationHistoryItem, InvestigationResult } from "@/lib/api";
import type { IndicatorType } from "@/types/indicator";

const types: IndicatorType[] = ["ip", "domain", "url", "hash", "email", "cve"];
const fieldClass = "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/60";

function riskClass(level: string) {
  const v = level.toLowerCase();
  if (v.includes("critical") || v.includes("high")) return "text-rose-300";
  if (v.includes("medium") || v.includes("moderate")) return "text-amber-300";
  return "text-emerald-300";
}

export default function InvestigationsPage() {
  const [items, setItems] = useState<InvestigationHistoryItem[]>([]);
  const [selected, setSelected] = useState<InvestigationResult | null>(null);
  const [type, setType] = useState<IndicatorType>("ip");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { setItems(await getInvestigations(1, 50)); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load investigation history."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSubmitting(true); setError(""); setNotice(""); setSelected(null);
    try {
      const result = await createInvestigation(type, value.trim());
      setSelected(result); setNotice(`Investigation #${result.investigation_id} completed.`); setValue(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Investigation failed."); }
    finally { setSubmitting(false); }
  }

  async function openItem(item: InvestigationHistoryItem) {
    setError(""); setNotice("");
    try { setSelected(await getInvestigation(item.investigation_id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load investigation details."); }
  }

  return <main className="flex-1 p-5 sm:p-6 lg:p-8">
    <div className="mb-6"><div className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-400">Threat analysis</div><h1 className="mt-2 text-3xl font-semibold text-white">Investigations</h1><p className="mt-2 text-sm text-slate-500">Run enrichment against a registered indicator, review risk scoring, and revisit previous investigations.</p></div>
    {(error || notice) && <div role="status" className={`mb-4 rounded-xl border p-4 text-sm ${error ? "border-rose-500/30 bg-rose-500/5 text-rose-300" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"}`}>{error || notice}</div>}
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Start an investigation</h2><p className="mt-1 text-sm text-slate-500">The indicator must already exist in the Indicators registry.</p>
      <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-[170px_minmax(0,1fr)_auto] md:items-end">
        <label className="block text-xs text-slate-400">Indicator type<select value={type} onChange={e=>setType(e.target.value as IndicatorType)} className={`${fieldClass} mt-2`}>{types.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</select></label>
        <label className="block text-xs text-slate-400">Indicator value<input required value={value} onChange={e=>setValue(e.target.value)} placeholder="e.g. 8.8.8.8 or example.com" className={`${fieldClass} mt-2`} /></label>
        <button disabled={submitting || !value.trim()} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Analyzing…" : "Run investigation"}</button>
      </form>
    </section>
    {selected && <section className="mt-5 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] uppercase tracking-[.18em] text-cyan-400">Investigation #{selected.investigation_id}</div><h2 className="mt-2 break-all font-mono text-lg text-white">{selected.value}</h2><p className="mt-1 text-xs uppercase text-slate-500">{selected.indicator_type} · Indicator #{selected.indicator_id}</p></div><button type="button" onClick={()=>setSelected(null)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">Close details</button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-950/70 p-4"><div className="text-xs text-slate-500">Risk score</div><div className="mt-1 text-3xl font-semibold text-white">{selected.score}</div></div><div className="rounded-xl bg-slate-950/70 p-4"><div className="text-xs text-slate-500">Risk level</div><div className={`mt-2 text-xl font-semibold capitalize ${riskClass(selected.risk_level)}`}>{selected.risk_level}</div></div><div className="rounded-xl bg-slate-950/70 p-4"><div className="text-xs text-slate-500">Enrichment records</div><div className="mt-1 text-3xl font-semibold text-white">{selected.summary.enrichment_count}</div></div></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-slate-800 p-4"><h3 className="text-sm font-semibold text-white">Enrichment sources</h3>{selected.summary.sources.length ? <ul className="mt-3 space-y-2">{selected.summary.sources.map(source=><li key={source} className="text-sm text-slate-300">{source}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No sources returned for this run.</p>}</div><div className="rounded-xl border border-slate-800 p-4"><h3 className="text-sm font-semibold text-white">Score breakdown</h3><pre className="mt-3 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-400">{JSON.stringify(selected.summary.score_breakdown, null, 2)}</pre></div></div>
      <div className="mt-4 rounded-xl border border-slate-800 p-4"><h3 className="text-sm font-semibold text-white">Enrichment data</h3>{selected.enrichments.length ? <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-400">{JSON.stringify(selected.enrichments, null, 2)}</pre> : <p className="mt-3 text-sm text-slate-500">The enrichment service returned no records.</p>}</div>
    </section>}
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"><div className="border-b border-slate-800 px-5 py-4"><h2 className="font-semibold text-white">Investigation history</h2><p className="mt-1 text-xs text-slate-500">Select a previous run to inspect its saved result.</p></div>{loading ? <p className="p-6 text-sm text-slate-500">Loading investigation history…</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-950/50"><tr>{["ID", "INDICATOR", "TYPE", "SCORE", "RISK", "CREATED", ""].map(h=><th key={h} className="px-5 py-3 text-[10px] tracking-wider text-slate-500">{h}</th>)}</tr></thead><tbody>{items.map(item=><tr key={item.investigation_id} className="border-t border-slate-800/70"><td className="px-5 py-4 text-xs text-slate-500">#{item.investigation_id}</td><td className="max-w-xs break-all px-5 py-4 font-mono text-xs text-slate-200">{item.value}</td><td className="px-5 py-4 text-xs uppercase text-slate-400">{item.indicator_type}</td><td className="px-5 py-4 text-sm text-white">{item.score}</td><td className={`px-5 py-4 text-xs capitalize ${riskClass(item.risk_level)}`}>{item.risk_level}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</td><td className="px-5 py-4"><button type="button" onClick={()=>void openItem(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-cyan-300 hover:border-cyan-400/40">Details</button></td></tr>)}{items.length===0&&<tr><td colSpan={7} className="p-8 text-center text-sm text-slate-500">No investigations yet. Add an indicator first, then run an investigation above.</td></tr>}</tbody></table></div>}</section>
  </main>;
}
