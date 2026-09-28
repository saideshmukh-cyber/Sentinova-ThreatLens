"use client";

import { useEffect, useState } from "react";

import {
  getAlerts,
  updateAlert,
} from "@/lib/api";

import RealtimeAlertToast from "@/components/RealtimeAlertToast";
import RealtimeStatus from "@/components/RealtimeStatus";

import {
  connectAlertWebSocket,
} from "@/lib/websocket";

import type {
  Alert,
  AlertStatus,
} from "@/types/alert";


const statusOptions: AlertStatus[] = [
  "new",
  "acknowledged",
  "in-progress",
  "resolved",
  "closed",
];


function severityLabel(
  score: number,
): string {
  if (score >= 80) {
    return "Critical";
  }

  if (score >= 60) {
    return "High";
  }

  if (score >= 40) {
    return "Medium";
  }

  return "Low";
}


/**
 * Checks whether an unknown value contains
 * the minimum fields required for an Alert.
 */
function isAlert(
  value: unknown,
): value is Alert {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const alert =
    value as Record<string, unknown>;

  return (
    typeof alert.id === "number" &&
    typeof alert.indicator_id === "number" &&
    typeof alert.severity_score === "number" &&
    typeof alert.rule === "string" &&
    typeof alert.status === "string"
  );
}


/**
 * Extract an Alert from the different WebSocket
 * message shapes that the backend may send.
 *
 * Supported shapes:
 *
 * {
 *   event: "alert.created",
 *   data: {
 *     id: 1,
 *     indicator_id: 2,
 *     ...
 *   }
 * }
 *
 * OR
 *
 * {
 *   event: "alert.created",
 *   data: {
 *     alert: {
 *       id: 1,
 *       indicator_id: 2,
 *       ...
 *     }
 *   }
 * }
 *
 * OR
 *
 * {
 *   event: "alert.created",
 *   alert: {
 *     id: 1,
 *     indicator_id: 2,
 *     ...
 *   }
 * }
 */
function extractAlert(
  message: unknown,
): Alert | null {
  if (
    typeof message !== "object" ||
    message === null
  ) {
    return null;
  }

  const payload =
    message as Record<string, unknown>;

  // Case 1:
  // message.data is already the Alert.
  if (isAlert(payload.data)) {
    return payload.data;
  }

  // Case 2:
  // message.data.alert contains the Alert.
  if (
    typeof payload.data === "object" &&
    payload.data !== null
  ) {
    const data =
      payload.data as Record<string, unknown>;

    if (isAlert(data.alert)) {
      return data.alert;
    }
  }

  // Case 3:
  // message.alert contains the Alert.
  if (isAlert(payload.alert)) {
    return payload.alert;
  }

  return null;
}


function getWebSocketEvent(
  message: unknown,
): string | undefined {
  if (
    typeof message !== "object" ||
    message === null
  ) {
    return undefined;
  }

  const payload =
    message as Record<string, unknown>;

  return typeof payload.event === "string"
    ? payload.event
    : undefined;
}


export default function AlertsPage() {
  const [alerts, setAlerts] =
    useState<Alert[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [realtimeConnected, setRealtimeConnected] =
    useState(false);

  const [realtimeAlert, setRealtimeAlert] =
    useState<Alert | null>(null);


  /*
   * Load existing alerts from the REST API.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const data =
          await getAlerts();

        if (cancelled) {
          return;
        }

        setAlerts(data);
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load alerts.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);


  /*
   * Connect to the alert WebSocket.
   *
   * The previous version assumed that every message
   * stored the Alert directly in message.data.
   *
   * This version extracts the Alert safely from:
   *
   *   message.data
   *   message.data.alert
   *   message.alert
   */
  useEffect(() => {
    const socket =
      connectAlertWebSocket(
        (message) => {
          const alertData =
            extractAlert(message);

          /*
           * Ignore messages that are not alert
           * events instead of treating them as
           * application errors.
           */
          if (!alertData) {
            console.debug(
              "Ignoring non-alert WebSocket message:",
              message,
            );

            return;
          }

          const event =
            getWebSocketEvent(message);


          /*
           * New alert.
           */
          if (
            event === "alert.created"
          ) {
            setAlerts((current) => {
              const alreadyExists =
                current.some(
                  (alert) =>
                    alert.id ===
                    alertData.id,
                );

              if (alreadyExists) {
                return current;
              }

              return [
                alertData,
                ...current,
              ];
            });

            setRealtimeAlert(
              alertData,
            );

            return;
          }


          /*
           * Updated alert.
           */
          if (
            event === "alert.updated"
          ) {
            setAlerts((current) =>
              current.map((alert) =>
                alert.id === alertData.id
                  ? alertData
                  : alert,
              ),
            );

            return;
          }


          /*
           * If the backend sends a valid Alert
           * without an event name, do not throw an
           * error. We simply log it for debugging.
           */
          console.debug(
            "Received valid alert with unknown WebSocket event:",
            {
              event,
              alert: alertData,
            },
          );
        },

        setRealtimeConnected,
      );


    return () => {
      socket.close();
    };
  }, []);


  async function handleStatusChange(
    alertId: number,
    status: AlertStatus,
  ) {
    try {
      setUpdatingId(alertId);
      setError(null);

      const updated =
        await updateAlert(
          alertId,
          { status },
        );

      setAlerts((current) =>
        current.map((alert) =>
          alert.id === updated.id
            ? updated
            : alert,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update alert.",
      );
    } finally {
      setUpdatingId(null);
    }
  }


  if (loading) {
    return (
      <main className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Alerts
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Monitor and manage security alerts.
            </p>
          </div>

          <RealtimeStatus
            connected={
              realtimeConnected
            }
          />
        </div>

        <p className="text-slate-400">
          Loading alerts...
        </p>
      </main>
    );
  }


  return (
    <main className="p-8">

      <RealtimeAlertToast
        alert={realtimeAlert}
        onClose={() =>
          setRealtimeAlert(null)
        }
      />


      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Alerts
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Monitor and manage security alerts.
          </p>
        </div>

        <RealtimeStatus
          connected={
            realtimeConnected
          }
        />
      </div>


      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}


      {alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-400">
            No alerts found.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left">

            <thead className="border-b border-slate-800 bg-slate-950">
              <tr>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Indicator
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Score
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Severity
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rule
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assignee
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Incident
                </th>

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
                    {severityLabel(
                      alert.severity_score,
                    )}
                  </td>


                  <td className="px-4 py-4 text-sm text-slate-300">
                    {alert.rule}
                  </td>


                  <td className="px-4 py-4">
                    <select
                      value={alert.status}
                      disabled={
                        updatingId ===
                        alert.id
                      }
                      onChange={(event) =>
                        handleStatusChange(
                          alert.id,
                          event.target
                            .value as AlertStatus,
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
                  </td>


                  <td className="px-4 py-4 text-sm text-slate-300">
                    {alert.assignee ??
                      "Unassigned"}
                  </td>


                  <td className="px-4 py-4 text-sm text-slate-300">
                    {alert.incident_id
                      ? `#${alert.incident_id}`
                      : "Not linked"}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

    </main>
  );
}