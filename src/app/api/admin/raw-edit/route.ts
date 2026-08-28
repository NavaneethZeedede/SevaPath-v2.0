import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/store";

/**
 * DEMO-ONLY ROUTE. Intentionally NOT linked from any navigation.
 *
 * This simulates an attacker with direct database access who bypasses the
 * append-only event flow and rewrites a stored record. In a real deployment
 * this endpoint would never exist. Its only purpose is to demonstrate that the
 * verification layer catches the tampering on the next timeline load.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const eventId = String(body.eventId ?? "");
  const newPayload = body.newPayload;
  if (!eventId || newPayload == null) {
    return NextResponse.json({ error: "eventId and newPayload required" }, { status: 400 });
  }
  const ev = store.getEvent(eventId);
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  store.rawUpdateEventPayload(eventId, newPayload);
  return NextResponse.json({ ok: true, note: "Raw DB edit applied (bypassing event chain)." });
}
