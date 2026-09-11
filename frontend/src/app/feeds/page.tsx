"use client";

import {
  useState,
} from "react";


type FeedResult = {
  source: string;
  fetched: number;
  inserted: number;
  duplicates: number;
  failed: number;
};


export default function FeedsPage() {
  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<FeedResult | null>(null);

  const [error, setError] =
    useState("");

  async function runURLhaus() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await fetch(
          "http://127.0.0.1:8000/api/v1/feeds/urlhaus",
          {
            method: "POST",
          },
        );

      if (!response.ok) {
        let message =
          `Feed ingestion failed: ${response.status}`;

        try {
          const data =
            await response.json();

          if (data.detail) {
            message =
              data.detail;
          }
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      const data =
        (await response.json()) as FeedResult;

      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Feed ingestion failed.",
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="flex-1">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <h2 className="text-2xl font-semibold text-white">
          Threat Feeds
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage and monitor threat intelligence feeds.
        </p>
      </header>


      <div className="p-8">
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <FeedCard
            name="URLhaus"
            description="Malicious URL intelligence feed."
            source="urlhaus"
            loading={loading}
            onRun={runURLhaus}
          />

          <FeedCard
            name="Additional Sources"
            description="Additional feed integrations will be added here."
            source="planned"
            loading={false}
            onRun={() => undefined}
            disabled
          />
        </div>


        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-5">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}


        {result && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">
                Latest Ingestion Result
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Source:{" "}
                {result.source}
              </p>
            </div>


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Fetched"
                value={result.fetched}
              />

              <StatCard
                label="Inserted"
                value={result.inserted}
              />

              <StatCard
                label="Duplicates"
                value={result.duplicates}
              />

              <StatCard
                label="Failed"
                value={result.failed}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


type FeedCardProps = {
  name: string;
  description: string;
  source: string;
  loading: boolean;
  onRun: () => void;
  disabled?: boolean;
};


function FeedCard({
  name,
  description,
  source,
  loading,
  onRun,
  disabled = false,
}: FeedCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {name}
          </h3>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              disabled
                ? "bg-slate-800 text-slate-500"
                : "bg-emerald-950 text-emerald-400"
            }`}
          >
            {disabled
              ? "Planned"
              : "Available"}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          {description}
        </p>

        <p className="mt-2 font-mono text-xs text-slate-500">
          Source: {source}
        </p>
      </div>

      <button
        type="button"
        onClick={onRun}
        disabled={
          disabled ||
          loading
        }
        className="rounded-lg bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading
          ? "Ingesting..."
          : "Run Feed"}
      </button>
    </div>
  );
}


type StatCardProps = {
  label: string;
  value: number;
};


function StatCard({
  label,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}