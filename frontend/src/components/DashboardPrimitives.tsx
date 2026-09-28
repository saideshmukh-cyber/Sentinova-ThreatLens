import Link from "next/link";
import type { ReactNode } from "react";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

const severityClasses: Record<Severity, string> = {
  critical: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  high: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  medium: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  low: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  info: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
};

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0a1520]/85 shadow-[0_20px_60px_rgba(0,0,0,.18)] ${className}`}>{children}</section>;
}

export function PanelHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-100">{title}</h2>{subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}</div>{action}</div>;
}

export function MetricCard({ label, value, detail, tone = "neutral", delta }: { label: string; value: string | number; detail?: string; tone?: "neutral" | "accent" | "danger"; delta?: string }) {
  const toneClass = tone === "danger" ? "text-rose-300" : tone === "accent" ? "text-cyan-300" : "text-white";
  return <div className="rounded-2xl border border-slate-800 bg-[#0a1520]/90 p-5"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">{label}</p>{delta && <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">{delta}</span>}</div><div className={`mt-4 text-3xl font-semibold tracking-tight ${toneClass}`}>{typeof value === "number" ? value.toLocaleString() : value}</div>{detail && <div className="mt-2 text-xs text-slate-500">{detail}</div>}</div>;
}

export function SeverityBadge({ severity, label }: { severity: Severity; label?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${severityClasses[severity]}`}>{label ?? severity}</span>;
}

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-200">{children}</Link>;
}

export function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return <div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(#31d7cb ${clamped * 3.6}deg, #182737 ${clamped * 3.6}deg)` }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#09141f]"><span className="text-4xl font-semibold text-white">{Math.round(clamped)}</span><span className="text-[10px] uppercase tracking-[.18em] text-slate-500">risk</span></div></div>;
}

