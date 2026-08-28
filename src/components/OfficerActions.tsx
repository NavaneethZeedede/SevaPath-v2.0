"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Officer {
  id: string;
  name: string;
  department: string | null;
}

export function OfficerActions({
  caseId,
  currentStatus,
  officers,
  departments,
}: {
  caseId: string;
  currentStatus: string;
  officers: Officer[];
  departments: string[];
}) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const closed = currentStatus === "CLOSED";

  async function run(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/cases/${caseId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Action failed");
      return;
    }
    setActive(null);
    router.refresh();
  }

  if (closed) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-verified ring-1 ring-green-200">
        This case is closed. No further actions can be appended (the chain is final).
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-800">Take action</h3>
      <p className="text-xs text-slate-500">Each action appends a new, sealed event to the chain.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => setActive("ASSIGNED")}>Assign</button>
        <button className="btn-secondary" onClick={() => setActive("ESCALATED")}>Escalate</button>
        <button className="btn-secondary" onClick={() => setActive("RESPONDED")}>Respond</button>
        <button className="btn-primary" onClick={() => setActive("CLOSED")}>Close case</button>
      </div>

      {msg && <p className="mt-2 text-sm text-breach">{msg}</p>}

      {active === "ASSIGNED" && (
        <Form busy={busy} onCancel={() => setActive(null)} onSubmit={(v) => run("ASSIGNED", v)}>
          <select name="assignedTo" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">— Assign to another officer —</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>{o.name} ({o.department})</option>
            ))}
          </select>
          <textarea name="note" rows={2} placeholder="Optional note" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </Form>
      )}

      {active === "ESCALATED" && (
        <Form busy={busy} onCancel={() => setActive(null)} onSubmit={(v) => run("ESCALATED", v)}>
          <select name="toDepartment" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <textarea name="reason" rows={3} placeholder="Required escalation reason" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </Form>
      )}

      {active === "RESPONDED" && (
        <Form busy={busy} onCancel={() => setActive(null)} onSubmit={(v) => run("RESPONDED", v)}>
          <textarea name="update" rows={3} placeholder="Progress update (not a closure)" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </Form>
      )}

      {active === "CLOSED" && (
        <Form busy={busy} onCancel={() => setActive(null)} onSubmit={(v) => run("CLOSED", v)}>
          <textarea name="closureReason" rows={3} placeholder="Required closure reason" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </Form>
      )}
    </div>
  );
}

function Form({
  children,
  busy,
  onCancel,
  onSubmit,
}: {
  children: React.ReactNode;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const values: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (String(v).trim()) values[k] = v;
    });
    onSubmit(values);
  }
  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
      {children}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? "Working…" : "Submit"}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
