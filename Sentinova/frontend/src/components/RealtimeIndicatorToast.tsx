"use client";

import { useEffect, useState } from "react";

import {
  connectAlertWebSocket,
  type AlertWebSocketMessage,
} from "@/lib/websocket";

type HighSeverityIndicator = {
  id: number;
  indicator_type: string;
  value: string;
  severity_score: number;
};

export default function RealtimeIndicatorToast() {
  const [indicator, setIndicator] =
    useState<HighSeverityIndicator | null>(null);

  useEffect(() => {
    const socket = connectAlertWebSocket(
      (message: AlertWebSocketMessage) => {
        if (
          message.event
          !== "indicators.high_severity"
        ) {
          return;
        }

        const data = message.data as
          | {
              indicator?: HighSeverityIndicator;
            }
          | undefined;

        if (!data?.indicator) {
          return;
        }

        setIndicator(data.indicator);

        window.setTimeout(() => {
          setIndicator(null);
        }, 6000);
      },
    );

    return () => {
      socket.close();
    };
  }, []);

  if (!indicator) {
    return null;
  }

  return (
    <div className="fixed right-6 top-6 z-50 w-96 rounded-lg border border-red-500/40 bg-slate-950 p-4 shadow-2xl">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">
        High Severity Indicator
      </div>

      <div className="break-all text-sm font-medium text-white">
        {indicator.value}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          Type: {indicator.indicator_type}
        </span>

        <span className="font-semibold text-red-400">
          Score: {indicator.severity_score}
        </span>
      </div>
    </div>
  );
}