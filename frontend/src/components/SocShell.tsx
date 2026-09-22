"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import RealtimeIndicatorToast from "@/components/RealtimeIndicatorToast";
import { connectAlertWebSocket, type AlertWebSocketMessage } from "@/lib/websocket";
import { useEffect } from "react";

const roleLinks = [
  { label: "Command Center", href: "/" },
  { label: "Executive", href: "/dashboards/executive" },
  { label: "SOC Analyst", href: "/dashboards/soc-analyst" },
  { label: "Incident Response", href: "/dashboards/incident-response" },
  { label: "Threat Hunting", href: "/dashboards/threat-hunting" },
];

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export default function SocShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const socket = connectAlertWebSocket((message: AlertWebSocketMessage) => {
      const event = message.event ?? "realtime.event";
      setEvents((current) => [event, ...current].slice(0, 6));
    });

    return () => socket.close();
  }, []);

  const pageTitle = useMemo(() => {
    const route = roleLinks.find((item) => item.href === pathname);
    if (route) return route.label;
    if (pathname.startsWith("/indicators")) return "Indicators";
    if (pathname.startsWith("/enrichments")) return "Enrichments";
    if (pathname.startsWith("/investigations")) return "Investigations";
    if (pathname.startsWith("/feeds")) return "Feeds";
    if (pathname.startsWith("/alerts")) return "Alerts";
    if (pathname.startsWith("/alert-rules")) return "Alert Rules";
    if (pathname.startsWith("/security-events")) return "Security Events";
    if (pathname.startsWith("/incidents")) return "Incidents";
    return "ThreatLens";
  }, [pathname]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    router.push(`/indicators?query=${encodeURIComponent(value)}`);
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#071018]/90 backdrop-blur-xl">
          <div className="flex h-[74px] items-center gap-4 px-4 sm:px-6 xl:px-8">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">Threat intelligence operations</div>
              <div className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-100">{pageTitle}</div>
            </div>

            <form onSubmit={submitSearch} className="hidden w-[340px] md:block">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 shadow-inner">
                <span className="text-slate-500"><SearchIcon /></span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search indicators, domains, IPs..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                />
                <kbd className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-600">/</kbd>
              </div>
            </form>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((value) => !value)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 transition hover:border-slate-700 hover:text-white"
                aria-label="Open notifications"
              >
                <BellIcon />
                {events.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300" />}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl border border-slate-800 bg-[#0b1622] p-4 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">Realtime activity</div>
                      <div className="mt-0.5 text-xs text-slate-500">WebSocket event stream</div>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Live
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {events.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-700 p-4 text-xs text-slate-500">No realtime events received in this session.</div>
                    ) : (
                      events.map((event, index) => (
                        <div key={`${event}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                          {event}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
              <span className="text-xs font-medium text-slate-300">System online</span>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200">TL</div>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <RealtimeIndicatorToast />
    </div>
  );
}
