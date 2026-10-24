"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  createAlertRule,
  getAlertRules,
  updateAlertRule,
} from "@/lib/api";

import type {
  AlertRule,
} from "@/types/alert-rule";


export default function AlertRulesPage() {
  const [rules, setRules] =
    useState<AlertRule[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [minScore, setMinScore] =
    useState("50");

  const [source, setSource] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [threshold, setThreshold] =
    useState("1");

  const [windowMinutes, setWindowMinutes] =
    useState("5");

  const [routeTo, setRouteTo] =
    useState("SOC Analyst");


  useEffect(() => {
    let active = true;

    getAlertRules()
      .then((data) => {
        if (!active) {
          return;
        }

        setRules(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load alert rules.",
        );

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);


  async function handleCreateRule(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Rule name is required.",
      );
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const rule =
        await createAlertRule({
          name: name.trim(),
          description:
            description.trim() ||
            undefined,
          enabled: true,
          min_score:
            minScore
              ? Number(minScore)
              : undefined,
          source:
            source.trim() ||
            undefined,
          category:
            category.trim() ||
            undefined,
          threshold:
            Number(threshold),
          window_minutes:
            Number(windowMinutes),
          route_to:
            routeTo.trim() ||
            undefined,
        });

      setRules((current) => [
        rule,
        ...current,
      ]);

      setName("");
      setDescription("");
      setMinScore("50");
      setSource("");
      setCategory("");
      setThreshold("1");
      setWindowMinutes("5");
      setRouteTo("SOC Analyst");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create alert rule.",
      );
    } finally {
      setCreating(false);
    }
  }


  async function handleToggleRule(
    rule: AlertRule,
  ) {
    try {
      setUpdatingId(rule.id);
      setError(null);

      const updated =
        await updateAlertRule(
          rule.id,
          {
            enabled: !rule.enabled,
          },
        );

      setRules((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update alert rule.",
      );
    } finally {
      setUpdatingId(null);
    }
  }


  if (loading) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-semibold text-white">
          Alert Rules
        </h2>

        <p className="mt-4 text-slate-400">
          Loading alert rules...
        </p>
      </main>
    );
  }


  return (
    <main className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">
          Alert Rules
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Configure the conditions that generate security alerts.
        </p>
      </div>


      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}


      <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white">
          Create Alert Rule
        </h3>

        <form
          onSubmit={handleCreateRule}
          className="mt-5 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Rule Name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="High Severity Firewall Detection"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
            />
          </div>


          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Describe when this rule should generate an alert."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
            />
          </div>


          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Minimum Score
              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={minScore}
                onChange={(event) =>
                  setMinScore(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Threshold
              </label>

              <input
                type="number"
                min="1"
                value={threshold}
                onChange={(event) =>
                  setThreshold(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Window Minutes
              </label>

              <input
                type="number"
                min="1"
                value={windowMinutes}
                onChange={(event) =>
                  setWindowMinutes(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Route To
              </label>

              <input
                value={routeTo}
                onChange={(event) =>
                  setRouteTo(
                    event.target.value,
                  )
                }
                placeholder="SOC Analyst"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>
          </div>


          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Source
              </label>

              <input
                value={source}
                onChange={(event) =>
                  setSource(
                    event.target.value,
                  )
                }
                placeholder="firewall"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Category
              </label>

              <input
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value,
                  )
                }
                placeholder="network"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500"
              />
            </div>
          </div>


          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating
              ? "Creating..."
              : "Create Rule"}
          </button>
        </form>
      </section>


      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-white">
            Configured Rules
          </h3>
        </div>


        {rules.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No alert rules configured.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-lg font-semibold text-white">
                        {rule.name}
                      </h4>

                      <span className="rounded-md border border-slate-700 px-2 py-1 text-xs uppercase text-slate-400">
                        {rule.enabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>

                    {rule.description && (
                      <p className="mt-2 text-sm text-slate-400">
                        {rule.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="rounded-md bg-slate-950 px-2 py-1">
                        Score ≥{" "}
                        {rule.min_score ??
                          "Any"}
                      </span>

                      <span className="rounded-md bg-slate-950 px-2 py-1">
                        Threshold:{" "}
                        {rule.threshold}
                      </span>

                      <span className="rounded-md bg-slate-950 px-2 py-1">
                        Window:{" "}
                        {rule.window_minutes}m
                      </span>

                      {rule.source && (
                        <span className="rounded-md bg-slate-950 px-2 py-1">
                          Source:{" "}
                          {rule.source}
                        </span>
                      )}

                      {rule.category && (
                        <span className="rounded-md bg-slate-950 px-2 py-1">
                          Category:{" "}
                          {rule.category}
                        </span>
                      )}

                      {rule.route_to && (
                        <span className="rounded-md bg-slate-950 px-2 py-1">
                          Route:{" "}
                          {rule.route_to}
                        </span>
                      )}
                    </div>
                  </div>


                  <button
                    type="button"
                    disabled={
                      updatingId ===
                      rule.id
                    }
                    onClick={() =>
                      handleToggleRule(
                        rule,
                      )
                    }
                    className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {rule.enabled
                      ? "Disable"
                      : "Enable"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}