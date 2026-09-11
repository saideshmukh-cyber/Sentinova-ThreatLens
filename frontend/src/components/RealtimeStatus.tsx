"use client";

type RealtimeStatusProps = {
  connected: boolean;
};

export default function RealtimeStatus({
  connected,
}: RealtimeStatusProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          connected
            ? "bg-green-500"
            : "bg-red-500"
        }`}
      />

      <span className="text-gray-400">
        {connected
          ? "Real-time connected"
          : "Real-time disconnected"}
      </span>
    </div>
  );
}