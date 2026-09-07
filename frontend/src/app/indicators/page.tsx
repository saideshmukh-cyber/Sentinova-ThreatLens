"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  createIndicator,
  getIndicators,
} from "@/lib/api";

import type {
  Indicator,
  IndicatorType,
} from "@/types/indicator";

const indicatorTypes: IndicatorType[] = [
  "ip",
  "domain",
  "url",
  "hash",
];

export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState<Indicator[]>(
    [],
  );

  const [total, setTotal] = useState(0);

  const [indicatorType, setIndicatorType] =
    useState<IndicatorType>("ip");

  const [value, setValue] = useState("");

  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  async function loadIndicators() {
    try {
      setLoading(true);
      setError("");

      const data = await getIndicators();

      setIndicators(data.items);
      setTotal(data.total);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load indicators.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      await loadIndicators();
    }

    load();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!value.trim()) {
      setError(
        "Please enter an indicator value.",
      );
      return;
    }

    try {
      setCreating(true);

      await createIndicator(
        indicatorType,
        value.trim(),
      );

      setValue("");

      setSuccess(
        "Indicator created successfully.",
      );

      await loadIndicators();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create indicator.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="flex-1">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <h2 className="text-2xl font-semibold">
          Indicators
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage and investigate threat indicators.
        </p>
      </header>

      <div className="p-8">
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">
            Add Indicator
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Add an IP address, domain, URL, or hash to ThreatLens.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6"
          >
            <div className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
              <select
                value={indicatorType}
                onChange={(event) =>
                  setIndicatorType(
                    event.target.value as IndicatorType,
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
              >
                {indicatorTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={value}
                onChange={(event) =>
                  setValue(event.target.value)
                }
                placeholder="Enter indicator value"
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
              />

              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Adding..."
                  : "Add Indicator"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
              {success}
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Total Indicators
          </p>

          <p className="mt-2 text-3xl font-bold">
            {total}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h3 className="font-semibold">
              Indicator Records
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">
                Loading indicators...
              </p>
            </div>
          ) : indicators.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">
                No indicators found.
              </p>
            </div>
          ) : (
            <IndicatorTable
              indicators={indicators}
            />
          )}
        </div>
      </div>
    </main>
  );
}

type IndicatorTableProps = {
  indicators: Indicator[];
};

function IndicatorTable({
  indicators,
}: IndicatorTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 bg-slate-950">
          <tr>
            <th className="px-6 py-4 font-medium text-slate-400">
              ID
            </th>

            <th className="px-6 py-4 font-medium text-slate-400">
              Type
            </th>

            <th className="px-6 py-4 font-medium text-slate-400">
              Value
            </th>

            <th className="px-6 py-4 font-medium text-slate-400">
              Created
            </th>
          </tr>
        </thead>

        <tbody>
          {indicators.map((indicator) => (
            <tr
              key={indicator.id}
              className="border-b border-slate-800 last:border-b-0"
            >
              <td className="px-6 py-4 text-slate-300">
                {indicator.id}
              </td>

              <td className="px-6 py-4">
                <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium uppercase text-slate-300">
                  {indicator.indicator_type}
                </span>
              </td>

              <td className="px-6 py-4 font-mono text-slate-200">
                {indicator.value}
              </td>

              <td className="px-6 py-4 text-slate-400">
                {new Date(
                  indicator.created_at,
                ).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}