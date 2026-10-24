"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardLinks = [
  { name: "Command Center", href: "/" },
  { name: "Executive", href: "/dashboards/executive" },
  { name: "SOC Analyst", href: "/dashboards/soc-analyst" },
  { name: "Incident Response", href: "/dashboards/incident-response" },
  { name: "Threat Hunting", href: "/dashboards/threat-hunting" },
];

const intelligenceLinks = [
  { name: "Indicators", href: "/indicators" },
  { name: "Enrichments", href: "/enrichments" },
  { name: "Investigations", href: "/investigations" },
  { name: "Feeds", href: "/feeds" },
];

const monitoringLinks = [
  { name: "Alerts", href: "/alerts" },
  { name: "Alert Rules", href: "/alert-rules" },
  { name: "Security Events", href: "/security-events" },
  { name: "Incidents", href: "/incidents" },
];

const governanceLinks = [
  { name: "Audit Log", href: "/audit" },
  { name: "Reports", href: "/reports" },
  { name: "Users & Roles", href: "/users" },
];

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 5v7l5 5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v5c0 4.7-2.9 8.2-7 10-4.1-1.8-7-5.3-7-10V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function LinkSection({ title, items }: { title: string; items: { name: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <section className="mb-6">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "border border-cyan-400/15 bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
              }`}
            >
              <span className={active ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"}>
                {item.name === "Indicators" || item.name === "Executive" ? <GridIcon /> : item.name === "Alerts" || item.name === "Incident Response" ? <ShieldIcon /> : <RadarIcon />}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden w-[252px] shrink-0 border-r border-slate-800/80 bg-[#08121d] lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-slate-800/80 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <RadarIcon />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-white">ThreatLens</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">CTI Operations</div>
            </div>
          </div>
        </div>

        <nav className="soc-scroll flex-1 overflow-y-auto px-3 py-5">
          <LinkSection title="Dashboards" items={dashboardLinks} />
          <LinkSection title="Intelligence" items={intelligenceLinks} />
          <LinkSection title="Monitoring" items={monitoringLinks} />
          <LinkSection title="Governance" items={governanceLinks} />
        </nav>

        <div className="border-t border-slate-800/80 p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Platform status</span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">PostgreSQL · Redis · Elasticsearch</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
