"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Feed = {
  name: string;
  description?: string;
  enabled?: boolean;
};

type FeedRunResult = {
  feed: string;
  fetched: number;
  created: number;
  skipped: number;
  unsupported: number;
};

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<FeedRunResult | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function loadFeeds() {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/v1/feeds/`);

      if (!response.ok) {
        throw new Error(`Failed to load feeds: ${response.status}`);
      }

      const data = await response.json();
      setFeeds(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load feeds.",
      );
    } finally {
      setLoaded(true);
    }
  }

  async function runFeed(name: string) {
    try {
      setRunning(name);
      setResult(null);
      setError("");

      const response = await fetch(
        `${API_URL}/api/v1/feeds/${encodeURIComponent(name)}/run`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || `Feed failed with status ${response.status}`,
        );
      }

      setResult(data);
      await loadFeeds();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to run feed.",
      );
    } finally {
      setRunning(null);
    }
  }

  if (!loaded) {
    void loadFeeds();
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Threat Feeds
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage and run configured threat intelligence feeds.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
          <h2 className="font-medium text-emerald-300">
            Feed completed
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Fetched</p>
              <p className="text-lg font-semibold text-white">
                {result.fetched}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Created</p>
              <p className="text-lg font-semibold text-white">
                {result.created}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Skipped</p>
              <p className="text-lg font-semibold text-white">
                {result.skipped}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Unsupported</p>
              <p className="text-lg font-semibold text-white">
                {result.unsupported}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-medium text-white">Configured feeds</h2>
        </div>

        {!loaded ? (
          <div className="p-6 text-sm text-slate-400">
            Loading feeds...
          </div>
        ) : feeds.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">
            No feeds configured.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {feeds.map((feed) => (
              <div
                key={feed.name}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-medium text-white">
                    {feed.name}
                  </h3>

                  {feed.description && (
                    <p className="mt-1 text-sm text-slate-400">
                      {feed.description}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-500">
                    Status:{" "}
                    {feed.enabled === false ? "Disabled" : "Enabled"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void runFeed(feed.name)}
                  disabled={
                    running !== null || feed.enabled === false
                  }
                  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {running === feed.name ? "Running..." : "Run feed"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}