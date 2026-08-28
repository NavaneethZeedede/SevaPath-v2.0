import Link from "next/link";
import { getCurrentActor } from "@/lib/session";
import { getCaseSummaries } from "@/lib/caseService";
import { StatusPill } from "@/app/citizen/page";

export default async function OfficerDashboard() {
  const actor = await getCurrentActor();
  if (!actor) {
    return (
      <div className="card mt-6 p-8 text-center text-slate-500">
        Please sign in to view the officer queue.
      </div>
    );
  }
  const summaries = await getCaseSummaries({ department: actor.department ?? "" });

  const open = summaries.filter((s) => s.case.status !== "CLOSED");
  const closed = summaries.filter((s) => s.case.status === "CLOSED");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Officer queue</h1>
      <p className="mt-1 text-sm text-slate-500">
        {actor.department} · {open.length} open, {closed.length} closed
      </p>

      {summaries.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-slate-500">
          No cases in {actor.department} right now.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {summaries.map((s) => (
            <Link key={s.case.case_id} href={`/officer/${s.case.case_id}`} className="card block p-4 hover:border-brand-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{s.case.title}</div>
                  <div className="text-xs text-slate-500">
                    {s.case.case_id} · filed by {s.case.citizen_id} · {s.case.location_text ?? "—"}
                  </div>
                </div>
                <StatusPill status={s.status} />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Stage: <span className="font-medium text-slate-700">{s.case.status}</span>
                {s.anchorCount > 0 ? " · 🔗 anchored" : " · ⏳ pending anchor"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
