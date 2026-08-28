import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseView } from "@/lib/caseService";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { AnchorIndicator } from "@/components/AnchorIndicator";
import { Timeline } from "@/components/Timeline";
import { OfficerActions } from "@/components/OfficerActions";
import { getCurrentActor } from "@/lib/session";
import * as store from "@/lib/store";
import { ALL_DEPARTMENTS } from "@/lib/departments";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OfficerCasePage({ params }: { params: { caseId: string } }) {
  const view = await getCaseView(params.caseId);
  if (!view) notFound();
  const actor = await getCurrentActor();
  if (!actor) notFound();

  const officersList = await store.listActors();
  const officers = officersList
    .filter((a) => a.role === "OFFICER")
    .map((a) => ({ id: a.id, name: a.name, department: a.department }));
  const departments = ALL_DEPARTMENTS;

  return (
    <div>
      <Link href="/officer" className="text-sm text-brand-700">
        &larr; Officer queue
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{view.case.title}</h1>
          <p className="text-sm text-slate-500">
            {view.case.case_id} · {view.case.department} · filed by {view.citizenName}
            {view.case.location_text ? ` · 📍 ${view.case.location_text}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          Stage: {view.case.status}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <IntegrityBadge status={view.verification.status} />
        <AnchorIndicator anchors={view.anchors} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Case timeline</h2>
          <div className="mt-4">
            <Timeline events={view.events} />
          </div>
        </div>
        <div className="space-y-4">
          <OfficerActions
            caseId={view.case.case_id}
            currentStatus={view.case.status}
            officers={officers}
            departments={departments}
          />
          <div className="card p-4 text-xs text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{actor.name}</span>. Your action
            will be sealed with a server-side HMAC signature under your actor key.
          </div>
        </div>
      </div>
    </div>
  );
}
