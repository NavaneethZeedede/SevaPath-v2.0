import fs from "fs";
import path from "path";
import { DATA_DIR } from "./paths";
import { ensureSeeded } from "./seed";
import {
  Actor,
  ActorRole,
  GrievanceAction,
  GrievanceCase,
  GrievanceEvent,
  Anchor,
} from "./types";
import { isSupabaseConfigured, supabase } from "./supabase";

/* --------------------------- file fallback --------------------------- */

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

async function load(): Promise<DB> {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    cache = JSON.parse(raw) as DB;
  } catch {
    cache = emptyDb();
  }
  if (!seeded && Object.keys(cache.actors).length === 0) {
    seeded = true;
    await ensureSeeded();
  }
  return cache;
}

async function save() {
  const db = cache ?? emptyDb();
  fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2));
}

/* --------------------------- Supabase adapter --------------------------- */

type SupabaseActorRow = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  email: string;
  secret_key: string;
};

type SupabaseCaseRow = {
  case_id: string;
  citizen_id: string;
  title: string;
  category: string;
  description: string;
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  department: string;
  status: string;
  created_at: string;
};

type SupabaseEventRow = {
  event_id: string;
  case_id: string;
  sequence_number: number;
  prev_event_hash: string;
  action: string;
  actor_id: string;
  actor_role: ActorRole;
  timestamp: string;
  payload: unknown;
  payload_hash: string;
  signature: string;
  event_hash: string;
};

type SupabaseAnchorRow = {
  anchor_id: string;
  root_hash: string;
  external_reference: string;
  method: string;
  anchored_at: string;
  events_covered: string[];
};

function actorToObj(row: SupabaseActorRow): Actor {
  return {
    id: row.id,
    name: row.name,
    role: row.role as Actor["role"],
    department: row.department ?? null,
    email: row.email,
    secretKey: row.secret_key,
  };
}

function caseToObj(row: SupabaseCaseRow): GrievanceCase {
  return {
    case_id: row.case_id,
    citizen_id: row.citizen_id,
    title: row.title,
    category: row.category,
    description: row.description,
    location_text: row.location_text,
    lat: row.lat,
    lng: row.lng,
    department: row.department,
    status: row.status as GrievanceCase["status"],
    created_at: row.created_at,
  };
}

function eventToObj(row: SupabaseEventRow): GrievanceEvent {
  return {
    event_id: row.event_id,
    case_id: row.case_id,
    sequence_number: row.sequence_number,
    prev_event_hash: row.prev_event_hash,
    action: row.action as GrievanceAction,
    actor_id: row.actor_id,
    actor_role: row.actor_role,
    timestamp: row.timestamp,
    payload: row.payload as GrievanceEvent["payload"],
    payload_hash: row.payload_hash,
    signature: row.signature,
    event_hash: row.event_hash,
  };
}

function anchorToObj(row: SupabaseAnchorRow): Anchor {
  return {
    anchor_id: row.anchor_id,
    root_hash: row.root_hash,
    external_reference: row.external_reference,
    method: row.method as Anchor["method"],
    anchored_at: row.anchored_at,
    events_covered: row.events_covered,
  };
}

/* --------------------------- public API --------------------------- */

export async function getActor(id: string): Promise<Actor | undefined> {
  if (supabase) {
    const { data } = await supabase.from("actors").select("*").eq("id", id).maybeSingle();
    return data ? actorToObj(data) : undefined;
  }
  return (await load()).actors[id];
}

export async function getActorByEmail(email: string): Promise<Actor | undefined> {
  const lower = email.trim().toLowerCase();
  if (supabase) {
    const { data } = await supabase.from("actors").select("*").ilike("email", lower).maybeSingle();
    return data ? actorToObj(data) : undefined;
  }
  return Object.values((await load()).actors).find((a) => a.email.toLowerCase() === lower);
}

