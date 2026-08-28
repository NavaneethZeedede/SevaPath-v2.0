"use client";

import { useState } from "react";

interface EventLite {
  event_id: string;
  sequence_number: number;
  action: string;
  payload: unknown;
}
interface CaseLite {
  case_id: string;
  title: string;
  events: EventLite[];
}

export function RawEditForm({ cases }: { cases: CaseLite[] }) {
  const [caseId, setCaseId] = useState(cases[0]?.case_id ?? "");
  const [eventId, setEventId] = useState("");
  const [payloadText, setPayloadText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedCase = cases.find((c) => c.case_id === caseId);

  function pickEvent(id: string) {
    setEventId(id);
    const ev = selectedCase?.events.find((e) => e.event_id === id);
    setPayloadText(ev ? JSON.stringify(ev.payload, null, 2) : "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      setMsg("Payload is not valid JSON.");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/admin/raw-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, newPayload: parsed }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) setMsg(data.error ?? "Failed");
    else setMsg("Raw DB edit applied. Open the citizen/officer view of this case and it will now show INTEGRITY BREACH on the edited event.");
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-breach">
        DEMO ONLY. This writes directly to the event row, bypassing the append-only chain — exactly
        what an attacker with database access could do. It is not linked from anywhere in the app.
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Case</label>
        <select value={caseId} onChange={(e) => { setCaseId(e.target.value); setEventId(""); setPayloadText(""); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {cases.map((c) => (
            <option key={c.case_id} value={c.case_id}>{c.case_id} — {c.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Event to tamper with</label>
        <select value={eventId} onChange={(e) => pickEvent(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" disabled={!selectedCase}>
          <option value="">— select event —</option>
          {selectedCase?.events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>#{ev.sequence_number} {ev.action}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Payload (edit this)</label>
        <textarea value={payloadText} onChange={(e) => setPayloadText(e.target.value)} rows={6} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" disabled={!eventId} />
      </div>
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
      <button className="btn-danger" disabled={busy || !eventId}>
        {busy ? "Applying…" : "Apply raw DB edit"}
      </button>
    </form>
  );
}
