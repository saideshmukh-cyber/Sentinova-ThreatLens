"use client";

import { formatDateTime } from "../../../lib/date-time";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  getIncident,
  getIncidentTimeline,
} from "@/lib/api";

import type {
  Incident,
} from "@/types/incident";

import type {
  IncidentTimeline,
} from "@/types/incident-timeline";


export default function IncidentDetailPage() {
  const params = useParams();

  const incidentId =
    Number(params.id);

  const [incident, setIncident] =
    useState<Incident | null>(null);

  const [timeline, setTimeline] =
    useState<IncidentTimeline[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [
          incidentData,
          timelineData,
        ] = await Promise.all([
          getIncident(incidentId),
          getIncidentTimeline(
            incidentId,
          ),
        ]);

        setIncident(
          incidentData,
        );

        setTimeline(
          timelineData,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load incident.",
        );
      } finally {
        setLoading(false);
      }
    }


    if (
      Number.isInteger(incidentId)
      && incidentId > 0
    ) {
      loadData();
    }
  }, [incidentId]);


  if (loading) {
    return (
      <main className="p-8">
        <p className="text-slate-400">
          Loading incident...
        </p>
      </main>
    );
  }


  if (error || !incident) {
    return (
      <main className="p-8">
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-6">
          <p className="text-red-300">
            {error ??
              "Incident not found."}
          </p>
        </div>
      </main>
    );
  }


  return (
    <main className="p-8">
      <div className="mb-6">
        <Link
          href="/incidents"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to incidents
        </Link>
      </div>


      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Incident #{incident.id}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-white">
              {incident.title}
            </h2>

            {incident.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                {incident.description}
              </p>
            )}
          </div>


          <div className="flex gap-3">
            <span className="rounded-md border border-slate-700 px-3 py-2 text-xs uppercase text-slate-300">
              {incident.severity}
            </span>

            <span className="rounded-md border border-slate-700 px-3 py-2 text-xs uppercase text-slate-300">
              {incident.status}
            </span>
          </div>
        </div>


        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white">
            Investigation Timeline
          </h3>

          {timeline.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No timeline events.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {timeline.map(
                (entry) => (
                  <div
                    key={entry.id}
                    className="border-l border-slate-700 pl-5"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-white">
                        {entry.event_type}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatDateTime(entry.created_at)}
                      </p>
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {entry.description}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Actor:{" "}
                      {entry.actor ??
                        "Unknown"}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}