export async function listActors(): Promise<Actor[]> {
  if (supabase) {
    const { data } = await supabase.from("actors").select("*").order("role").order("id");
    return (data ?? []).map(actorToObj);
  }
  return Object.values((await load()).actors).sort((a, b) =>
    a.role === b.role ? a.id.localeCompare(b.id) : a.role.localeCompare(b.role)
  );
}

export async function insertActor(a: Actor): Promise<void> {
  if (supabase) {
    await supabase.from("actors").upsert({
      id: a.id,
      name: a.name,
      role: a.role,
      department: a.department,
      email: a.email,
      secret_key: a.secretKey,
    });
    return;
  }
  const db = await load();
  db.actors[a.id] = { ...a };
  await save();
}

export async function insertCase(c: GrievanceCase): Promise<void> {
  if (supabase) {
    await supabase.from("cases").upsert({
      case_id: c.case_id,
      citizen_id: c.citizen_id,
      title: c.title,
      category: c.category,
      description: c.description,
      location_text: c.location_text ?? null,
      lat: c.lat ?? null,
      lng: c.lng ?? null,
      department: c.department,
      status: c.status,
      created_at: c.created_at,
    });
    return;
  }
  const db = await load();
  db.cases[c.case_id] = { ...c };
  await save();
}

export async function getCase(caseId: string): Promise<GrievanceCase | undefined> {
  if (supabase) {
    const { data } = await supabase.from("cases").select("*").eq("case_id", caseId).maybeSingle();
    return data ? caseToObj(data) : undefined;
  }
  return (await load()).cases[caseId];
}

export async function listCases(filter?: { citizenId?: string; department?: string }): Promise<GrievanceCase[]> {
  if (supabase) {
    let query = supabase.from("cases").select("*");
    if (filter?.citizenId) query = query.eq("citizen_id", filter.citizenId);
    else if (filter?.department) query = query.eq("department", filter.department);
    const { data } = await query.order("created_at", { ascending: false });
    return (data ?? []).map(caseToObj);
  }
  const all = Object.values((await load()).cases);
  let out = all;
  if (filter?.citizenId) out = out.filter((c) => c.citizen_id === filter.citizenId);
  else if (filter?.department) out = out.filter((c) => c.department === filter.department);
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateCaseStatus(caseId: string, status: GrievanceAction, department?: string): Promise<void> {
  if (supabase) {
    const updates: Record<string, unknown> = { status };
    if (department) updates.department = department;
    await supabase.from("cases").update(updates).eq("case_id", caseId);
    return;
  }
  const db = await load();
  const c = db.cases[caseId];
  if (!c) return;
  c.status = status;
  if (department) c.department = department;
  await save();
}

export async function insertEvent(e: GrievanceEvent): Promise<void> {
  if (supabase) {
    await supabase.from("events").upsert({
      event_id: e.event_id,
      case_id: e.case_id,
      sequence_number: e.sequence_number,
      prev_event_hash: e.prev_event_hash,
      action: e.action,
      actor_id: e.actor_id,
      actor_role: e.actor_role,
      timestamp: e.timestamp,
      payload: e.payload,
      payload_hash: e.payload_hash,
      signature: e.signature,
      event_hash: e.event_hash,
    });
    return;
  }
  const db = await load();
  db.events.push({ ...e });
  await save();
}

export async function getEventsByCase(caseId: string): Promise<GrievanceEvent[]> {
  if (supabase) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("case_id", caseId)
      .order("sequence_number", { ascending: true });
    return (data ?? []).map(eventToObj);
  }
  return (await load())
    .events.filter((e) => e.case_id === caseId)
    .sort((a, b) => a.sequence_number - b.sequence_number);
}

