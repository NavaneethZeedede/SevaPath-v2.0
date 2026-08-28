import crypto from "crypto";
import { buildEvent } from "./crypto";
import {
  Actor,
  GrievanceAction,
  GrievanceCase,
  GrievanceEvent,
} from "./types";
import * as store from "./store";
import { maybeAnchor } from "./anchoring";
import { notifyCaseChange } from "./email";

function nowIso() {
  return new Date().toISOString();
}

export function nextSequence(caseId: string): number {
  return store.countEvents(caseId) + 1;
}

export function lastEventHash(caseId: string): string {
  return store.getLastEventHash(caseId);
}

/**
 * The single append path. Every state change in the system goes through here.
 * There is intentionally NO update/delete of events in the normal flow.
 */
export function appendEvent(input: {
  caseId: string;
  action: GrievanceAction;
  actor: Actor;
  payload: unknown;
  newDepartment?: string;
}): GrievanceEvent {
  const { caseId, action, actor, payload, newDepartment } = input;
  const seq = nextSequence(caseId);
  const prev = lastEventHash(caseId);

  const event = buildEvent({
    eventId: `evt_${crypto.randomUUID()}`,
    caseId,
    sequenceNumber: seq,
    prevEventHash: prev,
    action,
    actorId: actor.id,
    actorRole: actor.role,
    timestamp: nowIso(),
    payload,
    secretKey: actor.secretKey,
  });

  store.insertEvent(event);
  store.updateCaseStatus(caseId, action, newDepartment);

  const gCase = store.getCase(caseId);
  if (gCase) {
    notifyCaseChange(gCase, action, actor).catch(() => {});
    maybeAnchor(caseId, action).catch(() => {});
  }
  return event;
}