export function DonutLegend({ rows }: { rows: { label: string; value: number; className: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return <div className="space-y-3">{rows.map((row) => { const pct = total ? Math.round((row.value / total) * 100) : 0; return <div key={row.label}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-300"><span className={`h-2 w-2 rounded-full ${row.className}`} />{row.label}</span><span className="text-slate-500">{row.value.toLocaleString()} · {pct}%</span></div><div className="h-1.5 rounded-full bg-slate-800"><div className={`h-full rounded-full ${row.className}`} style={{ width: `${pct}%` }} /></div></div>; })}</div>;
}

export function TrendChart({ values, secondary = [], labels = [] }: { values: number[]; secondary?: number[]; labels?: string[] }) {
  const max = Math.max(1, ...values, ...secondary);
  const width = 760;
  const height = 220;
  const pad = 20;
  const makePoints = (series: number[]) => series.map((v, i) => `${pad + (i / Math.max(1, series.length - 1)) * (width - pad * 2)},${height - pad - (v / max) * (height - pad * 2)}`).join(" ");
  const points = makePoints(values);
  const secondaryPoints = secondary.length ? makePoints(secondary) : "";
  return <div><svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Threat activity trend"><defs><linearGradient id="tl-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#31d7cb" stopOpacity=".24"/><stop offset="100%" stopColor="#31d7cb" stopOpacity="0"/></linearGradient></defs><path d={`M ${points.split(" ").join(" L ")} L ${width - pad},${height - pad} L ${pad},${height - pad} Z`} fill="url(#tl-grad)"/><polyline fill="none" stroke="#31d7cb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points}/>{secondaryPoints && <polyline fill="none" stroke="#7da8ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 5" points={secondaryPoints}/>}</svg><div className="mt-1 flex justify-between px-2 text-[10px] uppercase tracking-wider text-slate-600">{labels.length ? labels.filter((_, i) => i % Math.max(1, Math.floor(labels.length / 6)) === 0).map((label) => <span key={label}>{label.slice(5)}</span>) : <><span>30d ago</span><span>now</span></>}</div></div>;
}

export function SeverityDistribution({ values }: { values: Record<string, number> }) {
  const rows: [string, number, string][] = [["critical", values.critical ?? 0, "bg-rose-400"], ["high", values.high ?? 0, "bg-orange-400"], ["medium", values.medium ?? 0, "bg-amber-300"], ["low", values.low ?? 0, "bg-emerald-400"]];
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return <div className="space-y-4">{rows.map(([label, value, cls]) => <div key={label}><div className="mb-1.5 flex justify-between text-xs"><span className="uppercase tracking-wider text-slate-400">{label}</span><span className="font-medium text-slate-300">{value.toLocaleString()}</span></div><div className="h-2 rounded-full bg-slate-800"><div className={`h-full rounded-full ${cls}`} style={{ width: `${Math.max(3, (value / max) * 100)}%` }} /></div></div>)}</div>;
}

function project(longitude: number, latitude: number) {
  return { left: `${Math.max(2, Math.min(98, ((longitude + 180) / 360) * 100))}%`, top: `${Math.max(3, Math.min(97, ((90 - latitude) / 180) * 100))}%` };
}

export function GeoHeatmap({ points }: { points: Array<{ region: string; count: number; country?: string | null; country_code?: string | null; latitude?: number | null; longitude?: number | null }> }) {
  if (!points.length) return <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center"><div><div className="text-sm font-medium text-slate-300">No geolocation telemetry yet</div><div className="mt-2 max-w-sm text-xs leading-5 text-slate-500">Run IP enrichment with geographic data to populate the global activity view.</div></div></div>;
  const max = Math.max(1, ...points.map((p) => p.count));
  return <div className="rounded-xl border border-slate-800 bg-[#07131e] p-3"><div className="relative h-[280px] overflow-hidden rounded-lg border border-slate-800 bg-[#06111a]" style={{ backgroundImage: "linear-gradient(rgba(61,90,110,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(61,90,110,.16) 1px, transparent 1px)", backgroundSize: "10% 20%" }}><div className="absolute inset-[6%] rounded-full border border-slate-800/60"/><div className="absolute left-[50%] top-0 h-full border-l border-slate-800/40"/>{points.map((point, i) => { const pos = point.latitude != null && point.longitude != null ? project(point.longitude, point.latitude) : { left: `${10 + ((i * 29) % 80)}%`, top: `${12 + ((i * 17) % 70)}%` }; const intensity = .35 + (point.count / max) * .65; return <div key={`${point.region}-${i}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos} title={`${point.country ?? point.region}: ${point.count}`}><span className="block h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(49,215,203,.8)]" style={{ opacity: intensity, transform: `scale(${0.8 + point.count / max})` }} /></div>; })}<div className="absolute bottom-2 left-3 text-[9px] uppercase tracking-[.16em] text-slate-600">180°W</div><div className="absolute bottom-2 right-3 text-[9px] uppercase tracking-[.16em] text-slate-600">180°E</div><div className="absolute left-3 top-2 text-[9px] uppercase tracking-[.16em] text-slate-600">90°N</div><div className="absolute bottom-7 left-3 text-[9px] uppercase tracking-[.16em] text-slate-600">90°S</div></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{points.slice(0, 8).map((point) => <div key={`${point.region}-summary`} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"><div className="text-[10px] uppercase tracking-wider text-slate-600">{point.country_code ?? point.region}</div><div className="mt-1 text-sm font-semibold text-slate-200">{point.count.toLocaleString()}</div></div>)}</div></div>;
}

export function TechniqueBreakdown({ rows }: { rows: { label: string; value: number }[] }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-slate-700 p-6 text-xs text-slate-500">No ATT&amp;CK technique mappings recorded yet.</div>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return <div className="space-y-3">{rows.map((row) => <div key={row.label}><div className="mb-1.5 flex justify-between text-xs"><span className="font-mono text-cyan-200">{row.label}</span><span className="text-slate-500">{row.value}</span></div><div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400/70" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} /></div></div>)}</div>;
}

export function WidgetToggle({ labels, visible, onToggle }: { labels: { id: string; label: string }[]; visible: Record<string, boolean>; onToggle: (id: string) => void }) {
  return <div className="flex flex-wrap gap-2">{labels.map((item) => <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={`rounded-lg border px-3 py-2 text-[11px] font-medium transition ${visible[item.id] ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200" : "border-slate-800 bg-slate-950/40 text-slate-500"}`}>{item.label}</button>)}</div>;
}
