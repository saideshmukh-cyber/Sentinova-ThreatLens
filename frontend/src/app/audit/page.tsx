"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/api";
import { Panel, PanelHeader } from "@/components/DashboardPrimitives";

export default function AuditPage(){
  const [rows,setRows]=useState<Awaited<ReturnType<typeof getAuditLogs>>>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{let alive=true;async function load(){try{const data=await getAuditLogs(200);if(alive)setRows(data)}catch(err){if(alive)setError(err instanceof Error?err.message:"Failed to load audit records.")}finally{if(alive)setLoading(false)}}void load();return()=>{alive=false}},[]);
  return <div className="p-5 sm:p-6 lg:p-8"><div className="mb-6"><div className="text-[10px] uppercase tracking-[.2em] text-cyan-400">Governance</div><h1 className="mt-2 text-3xl font-semibold text-white">Audit log</h1><p className="mt-2 text-sm text-slate-500">Append-only record of authentication and state-changing activity.</p></div>{error&&<div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300">{error}</div>}<Panel><PanelHeader title="Recent activity" subtitle={`${rows.length} recent records`}/>{loading?<div className="p-8 text-sm text-slate-500">Loading audit records...</div>:<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-slate-800 bg-slate-950/60"><th className="px-5 py-3 text-[10px] tracking-wider text-slate-600">TIME</th><th className="px-5 py-3 text-[10px] tracking-wider text-slate-600">ACTOR</th><th className="px-5 py-3 text-[10px] tracking-wider text-slate-600">ACTION</th><th className="px-5 py-3 text-[10px] tracking-wider text-slate-600">ENTITY</th><th className="px-5 py-3 text-[10px] tracking-wider text-slate-600">CORRELATION</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-b border-slate-800/70"><td className="px-5 py-3 text-xs text-slate-500">{new Date(row.timestamp).toLocaleString()}</td><td className="px-5 py-3 text-xs text-slate-300">{row.actor}</td><td className="px-5 py-3"><span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold uppercase text-cyan-300">{row.action}</span></td><td className="px-5 py-3 text-xs text-slate-400">{row.entity_type}{row.entity_id?` #${row.entity_id}`:""}</td><td className="px-5 py-3 font-mono text-[10px] text-slate-600">{row.correlation_id??"-"}</td></tr>)}</tbody></table></div>}</Panel></div>
}
