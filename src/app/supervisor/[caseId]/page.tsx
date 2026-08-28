import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseView } from "@/lib/caseService";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { AnchorIndicator } from "@/components/AnchorIndicator";
import { Timeline } from "@/components/Timeline";
import { HowItWorks } from "@/components/HowItWorks";

export default async function SupervisorCasePage({ params }: { params: { caseId: string } }) {
  const view = await getCaseView(params.caseId);
  if (!view) notFound();

  return (
    <div>
      <Link href="/supervisor" className="text-sm text-brand-700">
        &larr; Supervisor
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{view.case.title}</h1>
          <p className="text-sm text-slate-500">
            {view.case.case_id} · {view.case.department} · filed by {view.citizenName} ({view.case.citizen_id})
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

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Full audit timeline</h2>
        <p className="text-sm text-slate-500">
          Includes actor identifiers for oversight. Expand any event for hashes and signatures.
        </p>
        <div className="mt-4">
          <Timeline events={view.events} />
        </div>
      </div>

      <div className="mt-10">
        <HowItWorks />
      </div>
    </div>
  );
}
