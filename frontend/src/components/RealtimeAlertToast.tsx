"use client";

import type { Alert } from "@/types/alert";

type RealtimeAlertToastProps = {
  alert: Alert | null;
  onClose: () => void;
};

export default function RealtimeAlertToast({
  alert,
  onClose,
}: RealtimeAlertToastProps) {
  if (!alert) {
    return null;
  }

  return (
    <div className="fixed right-6 top-6 z-50 w-96 rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-red-400">
          New Alert
        </span>

        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-white">
          {alert.rule}
        </p>

        <p className="text-gray-400">
          Indicator ID: {alert.indicator_id}
        </p>

        <p className="text-gray-400">
          Severity: {alert.severity_score}
        </p>

        <p className="text-gray-400">
          Status: {alert.status}
        </p>
      </div>
    </div>
  );
}