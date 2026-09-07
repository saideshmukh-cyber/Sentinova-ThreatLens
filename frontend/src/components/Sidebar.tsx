import Link from "next/link";

const intelligenceLinks = [
  {
    name: "Dashboard",
    href: "/",
  },
  {
    name: "Indicators",
    href: "/indicators",
  },
  {
    name: "Enrichments",
    href: "/enrichments",
  },
  {
    name: "Investigations",
    href: "/investigations",
  },
  {
    name: "Feeds",
    href: "/feeds",
  },
];

const monitoringLinks = [
  {
    name: "Alerts",
    href: "/alerts",
  },
  {
    name: "Incidents",
    href: "/incidents",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-6 py-5">
        <h1 className="text-xl font-bold text-white">
          ThreatLens
        </h1>

        <p className="mt-1 text-xs text-slate-400">
          Threat Intelligence Platform
        </p>
      </div>

      <nav className="p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Intelligence
        </p>

        <div className="space-y-1">
          {intelligenceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Monitoring
        </p>

        <div className="space-y-1">
          {monitoringLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}