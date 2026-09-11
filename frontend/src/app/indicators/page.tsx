"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  createIndicator,
  deleteIndicator,
  getIndicators,
  updateIndicator,
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

const PAGE_SIZE = 10;


export default function IndicatorsPage() {
  const [indicators, setIndicators] =
    useState<Indicator[]>([]);

  const [total, setTotal] =
    useState(0);

  const [indicatorType, setIndicatorType] =
    useState<IndicatorType | "">("");

  const [searchInput, setSearchInput] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [newIndicatorType, setNewIndicatorType] =
    useState<IndicatorType>("ip");

  const [newIndicatorValue, setNewIndicatorValue] =
    useState("");

  const [editingIndicator, setEditingIndicator] =
    useState<Indicator | null>(null);

  const [editType, setEditType] =
    useState<IndicatorType>("ip");

  const [editValue, setEditValue] =
    useState("");

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [refreshKey, setRefreshKey] =
    useState(0);


  useEffect(() => {
    let cancelled = false;

    async function fetchIndicators() {
      setLoading(true);
      setError("");

      try {
        const data =
          await getIndicators({
            query:
              searchQuery || undefined,
            indicatorType:
              indicatorType || undefined,
            page,
            size: PAGE_SIZE,
          });

        if (cancelled) {
          return;
        }

        setIndicators(data.items);
        setTotal(data.total);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load indicators.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchIndicators();

    return () => {
      cancelled = true;
    };
  }, [
    searchQuery,
    indicatorType,
    page,
    refreshKey,
  ]);


  async function handleCreate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!newIndicatorValue.trim()) {
      setError(
        "Please enter an indicator value.",
      );
      return;
    }

    try {
      setCreating(true);

      await createIndicator(
        newIndicatorType,
        newIndicatorValue.trim(),
      );

      setNewIndicatorValue("");

      setSuccess(
        "Indicator created successfully.",
      );

      setPage(1);

      setRefreshKey(
        (currentKey) =>
          currentKey + 1,
      );
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


  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPage(1);
    setSearchQuery(
      searchInput.trim(),
    );
  }


  function handleTypeChange(
    value: IndicatorType | "",
  ) {
    setPage(1);
    setIndicatorType(value);
  }


  function clearFilters() {
    setSearchInput("");
    setSearchQuery("");
    setIndicatorType("");
    setPage(1);
  }


  function openEdit(
    indicator: Indicator,
  ) {
    setError("");
    setSuccess("");

    setEditingIndicator(
      indicator,
    );

    setEditType(
      indicator.indicator_type,
    );

    setEditValue(
      indicator.value,
    );
  }


  function closeEdit() {
    if (savingEdit) {
      return;
    }

    setEditingIndicator(null);
    setEditValue("");
  }


  async function handleEditSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingIndicator) {
      return;
    }

    setError("");
    setSuccess("");

    if (!editValue.trim()) {
      setError(
        "Please enter an indicator value.",
      );
      return;
    }

    try {
      setSavingEdit(true);

      await updateIndicator(
        editingIndicator.id,
        editType,
        editValue.trim(),
      );

      setEditingIndicator(null);
      setEditValue("");

      setSuccess(
        "Indicator updated successfully.",
      );

      setRefreshKey(
        (currentKey) =>
          currentKey + 1,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update indicator.",
      );
    } finally {
      setSavingEdit(false);
    }
  }


  async function handleDelete(
    indicator: Indicator,
  ) {
    const confirmed =
      window.confirm(
        `Delete ${indicator.indicator_type.toUpperCase()} indicator "${indicator.value}"?`,
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setDeletingId(indicator.id);

      await deleteIndicator(
        indicator.id,
      );

      setSuccess(
        "Indicator deleted successfully.",
      );

      if (
        indicators.length === 1 &&
        page > 1
      ) {
        setPage(
          (currentPage) =>
            currentPage - 1,
        );
      } else {
        setRefreshKey(
          (currentKey) =>
            currentKey + 1,
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete indicator.",
      );
    } finally {
      setDeletingId(null);
    }
  }


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / PAGE_SIZE,
      ),
    );


  return (
    <main className="flex-1">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <h2 className="text-2xl font-semibold text-white">
          Indicators
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage and investigate threat indicators.
        </p>
      </header>


      <div className="p-8">
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">
            Add Indicator
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Add an IP address, domain, URL, or hash to ThreatLens.
          </p>

          <form
            onSubmit={handleCreate}
            className="mt-6"
          >
            <div className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
              <select
                value={newIndicatorType}
                onChange={(event) =>
                  setNewIndicatorType(
                    event.target
                      .value as IndicatorType,
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
              >
                {indicatorTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type.toUpperCase()}
                    </option>
                  ),
                )}
              </select>

              <input
                type="text"
                value={newIndicatorValue}
                onChange={(event) =>
                  setNewIndicatorValue(
                    event.target.value,
                  )
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
        </div>


        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Search Indicators
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Search by indicator value and filter by type.
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="grid gap-4 md:grid-cols-[1fr_180px_auto_auto]"
            >
              <input
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Search indicator value"
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
              />

              <select
                value={indicatorType}
                onChange={(event) =>
                  handleTypeChange(
                    event.target
                      .value as IndicatorType | "",
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
              >
                <option value="">
                  All Types
                </option>

                {indicatorTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type.toUpperCase()}
                    </option>
                  ),
                )}
              </select>

              <button
                type="submit"
                className="rounded-lg bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
              >
                Search
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Clear
              </button>
            </form>
          </div>
        </div>


        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}


        {success && (
          <div className="mb-6 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}


        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Total Matching Indicators
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {total}
          </p>
        </div>


        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h3 className="font-semibold text-white">
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

              <p className="mt-2 text-xs text-slate-500">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <IndicatorTable
              indicators={indicators}
              deletingId={deletingId}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>


        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                page === 1 ||
                loading
              }
              onClick={() =>
                setPage(
                  (currentPage) =>
                    currentPage - 1,
                )
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                page >= totalPages ||
                loading
              }
              onClick={() =>
                setPage(
                  (currentPage) =>
                    currentPage + 1,
                )
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>


      {editingIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">
                Edit Indicator
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Update the indicator type or value.
              </p>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Type
                </label>

                <select
                  value={editType}
                  onChange={(event) =>
                    setEditType(
                      event.target
                        .value as IndicatorType,
                    )
                  }
                  disabled={savingEdit}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-slate-500 disabled:opacity-50"
                >
                  {indicatorTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type.toUpperCase()}
                      </option>
                    ),
                  )}
                </select>
              </div>


              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Value
                </label>

                <input
                  type="text"
                  value={editValue}
                  onChange={(event) =>
                    setEditValue(
                      event.target.value,
                    )
                  }
                  disabled={savingEdit}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white outline-none focus:border-slate-500 disabled:opacity-50"
                />
              </div>


              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={savingEdit}
                  className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEdit
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}


type IndicatorTableProps = {
  indicators: Indicator[];
  deletingId: number | null;
  onEdit: (
    indicator: Indicator,
  ) => void;
  onDelete: (
    indicator: Indicator,
  ) => void;
};


function IndicatorTable({
  indicators,
  deletingId,
  onEdit,
  onDelete,
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

            <th className="px-6 py-4 font-medium text-slate-400">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {indicators.map(
            (indicator) => (
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

                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/indicators/${indicator.id}`}
                      className="text-sm text-slate-300 hover:text-white"
                    >
                      View
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(indicator)
                      }
                      className="text-sm text-slate-300 hover:text-white"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(indicator)
                      }
                      disabled={
                        deletingId ===
                        indicator.id
                      }
                      className="text-sm text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId ===
                      indicator.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}