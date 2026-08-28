import Link from "next/link";
import { notFound } from "next/navigation";
import * as store from "@/lib/store";

export const dynamic = "force-dynamic";

export default function VerifyAnchorPage({ params }: { params: { anchorId: string } }) {
  const anchor = store.getAnchor(params.anchorId);
  if (!anchor) notFound();

  const events = anchor.events_covered.map((c) => {
    const [caseId, seq] = c.split("#");
    const ev = store.getEventsByCase(caseId).find((e) => e.sequence_number === Number(seq));
    return ev ? { caseId, seq, event_id: ev.event_id, action: ev.action, event_hash: ev.event_hash } : null;
  }).filter(Boolean) as { caseId: string; seq: string; event_id: string; action: string; event_hash: string }[];

  const methodLabel =
    anchor.method === "github-gist" ? "GitHub Gist (external, immutable)" :
    anchor.method === "opentimestamps" ? "OpenTimestamps (Bitcoin)" :
    "Local public ledger (demo)";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-brand-700">&larr; Home</Link>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">External anchor</h1>

      <div className="card mt-5 space-y-3 p-5">
        <div>
          <div className="text-xs font-medium text-slate-500">Method</div>
          <div className="text-sm text-slate-800">{methodLabel}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Root hash (committing the events below)</div>
          <div className="hash text-slate-700">{anchor.root_hash}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Anchored at</div>
          <div className="text-sm text-slate-800">{new Date(anchor.anchored_at).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">External reference</div>
          {anchor.external_reference.startsWith("http") ? (
            <a href={anchor.external_reference} target="_blank" rel="noreferrer" className="text-sm text-brand-700 underline">
              {anchor.external_reference}
            </a>
          ) : (
            <div className="text-sm text-slate-700">{anchor.external_reference}</div>
          )}
        </div>
      </div>

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Events covered by this anchor</h2>
      <div className="mt-3 space-y-2">
        {events.map((e) => (
          <div key={e.event_id} className="card p-3">
            <div className="text-sm font-medium text-slate-800">
              {e.caseId} · #{e.seq} {e.action}
            </div>
            <div className="hash mt-1 text-slate-600">{e.event_hash}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-400">
        This fingerprint is published outside the application database, so even someone who rewrites
        the case history in our DB cannot silently rewrite this anchor.
      </p>
    </main>
  );
}
