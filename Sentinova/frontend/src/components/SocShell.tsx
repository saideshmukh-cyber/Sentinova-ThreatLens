"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import RealtimeIndicatorToast from "@/components/RealtimeIndicatorToast";
import {
  connectAlertWebSocket,
  type AlertWebSocketMessage,
} from "@/lib/websocket";
import { globalSearch } from "@/lib/api";

const routes = [
  { label: "Command Center", href: "/" },
  { label: "Executive", href: "/dashboards/executive" },
  { label: "SOC Analyst", href: "/dashboards/soc-analyst" },
  { label: "Incident Response", href: "/dashboards/incident-response" },
  { label: "Threat Hunting", href: "/dashboards/threat-hunting" },
];

function Icon({ name }: { name: "search" | "bell" | "spark" }) {
  if (name === "bell") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
        <path d="M18 17l.8 2.2L21 20l-2.2.8L18 23l-.8-2.2L15 20l2.2-.8L18 17Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export default function SocShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const authRequired =
    process.env.NEXT_PUBLIC_AUTH_REQUIRED === "true";

  const isPublicRoute =
    pathname === "/login" || pathname === "/signup";

  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [searchResults, setSearchResults] = useState<{
    indicators: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
  } | null>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [events, setEvents] = useState<
    Array<{
      event: string;
      at: string;
      payload: AlertWebSocketMessage;
    }>
  >([]);

  const [user, setUser] = useState<{
    username: string;
    role: string;
  } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  /*
   * Authentication check.
   *
   * Public pages do not require authentication.
   *
   * Protected pages are held back until localStorage has
   * been checked for an access token.
   */
  useEffect(() => {
    if (isPublicRoute) {
      setAuthChecked(true);
      setAuthenticated(false);
      return;
    }

    if (!authRequired) {
      setAuthChecked(true);
      setAuthenticated(true);
      return;
    }

    const token = localStorage.getItem(
      "threatlens_access_token",
    );

    if (token) {
      setAuthenticated(true);
      setAuthChecked(true);
    } else {
      setAuthenticated(false);
      setAuthChecked(true);
      router.replace("/login");
    }
  }, [authRequired, isPublicRoute, pathname, router]);

  /*
   * Load logged-in user information.
   */
  useEffect(() => {
    if (isPublicRoute || !authenticated) {
      setUser(null);
      return;
    }

    try {
      const stored = localStorage.getItem(
        "threatlens_user",
      );

      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, [authenticated, isPublicRoute, pathname]);

  /*
   * "/" keyboard shortcut opens global search.
   */
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        document.activeElement !== searchRef.current
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  /*
   * Realtime WebSocket.
   *
   * Only connect after authentication has been confirmed.
   */
  useEffect(() => {
    if (isPublicRoute || !authenticated) {
      return;
    }

    const socket = connectAlertWebSocket((message) => {
      setEvents((current) =>
        [
          {
            event: message.event ?? "realtime.event",
            at: new Date().toLocaleTimeString(),
            payload: message,
          },
          ...current,
        ].slice(0, 10),
      );
    });

    return () => {
      socket.close();
    };
  }, [authenticated, isPublicRoute, pathname]);

  const pageTitle = useMemo(() => {
    const route = routes.find(
      (item) => item.href === pathname,
    );

    if (route) {
      return route.label;
    }

    if (pathname.startsWith("/indicators")) {
      return "Indicators";
    }

    if (pathname.startsWith("/alerts")) {
      return "Alerts";
    }

    if (pathname.startsWith("/incidents")) {
      return "Incidents";
    }

    if (pathname.startsWith("/investigations")) {
      return "Investigations";
    }

    if (pathname.startsWith("/feeds")) {
      return "Feeds";
    }

    if (pathname.startsWith("/administration")) {
      return "Administration";
    }

    if (pathname.startsWith("/search")) {
      return "Search";
    }

    if (pathname.startsWith("/reports")) {
      return "Reports";
    }

    return "ThreatLens";
  }, [pathname]);

  async function runSearch(value: string) {
    const query = value.trim();

    if (!query) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    setSearchOpen(true);

    try {
      const results = await globalSearch(query);
      setSearchResults(results);
    } catch {
      setSearchResults(null);
      router.push(
        `/indicators?query=${encodeURIComponent(query)}`,
      );
    }
  }

  function logout() {
    localStorage.removeItem("threatlens_access_token");
    localStorage.removeItem("threatlens_refresh_token");
    localStorage.removeItem("threatlens_user");

    setAuthenticated(false);
    setUser(null);

    router.replace("/login");
  }

  /*
   * Login and signup pages should not display the SOC shell.
   */
  if (isPublicRoute) {
    return <>{children}</>;
  }

  /*
   * While authentication is being checked, do not render
   * protected pages yet.
   */
  if (authRequired && !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-sm text-slate-400">
          Checking authentication...
        </div>
      </div>
    );
  }

  /*
   * If authentication is required but there is no valid
   * local token, keep the protected application hidden.
   */
  if (authRequired && !authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-6">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-lg font-semibold">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                  <Icon name="search" />

                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void runSearch(search);
                      }

                      if (event.key === "Escape") {
                        setSearch("");
                        setSearchOpen(false);
                        setSearchResults(null);
                      }
                    }}
                    placeholder="Search..."
                    className="w-56 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  />
                </div>

                {searchOpen && searchResults && (
                  <div className="absolute right-0 top-12 z-50 w-96 rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Search results
                    </div>

                    <div className="space-y-2">
                      {searchResults.indicators.length === 0 &&
                      searchResults.events.length === 0 ? (
                        <div className="text-sm text-slate-500">
                          No results found.
                        </div>
                      ) : (
                        <>
                          {searchResults.indicators
                            .slice(0, 5)
                            .map((indicator, index) => (
                              <button
                                key={`indicator-${index}`}
                                type="button"
                                className="block w-full rounded-md p-2 text-left text-sm hover:bg-slate-800"
                                onClick={() => {
                                  setSearchOpen(false);
                                  router.push(
                                    `/indicators`,
                                  );
                                }}
                              >
                                <div className="text-slate-200">
                                  {String(
                                    indicator.value ??
                                      indicator.name ??
                                      "Indicator",
                                  )}
                                </div>

                                <div className="text-xs text-slate-500">
                                  Indicator
                                </div>
                              </button>
                            ))}

                          {searchResults.events
                            .slice(0, 5)
                            .map((event, index) => (
                              <button
                                key={`event-${index}`}
                                type="button"
                                className="block w-full rounded-md p-2 text-left text-sm hover:bg-slate-800"
                                onClick={() => {
                                  setSearchOpen(false);
                                  router.push(
                                    `/security-events`,
                                  );
                                }}
                              >
                                <div className="text-slate-200">
                                  {String(
                                    event.name ??
                                      event.event_type ??
                                      event.message ??
                                      "Security event",
                                  )}
                                </div>

                                <div className="text-xs text-slate-500">
                                  Security event
                                </div>
                              </button>
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen((value) => !value)
                }
                className="relative rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Icon name="bell" />

                {events.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {events.length}
                  </span>
                )}
              </button>

              <div className="hidden items-center gap-2 border-l border-slate-800 pl-3 sm:flex">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-200">
                    {user?.username ?? "User"}
                  </div>

                  <div className="text-xs capitalize text-slate-500">
                    {user?.role ?? ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {notificationsOpen && (
          <div className="fixed right-6 top-20 z-50 w-96 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="bell" />
                Notifications
              </div>

              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Close
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-sm text-slate-500">
                No realtime notifications.
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((item, index) => (
                  <div
                    key={`${item.at}-${index}`}
                    className="rounded-md border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="text-sm text-slate-200">
                      {item.event}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {item.at}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <RealtimeIndicatorToast />
    </div>
  );
}