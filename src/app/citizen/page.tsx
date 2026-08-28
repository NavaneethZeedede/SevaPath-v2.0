import Link from "next/link";
import { getCurrentActor } from "@/lib/session";
import { getCaseSummaries } from "@/lib/caseService";

export default function CitizenDashboard() {
  const actor = getCurrentActor()!;
  const summaries = getCaseSummaries({ citizenId: actor.id });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My grievances</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every case shows a verified timeline you can audit yourself.
          </p>
        </div>
        <Link href="/citizen/new" className="btn-primary">
          File a new grievance
        </Link>
      </div>

      {summaries.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-slate-500">
          No grievances yet. File your first one to see the verifiable timeline in action.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {summaries.map((s) => (
            <Link key={s.case.case_id} href={`/citizen/${s.case.case_id}`} className="card block p-4 hover:border-brand-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{s.case.title}</div>
                  <div className="text-xs text-slate-500">
                    {s.case.case_id} · {s.case.department} · {s.case.location_text ?? "—"}
                  </div>
                </div>
                <StatusPill status={s.status} />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Current stage: <span className="font-medium text-slate-700">{s.case.status}</span>
                {s.anchorCount > 0 ? " · 🔗 anchored" : " · ⏳ pending anchor"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatusPill({ status }: { status: "VERIFIED" | "INTEGRITY_BREACH" }) {
  return status === "VERIFIED" ? (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-verified">
      ✅ VERIFIED
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-breach">
      🚨 BREACH
    </span>
  );
}
