import crypto from "crypto";
import { sha256, buildEvent } from "./crypto";
import { Actor, GrievanceAction, GrievanceCase, GrievanceEvent } from "./types";
import * as store from "./store";
import { forceAnchor } from "./anchoring";

const SALT = "sevapath-demo-simulated-signing-salt-v1";

function simKey(actorId: string): string {
  return sha256(`${SALT}:${actorId}`);
}

interface SeedActor {
  id: string;
  name: string;
  role: Actor["role"];
  department: string | null;
  email: string;
}

const SEED_ACTORS: SeedActor[] = [
  { id: "CIT_1", name: "Priya Sharma", role: "CITIZEN", department: null, email: "priya.sharma@example.com" },
  { id: "CIT_2", name: "Arjun Mehta", role: "CITIZEN", department: null, email: "arjun.mehta@example.com" },
  { id: "CIT_3", name: "Lakshmi Rao", role: "CITIZEN", department: null, email: "lakshmi.rao@example.com" },
  { id: "CIT_4", name: "Mohammed Faiz", role: "CITIZEN", department: null, email: "faiz@example.com" },
  { id: "OFF_W1", name: "Ravi Kumar", role: "OFFICER", department: "Water Dept", email: "ravik@water.gov.in" },
  { id: "OFF_W2", name: "Sunita Iyer", role: "OFFICER", department: "Water Dept", email: "sunitai@water.gov.in" },
  { id: "OFF_E1", name: "Deepak Nair", role: "OFFICER", department: "Electricity Dept", email: "deepakn@elec.gov.in" },
  { id: "OFF_E2", name: "Anita Bose", role: "OFFICER", department: "Electricity Dept", email: "anitab@elec.gov.in" },
  { id: "OFF_R1", name: "Kiran Shetty", role: "OFFICER", department: "Roads & Infrastructure Dept", email: "kiran@roads.gov.in" },
  { id: "OFF_R2", name: "Meera Pillai", role: "OFFICER", department: "Roads & Infrastructure Dept", email: "meera@roads.gov.in" },
  { id: "OFF_S1", name: "Ganesh Verma", role: "OFFICER", department: "Sanitation Dept", email: "ganesh@sanitation.gov.in" },
  { id: "OFF_S2", name: "Divya Menon", role: "OFFICER", department: "Sanitation Dept", email: "divya@sanitation.gov.in" },
  { id: "OFF_REV1", name: "Prakash Joshi", role: "OFFICER", department: "Revenue & Property Tax Dept", email: "prakash@revenue.gov.in" },
  { id: "OFF_REV2", name: "Shobha Rani", role: "OFFICER", department: "Revenue & Property Tax Dept", email: "shobha@revenue.gov.in" },
  { id: "OFF_GA1", name: "Naveen Chandra", role: "OFFICER", department: "General Administration Dept", email: "naveen@genadmin.gov.in" },
  { id: "OFF_GA2", name: "Farida Khan", role: "OFFICER", department: "General Administration Dept", email: "farida@genadmin.gov.in" },
  { id: "SUP_1", name: "M. Venkatesh", role: "SUPERVISOR", department: null, email: "sup@gov.in" },
];

interface SeedCase {
  case_id: string;
  citizen_id: string;
  title: string;
  category: string;
  description: string;
  location_text: string;
  department: string;
  events: { action: GrievanceAction; actorId: string; payload: Record<string, unknown> }[];
}

