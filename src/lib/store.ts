import { getDb } from "./db";
import {
  Actor,
  GrievanceCase,
  GrievanceEvent,
  Anchor,
} from "./types";

/* ----------------------------- actors ----------------------------- */

function rowToActor(row: any): Actor {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    email: row.email,
    secretKey: row.secret_key,
  };
}

export function getActor(id: string): Actor | undefined {
  const row = getDb().prepare("SELECT * FROM actors WHERE id = ?").get(id) as any;
  return row ? rowToActor(row) : undefined;
}

export function getActorByEmail(email: string): Actor | undefined {
  const row = getDb().prepare("SELECT * FROM actors WHERE email = ?").get(email) as any;
  return row ? rowToActor(row) : undefined;
}

export function listActors(): Actor[] {
  const rows = getDb().prepare("SELECT * FROM actors ORDER BY role, id").all() as any[];
  return rows.map(rowToActor);
}

export function insertActor(a: Actor) {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO actors (id, name, role, department, email, secret_key)
       VALUES (@id, @name, @role, @department, @email, @secret_key)`
    )
    .run({ ...a, secret_key: a.secretKey });
}

/* ----------------------------- cases ------------------------------ */

export function insertCase(c: GrievanceCase) {
  getDb()
    .prepare(
      `INSERT INTO cases (case_id, citizen_id, title, category, description,
        location_text, lat, lng, department, status, created_at)
       VALUES (@case_id, @citizen_id, @title, @category, @description,
        @location_text, @lat, @lng, @department, @status, @created_at)`
    )
    .run(c);
}

export function getCase(caseId: string): GrievanceCase | undefined {
  return getDb().prepare("SELECT * FROM cases WHERE case_id = ?").get(caseId) as
    | GrievanceCase
    | undefined;
}

export function listCases(filter?: {
  citizenId?: string;
  department?: string;
}): GrievanceCase[] {
  const db = getDb();
  if (filter?.citizenId) {
    return db
      .prepare("SELECT * FROM cases WHERE citizen_id = ? ORDER BY created_at DESC")
      .all(filter.citizenId) as GrievanceCase[];
  }
  if (filter?.department) {
    return db
      .prepare(
        "SELECT * FROM cases WHERE department = ? ORDER BY created_at DESC"
      )
      .all(filter.department) as GrievanceCase[];
  }
  return db.prepare("SELECT * FROM cases ORDER BY created_at DESC").all() as GrievanceCase[];
}

export function updateCaseStatus(caseId: string, status: string, department?: string) {
  const db = getDb();
  if (department) {
    db.prepare("UPDATE cases SET status = ?, department = ? WHERE case_id = ?").run(
      status,
      department,
      caseId
    );
  } else {
    db.prepare("UPDATE cases SET status = ? WHERE case_id = ?").run(status, caseId);
  }
}

/* ----------------------------- events ----------------------------- */

export function insertEvent(e: GrievanceEvent) {
  getDb()
    .prepare(
      `INSERT INTO events (event_id, case_id, sequence_number, prev_event_hash,
        action, actor_id, actor_role, timestamp, payload, payload_hash,
        signature, event_hash)
       VALUES (@event_id, @case_id, @sequence_number, @prev_event_hash,
        @action, @actor_id, @actor_role, @timestamp, @payload, @payload_hash,
        @signature, @event_hash)`
    )
    .run({
      ...e,
      payload: JSON.stringify(e.payload),
    });
}

export function getEventsByCase(caseId: string): GrievanceEvent[] {
  const rows = getDb()
    .prepare("SELECT * FROM events WHERE case_id = ? ORDER BY sequence_number ASC")
    .all(caseId) as (GrievanceEvent & { payload: string })[];
  return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) }));
}

export function getLastEventHash(caseId: string): string {
  const row = getDb()
    .prepare(
      "SELECT event_hash FROM events WHERE case_id = ? ORDER BY sequence_number DESC LIMIT 1"
    )
    .get(caseId) as { event_hash: string } | undefined;
  return row ? row.event_hash : "GENESIS";
}

export function countEvents(caseId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM events WHERE case_id = ?")
    .get(caseId) as { n: number };
  return row.n;
}

export function getEvent(eventId: string): GrievanceEvent | undefined {
  const row = getDb().prepare("SELECT * FROM events WHERE event_id = ?").get(eventId) as
    | (GrievanceEvent & { payload: string })
    | undefined;
  return row ? { ...row, payload: JSON.parse(row.payload) } : undefined;
}

/** Demo-only: raw DB edit that bypasses the append-only event flow. */
export function rawUpdateEventPayload(eventId: string, payload: unknown) {
  getDb()
    .prepare("UPDATE events SET payload = ? WHERE event_id = ?")
    .run(JSON.stringify(payload), eventId);
}

/* ----------------------------- anchors ---------------------------- */

export function insertAnchor(a: Anchor) {
  getDb()
    .prepare(
      `INSERT INTO anchors (anchor_id, root_hash, external_reference, method, anchored_at, events_covered)
       VALUES (@anchor_id, @root_hash, @external_reference, @method, @anchored_at, @events_covered)`
    )
    .run({ ...a, events_covered: JSON.stringify(a.events_covered) });
}

export function getAnchor(anchorId: string): Anchor | undefined {
  const row = getDb().prepare("SELECT * FROM anchors WHERE anchor_id = ?").get(anchorId) as
    | (Anchor & { events_covered: string })
    | undefined;
  return row ? { ...row, events_covered: JSON.parse(row.events_covered) } : undefined;
}

export function getAnchorsForCase(caseId: string): Anchor[] {
  const rows = getDb()
    .prepare("SELECT * FROM anchors ORDER BY anchored_at DESC")
    .all() as (Anchor & { events_covered: string })[];
  return rows
    .filter((r) => r.events_covered.includes(caseId) || r.events_covered.includes(`${caseId}:`))
    .map((r) => ({ ...r, events_covered: JSON.parse(r.events_covered) }));
}

export function listAnchors(): Anchor[] {
  const rows = getDb()
    .prepare("SELECT * FROM anchors ORDER BY anchored_at DESC")
    .all() as (Anchor & { events_covered: string })[];
  return rows.map((r) => ({ ...r, events_covered: JSON.parse(r.events_covered) }));
}

/* ---------------------------- sessions ---------------------------- */

export function createSession(token: string, actorId: string) {
  getDb()
    .prepare("INSERT INTO sessions (token, actor_id, created_at) VALUES (?, ?, ?)")
    .run(token, actorId, new Date().toISOString());
}

export function getSessionActor(token: string): Actor | undefined {
  const row = getDb()
    .prepare("SELECT actor_id FROM sessions WHERE token = ?")
    .get(token) as { actor_id: string } | undefined;
  return row ? getActor(row.actor_id) : undefined;
}

export function deleteSession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/* --------------------------- demo inbox --------------------------- */

export function insertEmail(toEmail: string, subject: string, body: string, caseId?: string) {
  getDb()
    .prepare(
      "INSERT INTO demo_inbox (to_email, subject, body, case_id, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(toEmail, subject, body, caseId ?? null, new Date().toISOString());
}

export function listEmails(): { id: number; to_email: string; subject: string; body: string; case_id: string | null; created_at: string }[] {
  return getDb()
    .prepare("SELECT * FROM demo_inbox ORDER BY id DESC")
    .all() as any[];
}
