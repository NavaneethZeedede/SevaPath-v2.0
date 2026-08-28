import Link from "next/link";
import { getCaseSummaries } from "@/lib/caseService";
import { StatusPill } from "@/app/citizen/page";
import * as store from "@/lib/store";

export default async function SupervisorDashboard() {
  const summaries = await getCaseSummaries();
  const breaches = summaries.filter((s) => s.status === "INTEGRITY_BREACH");
  const verified = summaries.filter((s) => s.status === "VERIFIED");
  const closed = summaries.filter((s) => s.case.status === "CLOSED");

  let avgCloseHrs: number | null = null;
  if (closed.length) {
    let total = 0;
    let n = 0;
    for (const s of closed) {
      const events = await store.getEventsByCase(s.case.case_id);
      const closeEv = events.find((e) => e.action === "CLOSED");
      if (closeEv) {
        total += (new Date(closeEv.timestamp).getTime() - new Date(s.case.created_at).getTime()) / 3.6e6;
        n++;
      }
    }
    if (n) avgCloseHrs = total / n;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Supervisor oversight</h1>
      <p className="mt-1 text-sm text-slate-500">
        All departments · {summaries.length} cases · {verified.length} verified · {breaches.length}{" "}
        need audit
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total cases" value={summaries.length} />
        <Stat label="Verified" value={verified.length} tone="text-verified" />
        <Stat label="Needs audit" value={breaches.length} tone="text-breach" />
        <Stat
          label="Avg time-to-close"
          value={avgCloseHrs == null ? "—" : `${avgCloseHrs.toFixed(1)}h`}
        />
      </div>

      {breaches.length > 0 && (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-breach">
            🚨 Cases needing audit
          </h2>
          <div className="mt-3 space-y-2">
            {breaches.map((s) => (
              <Link
                key={s.case.case_id}
                href={`/supervisor/${s.case.case_id}`}
                className="card block p-4 ring-2 ring-breach hover:bg-red-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{s.case.title}</div>
                    <div className="text-xs text-slate-500">
                      {s.case.case_id} · {s.case.department} · event #{s.breachedSeq} failed verification
                    </div>
                  </div>
                  <StatusPill status="INTEGRITY_BREACH" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">All cases</h2>
        <div className="mt-3 space-y-2">
          {summaries.map((s) => (
            <Link
              key={s.case.case_id}
              href={`/supervisor/${s.case.case_id}`}
              className="card block p-4 hover:border-brand-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{s.case.title}</div>
                  <div className="text-xs text-slate-500">
                    {s.case.case_id} · {s.case.department} · stage {s.case.status}
                  </div>
                </div>
                <StatusPill status={s.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="card p-4">
      <div className={`text-2xl font-semibold ${tone ?? "text-slate-800"}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
