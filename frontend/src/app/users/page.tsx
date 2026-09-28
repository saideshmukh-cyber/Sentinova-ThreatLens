"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Panel, PanelHeader } from "@/components/DashboardPrimitives";

type User = { id:number; username:string; role:string; created_at:string };

function headers() { const h = new Headers({ "Content-Type": "application/json" }); const token = typeof window !== "undefined" ? localStorage.getItem("threatlens_access_token") : null; if (token) h.set("Authorization", `Bearer ${token}`); return h; }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("analyst");
  const [error, setError] = useState("");
  async function load(){ const r=await fetch(`${API_URL}/api/v1/auth/users`,{headers:headers(),cache:"no-store"}); if(!r.ok) throw new Error((await r.json()).detail ?? `Request failed: ${r.status}`); setUsers(await r.json()); }
  useEffect(()=>{void load().catch((e)=>setError(e.message));},[]);
  async function create(){ const r=await fetch(`${API_URL}/api/v1/auth/users`,{method:"POST",headers:headers(),body:JSON.stringify({username,password,role})}); if(!r.ok){setError((await r.json()).detail??`Request failed: ${r.status}`);return;} setUsername("");setPassword("");await load(); }
  return <div className="p-5 sm:p-6 lg:p-8"><div className="mb-6"><div className="text-[10px] uppercase tracking-[.2em] text-cyan-400">Administration</div><h1 className="mt-2 text-3xl font-semibold text-white">Users & roles</h1><p className="mt-2 text-sm text-slate-500">Manage role assignments for the ThreatLens RBAC layer.</p></div>{error&&<div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300">{error}</div>}<div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]"><Panel><PanelHeader title="Create user"/><div className="space-y-4 p-5"><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Temporary password" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"/><select value={role} onChange={e=>setRole(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"><option value="analyst">Analyst</option><option value="security_engineer">Security Engineer</option><option value="incident_responder">Incident Responder</option><option value="threat_hunter">Threat Hunter</option><option value="executive">Executive</option><option value="admin">Admin</option></select><button type="button" onClick={()=>void create()} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950">Create account</button></div></Panel><Panel><PanelHeader title="User directory" subtitle={`${users.length} configured accounts`}/><div className="divide-y divide-slate-800/80">{users.map(user=><div key={user.id} className="flex items-center gap-4 px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">{user.username.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="text-sm font-medium text-slate-200">{user.username}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-cyan-300">{user.role}</div></div><div className="text-[10px] text-slate-600">{new Date(user.created_at).toLocaleDateString()}</div></div>)}</div></Panel></div></div>;
}
