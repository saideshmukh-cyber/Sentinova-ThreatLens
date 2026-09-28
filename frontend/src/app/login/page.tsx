"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("ChangeMe!2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await login(username, password);
      localStorage.setItem("threatlens_access_token", result.access_token);
      localStorage.setItem("threatlens_refresh_token", result.refresh_token);
      localStorage.setItem("threatlens_user", JSON.stringify({ username: result.username, role: result.role }));
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050d14] p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0a1520] p-7 shadow-2xl">
        <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-400">ThreatLens Secure Access</div>
        <h1 className="mt-3 text-2xl font-semibold text-white">Sign in to SOC operations</h1>
        <p className="mt-2 text-sm text-slate-500">Use your ThreatLens account to access role-scoped intelligence.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs text-slate-500">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/30" />
          </div>
          <div>
            <label className="mb-2 block text-xs text-slate-500">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/30" />
          </div>
        </div>
        {error && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">{error}</div>}
        <button disabled={loading} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button>
      </form>
    </div>
  );
}
