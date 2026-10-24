"use client";

import { formatDateTime } from "../../lib/date-time";

import { useEffect, useState } from "react";

import {
  createSecurityEvent,
  getSecurityEvents,
} from "@/lib/api";

import type {
  SecurityEvent,
} from "@/types/security-event";


function getCurrentDateTimeLocal(): string {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  const hours = String(
    now.getHours(),
  ).padStart(2, "0");

  const minutes = String(
    now.getMinutes(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function formatEventTimestamp(
  timestamp: string,
): string {
  return formatDateTime(timestamp);
}


export default function SecurityEventsPage() {
  const [events, setEvents] =
    useState<SecurityEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const [source, setSource] =
    useState("firewall");

  const [eventType, setEventType] =
    useState("connection");

  const [category, setCategory] =
    useState("network");

  const [indicatorValue, setIndicatorValue] =
    useState("");

  const [timestamp, setTimestamp] =
    useState(
      getCurrentDateTimeLocal(),
    );


  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        const data =
          await getSecurityEvents();

        if (!cancelled) {
          setEvents(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load security events.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, []);


  function useCurrentTime() {
    setTimestamp(
      getCurrentDateTimeLocal(),
    );
  }


  async function handleCreateEvent(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!indicatorValue.trim()) {
      setError(
        "Indicator value is required.",
      );
      return;
    }

    if (!timestamp) {
      setError(
        "Event timestamp is required.",
      );
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const created =
        await createSecurityEvent({
          source: source.trim(),
          event_type: eventType.trim(),
          category:
            category.trim() || undefined,
          indicator_value:
            indicatorValue.trim(),

          /*
           * datetime-local produces:
           *
           * 2026-09-09T16:30
           *
           * We deliberately do not use
           * toISOString() here because that
           * would convert the entered local
           * time into UTC.
           */
          timestamp:
            `${timestamp}:00`,
        });

      setEvents((current) => [
        created,
        ...current,
      ]);

      setIndicatorValue("");

      setTimestamp(
        getCurrentDateTimeLocal(),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create security event.",
      );
    } finally {
      setCreating(false);
    }
  }


  if (loading) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-semibold text-white">
          Security Events
        </h2>

        <p className="mt-4 text-slate-400">
          Loading security events...
        </p>
      </main>
    );
  }


  return (
    <main className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">
          Security Events
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Ingest internal security events and correlate them with ThreatLens indicators.
        </p>
      </div>


      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}


      <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white">
          Ingest Security Event
        </h3>

        <form
          onSubmit={handleCreateEvent}
          className="mt-5 space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Source
              </label>

              <input
                value={source}
                onChange={(event) =>
                  setSource(
                    event.target.value,
                  )
                }
                placeholder="firewall"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Event Type
              </label>

              <input
                value={eventType}
                onChange={(event) =>
                  setEventType(
                    event.target.value,
                  )
                }
                placeholder="connection"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>
          </div>


          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Category
              </label>

              <input
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value,
                  )
                }
                placeholder="network"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Indicator Value
              </label>

              <input
                value={indicatorValue}
                onChange={(event) =>
                  setIndicatorValue(
                    event.target.value,
                  )
                }
                placeholder="1.1.1.1"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>
          </div>


          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Event Timestamp
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(event) =>
                  setTimestamp(
                    event.target.value,
                  )
                }
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />

              <button
                type="button"
                onClick={useCurrentTime}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Use Current Time
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Choose any date and time, or click
              {" "}
              <span className="text-slate-400">
                Use Current Time
              </span>
              {" "}
              to fill the current local time.
            </p>
          </div>


          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating
              ? "Ingesting..."
              : "Ingest Event"}
          </button>
        </form>
      </section>


      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-white">
            Recent Security Events
          </h3>
        </div>


        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No security events found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    ID
                  </th>

                  <th className="px-6 py-4">
                    Source
                  </th>

                  <th className="px-6 py-4">
                    Event Type
                  </th>

                  <th className="px-6 py-4">
                    Category
                  </th>

                  <th className="px-6 py-4">
                    Indicator
                  </th>

                  <th className="px-6 py-4">
                    Timestamp
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {events.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-slate-400">
                      #{item.id}
                    </td>

                    <td className="px-6 py-4 text-white">
                      {item.source}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {item.event_type}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {item.category ??
                        "—"}
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-200">
                      {item.indicator_value}
                    </td>

                    <td className="px-6 py-4 text-slate-400">
                      {formatEventTimestamp(
                        item.timestamp,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}