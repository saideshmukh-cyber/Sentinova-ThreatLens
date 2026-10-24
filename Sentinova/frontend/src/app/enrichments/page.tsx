"use client";

import { formatDateTime } from "../../lib/date-time";
import { useEffect, useMemo, useState } from "react";
import {
  enrichIndicator,
  getEnrichments,
  getIndicators,
} from "@/lib/api";
import type { Enrichment } from "@/types/enrichment";
import type { Indicator } from "@/types/indicator";

type IndicatorListResponse = {
  items?: Indicator[];
  total?: number;
};

type EnrichmentRecord = Enrichment & {
  id?: number;
  indicator_id?: number;
  provider?: string | null;
  enrichment_type?: string | null;
  kind?: string | null;
  data?: unknown;
  result?: unknown;
  details?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  timestamp?: string | null;
};

const typeLabel: Record<string, string> = {
  ip: "IP Address",
  domain: "Domain",
  url: "URL",
  hash: "File Hash",
  email: "Email",
  cve: "CVE",
};

function prettyType(value: string | null | undefined) {
  if (!value) return "Enrichment";
  return typeLabel[value] ?? value.replaceAll("_", " ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime(value);
}

function getRecordPayload(record: EnrichmentRecord) {
  if (record.data !== undefined) return record.data;
  if (record.result !== undefined) return record.result;
  if (record.details !== undefined) return record.details;
  return record;
}

function formatValue(value: unknown) {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getProvider(record: EnrichmentRecord) {
  return record.provider ?? record.enrichment_type ?? record.kind ?? "Provider";
}

function getPossibleActions(indicator: Indicator) {
  const type = String(
    (indicator as Indicator & { indicator_type?: string }).indicator_type ??
      (indicator as Indicator & { type?: string }).type ??
      "",
  ).toLowerCase();

  if (type === "ip") {
    return [
      {
        key: "ip",
        label: "IP Reputation",
        description: "Reputation, abuse and Geo/ASN intelligence",
      },
      {
        key: "virustotal",
        label: "VirusTotal",
        description: "Multi-engine reputation and detection results",
      },
    ];
  }

  if (type === "domain") {
    return [
      {
        key: "dns",
        label: "DNS Analysis",
        description: "DNS records and domain intelligence",
      },
      {
        key: "virustotal",
        label: "VirusTotal",
        description: "Domain reputation and detection results",
      },
    ];
  }

  if (type === "hash") {
    return [
      {
        key: "hash",
        label: "Malware Lookup",
        description: "Hash identification and malware verdict",
      },
      {
        key: "virustotal",
        label: "VirusTotal",
        description: "Multi-engine malware detection",
      },
    ];
  }

  return [
    {
      key: "virustotal",
      label: "VirusTotal",
      description: "Available reputation/detection enrichment",
    },
  ];
}

export default function EnrichmentsPage() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [enrichments, setEnrichments] = useState<EnrichmentRecord[]>([]);

  const [loadingIndicators, setLoadingIndicators] = useState(true);
  const [loadingEnrichments, setLoadingEnrichments] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedIndicator = useMemo(
    () => indicators.find((indicator) => indicator.id === selectedId) ?? null,
    [indicators, selectedId],
  );

  async function loadIndicators() {
    setLoadingIndicators(true);
    setError(null);

    try {
      const response = (await getIndicators({
        page: 1,
        size: 100,
      })) as IndicatorListResponse;

      const items = response.items ?? [];

      setIndicators(items);

      if (items.length > 0 && selectedId === null) {
        setSelectedId(items[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load indicators.",
      );
    } finally {
      setLoadingIndicators(false);
    }
  }

  async function loadEnrichments(indicatorId: number) {
    setLoadingEnrichments(true);
    setError(null);

    try {
      const result = await getEnrichments(indicatorId);
      setEnrichments((result ?? []) as EnrichmentRecord[]);
    } catch (err) {
      setEnrichments([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load enrichment data.",
      );
    } finally {
      setLoadingEnrichments(false);
    }
  }

  useEffect(() => {
    void loadIndicators();
  }, []);

  useEffect(() => {
    if (selectedId !== null) {
      void loadEnrichments(selectedId);
    } else {
      setEnrichments([]);
    }
  }, [selectedId]);

  async function runEnrichment(action: string, label: string) {
    if (!selectedIndicator) return;

    setRunningAction(action);
    setError(null);
    setSuccess(null);

    try {
      await enrichIndicator(
        selectedIndicator.id,
        action as
          | "dns"
          | "ip"
          | "hash"
          | "virustotal",
      );

      await loadEnrichments(selectedIndicator.id);

      setSuccess(`${label} completed successfully.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `${label} failed.`,
      );
    } finally {
      setRunningAction(null);
    }
  }

  const filteredIndicators = indicators.filter((indicator) => {
    if (!search.trim()) return true;

    const value = String(
      (indicator as Indicator & { value?: string }).value ?? "",
    ).toLowerCase();

    const type = String(
      (indicator as Indicator & { indicator_type?: string }).indicator_type ??
        (indicator as Indicator & { type?: string }).type ??
        "",
    ).toLowerCase();

    const query = search.toLowerCase();

    return value.includes(query) || type.includes(query);
  });

  return (
    <main className="flex-1">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <h2 className="text-2xl font-semibold">Enrichments</h2>

        <p className="mt-1 text-sm text-slate-400">
          Investigate indicators using reputation, DNS, malware and
          external intelligence providers.
        </p>
      </header>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          {/* Indicator selector */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Select Indicator
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Choose an IOC to investigate and enrich.
              </p>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search indicators..."
              className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-500"
            />

            {loadingIndicators ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-lg bg-slate-800"
                  />
                ))}
              </div>
            ) : filteredIndicators.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">
                No indicators found.
              </div>
            ) : (
              <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                {filteredIndicators.map((indicator) => {
                  const indicatorType = String(
                    (indicator as Indicator & {
                      indicator_type?: string;
                    }).indicator_type ??
                      (indicator as Indicator & {
                        type?: string;
                      }).type ??
                      "",
                  );

                  const value = String(
                    (indicator as Indicator & {
                      value?: string;
                    }).value ?? "",
                  );

                  const severity = Number(
                    (indicator as Indicator & {
                      severity_score?: number;
                    }).severity_score ?? 0,
                  );

                  const active =
                    selectedId === indicator.id;

                  return (
                    <button
                      key={indicator.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(indicator.id);
                        setSuccess(null);
                        setError(null);
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        active
                          ? "border-cyan-500/60 bg-cyan-950/30"
                          : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-200">
                            {value || `Indicator #${indicator.id}`}
                          </p>

                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            {prettyType(indicatorType)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {severity}/100
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Enrichment workspace */}
          <section className="min-w-0">
            {!selectedIndicator ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">
                <h3 className="text-lg font-semibold">
                  Enrichment Data
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Select an indicator to begin enrichment.
                </p>
              </div>
            ) : (
              <>
                {/* Selected indicator */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Selected indicator
                      </p>

                      <h3 className="mt-1 break-all text-xl font-semibold text-slate-100">
                        {String(
                          (selectedIndicator as Indicator & {
                            value?: string;
                          }).value ?? "",
                        )}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {prettyType(
                          String(
                            (selectedIndicator as Indicator & {
                              indicator_type?: string;
                            }).indicator_type ??
                              (selectedIndicator as Indicator & {
                                type?: string;
                              }).type ??
                              "",
                          ),
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        selectedId !== null &&
                        loadEnrichments(selectedId)
                      }
                      disabled={loadingEnrichments}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingEnrichments
                        ? "Refreshing..."
                        : "Refresh"}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <h3 className="text-lg font-semibold">
                    Enrichment Actions
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Run the intelligence providers appropriate for this
                    indicator.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {getPossibleActions(selectedIndicator).map(
                      (action) => (
                        <button
                          key={action.key}
                          type="button"
                          disabled={runningAction !== null}
                          onClick={() =>
                            runEnrichment(
                              action.key,
                              action.label,
                            )
                          }
                          className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-cyan-500/50 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-slate-100">
                              {runningAction === action.key
                                ? "Running..."
                                : action.label}
                            </span>

                            <span className="text-cyan-400">
                              →
                            </span>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {action.description}
                          </p>
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Enrichment Results
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Intelligence gathered from enrichment providers.
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {enrichments.length} result
                      {enrichments.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {loadingEnrichments ? (
                    <div className="mt-5 space-y-3">
                      {[1, 2].map((item) => (
                        <div
                          key={item}
                          className="h-32 animate-pulse rounded-xl bg-slate-800"
                        />
                      ))}
                    </div>
                  ) : enrichments.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                      <p className="text-sm font-medium text-slate-300">
                        No enrichment results yet.
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Run one of the enrichment actions above to gather
                        intelligence for this indicator.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {enrichments.map((record, index) => {
                        const payload = getRecordPayload(record);

                        return (
                          <article
                            key={
                              record.id ??
                              `${getProvider(record)}-${index}`
                            }
                            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                          >
                            <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium text-slate-100">
                                  {getProvider(record)}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {prettyType(
                                    record.enrichment_type ??
                                      record.kind,
                                  )}
                                </p>
                              </div>

                              <p className="text-xs text-slate-500">
                                {formatDate(
                                  record.created_at ??
                                    record.updated_at ??
                                    record.timestamp,
                                )}
                              </p>
                            </div>

                            <div className="p-4">
                              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-4 text-xs leading-5 text-slate-300">
                                {formatValue(payload)}
                              </pre>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}