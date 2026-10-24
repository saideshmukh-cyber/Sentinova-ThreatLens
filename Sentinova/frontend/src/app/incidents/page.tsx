"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { createIncident, getIncidents, updateIncident } from "@/lib/api";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types/incident";

const statusOptions: IncidentStatus[] = ["open", "in-progress", "resolved", "closed"];
const severityOptions: IncidentSeverity[] = ["low", "medium", "high", "critical"];

type IncidentEdits = {
  severity: IncidentSeverity;
  assignee: string;
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [edits, setEdits] = useState<Record<number, IncidentEdits>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [assignee, setAssignee] = useState("");

  function initialiseEdits(items: Incident[]) {
    const next: Record<number, IncidentEdits> = {};
    for (const incident of items) {
      next[incident.id] = {
        severity: incident.severity,
        assignee: incident.assignee ?? "",
      };
    }
    setEdits(next);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadIncidents() {
      try {
        const data = await getIncidents();
        if (!cancelled) {
          setIncidents(data);
          initialiseEdits(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load incidents.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadIncidents();
    return () => { cancelled = true; };
  }, []);

  async function handleCreateIncident(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Please enter an incident title.");
      return;
    }
    try {
      setCreating(true);
      setError(null);
      setNotice(null);
      const incident = await createIncident({
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        assignee: assignee.trim() || undefined,
      });
      setIncidents((current) => [incident, ...current]);
      setEdits((current) => ({
        ...current,
        [incident.id]: { severity: incident.severity, assignee: incident.assignee ?? "" },
      }));
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setAssignee("");
      setNotice("Incident created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create incident.");
    } finally {
      setCreating(false);
    }
  }

  function changeEdit(id: number, changes: Partial<IncidentEdits>) {
    setEdits((current) => ({
      ...current,
      [id]: {
        severity: current[id]?.severity ?? "medium",
        assignee: current[id]?.assignee ?? "",
        ...changes,
      },
    }));
  }

  async function handleSaveIncident(incident: Incident) {
    const draft = edits[incident.id];
    if (!draft) return;
    try {
      setSavingId(incident.id);
      setError(null);
      setNotice(null);
      const updated = await updateIncident(incident.id, {
        severity: draft.severity,
        assignee: draft.assignee.trim() || null,
      });
      setIncidents((current) =>
        current.map((item) => item.id === updated.id ? updated : item),
      );
      changeEdit(updated.id, {
        severity: updated.severity,
        assignee: updated.assignee ?? "",
      });
      setNotice(`Incident #${updated.id} saved successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save incident changes.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleStatusChange(incidentId: number, status: IncidentStatus) {
    try {
      setError(null);
      setNotice(null);
      const updated = await updateIncident(incidentId, { status });
      setIncidents((current) =>
        current.map((incident) => incident.id === updated.id ? updated : incident),
      );
      setNotice(`Incident #${updated.id} status updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update incident status.");
    }
  }

  if (loading) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-semibold text-white">Incidents</h2>
        <p className="mt-4 text-slate-400">Loading incidents...</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">Incidents</h2>
        <p className="mt-1 text-sm text-slate-400">Manage investigations and incident response.</p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white">Create Incident</h3>
        <form onSubmit={handleCreateIncident} className="mt-5 space-y-4">
          <div>
            <label htmlFor="new-incident-title" className="mb-2 block text-sm text-slate-400">Title</label>
            <input id="new-incident-title" required value={title} onChange={(event) => setTitle(event.target.value)}
              placeholder="Suspicious activity investigation"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500" />
          </div>
          <div>
            <label htmlFor="new-incident-description" className="mb-2 block text-sm text-slate-400">Description</label>
            <textarea id="new-incident-description" value={description} onChange={(event) => setDescription(event.target.value)}
              rows={3} placeholder="Describe the incident..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="new-incident-severity" className="mb-2 block text-sm text-slate-400">Severity</label>
              <select id="new-incident-severity" value={severity} onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500">
                {severityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="new-incident-assignee" className="mb-2 block text-sm text-slate-400">Assignee</label>
              <input id="new-incident-assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)}
                placeholder="SOC Analyst"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500" />
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
            {creating ? "Creating..." : "Create Incident"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-white">Incident List</h3>
        </div>
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No incidents found.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {incidents.map((incident) => {
              const draft = edits[incident.id] ?? {
                severity: incident.severity,
                assignee: incident.assignee ?? "",
              };
              const hasChanges = draft.severity !== incident.severity
                || draft.assignee !== (incident.assignee ?? "");
              return (
                <div key={incident.id} className="p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">Incident #{incident.id}</p>
                      <h4 className="mt-1 text-lg font-semibold text-white">{incident.title}</h4>
                      <Link
  href={`/incidents/${incident.id}`}
  className="mt-2 inline-block text-sm font-medium text-sky-400 hover:text-sky-300"
>
  View Details & Timeline →
</Link>
                      {incident.description && <p className="mt-2 max-w-2xl text-sm text-slate-400">{incident.description}</p>}
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor={`severity-${incident.id}`} className="mb-2 block text-sm text-slate-400">Severity</label>
                          <select id={`severity-${incident.id}`} value={draft.severity}
                            onChange={(event) => changeEdit(incident.id, { severity: event.target.value as IncidentSeverity })}
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500">
                            {severityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`assignee-${incident.id}`} className="mb-2 block text-sm text-slate-400">Assignee</label>
                          <input id={`assignee-${incident.id}`} value={draft.assignee}
                            onChange={(event) => changeEdit(incident.id, { assignee: event.target.value })}
                            placeholder="Unassigned"
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500" />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => void handleSaveIncident(incident)}
                          disabled={!hasChanges || savingId === incident.id}
                          className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
                          {savingId === incident.id ? "Saving..." : "Save Changes"}
                        </button>
                        <button type="button" onClick={() => changeEdit(incident.id, {
                          severity: incident.severity,
                          assignee: incident.assignee ?? "",
                        })} disabled={!hasChanges || savingId === incident.id}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row xl:pl-4">
                      <span className="rounded-md border border-slate-700 px-3 py-2 text-xs uppercase text-slate-300">
                        Current severity: {incident.severity}
                      </span>
                      <div>
                        <label htmlFor={`status-${incident.id}`} className="mb-1 block text-xs text-slate-500">Status</label>
                        <select id={`status-${incident.id}`} value={incident.status}
                          onChange={(event) => void handleStatusChange(incident.id, event.target.value as IncidentStatus)}
                          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500">
                          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
