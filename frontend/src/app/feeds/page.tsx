"use client";

import { formatDateTime } from "../../lib/date-time";

import { useEffect, useState } from "react";
import { getFeedConfigs, runFeed, updateFeedConfig, type FeedConfig } from "@/lib/api";
import { MetricCard, Panel, PanelHeader } from "@/components/DashboardPrimitives";

type Result = Record<string, unknown> & { feed?: string; fetched?: number; created?: number; skipped?: number; unsupported?: number };

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<FeedConfig[]>([]);
  const [loading, setLoading] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try { setFeeds(await getFeedConfigs()); } catch (err) { setError(err instanceof Error ? err.message : "Failed to load feeds."); }
  }
  useEffect(() => { void load(); }, []);

  async function toggle(feed: FeedConfig) {
    try { await updateFeedConfig(feed.name, { enabled: !feed.enabled }); setFeeds((rows) => rows.map((row) => row.name === feed.name ? { ...row, enabled: !row.enabled } : row)); } catch (err) { setError(err instanceof Error ? err.message : "Feed update failed."); }
  }

  async function setSchedule(feed: FeedConfig, hours: number) {
    try {
      const updated = await updateFeedConfig(feed.name, { schedule_minutes: Math.max(15, Math.round(hours * 60)) });
      setFeeds((rows) => rows.map((row) => row.name === feed.name ? updated : row));
    } catch (err) { setError(err instanceof Error ? err.message : "Feed schedule update failed."); }
  }

  async function run(name: string) {
    setLoading(name); setError(""); setResult(null);
    try { setResult(await runFeed(name)); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Feed ingestion failed."); } finally { setLoading(""); }
  }

  return <div className="p-5 sm:p-6 lg:p-8"><div className="mb-6"><div className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-400">Intelligence ingestion</div><h1 className="mt-2 text-3xl font-semibold text-white">Threat feeds</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Manage the six configured threat-intelligence sources, re-poll on demand, and control scheduled polling intervals.</p></div>{error && <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300">{error}</div>}<div className="grid gap-4 md:grid-cols-3"><MetricCard label="Configured feeds" value={feeds.length} tone="accent"/><MetricCard label="Enabled" value={feeds.filter((f)=>f.enabled).length}/><MetricCard label="Schedule floor" value="15m" detail="Minimum configurable interval"/></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{feeds.map(feed=><Panel key={feed.name}><PanelHeader title={feed.name} subtitle={feed.description} action={<button type="button" onClick={()=>void toggle(feed)} className={`rounded-lg border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${feed.enabled ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-slate-800 bg-slate-950 text-slate-500"}`}>{feed.enabled ? "Enabled" : "Disabled"}</button>}/><div className="p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><div className="text-[10px] uppercase tracking-wider text-slate-600">Poll interval</div><select value={String(Math.round(feed.schedule_minutes / 60))} onChange={(e)=>void setSchedule(feed,Number(e.target.value))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm font-semibold text-white"><option value="1">1h</option><option value="6">6h</option><option value="12">12h</option><option value="24">24h</option><option value="48">48h</option><option value="168">7d</option></select></div><div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><div className="text-[10px] uppercase tracking-wider text-slate-600">Last run</div><div className="mt-2 text-xs text-slate-400">{feed.last_run_at ? formatDateTime(feed.last_run_at) : "Never"}</div></div></div><div className="mt-4 flex gap-2"><button type="button" disabled={loading===feed.name} onClick={()=>void run(feed.name)} className="rounded-lg bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-50">{loading===feed.name ? "Polling..." : "Re-poll now"}</button></div></div></Panel>)}</div>{result && <Panel className="mt-4"><PanelHeader title="Latest ingestion" subtitle={String(result.feed ?? "Feed result")}/><div className="grid gap-3 p-5 sm:grid-cols-4"><MetricCard label="Fetched" value={Number(result.fetched ?? 0)}/><MetricCard label="Created" value={Number(result.created ?? 0)} tone="accent"/><MetricCard label="Skipped" value={Number(result.skipped ?? 0)}/><MetricCard label="Unsupported" value={Number(result.unsupported ?? 0)}/></div></Panel>}</div>;
}
