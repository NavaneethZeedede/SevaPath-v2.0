import { verifyChain } from "./crypto";
import { Anchor, GrievanceCase, VerificationResult, VerifiedEvent } from "./types";
import * as store from "./store";

export interface CaseSummary {
  case: GrievanceCase;
  status: VerificationResult["status"];
  anchorCount: number;
  lastAnchoredAt: string | null;
  breachedSeq: number | null;
  citizenName: string;
}

export async function getCaseSummaries(filter?: {
  citizenId?: string;
  department?: string;
}): Promise<CaseSummary[]> {
  let cases = await store.listCases();
  if (filter?.citizenId) cases = await store.listCases({ citizenId: filter.citizenId });
  else if (filter?.department) cases = await store.listCases({ department: filter.department });

  const actors = await store.listActors();
  const secretKeys = new Map(actors.map((a) => [a.id, a.secretKey]));

  return Promise.all(
    cases.map(async (c) => {
      const events = await store.getEventsByCase(c.case_id);
      const v = verifyChain(events, (id) => secretKeys.get(id));
      const anchors = await store.getAnchorsForCase(c.case_id);
      return {
        case: c,
        status: v.status,
        anchorCount: anchors.length,
        lastAnchoredAt: anchors[0]?.anchored_at ?? null,
        breachedSeq: v.status === "INTEGRITY_BREACH" ? v.events.find((e) => !e.ok)?.sequence_number ?? null : null,
        citizenName: actors.find((a) => a.id === c.citizen_id)?.name ?? c.citizen_id,
      };
    })
  );
}

export interface CaseView {
  case: GrievanceCase;
  verification: VerificationResult;
  anchors: Anchor[];
  citizenName: string;
  events: (VerifiedEvent & { actorName: string })[];
  breachedEvent?: VerifiedEvent;
}

export async function getCaseView(caseId: string): Promise<CaseView | undefined> {
  const gCase = await store.getCase(caseId);
  if (!gCase) return undefined;

  const events = await store.getEventsByCase(caseId);
  const actors = await store.listActors();
  const secretKeys = new Map(actors.map((a) => [a.id, a.secretKey]));
  const verification = verifyChain(events, (actorId) => secretKeys.get(actorId));

  const actorNames = new Map<string, string>();
  for (const a of actors) actorNames.set(a.id, a.name);

  const enriched = verification.events.map((e) => ({
    ...e,
    actorName: actorNames.get(e.actor_id) ?? e.actor_id,
  }));

  const breachedEvent = verification.status === "INTEGRITY_BREACH"
    ? enriched.find((e) => !e.ok)
    : undefined;

  const anchors = await store.getAnchorsForCase(caseId);
  const citizenName = actors.find((a) => a.id === gCase.citizen_id)?.name ?? gCase.citizen_id;

  return {
    case: gCase,
    verification,
    anchors,
    citizenName,
    events: enriched,
    breachedEvent,
  };
}
