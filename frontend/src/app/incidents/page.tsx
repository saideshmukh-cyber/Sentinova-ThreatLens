"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  createIncident,
  getIncidents,
  updateIncident,
} from "@/lib/api";

import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/incident";


const statusOptions: IncidentStatus[] = [
  "open",
  "in-progress",
  "resolved",
  "closed",
];


const severityOptions: IncidentSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];


export default function IncidentsPage() {
  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [severity, setSeverity] =
    useState<IncidentSeverity>("medium");

  const [assignee, setAssignee] =
    useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadIncidents() {
      try {
        const data =
          await getIncidents();

        if (!cancelled) {
          setIncidents(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load incidents.",
          );

          setLoading(false);
        }
      }
    }

    loadIncidents();

    return () => {
      cancelled = true;
    };
  }, []);


  async function handleCreateIncident(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const incident =
        await createIncident({
          title,
          description:
            description || undefined,
          severity,
          assignee:
            assignee || undefined,
        });

      setIncidents((current) => [
        incident,
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setSeverity("medium");
      setAssignee("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create incident.",
      );
    } finally {
      setCreating(false);
    }
  }


  async function handleStatusChange(
    incidentId: number,
    status: IncidentStatus,
  ) {
    try {
      setError(null);

      const updated =
        await updateIncident(
          incidentId,
          { status },
        );

      setIncidents((current) =>
        current.map((incident) =>
          incident.id === updated.id
            ? updated
            : incident,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update incident.",
      );
    }
  }


  if (loading) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-semibold text-white">
          Incidents
        </h2>

        <p className="mt-4 text-slate-400">
          Loading incidents...
        </p>
      </main>
    );
  }


  return (
    <main className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">
          Incidents
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage investigations and incident response.
        </p>
      </div>


      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}


      <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white">
          Create Incident
        </h3>

        <form
          onSubmit={handleCreateIncident}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Title
            </label>

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Suspicious activity investigation"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
            />
          </div>


          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Describe the incident..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
            />
          </div>


          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Severity
              </label>

              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(
                    event.target.value as IncidentSeverity,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              >
                {severityOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ),
                )}
              </select>
            </div>


            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Assignee
              </label>

              <input
                value={assignee}
                onChange={(event) =>
                  setAssignee(
                    event.target.value,
                  )
                }
                placeholder="SOC Analyst"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>
          </div>


          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating
              ? "Creating..."
              : "Create Incident"}
          </button>
        </form>
      </section>


      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-white">
            Incident List
          </h3>
        </div>


        {incidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No incidents found.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {incidents.map(
              (incident) => (
                <div
                  key={incident.id}
                  className="p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs text-slate-500">
                        Incident #{incident.id}
                      </p>

                      <h4 className="mt-1 text-lg font-semibold text-white">
                        {incident.title}
                      </h4>

                      {incident.description && (
                        <p className="mt-2 max-w-2xl text-sm text-slate-400">
                          {incident.description}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-slate-500">
                        Assignee:{" "}
                        <span className="text-slate-300">
                          {incident.assignee ??
                            "Unassigned"}
                        </span>
                      </p>
                    </div>


                    <div className="flex flex-col gap-3 sm:flex-row">
                      <span className="rounded-md border border-slate-700 px-3 py-2 text-xs uppercase text-slate-300">
                        {incident.severity}
                      </span>

                      <select
                        value={incident.status}
                        onChange={(event) =>
                          handleStatusChange(
                            incident.id,
                            event.target.value as IncidentStatus,
                          )
                        }
                        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                      >
                        {statusOptions.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}