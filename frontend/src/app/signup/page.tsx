"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const result = await signup(username, password);
      localStorage.setItem("threatlens_access_token", result.access_token);
      localStorage.setItem("threatlens_refresh_token", result.refresh_token);
      localStorage.setItem("threatlens_user", JSON.stringify({ username: result.username, role: result.role }));
      router.replace("/");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign up failed"); }
    finally { setLoading(false); }
  }
  return <div className="flex min-h-screen items-center justify-center bg-[#050d14] p-6"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0a1520] p-7 shadow-2xl">
    <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-400">ThreatLens Secure Access</div>
    <h1 className="mt-3 text-2xl font-semibold text-white">Create your analyst account</h1>
    <p className="mt-2 text-sm text-slate-500">New self-service accounts start with the Analyst role.</p>
    <div className="mt-6 space-y-4">
      <div><label className="mb-2 block text-xs text-slate-500">Username</label><input required minLength={3} value={username} onChange={(e)=>setUsername(e.target.value)} autoComplete="username" className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/30" /></div>
      <div><label className="mb-2 block text-xs text-slate-500">Password</label><input required minLength={8} type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/30" /><p className="mt-2 text-[10px] text-slate-600">Use 8+ characters with uppercase, lowercase and a number.</p></div>
      <div><label className="mb-2 block text-xs text-slate-500">Confirm password</label><input required type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} autoComplete="new-password" className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/30" /></div>
    </div>
    {error && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">{error}</div>}
    <button disabled={loading} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{loading ? "Creating account..." : "Create account"}</button>
    <p className="mt-5 text-center text-xs text-slate-600">Already registered? <Link href="/login" className="text-cyan-300 hover:text-cyan-200">Sign in</Link></p>
  </form></div>;
}
