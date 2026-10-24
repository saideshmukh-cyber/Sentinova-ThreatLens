"use client";

import { useEffect, useState } from "react";

import {
  attachAlertToIncident,
  createIncident,
  createIncidentFromAlert,
  escalateAlert,
  getAlerts,
  getIncidents,
  updateAlert,
} from "@/lib/api";

import RealtimeAlertToast from "@/components/RealtimeAlertToast";
import RealtimeStatus from "@/components/RealtimeStatus";
import { connectAlertWebSocket } from "@/lib/websocket";

import type { Alert, AlertStatus } from "@/types/alert";
import type { Incident, IncidentSeverity } from "@/types/incident";

const statusOptions: AlertStatus[] = [
  "new",
  "acknowledged",
  "in-progress",
  "resolved",
  "closed",
];

const incidentSeverities: IncidentSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

type Modal =
  | { type: "create"; alert: Alert | null }
  | { type: "create-from-alert"; alert: Alert }
  | { type: "attach"; alert: Alert }
  | null;

function severityLabel(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function incidentSeverityForAlert(score: number): IncidentSeverity {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function isAlert(value: unknown): value is Alert {
  if (typeof value !== "object" || value === null) return false;
  const alert = value as Record<string, unknown>;
  return (
    typeof alert.id === "number" &&
    typeof alert.indicator_id === "number" &&
    typeof alert.severity_score === "number" &&
    typeof alert.rule === "string" &&
    typeof alert.status === "string"
  );
}

function extractAlert(message: unknown): Alert | null {
  if (typeof message !== "object" || message === null) return null;
  const payload = message as Record<string, unknown>;

  if (isAlert(payload.data)) return payload.data;

  if (typeof payload.data === "object" && payload.data !== null) {
    const data = payload.data as Record<string, unknown>;
    if (isAlert(data.alert)) return data.alert;
  }

  if (isAlert(payload.alert)) return payload.alert;
  return null;
}

function getWebSocketEvent(message: unknown): string | undefined {
  if (typeof message !== "object" || message === null) return undefined;
  const payload = message as Record<string, unknown>;
  return typeof payload.event === "string" ? payload.event : undefined;
}

function getCurrentRole(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem("threatlens_user");
    if (!stored) return "";
    const user = JSON.parse(stored) as { role?: string };
    return user.role ?? "";
  } catch {
    return "";
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [realtimeAlert, setRealtimeAlert] = useState<Alert | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentSeverity, setIncidentSeverity] =
    useState<IncidentSeverity>("medium");
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | "">("");

  const role = getCurrentRole();
  const isAdmin = role === "admin";
  const isAnalyst = role === "analyst";
  const isIncidentResponder = role === "incident_responder";

  const canEscalate = isAdmin || isAnalyst || isIncidentResponder;
  const canCreateIncident = isAdmin || isIncidentResponder;
  const canCreateIncidentFromAlert =
    isAdmin || isAnalyst || isIncidentResponder;
  const canAttachIncident = isAdmin || isAnalyst || isIncidentResponder;

  async function loadIncidents() {
    try {
      setIncidents(await getIncidents());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load incidents.",
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const data = await getAlerts();
        if (!cancelled) {
          setAlerts(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load alerts.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAlerts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (canAttachIncident || canCreateIncident) {
      void loadIncidents();
    }
  }, [canAttachIncident, canCreateIncident]);

  useEffect(() => {
    const socket = connectAlertWebSocket(
      (message) => {
        const alertData = extractAlert(message);
        if (!alertData) return;

        const event = getWebSocketEvent(message);

        if (event === "alert.created") {
          setAlerts((current) => {
            if (current.some((alert) => alert.id === alertData.id)) {
              return current;
            }
            return [alertData, ...current];
          });
          setRealtimeAlert(alertData);
          return;
        }

        if (event === "alert.updated") {
          setAlerts((current) =>
            current.map((alert) =>
              alert.id === alertData.id ? alertData : alert,
            ),
          );
        }
      },
      setRealtimeConnected,
    );

    return () => socket.close();
  }, []);

  function openCreateIncident(alert: Alert | null = null) {
    setIncidentTitle(
      alert ? `ThreatLens Incident - Alert ${alert.id}` : "",
    );
    setIncidentDescription(
      alert
        ? `Incident created from alert ${alert.id}.`
        : "",
    );
    setIncidentSeverity(
      alert ? incidentSeverityForAlert(alert.severity_score) : "medium",
    );
    setModal(
      alert
        ? { type: "create-from-alert", alert }
        : { type: "create", alert: null },
    );
    setError(null);
  }

  function openAttach(alert: Alert) {
    setSelectedIncidentId("");
    setModal({ type: "attach", alert });
    setError(null);
    void loadIncidents();
  }

  async function handleStatusChange(alertId: number, status: AlertStatus) {
    try {
      setUpdatingId(alertId);
      setError(null);

      const updated = await updateAlert(alertId, { status });
      setAlerts((current) =>
        current.map((alert) =>
          alert.id === updated.id ? updated : alert,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update alert.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleEscalate(alert: Alert) {
    try {
      setBusyAction(`escalate-${alert.id}`);
      setError(null);

      const updated = await escalateAlert(alert.id);
      setAlerts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to escalate alert.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateIncidentFromAlert() {
    if (modal?.type !== "create-from-alert") return;

    const alert = modal.alert;

    try {
      setBusyAction(`create-from-alert-${alert.id}`);
      setError(null);

      const incident = await createIncidentFromAlert(alert.id, {
        title: incidentTitle,
        description: incidentDescription || undefined,
        severity: incidentSeverity,
      });

      setIncidents((current) => [incident, ...current]);
      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id
            ? { ...item, incident_id: incident.id }
            : item,
        ),
      );
      setModal(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create an incident from the alert.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateStandaloneIncident() {
    try {
      setBusyAction("create-incident");
      setError(null);

      const incident = await createIncident({
        title: incidentTitle,
        description: incidentDescription || undefined,
        severity: incidentSeverity,
      });

      setIncidents((current) => [incident, ...current]);
      setModal(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create incident.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAttach() {
    if (modal?.type !== "attach" || selectedIncidentId === "") return;

    try {
      setBusyAction(`attach-${modal.alert.id}`);
      setError(null);

      const updated = await attachAlertToIncident(
        modal.alert.id,
        selectedIncidentId,
      );

      setAlerts((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );
      setModal(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to attach alert.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <main className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Alerts</h2>
            <p className="mt-1 text-sm text-slate-400">
              Monitor and manage security alerts.
            </p>
          </div>
          <RealtimeStatus connected={realtimeConnected} />
        </div>
        <p className="text-slate-400">Loading alerts...</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <RealtimeAlertToast
        alert={realtimeAlert}
        onClose={() => setRealtimeAlert(null)}
      />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Alerts</h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitor, triage, escalate and operationalise security alerts.
          </p>
        </div>
        <RealtimeStatus connected={realtimeConnected} />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-400">No alerts found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 bg-slate-950">
              <tr>
                {["ID", "Indicator", "Score", "Severity", "Rule", "Status", "Assignee", "Incident", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                >
                  <td className="px-4 py-4 text-sm text-slate-300">
                    #{alert.id}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    Indicator #{alert.indicator_id}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-white">
                    {alert.severity_score}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {severityLabel(alert.severity_score)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {alert.rule}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={alert.status}
                      disabled={updatingId === alert.id}
                      onChange={(event) =>
                        void handleStatusChange(
                          alert.id,
                          event.target.value as AlertStatus,
                        )
                      }
                      className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {alert.assignee ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {alert.incident_id ? `#${alert.incident_id}` : "Not linked"}
                  </td>
                  <td className="min-w-[360px] px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canEscalate && (
  <button
    type="button"
    disabled={
      busyAction === `escalate-${alert.id}` ||
      alert.status === "in-progress"
    }
    onClick={() => void handleEscalate(alert)}
    className={`rounded-md border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
      alert.status === "in-progress"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
        : "border-amber-500/40 bg-amber-500/10 text-amber-300"
    }`}
  >
    {busyAction === `escalate-${alert.id}`
      ? "Escalating..."
      : alert.status === "in-progress"
        ? "Escalated"
        : "Escalate"}
  </button>
)}

                      {canCreateIncident && (
                        <button
                          type="button"
                          onClick={() => openCreateIncident()}
                          className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300"
                        >
                          Create Incident
                        </button>
                      )}

                      {canCreateIncidentFromAlert && (
                        <button
                          type="button"
                          disabled={alert.incident_id !== null}
                          onClick={() => openCreateIncident(alert)}
                          className="rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Create Incident from Alert
                        </button>
                      )}

                      {canAttachIncident && (
                        <button
                          type="button"
                          onClick={() => openAttach(alert)}
                          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200"
                        >
                          Attach to Incident
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {modal.type === "attach"
                    ? "Attach Alert to Incident"
                    : modal.type === "create-from-alert"
                      ? `Create Incident from Alert #${modal.alert.id}`
                      : "Create Incident"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {modal.type === "attach"
                    ? "Choose an existing incident."
                    : "Enter the incident details before saving."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {modal.type === "attach" ? (
              <>
                <select
                  value={selectedIncidentId}
                  onChange={(event) =>
                    setSelectedIncidentId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                >
                  <option value="">Select an incident...</option>
                  {incidents.map((incident) => (
                    <option key={incident.id} value={incident.id}>
                      #{incident.id} — {incident.title}
                    </option>
                  ))}
                </select>

                {incidents.length === 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    No incidents are available yet. Create one first.
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedIncidentId === "" ||
                      busyAction === `attach-${modal.alert.id}`
                    }
                    onClick={() => void handleAttach()}
                    className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    Attach
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <input
                    value={incidentTitle}
                    onChange={(event) => setIncidentTitle(event.target.value)}
                    placeholder="Incident title"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
                  />

                  <textarea
                    value={incidentDescription}
                    onChange={(event) =>
                      setIncidentDescription(event.target.value)
                    }
                    placeholder="Description"
                    rows={4}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
                  />

                  <select
                    value={incidentSeverity}
                    onChange={(event) =>
                      setIncidentSeverity(
                        event.target.value as IncidentSeverity,
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                  >
                    {incidentSeverities.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      !incidentTitle.trim() ||
                      busyAction ===
                        (modal.type === "create-from-alert"
                          ? `create-from-alert-${modal.alert.id}`
                          : "create-incident")
                    }
                    onClick={() =>
                      void (modal.type === "create-from-alert"
                        ? handleCreateIncidentFromAlert()
                        : handleCreateStandaloneIncident())
                    }
                    className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    {modal.type === "create-from-alert"
                      ? "Create & Link"
                      : "Create Incident"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
