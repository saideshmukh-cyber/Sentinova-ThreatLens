"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  enrichIndicator,
  getIndicator,
  getIndicatorEnrichments,
} from "@/lib/api";

import type {
  Enrichment,
} from "@/types/enrichment";

import type {
  Indicator,
} from "@/types/indicator";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(
  value: string,
): string {
  return new Date(
    value,
  ).toLocaleString();
}

function formatSource(
  source: string,
): string {
  return source
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function groupEnrichments(
  enrichments: Enrichment[],
): Record<string, Enrichment[]> {
  return enrichments.reduce(
    (
      groups,
      enrichment,
    ) => {
      if (!groups[enrichment.source]) {
        groups[enrichment.source] = [];
      }

      groups[enrichment.source].push(
        enrichment,
      );

      return groups;
    },
    {} as Record<string, Enrichment[]>,
  );
}

function EnrichmentResult({
  enrichment,
}: {
  enrichment: Enrichment;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-white">
            {formatSource(
              enrichment.source,
            )}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Updated{" "}
            {formatDate(
              enrichment.created_at,
            )}
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
          {enrichment.source}
        </span>
      </div>

      <div className="p-5">
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-6 text-slate-300">
          {JSON.stringify(
            enrichment.data,
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

function EnrichmentSection({
  source,
  enrichments,
}: {
  source: string;
  enrichments: Enrichment[];
}) {
  const sorted =
    [...enrichments].sort(
      (a, b) =>
        new Date(
          b.created_at,
        ).getTime() -
        new Date(
          a.created_at,
        ).getTime(),
    );

  const latest =
    sorted[0];

  const history =
    sorted.slice(1);

  return (
    <div className="space-y-4">
      <EnrichmentResult
        enrichment={latest}
      />

      {history.length > 0 && (
        <details className="rounded-lg border border-slate-800 bg-slate-950/30">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-400 hover:text-white">
            View history (
            {history.length} previous{" "}
            {source} result
            {history.length === 1
              ? ""
              : "s"}
            )
          </summary>

          <div className="space-y-4 border-t border-slate-800 p-4">
            {history.map(
              (enrichment) => (
                <EnrichmentResult
                  key={
                    enrichment.id
                  }
                  enrichment={
                    enrichment
                  }
                />
              ),
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export default function IndicatorDetailPage({
  params,
}: PageProps) {
  const [indicator, setIndicator] =
    useState<Indicator | null>(
      null,
    );

  const [enrichments, setEnrichments] =
    useState<Enrichment[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [enriching, setEnriching] =
    useState(false);

  const [error, setError] =
    useState("");

  const [enrichmentError, setEnrichmentError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const { id } =
          await params;

        const indicatorId =
          Number(id);

        if (
          !Number.isInteger(
            indicatorId,
          ) ||
          indicatorId <= 0
        ) {
          throw new Error(
            "Invalid indicator ID.",
          );
        }

        const [
          indicatorData,
          enrichmentData,
        ] = await Promise.all([
          getIndicator(
            indicatorId,
          ),
          getIndicatorEnrichments(
            indicatorId,
          ),
        ]);

        if (cancelled) {
          return;
        }

        setIndicator(
          indicatorData,
        );

        setEnrichments(
          enrichmentData,
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load indicator.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function handleEnrich() {
    if (!indicator) {
      return;
    }

    setEnriching(true);
    setEnrichmentError("");

    try {
      const updated =
        await enrichIndicator(
          indicator.id,
          indicator.indicator_type,
        );

      setEnrichments((current) => [
        updated,
        ...current,
      ]);
    } catch (err) {
      setEnrichmentError(
        err instanceof Error
          ? err.message
          : "Failed to enrich indicator.",
      );
    } finally {
      setEnriching(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
          Loading indicator...
        </div>
      </main>
    );
  }

  if (error || !indicator) {
    return (
      <main className="p-8">
        <Link
          href="/indicators"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to Indicators
        </Link>

        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-red-300">
          {error ||
            "Indicator not found."}
        </div>
      </main>
    );
  }

  const grouped =
    groupEnrichments(
      enrichments,
    );

  const sources =
    Object.keys(grouped);

  return (
    <main className="space-y-6 p-8">
      <div>
        <Link
          href="/indicators"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to Indicators
        </Link>

        <div className="mt-4">
          <p className="text-sm text-slate-500">
            Indicator
          </p>

          <h1 className="mt-1 break-all text-2xl font-bold text-white">
            {indicator.value}
          </h1>
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Indicator Details
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  ID
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {indicator.id}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Type
                </p>

                <span className="mt-1 inline-block rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {indicator.indicator_type}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Value
                </p>

                <p className="mt-1 break-all font-mono text-sm text-slate-200">
                  {indicator.value}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {formatDate(
                    indicator.created_at,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleEnrich}
              disabled={enriching}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enriching
                ? "Enriching..."
                : "Enrich Indicator"}
            </button>

            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-500"
            >
              Investigate
            </button>

            <button
              type="button"
              disabled
              className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 opacity-60"
            >
              Delete
            </button>
          </div>
        </div>

        {enrichmentError && (
          <div className="mt-5 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {enrichmentError}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Enrichment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest results from ThreatLens enrichment providers.
            </p>
          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
            {sources.length}{" "}
            {sources.length === 1
              ? "source"
              : "sources"}
          </span>
        </div>

        <div className="mt-6 space-y-6">
          {sources.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 px-6 py-10 text-center">
              <p className="text-sm text-slate-400">
                No enrichment results yet.
              </p>

              <p className="mt-2 text-xs text-slate-600">
                Click Enrich Indicator to run an enrichment provider.
              </p>
            </div>
          ) : (
            sources.map(
              (source) => (
                <EnrichmentSection
                  key={source}
                  source={source}
                  enrichments={
                    grouped[source]
                  }
                />
              ),
            )
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">
          Investigation
        </h2>

        <div className="mt-4 rounded-lg border border-dashed border-slate-700 px-6 py-10 text-center">
          <p className="text-sm text-slate-400">
            Investigation workflow will appear here.
          </p>

          <p className="mt-2 text-xs text-slate-600">
            This will be connected in the Investigation phase.
          </p>
        </div>
      </section>
    </main>
  );
}