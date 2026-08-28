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

export async function nextSequence(caseId: string): Promise<number> {
  return (await store.countEvents(caseId)) + 1;
}

export async function lastEventHash(caseId: string): Promise<string> {
  return await store.getLastEventHash(caseId);
}

export async function appendEvent(input: {
  caseId: string;
  action: GrievanceAction;
  actor: Actor;
  payload: unknown;
  newDepartment?: string;
}): Promise<GrievanceEvent> {
  const { caseId, action, actor, payload, newDepartment } = input;
  const seq = await nextSequence(caseId);
  const prev = await lastEventHash(caseId);

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

  await store.insertEvent(event);
  await store.updateCaseStatus(caseId, action, newDepartment);

  const gCase = await store.getCase(caseId);
  if (gCase) {
    notifyCaseChange(gCase, action, actor).catch(() => {});
    maybeAnchor(caseId, action).catch(() => {});
  }
  return event;
}
