import Link from "next/link";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

const severityClasses: Record<Severity, string> = {
  critical: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  high: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  medium: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  low: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  info: "border-slate-600 bg-slate-800/70 text-slate-300",
};

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-800/90 bg-[#0b1622]/90 shadow-[0_20px_60px_rgba(0,0,0,0.14)] ${className}`}>{children}</section>;
}

export function PanelHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({ label, value, delta, detail, tone = "default" }: { label: string; value: string | number; delta?: string; detail?: string; tone?: "default" | "danger" | "accent" }) {
  const toneClass = tone === "danger" ? "text-rose-300" : tone === "accent" ? "text-cyan-300" : "text-white";

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-[#0b1622]/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        {delta && <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">{delta}</span>}
      </div>
      <div className={`mt-4 text-3xl font-semibold tracking-tight ${toneClass}`}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      {detail && <div className="mt-2 text-xs text-slate-500">{detail}</div>}
    </div>
  );
}

export function SeverityBadge({ severity, label }: { severity: Severity; label?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${severityClasses[severity]}`}>{label ?? severity}</span>;
}

export function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-20 items-end gap-1.5">
      {values.map((value, index) => (
        <div key={index} className="flex-1 rounded-t bg-cyan-400/20" style={{ height: `${Math.max(12, (value / max) * 100)}%` }}>
          <div className="h-full rounded-t bg-gradient-to-t from-cyan-500/40 to-cyan-300/20" />
        </div>
      ))}
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="relative flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(#39d3c7 ${clamped * 3.6}deg, #18293a ${clamped * 3.6}deg)` }}>
      <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#0b1622]">
        <span className="text-3xl font-semibold text-white">{Math.round(clamped)}</span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">risk</span>
      </div>
    </div>
  );
}

export function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/25 hover:text-cyan-300">{children}</Link>;
}

export function DonutLegend({ rows }: { rows: { label: string; value: number; className: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pct = total === 0 ? 0 : Math.round((row.value / total) * 100);
        return (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300"><span className={`h-2 w-2 rounded-full ${row.className}`} />{row.label}</span>
              <span className="text-slate-500">{row.value.toLocaleString()} · {pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800">
              <div className={`h-full rounded-full ${row.className}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Heatmap() {
  const cells = [
    [18, 42, 75, 54, 26, 13, 21, 33, 17, 9, 20, 46],
    [15, 58, 80, 66, 37, 22, 34, 48, 26, 14, 22, 41],
    [12, 36, 71, 57, 28, 17, 38, 63, 34, 21, 29, 49],
    [8, 25, 53, 42, 19, 16, 29, 52, 27, 15, 19, 37],
    [6, 20, 41, 35, 14, 10, 22, 39, 21, 12, 18, 31],
  ];

  return (
    <div className="soc-grid relative overflow-hidden rounded-xl border border-slate-800 bg-[#08131f] p-3">
      <div className="grid gap-1.5">
        {cells.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-12 gap-1.5">
            {row.map((value, index) => (
              <div key={`${rowIndex}-${index}`} className="h-7 rounded bg-cyan-400/10" style={{ opacity: 0.3 + value / 120 }} title={`Activity ${value}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-600">
        <span>Low activity</span><span>Global threat activity</span><span>High activity</span>
      </div>
    </div>
  );
}