export async function getLastEventHash(caseId: string): Promise<string> {
  if (supabase) {
    const { data } = await supabase
      .from("events")
      .select("event_hash")
      .eq("case_id", caseId)
      .order("sequence_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.event_hash ?? "GENESIS";
  }
  const evs = (await load()).events.filter((e) => e.case_id === caseId);
  if (evs.length === 0) return "GENESIS";
  const sorted = evs.sort((a, b) => b.sequence_number - a.sequence_number);
  return sorted[0].event_hash;
}

export async function countEvents(caseId: string): Promise<number> {
  if (supabase) {
    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("case_id", caseId);
    return count ?? 0;
  }
  return (await load()).events.filter((e) => e.case_id === caseId).length;
}

export async function getEvent(eventId: string): Promise<GrievanceEvent | undefined> {
  if (supabase) {
    const { data } = await supabase.from("events").select("*").eq("event_id", eventId).maybeSingle();
    return data ? eventToObj(data) : undefined;
  }
  return (await load()).events.find((e) => e.event_id === eventId);
}

export async function rawUpdateEventPayload(eventId: string, payload: unknown): Promise<void> {
  if (supabase) {
    await supabase.from("events").update({ payload }).eq("event_id", eventId);
    return;
  }
  const db = await load();
  const ev = db.events.find((e) => e.event_id === eventId);
  if (ev) {
    ev.payload = payload as GrievanceEvent["payload"];
    await save();
  }
}

export async function insertAnchor(a: Anchor): Promise<void> {
  if (supabase) {
    await supabase.from("anchors").upsert({
      anchor_id: a.anchor_id,
      root_hash: a.root_hash,
      external_reference: a.external_reference,
      method: a.method,
      anchored_at: a.anchored_at,
      events_covered: a.events_covered,
    });
    return;
  }
  const db = await load();
  db.anchors.push({ ...a, events_covered: [...a.events_covered] });
  await save();
}

export async function getAnchor(anchorId: string): Promise<Anchor | undefined> {
  if (supabase) {
    const { data } = await supabase.from("anchors").select("*").eq("anchor_id", anchorId).maybeSingle();
    return data ? anchorToObj(data) : undefined;
  }
  const a = (await load()).anchors.find((x) => x.anchor_id === anchorId);
  return a ? { ...a, events_covered: [...a.events_covered] } : undefined;
}

export async function getAnchorsForCase(caseId: string): Promise<Anchor[]> {
  if (supabase) {
    const { data } = await supabase
      .from("anchors")
      .select("*")
      .order("anchored_at", { ascending: false });
    return (data ?? [])
      .filter((a) => a.events_covered.some((c: string) => c === caseId || c.startsWith(`${caseId}#`)))
      .map(anchorToObj);
  }
  return (await load())
    .anchors.filter((a) =>
      a.events_covered.some((c) => c === caseId || c.startsWith(`${caseId}#`))
    )
    .sort((a, b) => b.anchored_at.localeCompare(a.anchored_at))
    .map((a) => ({ ...a, events_covered: [...a.events_covered] }));
}

export async function listAnchors(): Promise<Anchor[]> {
  if (supabase) {
    const { data } = await supabase
      .from("anchors")
      .select("*")
      .order("anchored_at", { ascending: false });
    return (data ?? []).map(anchorToObj);
  }
  return (await load())
    .anchors.sort((a, b) => b.anchored_at.localeCompare(a.anchored_at))
    .map((a) => ({ ...a, events_covered: [...a.events_covered] }));
}

export interface InboxItem {
  id: number;
  to_email: string;
  subject: string;
  body: string;
  case_id: string | null;
  created_at: string;
}

export async function insertEmail(toEmail: string, subject: string, body: string, caseId?: string): Promise<void> {
  if (supabase) {
    await supabase.from("inbox").insert({
      to_email: toEmail,
      subject,
      body,
      case_id: caseId ?? null,
      created_at: new Date().toISOString(),
    });
    return;
  }
  const db = await load();
  db.inbox.push({
    id: db._emailSeq++,
    to_email: toEmail,
    subject,
    body,
    case_id: caseId ?? null,
    created_at: new Date().toISOString(),
  });
  await save();
}

export async function listEmails(): Promise<InboxItem[]> {
  if (supabase) {
    const { data } = await supabase
      .from("inbox")
      .select("*")
      .order("id", { ascending: false });
    return (data ?? []) as InboxItem[];
  }
  return [...(await load()).inbox].sort((a, b) => b.id - a.id);
}
