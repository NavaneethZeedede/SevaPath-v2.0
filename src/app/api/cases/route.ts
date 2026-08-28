import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentActor } from "@/lib/session";
import * as store from "@/lib/store";
import { verifyChain } from "@/lib/crypto";
import { appendEvent } from "@/lib/append";
import { reverseGeocode } from "@/lib/geocode";

export async function GET() {
  const actor = await getCurrentActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let cases = await store.listCases();
  if (actor.role === "CITIZEN") cases = await store.listCases({ citizenId: actor.id });
  else if (actor.role === "OFFICER") cases = await store.listCases({ department: actor.department ?? "" });

  const actors = await store.listActors();
  const secretKeys = new Map(actors.map((a) => [a.id, a.secretKey]));

  const out = await Promise.all(
    cases.map(async (c) => {
      const events = await store.getEventsByCase(c.case_id);
      const v = verifyChain(events, (id) => secretKeys.get(id));
      const anchors = await store.getAnchorsForCase(c.case_id);
      return {
        case: c,
        verificationStatus: v.status,
        anchorCount: anchors.length,
        lastAnchoredAt: anchors[0]?.anchored_at ?? null,
        breachedEventSeq: v.status === "INTEGRITY_BREACH" ? v.events.find((e) => !e.ok)?.sequence_number : null,
      };
    })
  );
  return NextResponse.json({ cases: out });
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentActor();
  if (!actor || actor.role !== "CITIZEN") {
    return NextResponse.json({ error: "Only citizens may file grievances" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "General").trim();
  const locationText = String(body.location_text ?? "").trim() || null;
  const lat = body.lat != null ? Number(body.lat) : null;
  const lng = body.lng != null ? Number(body.lng) : null;

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  let resolvedLocation = locationText;
  if (!resolvedLocation && lat != null && lng != null) {
    resolvedLocation = (await reverseGeocode(lat, lng)) ?? `Lat ${lat}, Lng ${lng}`;
  }

  const caseId = `SVP-${Math.floor(1000 + Math.random() * 9000)}-${crypto.randomUUID().slice(0, 4)}`;
  await store.insertCase({
    case_id: caseId,
    citizen_id: actor.id,
    title,
    category,
    description,
    location_text: resolvedLocation,
    lat,
    lng,
    department: "Water Dept",
    status: "FILED",
    created_at: new Date().toISOString(),
  });

  await appendEvent({
    caseId,
    action: "FILED",
    actor,
    payload: { complaint: description, category, location: resolvedLocation },
  });

  return NextResponse.json({ ok: true, caseId });
}
