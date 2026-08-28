"use client";

import { useState } from "react";
import { VerifiedEvent } from "@/lib/types";

const ACTION_META: Record<string, { icon: string; label: string; tint: string }> = {
  FILED: { icon: "📝", label: "Filed", tint: "bg-brand-50 text-brand-700" },
  ASSIGNED: { icon: "📌", label: "Assigned", tint: "bg-slate-100 text-slate-700" },
  ESCALATED: { icon: "⬆️", label: "Escalated", tint: "bg-amber-50 text-pending" },
  RESPONDED: { icon: "💬", label: "Responded", tint: "bg-slate-100 text-slate-700" },
  CLOSED: { icon: "🏁", label: "Closed", tint: "bg-green-50 text-verified" },
};

function describe(ev: VerifiedEvent): string {
  const p = ev.payload as Record<string, any>;
  switch (ev.action) {
    case "FILED":
      return p.complaint ?? "Grievance filed";
    case "ASSIGNED":
      return `Assigned to ${p.assignedTo ?? "officer"}${p.note ? ` — ${p.note}` : ""}`;
    case "ESCALATED":
      return `To ${p.toDepartment ?? "another department"}${p.reason ? ` — ${p.reason}` : ""}`;
    case "RESPONDED":
      return p.update ?? "Officer update";
    case "CLOSED":
      return p.closureReason ?? "Case closed";
    default:
      return "";
  }
}

export function Timeline({ events }: { events: (VerifiedEvent & { actorName: string })[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
      {events.map((ev) => {
        const meta = ACTION_META[ev.action] ?? ACTION_META.FILED;
        const failing = ev.checks.find((c) => !c.ok);
        return (
          <li key={ev.event_id} className="relative">
            <span
              className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full text-sm ring-2 ring-white ${meta.tint}`}
            >
              {meta.icon}
            </span>
            <EventCard ev={ev} meta={meta} failing={failing} />
          </li>
        );
      })}
    </ol>
  );
}

function EventCard({
  ev,
  meta,
  failing,
}: {
  ev: VerifiedEvent & { actorName: string };
  meta: { icon: string; label: string };
  failing?: { name: string; detail: string };
}) {
  const [open, setOpen] = useState(false);
  const breached = !ev.ok;
  return (
    <div
      className={`card p-4 ${breached ? "ring-2 ring-breach" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{meta.label}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              #{ev.sequence_number}
            </span>
            {breached && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-breach">
                BREACH
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-700">{describe(ev)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {ev.actorName} · {ev.actor_role} · {new Date(ev.timestamp).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          {open ? "Hide technical details" : "Technical details"}
        </button>
      </div>

      {breached && failing && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-breach">
          <strong>Failed check: {failing.name}.</strong> {failing.detail}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-3 text-xs">
          <Row label="event_id" value={ev.event_id} />
          <Row label="prev_event_hash" value={ev.prev_event_hash} />
          <Row label="payload_hash" value={ev.payload_hash} ok={ev.checks.find((c) => c.name === "payload_hash")?.ok} />
          <Row label="signature (HMAC)" value={ev.signature} ok={ev.checks.find((c) => c.name === "signature")?.ok} />
          <Row label="event_hash" value={ev.event_hash} ok={ev.checks.find((c) => c.name === "event_hash")?.ok} />
          <Row label="chain_link" value={ev.checks.find((c) => c.name === "chain_link")?.ok === false ? "FAILED" : "ok"} ok={ev.checks.find((c) => c.name === "chain_link")?.ok} />
          <div className="pt-1">
            <div className="font-medium text-slate-500">payload</div>
            <pre className="hash mt-1 whitespace-pre-wrap text-slate-600">
              {JSON.stringify(ev.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-32 shrink-0 font-medium text-slate-500">{label}</span>
      <span className={`hash flex-1 ${ok === false ? "text-breach" : "text-slate-600"}`}>
        {value}
        {ok === true && <span className="ml-1 text-verified">✓</span>}
        {ok === false && <span className="ml-1">✗</span>}
      </span>
    </div>
  );
}
