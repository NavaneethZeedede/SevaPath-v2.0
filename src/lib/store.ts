import fs from "fs";
import path from "path";
import { DATA_DIR } from "./paths";
import { ensureSeeded } from "./seed";
import {
  Actor,
  GrievanceAction,
  GrievanceCase,
  GrievanceEvent,
  Anchor,
} from "./types";

/**
 * Pure-JS persistence layer (no native modules) so the app runs identically on
 * Vercel serverless, local Node, containers, etc. The whole dataset lives in a
 * single JSON file under DATA_DIR; it is loaded into memory on first access and
 * written back after every mutation.
 *
 * On Vercel, DATA_DIR is /tmp (ephemeral, per-instance) — fine for a single
 * demo session; for durable/shared state use a persistent FS or Supabase.
 */

const STORE_PATH = path.join(DATA_DIR, "store.json");

interface DB {
  actors: Record<string, Actor>;
  cases: Record<string, GrievanceCase>;
  events: GrievanceEvent[];
  anchors: (Anchor & { events_covered: string[] })[];
  inbox: {
    id: number;
    to_email: string;
    subject: string;
    body: string;
    case_id: string | null;
    created_at: string;
  }[];
  _emailSeq: number;
}

let cache: DB | null = null;
let seeded = false;

function emptyDb(): DB {
  return { actors: {}, cases: {}, events: [], anchors: [], inbox: [], _emailSeq: 1 };
}

function load(): DB {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    cache = JSON.parse(raw) as DB;
  } catch {
    cache = emptyDb();
  }
  if (!seeded && Object.keys(cache.actors).length === 0) {
    seeded = true;
    ensureSeeded();
  }
  return cache;
}

function save() {
  const db = cache ?? emptyDb();
  fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2));
}

/* ----------------------------- actors ----------------------------- */

export function getActor(id: string): Actor | undefined {
  return load().actors[id];
}

export function getActorByEmail(email: string): Actor | undefined {
  const lower = email.trim().toLowerCase();
  return Object.values(load().actors).find((a) => a.email.toLowerCase() === lower);
}

export function listActors(): Actor[] {
  return Object.values(load().actors).sort((a, b) =>
    a.role === b.role ? a.id.localeCompare(b.id) : a.role.localeCompare(b.role)
  );
}

export function insertActor(a: Actor) {
  const db = load();
  db.actors[a.id] = { ...a };
  save();
}

/* ----------------------------- cases ------------------------------ */

export function insertCase(c: GrievanceCase) {
  const db = load();
  db.cases[c.case_id] = { ...c };
  save();
}

export function getCase(caseId: string): GrievanceCase | undefined {
  return load().cases[caseId];
}

export function listCases(filter?: { citizenId?: string; department?: string }): GrievanceCase[] {
  const all = Object.values(load().cases);
  let out = all;
  if (filter?.citizenId) out = out.filter((c) => c.citizen_id === filter.citizenId);
  else if (filter?.department) out = out.filter((c) => c.department === filter.department);
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function updateCaseStatus(caseId: string, status: GrievanceAction, department?: string) {
  const db = load();
  const c = db.cases[caseId];
  if (!c) return;
  c.status = status;
  if (department) c.department = department;
  save();
}

/* ----------------------------- events ----------------------------- */

export function insertEvent(e: GrievanceEvent) {
  const db = load();
  db.events.push({ ...e });
  save();
}

export function getEventsByCase(caseId: string): GrievanceEvent[] {
  return load()
    .events.filter((e) => e.case_id === caseId)
    .sort((a, b) => a.sequence_number - b.sequence_number);
}

export function getLastEventHash(caseId: string): string {
  const evs = load().events.filter((e) => e.case_id === caseId);
  if (evs.length === 0) return "GENESIS";
  const sorted = evs.sort((a, b) => b.sequence_number - a.sequence_number);
  return sorted[0].event_hash;
}

export function countEvents(caseId: string): number {
  return load().events.filter((e) => e.case_id === caseId).length;
}

export function getEvent(eventId: string): GrievanceEvent | undefined {
  return load().events.find((e) => e.event_id === eventId);
}

/** Demo-only: raw DB edit that bypasses the append-only event flow. */
export function rawUpdateEventPayload(eventId: string, payload: unknown) {
  const db = load();
  const ev = db.events.find((e) => e.event_id === eventId);
  if (ev) {
    ev.payload = payload as GrievanceEvent["payload"];
    save();
  }
}

/* ----------------------------- anchors ---------------------------- */

export function insertAnchor(a: Anchor) {
  const db = load();
  db.anchors.push({ ...a, events_covered: [...a.events_covered] });
  save();
}

export function getAnchor(anchorId: string): Anchor | undefined {
  const a = load().anchors.find((x) => x.anchor_id === anchorId);
  return a ? { ...a, events_covered: [...a.events_covered] } : undefined;
}

export function getAnchorsForCase(caseId: string): Anchor[] {
  return load()
    .anchors.filter((a) =>
      a.events_covered.some((c) => c === caseId || c.startsWith(`${caseId}#`))
    )
    .sort((a, b) => b.anchored_at.localeCompare(a.anchored_at))
    .map((a) => ({ ...a, events_covered: [...a.events_covered] }));
}

export function listAnchors(): Anchor[] {
  return load()
    .anchors.sort((a, b) => b.anchored_at.localeCompare(a.anchored_at))
    .map((a) => ({ ...a, events_covered: [...a.events_covered] }));
}

/* --------------------------- demo inbox --------------------------- */

export function insertEmail(toEmail: string, subject: string, body: string, caseId?: string) {
  const db = load();
  db.inbox.push({
    id: db._emailSeq++,
    to_email: toEmail,
    subject,
    body,
    case_id: caseId ?? null,
    created_at: new Date().toISOString(),
  });
  save();
}

export function listEmails() {
  return [...load().inbox].sort((a, b) => b.id - a.id);
}
