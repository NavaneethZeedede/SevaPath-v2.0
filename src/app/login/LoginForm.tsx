"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ACCOUNTS = [
  { role: "CITIZEN", label: "Citizens", items: [
    { email: "priya.sharma@example.com", name: "Priya Sharma" },
    { email: "arjun.mehta@example.com", name: "Arjun Mehta" },
    { email: "lakshmi.rao@example.com", name: "Lakshmi Rao" },
    { email: "faiz@example.com", name: "Mohammed Faiz" },
  ]},
  { role: "OFFICER", label: "Officers", items: [
    { email: "ravik@water.gov.in", name: "Ravi Kumar (Water)" },
    { email: "sunitai@water.gov.in", name: "Sunita Iyer (Water)" },
    { email: "deepakn@elec.gov.in", name: "Deepak Nair (Electricity)" },
    { email: "anitab@elec.gov.in", name: "Anita Bose (Electricity)" },
  ]},
  { role: "SUPERVISOR", label: "Supervisor", items: [
    { email: "sup@gov.in", name: "M. Venkatesh" },
  ]},
];

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    const home =
      data.actor.role === "CITIZEN" ? "/citizen"
      : data.actor.role === "OFFICER" ? "/officer"
      : "/supervisor";
    router.push(home);
    router.refresh();
  }

  return (
    <div>
      <Link href="/" className="mb-6 inline-block text-sm text-brand-700">
        &larr; Back to SevaPath
      </Link>
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-slate-800">Sign in (demo)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Auth is mocked for the prototype. Pick a demo account email, or type your own. Any password
          works.
        </p>
        <form onSubmit={login} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-breach">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Demo accounts</p>
          <div className="mt-2 space-y-3">
            {ACCOUNTS.filter((g) => !roleParam || g.role === roleParam).map((g) => (
              <div key={g.role}>
                <p className="text-xs font-semibold text-slate-600">{g.label}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {g.items.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => setEmail(a.email)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-brand-400 hover:text-brand-700"
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
