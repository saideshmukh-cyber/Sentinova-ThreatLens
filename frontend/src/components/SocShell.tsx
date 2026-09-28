"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import RealtimeIndicatorToast from "@/components/RealtimeIndicatorToast";
import { connectAlertWebSocket, type AlertWebSocketMessage } from "@/lib/websocket";
import { globalSearch } from "@/lib/api";

const routes = [
  { label: "Command Center", href: "/" },
  { label: "Executive", href: "/dashboards/executive" },
  { label: "SOC Analyst", href: "/dashboards/soc-analyst" },
  { label: "Incident Response", href: "/dashboards/incident-response" },
  { label: "Threat Hunting", href: "/dashboards/threat-hunting" },
];

function Icon({ name }: { name: "search" | "bell" | "spark" }) {
  if (name === "bell") return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
  if (name === "spark") return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="M18 17l.8 2.2L21 20l-2.2.8L18 23l-.8-2.2L15 20l2.2-.8L18 17Z"/></svg>;
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>;
}

export default function SocShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authRequired = process.env.NEXT_PUBLIC_AUTH_REQUIRED === "true";
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ indicators: Array<Record<string, unknown>>; events: Array<Record<string, unknown>> } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [events, setEvents] = useState<Array<{ event: string; at: string; payload: AlertWebSocketMessage }>>([]);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("threatlens_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch { setUser(null); }
  }, [pathname]);

  useEffect(() => {
    if (!authRequired || pathname === "/login") return;
    if (!localStorage.getItem("threatlens_access_token")) router.replace("/login");
  }, [authRequired, pathname, router]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement !== searchRef.current) { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (pathname === "/login") return;
    const socket = connectAlertWebSocket((message) => setEvents((current) => [{ event: message.event ?? "realtime.event", at: new Date().toLocaleTimeString(), payload: message }, ...current].slice(0, 10)));
    return () => socket.close();
  }, [pathname]);

  const pageTitle = useMemo(() => routes.find((r) => r.href === pathname)?.label ?? (
    pathname.startsWith("/indicators") ? "Indicators" : pathname.startsWith("/enrichments") ? "Enrichments" : pathname.startsWith("/investigations") ? "Investigations" : pathname.startsWith("/feeds") ? "Feeds" : pathname.startsWith("/alerts") ? "Alerts" : pathname.startsWith("/alert-rules") ? "Alert Rules" : pathname.startsWith("/security-events") ? "Security Events" : pathname.startsWith("/incidents") ? "Incidents" : pathname.startsWith("/audit") ? "Audit Log" : pathname.startsWith("/reports") ? "Reports & Exports" : pathname.startsWith("/users") ? "Users & Roles" : "ThreatLens"
  ), [pathname]);

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    setSearchOpen(true);
    try { setSearchResults(await globalSearch(value)); } catch { setSearchResults(null); router.push(`/indicators?query=${encodeURIComponent(value)}`); }
  }

  function logout() {
    localStorage.removeItem("threatlens_access_token");
    localStorage.removeItem("threatlens_refresh_token");
    localStorage.removeItem("threatlens_user");
    router.replace("/login");
  }

  if (pathname === "/login") return <>{children}</>;

  return <div className="flex min-h-screen bg-transparent"><Sidebar/><div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#071018]/90 backdrop-blur-xl"><div className="flex min-h-[78px] items-center gap-3 px-4 sm:px-6 xl:px-8"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-400/75"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300"/>SOC OPERATIONS</div><div className="mt-1 truncate text-lg font-semibold text-slate-100">{pageTitle}</div></div><form onSubmit={runSearch} className="relative hidden w-[360px] lg:block"><div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5"><span className="text-slate-500"><Icon name="search"/></span><input ref={searchRef} value={search} onChange={(e)=>setSearch(e.target.value)} onFocus={()=>search && setSearchOpen(true)} placeholder="Search IOC, event, source..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"/><kbd className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-600">/</kbd></div>{searchOpen&&search&&<div className="absolute left-0 right-0 top-12 rounded-2xl border border-slate-800 bg-[#0b1622] p-3 shadow-2xl"><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500"><span>Global search</span><button type="button" onClick={()=>setSearchOpen(false)} className="text-slate-600 hover:text-slate-200">Close</button></div>{searchResults?<div className="space-y-2">{searchResults.indicators.slice(0,4).map((item,i)=><button type="button" key={i} onClick={()=>router.push(`/indicators/${item.id}`)} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-left hover:border-cyan-400/20"><div className="text-[10px] uppercase tracking-wider text-cyan-300">{String(item.indicator_type)}</div><div className="mt-1 break-all font-mono text-xs text-slate-300">{String(item.value)}</div></button>)}{searchResults.indicators.length===0&&searchResults.events.length===0&&<div className="p-4 text-xs text-slate-500">No matching intelligence.</div>}</div>:<div className="p-4 text-xs text-slate-500">Searching...</div>}</div>}</form><button type="button" onClick={()=>setNotificationsOpen(v=>!v)} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white" aria-label="Notifications"><Icon name="bell"/>{events.length>0&&<span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300"/>}</button><div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400"/><span className="text-xs font-medium text-slate-300">Operational</span></div><div className="hidden min-w-[110px] items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 md:flex"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300">{user?.username?.slice(0,2).toUpperCase() ?? "TL"}</div><div className="min-w-0"><div className="truncate text-xs font-medium text-slate-200">{user?.username ?? "Local user"}</div><div className="truncate text-[9px] uppercase tracking-wider text-slate-600">{user?.role ?? "Operator"}</div></div></div><button type="button" onClick={logout} className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-white">Logout</button>{notificationsOpen&&<div className="absolute right-4 top-[70px] w-[360px] rounded-2xl border border-slate-800 bg-[#0b1622] p-4 shadow-2xl"><div className="flex items-center justify-between"><div><div className="text-sm font-semibold text-white">Live notifications</div><div className="mt-1 text-xs text-slate-500">Alert and high-severity WebSocket stream</div></div><span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>Live</span></div><div className="mt-4 space-y-2">{events.length===0?<div className="rounded-xl border border-dashed border-slate-700 p-4 text-xs text-slate-500">No events received this session.</div>:events.map((item,i)=><div key={i} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-300">{item.event}</span><span className="text-[10px] text-slate-600">{item.at}</span></div><div className="mt-1 text-[10px] text-slate-500">Realtime event received</div></div>)}</div></div>}</div></header><main className="min-w-0 flex-1">{children}</main></div><RealtimeIndicatorToast/></div>;
}
