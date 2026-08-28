import crypto from "crypto";
import {
  GrievanceAction,
  GrievanceEvent,
  ActorRole,
  GENESIS,
  VerificationCheck,
  VerifiedEvent,
  VerificationResult,
} from "./types";

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function hmacSha256(key: string, input: string): string {
  return crypto.createHmac("sha256", key).update(input, "utf8").digest("hex");
}

/**
 * Canonicalize a JSON payload so the same logical content always hashes the
 * same regardless of key ordering / whitespace. Keys are sorted recursively.
 */
export function canonicalize(payload: unknown): string {
  return JSON.stringify(sortKeys(payload));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

export function computePayloadHash(payload: unknown): string {
  return sha256(canonicalize(payload));
}

export function computeSignature(
  secretKey: string,
  prevEventHash: string,
  payloadHash: string,
  timestamp: string,
  actorId: string
): string {
  return hmacSha256(secretKey, prevEventHash + payloadHash + timestamp + actorId);
}

export function computeEventHash(
  eventId: string,
  prevEventHash: string,
  payloadHash: string,
  timestamp: string,
  signature: string
): string {
  return sha256(eventId + prevEventHash + payloadHash + timestamp + signature);
}

export interface BuildEventInput {
  eventId: string;
  caseId: string;
  sequenceNumber: number;
  prevEventHash: string;
  action: GrievanceAction;
  actorId: string;
  actorRole: ActorRole;
  timestamp: string;
  payload: unknown;
  secretKey: string;
}

/**
 * Build a fully-linked, signed event. This is the ONLY way events are created.
 * Once persisted it must never be mutated through the app - only new events
 * are appended.
 */
export function buildEvent(input: BuildEventInput): GrievanceEvent {
  const payloadHash = computePayloadHash(input.payload);
  const signature = computeSignature(
    input.secretKey,
    input.prevEventHash,
    payloadHash,
    input.timestamp,
    input.actorId
  );
  const eventHash = computeEventHash(
    input.eventId,
    input.prevEventHash,
    payloadHash,
    input.timestamp,
    signature
  );
  return {
    event_id: input.eventId,
    case_id: input.caseId,
    sequence_number: input.sequenceNumber,
    prev_event_hash: input.prevEventHash,
    action: input.action,
    actor_id: input.actorId,
    actor_role: input.actorRole,
    timestamp: input.timestamp,
    payload: input.payload,
    payload_hash: payloadHash,
    signature,
    event_hash: eventHash,
  };
}

/**
 * Recompute every cryptographic check for a chain of events and decide whether
 * the whole case is VERIFIED or an INTEGRITY_BREACH. The first failing check on
 * an event is reported with a precise, human-readable reason.
 */
export function verifyChain(
  events: GrievanceEvent[],
  keyForActor: (actorId: string) => string | undefined
): VerificationResult {
  const ordered = [...events].sort(
    (a, b) => a.sequence_number - b.sequence_number
  );
  const verifiedEvents: VerifiedEvent[] = [];
  let breached = false;

  for (let i = 0; i < ordered.length; i++) {
    const ev = ordered[i];
    const checks: VerificationCheck[] = [];

    const recomputedPayloadHash = computePayloadHash(ev.payload);
    const payloadHashOk = recomputedPayloadHash === ev.payload_hash;
    checks.push({
      name: "payload_hash",
      ok: payloadHashOk,
      detail: payloadHashOk
        ? "Payload matches stored hash."
        : `Stored payload_hash ${ev.payload_hash.slice(0, 12)}… does not match recomputed ${recomputedPayloadHash.slice(0, 12)}… — the record content was altered.`,
    });

    const signature = computeSignature(
      keyForActor(ev.actor_id) ?? "",
      ev.prev_event_hash,
      ev.payload_hash,
      ev.timestamp,
      ev.actor_id
    );
    const signatureOk = signature === ev.signature;
    checks.push({
      name: "signature",
      ok: signatureOk,
      detail: signatureOk
        ? "HMAC signature valid for this actor."
        : `Signature does not validate with the known key for actor ${ev.actor_id} — action may be forged or signed under a different identity.`,
    });

    const eventHash = computeEventHash(
      ev.event_id,
      ev.prev_event_hash,
      ev.payload_hash,
      ev.timestamp,
      ev.signature
    );
    const eventHashOk = eventHash === ev.event_hash;
    checks.push({
      name: "event_hash",
      ok: eventHashOk,
      detail: eventHashOk
        ? "Event hash consistent with fields."
        : `Stored event_hash ${ev.event_hash.slice(0, 12)}… does not match recomputed ${eventHash.slice(0, 12)}… — a field was tampered with.`,
    });

    const expectedPrev = i === 0 ? GENESIS : ordered[i - 1].event_hash;
    const linkOk = ev.prev_event_hash === expectedPrev;
    checks.push({
      name: "chain_link",
      ok: linkOk,
      detail: linkOk
        ? "Links correctly to the previous event."
        : i === 0
          ? `First event must link to GENESIS, found ${ev.prev_event_hash.slice(0, 12)}….`
          : `prev_event_hash ${ev.prev_event_hash.slice(0, 12)}… does not match previous event's hash ${expectedPrev.slice(0, 12)}… — an event was deleted, reordered, or swapped.`,
    });

    const ok = checks.every((c) => c.ok);
    if (!ok) breached = true;
    verifiedEvents.push({ ...ev, checks, ok });
  }

  return {
    status: breached ? "INTEGRITY_BREACH" : "VERIFIED",
    events: verifiedEvents,
  };
}
