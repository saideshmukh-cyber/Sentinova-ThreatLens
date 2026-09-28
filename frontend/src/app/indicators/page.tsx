"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createIndicator, deleteIndicator, downloadExport, getIndicators, updateIndicator } from "@/lib/api";
import type { Indicator, IndicatorStatus, IndicatorType, TLP } from "@/types/indicator";
import { Panel, PanelHeader, SeverityBadge, LinkButton } from "@/components/DashboardPrimitives";

const indicatorTypes: IndicatorType[] = ["ip", "domain", "url", "hash", "email", "cve"];
const PAGE_SIZE = 15;

function severity(score: number) {
  return score >= 90 ? "critical" : score >= 70 ? "high" : score >= 40 ? "medium" : "low";
}

export default function IndicatorsPage() {
  const [items, setItems] = useState<Indicator[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<IndicatorType | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Indicator | null>(null);
  const [formType, setFormType] = useState<IndicatorType>("ip");
  const [formValue, setFormValue] = useState("");
  const [confidence, setConfidence] = useState(50);
  const [tlp, setTlp] = useState<TLP>("clear");
  const [status, setStatus] = useState<IndicatorStatus>("active");
  const [tags, setTags] = useState("");
  const [attack, setAttack] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setError("");
    try {
      const data = await getIndicators({ query: query || undefined, indicatorType: type || undefined, page, size: PAGE_SIZE });
      setItems(data.items); setTotal(data.total);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load indicators."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [query, type, page]);

  function openCreate() {
    setEditing(null); setFormType("ip"); setFormValue(""); setConfidence(50); setTlp("clear"); setStatus("active"); setTags(""); setAttack(""); setNotes(""); setFormOpen(true); setError("");
  }

  function openEdit(item: Indicator) {
    setEditing(item); setFormType(item.indicator_type); setFormValue(item.value); setConfidence(item.confidence); setTlp((item.tlp as TLP) || "clear"); setStatus((item.status as IndicatorStatus) || "active"); setTags(item.tags.join(", ")); setAttack(item.attack_techniques.join(", ")); setNotes(item.notes ?? ""); setFormOpen(true); setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const payload = { indicator_type: formType, value: formValue.trim(), confidence, tlp, status, tags: tags.split(",").map(v=>v.trim()).filter(Boolean), attack_techniques: attack.split(",").map(v=>v.trim()).filter(Boolean), notes: notes.trim() || null };
    try {
      if (editing) await updateIndicator(editing.id, payload);
      else await createIndicator(formType, formValue.trim(), payload);
      setFormOpen(false); setNotice(editing ? "Indicator updated." : "Indicator created."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save indicator."); }
    finally { setSaving(false); }
  }

  async function remove(item: Indicator) {
    if (!window.confirm(`Delete ${item.value}?`)) return;
    try { await deleteIndicator(item.id); setNotice("Indicator deleted."); if(items.length===1&&page>1)setPage(p=>p-1); else await load(); } catch(err) { setError(err instanceof Error?err.message:"Unable to delete indicator."); }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const highCount = useMemo(() => items.filter(i => i.severity_score >= 70).length, [items]);

  return <div className="p-5 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-400">Intelligence registry</div><h1 className="mt-2 text-3xl font-semibold text-white">Indicators</h1><p className="mt-2 text-sm text-slate-500">Canonical IOC management with severity, provenance, TLP, ATT&amp;CK context and analyst notes.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={openCreate} className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950">Add indicator</button><button type="button" onClick={()=>void downloadExport("/api/v1/export/csv","threatlens-indicators.csv")} className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">CSV export</button><button type="button" onClick={()=>void downloadExport("/api/v1/export/stix","threatlens-indicators.stix.json")} className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">STIX 2.1</button></div></div>
    <div className="grid gap-4 md:grid-cols-3"><Panel><div className="p-5"><div className="text-[10px] uppercase tracking-wider text-slate-600">Total corpus</div><div className="mt-2 text-3xl font-semibold text-white">{total.toLocaleString()}</div></div></Panel><Panel><div className="p-5"><div className="text-[10px] uppercase tracking-wider text-slate-600">High in current page</div><div className="mt-2 text-3xl font-semibold text-orange-300">{highCount}</div></div></Panel><Panel><div className="p-5"><div className="text-[10px] uppercase tracking-wider text-slate-600">Current filter</div><div className="mt-2 text-xl font-semibold text-cyan-300">{type || "All types"}</div></div></Panel></div>

    <Panel className="mt-4"><PanelHeader title="Search and filter" subtitle="Full-text query plus indicator-type facet"/><div className="grid gap-3 p-5 lg:grid-cols-[1fr_180px_auto]"><input value={query} onChange={e=>{setPage(1);setQuery(e.target.value)}} placeholder="Search IP, domain, URL, hash, email or CVE..." className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 font-mono text-sm text-slate-200 outline-none focus:border-cyan-400/30"/><select value={type} onChange={e=>{setPage(1);setType(e.target.value as IndicatorType|"")}} className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 outline-none"><option value="">All types</option>{indicatorTypes.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</select><button type="button" onClick={()=>{setQuery("");setType("");setPage(1)}} className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-semibold text-slate-300">Reset</button></div></Panel>
    {(error||notice)&&<div className={`mt-4 rounded-xl border p-4 text-xs ${error?"border-rose-500/20 bg-rose-500/5 text-rose-300":"border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}>{error||notice}</div>}

    <Panel className="mt-4"><PanelHeader title="IOC queue" subtitle={`${total.toLocaleString()} matching indicators`}/>{loading?<div className="p-8 text-sm text-slate-500">Loading intelligence...</div>:<div className="overflow-x-auto"><table className="w-full text-left"><thead className="border-b border-slate-800 bg-slate-950/60"><tr>{["IOC","TYPE","SEVERITY","CONFIDENCE","TLP","STATUS","ACTIONS"].map(h=><th key={h} className="px-5 py-3 text-[10px] font-semibold tracking-[.16em] text-slate-600">{h}</th>)}</tr></thead><tbody>{items.map(item=><tr key={item.id} className="border-b border-slate-800/70 last:border-0"><td className="max-w-[420px] px-5 py-4"><Link href={`/indicators/${item.id}`} className="break-all font-mono text-xs text-slate-200 hover:text-cyan-300">{item.value}</Link><div className="mt-1 text-[10px] text-slate-600">#{item.id}</div></td><td className="px-5 py-4"><SeverityBadge severity="info" label={item.indicator_type}/></td><td className="px-5 py-4"><SeverityBadge severity={severity(item.severity_score) as "critical"|"high"|"medium"|"low"}/><div className="mt-1 text-xs font-semibold text-slate-200">{item.severity_score}</div></td><td className="px-5 py-4 text-xs text-slate-300">{item.confidence}</td><td className="px-5 py-4 text-xs uppercase text-slate-400">{item.tlp}</td><td className="px-5 py-4 text-xs text-slate-400">{item.status}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>openEdit(item)} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] text-slate-300">Edit</button><button type="button" onClick={()=>void remove(item)} className="rounded-lg border border-rose-500/20 px-2.5 py-1.5 text-[10px] text-rose-300">Delete</button></div></td></tr>)}{items.length===0&&<tr><td colSpan={7} className="p-8 text-center text-sm text-slate-500">No indicators match this query.</td></tr>}</tbody></table></div>}</Panel>
    <div className="mt-4 flex items-center justify-between"><div className="text-xs text-slate-600">Page {page} / {totalPages}</div><div className="flex gap-2"><button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-400 disabled:opacity-30">Previous</button><button disabled={page>=totalPages||loading} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-400 disabled:opacity-30">Next</button></div></div>

    {formOpen&&<div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4"><div className="mx-auto my-8 w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0a1520] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.18em] text-cyan-400">IOC editor</div><h2 className="mt-2 text-xl font-semibold text-white">{editing?"Edit indicator":"Add indicator"}</h2></div><button type="button" onClick={()=>setFormOpen(false)} className="text-slate-500 hover:text-white">Close</button></div><form onSubmit={submit} className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs text-slate-500">Type</label><select value={formType} onChange={e=>setFormType(e.target.value as IndicatorType)} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">{indicatorTypes.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div><div><label className="mb-2 block text-xs text-slate-500">Confidence</label><input type="number" min={0} max={100} value={confidence} onChange={e=>setConfidence(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"/></div></div><div><label className="mb-2 block text-xs text-slate-500">Value</label><input required value={formValue} onChange={e=>setFormValue(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 font-mono text-sm text-slate-200"/></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs text-slate-500">TLP</label><select value={tlp} onChange={e=>setTlp(e.target.value as TLP)} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"><option value="clear">Clear</option><option value="green">Green</option><option value="amber">Amber</option><option value="red">Red</option></select></div><div><label className="mb-2 block text-xs text-slate-500">Status</label><select value={status} onChange={e=>setStatus(e.target.value as IndicatorStatus)} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"><option value="active">Active</option><option value="under_review">Under review</option><option value="whitelisted">Whitelisted</option><option value="expired">Expired</option></select></div></div><div><label className="mb-2 block text-xs text-slate-500">Tags</label><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="malware, phishing, c2" className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"/></div><div><label className="mb-2 block text-xs text-slate-500">ATT&amp;CK techniques</label><input value={attack} onChange={e=>setAttack(e.target.value)} placeholder="T1059, T1566" className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"/></div><div><label className="mb-2 block text-xs text-slate-500">Analyst notes</label><textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"/></div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setFormOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs text-slate-300">Cancel</button><button disabled={saving} className="rounded-xl bg-cyan-300 px-5 py-2.5 text-xs font-semibold text-slate-950">{saving?"Saving...":"Save indicator"}</button></div></form></div></div>}
  </div>;
}