const SEED_CASES: SeedCase[] = [
  {
    case_id: "SVP-1001",
    citizen_id: "CIT_1",
    title: "Water tanker has not arrived in 3 weeks",
    category: "Water Supply",
    description:
      "Our ward has not received the scheduled drinking-water tanker for 21 days. Residents are forced to buy water at high cost.",
    location_text: "Ward 12, Anantapur, Andhra Pradesh",
    department: "Water Dept",
    events: [
      { action: "FILED", actorId: "CIT_1", payload: { complaint: "Water tanker not arriving for 3 weeks in Ward 12.", category: "Water Supply" } },
      { action: "ASSIGNED", actorId: "OFF_W1", payload: { assignedTo: "OFF_W1", note: "Taking this up with the local tanker roster." } },
      { action: "RESPONDED", actorId: "OFF_W1", payload: { update: "Spoke to depot; tanker was misrouted. Re-scheduling for tomorrow." } },
      { action: "ESCALATED", actorId: "OFF_W1", payload: { toOfficer: "OFF_W2", toDepartment: "Water Dept", reason: "Recurring misroute suggests a roster/system issue needing senior oversight." } },
      { action: "CLOSED", actorId: "OFF_W2", payload: { closureReason: "Permanent reroute assigned; tanker delivered and confirmed by ward volunteer." } },
    ],
  },
  {
    case_id: "SVP-1002",
    citizen_id: "CIT_2",
    title: "Streetlight outside house has been out for a month",
    category: "Electricity",
    description:
      "The streetlight at the lane entrance has been dark for a month, creating a safety hazard at night.",
    location_text: "5th Cross, RT Nagar, Bengaluru",
    department: "Electricity Dept",
    events: [
      { action: "FILED", actorId: "CIT_2", payload: { complaint: "Streetlight out for a month at 5th Cross.", category: "Electricity" } },
      { action: "ASSIGNED", actorId: "OFF_E1", payload: { assignedTo: "OFF_E1", note: "Field team notified." } },
      { action: "CLOSED", actorId: "OFF_E1", payload: { closureReason: "Faulty ballast replaced; light restored and verified." } },
    ],
  },
  {
    case_id: "SVP-1003",
    citizen_id: "CIT_3",
    title: "Incorrect property tax demand after reassessment",
    category: "Water Dept",
    description:
      "I was billed twice for the same quarter after the recent reassessment. Requesting correction.",
    location_text: "Lakshmi Nagar, Vijayawada",
    department: "Water Dept",
    events: [
      { action: "FILED", actorId: "CIT_3", payload: { complaint: "Double property-tax demand after reassessment.", category: "Water Dept" } },
      { action: "ASSIGNED", actorId: "OFF_W2", payload: { assignedTo: "OFF_W2", note: "Pulling assessment records." } },
      { action: "ESCALATED", actorId: "OFF_W2", payload: { toOfficer: "OFF_W1", toDepartment: "Water Dept", reason: "Billing system error; needs records correction by assessment desk." } },
      { action: "RESPONDED", actorId: "OFF_W1", payload: { update: "Duplicate entry found and flagged for reversal." } },
      { action: "CLOSED", actorId: "OFF_W1", payload: { closureReason: "Duplicate demand reversed; corrected bill issued." } },
    ],
  },
];

let seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  const existing = await store.getActor("CIT_1");
  if (existing) {
    // DB already seeded — but still upsert the actor roster so newly added
    // demo officers (e.g. for Roads/Sanitation/Revenue/General departments)
    // appear on deployments that were seeded before they existed.
    // insertActor upserts and keys are deterministic, so this is idempotent.
    for (const a of SEED_ACTORS) {
      await store.insertActor({
        id: a.id,
        name: a.name,
        role: a.role,
        department: a.department,
        email: a.email,
        secretKey: simKey(a.id),
      });
    }
    seeded = true;
    return;
  }

  for (const a of SEED_ACTORS) {
    await store.insertActor({
      id: a.id,
      name: a.name,
      role: a.role,
      department: a.department,
      email: a.email,
      secretKey: simKey(a.id),
    });
  }

  for (const c of SEED_CASES) {
    const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString();
    const gCase: GrievanceCase = {
      case_id: c.case_id,
      citizen_id: c.citizen_id,
      title: c.title,
      category: c.category,
      description: c.description,
      location_text: c.location_text,
      lat: null,
      lng: null,
      department: c.department,
      status: "FILED",
      created_at: createdAt,
    };
    await store.insertCase(gCase);

    let prev = "GENESIS";
    const events: GrievanceEvent[] = [];
    for (let i = 0; i < c.events.length; i++) {
      const spec = c.events[i];
      const actor = await store.getActor(spec.actorId);
      if (!actor) continue;
      const seq = i + 1;
      const ts = new Date(new Date(createdAt).getTime() + i * 1000 * 60 * 60 * 5).toISOString();
      const ev = buildEvent({
        eventId: `evt_seed_${c.case_id}_${seq}`,
        caseId: c.case_id,
        sequenceNumber: seq,
        prevEventHash: prev,
        action: spec.action,
        actorId: actor.id,
        actorRole: actor.role,
        timestamp: ts,
        payload: spec.payload,
        secretKey: actor.secretKey,
      });
      await store.insertEvent(ev);
      prev = ev.event_hash;
      events.push(ev);
    }
    await store.updateCaseStatus(c.case_id, c.events[c.events.length - 1].action);
  }

  seeded = true;

  for (const c of SEED_CASES) {
    forceAnchor(c.case_id).catch(() => {});
  }
}
