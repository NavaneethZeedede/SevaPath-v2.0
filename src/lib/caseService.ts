import { verifyChain } from "./crypto";
import { Anchor, GrievanceCase, VerificationResult, VerifiedEvent } from "./types";
import * as store from "./store";

export interface CaseSummary {
  case: GrievanceCase;
  status: VerificationResult["status"];
  anchorCount: number;
  lastAnchoredAt: string | null;
  breachedSeq: number | null;
}

export function getCaseSummaries(filter?: {
  citizenId?: string;
  department?: string;
}): CaseSummary[] {
  let cases = store.listCases();
  if (filter?.citizenId) cases = store.listCases({ citizenId: filter.citizenId });
  else if (filter?.department) cases = store.listCases({ department: filter.department });

  return cases.map((c) => {
    const events = store.getEventsByCase(c.case_id);
    const v = verifyChain(events, (id) => store.getActor(id)?.secretKey);
    const anchors = store.getAnchorsForCase(c.case_id);
    return {
      case: c,
      status: v.status,
      anchorCount: anchors.length,
      lastAnchoredAt: anchors[0]?.anchored_at ?? null,
      breachedSeq: v.status === "INTEGRITY_BREACH" ? v.events.find((e) => !e.ok)?.sequence_number ?? null : null,
    };
  });
}

export interface CaseView {
  case: GrievanceCase;
  verification: VerificationResult;
  anchors: Anchor[];
  citizenName: string;
  events: (VerifiedEvent & { actorName: string })[];
  breachedEvent?: VerifiedEvent;
}

export function getCaseView(caseId: string): CaseView | undefined {
  const gCase = store.getCase(caseId);
  if (!gCase) return undefined;

  const events = store.getEventsByCase(caseId);
  const verification = verifyChain(events, (actorId) => store.getActor(actorId)?.secretKey);

  const actorNames = new Map<string, string>();
  for (const a of store.listActors()) actorNames.set(a.id, a.name);

  const enriched = verification.events.map((e) => ({
    ...e,
    actorName: actorNames.get(e.actor_id) ?? e.actor_id,
  }));

  const breachedEvent = verification.status === "INTEGRITY_BREACH"
    ? enriched.find((e) => !e.ok)
    : undefined;

  return {
    case: gCase,
    verification,
    anchors: store.getAnchorsForCase(caseId),
    citizenName: store.getActor(gCase.citizen_id)?.name ?? gCase.citizen_id,
    events: enriched,
    breachedEvent,
  };
}
