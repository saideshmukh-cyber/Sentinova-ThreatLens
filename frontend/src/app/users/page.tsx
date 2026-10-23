"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type User = {
  id: number;
  username: string;
  role: string;
};

const roles = [
  "admin",
  "security_engineer",
  "incident_responder",
  "threat_hunter",
  "analyst",
  "executive",
];

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("threatlens_access_token")
      : null;

  const result: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    result.Authorization = `Bearer ${token}`;
  }

  return result;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("analyst");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setError("");
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/v1/auth/users`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.detail ?? `Request failed: ${response.status}`
        );
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      setError("");
      setCreating(true);

      const response = await fetch(
        `${API_URL}/api/v1/auth/users`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            username: username.trim(),
            password,
            role,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.detail ?? `Request failed: ${response.status}`
        );
      }

      setUsername("");
      setPassword("");
      setRole("analyst");

      await load();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create user"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[.2em] text-cyan-400">
          Administration
        </div>

        <h1 className="mt-2 text-3xl font-semibold text-white">
          Users & roles
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage role assignments for the ThreatLens RBAC layer.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">
              Create user
            </h2>
          </div>

          <form onSubmit={create} className="space-y-4 p-5">
            <input
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Username"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
            />

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Temporary password"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
            />

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item
                   .split("_")
                   .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                   .join(" ")}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create user"}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">
              Existing users
            </h2>
          </div>

          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="p-5 text-sm text-slate-500">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">
                No users found.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <div className="text-sm font-medium text-white">
                      {user.username}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      ID: {user.id}
                    </div>
                  </div>

                  <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                    {user.role
                   .split("_")
                   .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                   .join(" ")}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}