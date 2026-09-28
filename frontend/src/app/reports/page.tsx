"use client";

import { useState } from "react";
import { downloadExport } from "@/lib/api";
import { LinkButton, MetricCard, Panel, PanelHeader } from "@/components/DashboardPrimitives";

export default function ReportsPage() {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function download(path: string, filename: string) {
    setBusy(filename); setError("");
    try { await downloadExport(path, filename); } catch (err) { setError(err instanceof Error ? err.message : "Export failed."); } finally { setBusy(""); }
  }
  return <div className="p-5 sm:p-6 lg:p-8"><div className="mb-6"><div className="text-[10px] uppercase tracking-[.2em] text-cyan-400">Governance</div><h1 className="mt-2 text-3xl font-semibold text-white">Reports & exports</h1><p className="mt-2 text-sm text-slate-500">Generate executive reporting and move curated intelligence into downstream tooling.</p></div>{error&&<div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300">{error}</div>}<div className="grid gap-4 md:grid-cols-3"><MetricCard label="CSV" value="Structured" detail="Indicator corpus for downstream tooling" tone="accent"/><MetricCard label="STIX 2.1" value="Bundle" detail="Canonical indicator patterns"/><MetricCard label="PDF" value="Executive" detail="Printable risk-posture report"/></div><div className="mt-4 grid gap-4 md:grid-cols-3"><Panel><PanelHeader title="CSV export" subtitle="Indicators + metadata"/><div className="p-5"><button type="button" disabled={!!busy} onClick={()=>void download("/api/v1/export/csv","threatlens-indicators.csv")} className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{busy==="threatlens-indicators.csv"?"Preparing...":"Download CSV"}</button></div></Panel><Panel><PanelHeader title="STIX 2.1" subtitle="Indicator bundle"/><div className="p-5"><button type="button" disabled={!!busy} onClick={()=>void download("/api/v1/export/stix","threatlens-indicators.stix.json")} className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{busy==="threatlens-indicators.stix.json"?"Preparing...":"Download STIX"}</button></div></Panel><Panel><PanelHeader title="Executive PDF" subtitle="Board-ready report"/><div className="p-5"><button type="button" disabled={!!busy} onClick={()=>void download("/api/v1/reports/executive.pdf","threatlens-executive-report.pdf")} className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{busy==="threatlens-executive-report.pdf"?"Preparing...":"Download PDF"}</button></div></Panel></div><div className="mt-4 flex gap-2"><LinkButton href="/indicators">Indicators</LinkButton><LinkButton href="/audit">Audit log</LinkButton></div></div>;
}
