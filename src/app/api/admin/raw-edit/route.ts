import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const eventId = String(body.eventId ?? "");
  const newPayload = body.newPayload;
  if (!eventId || newPayload == null) {
    return NextResponse.json({ error: "eventId and newPayload required" }, { status: 400 });
  }
  const ev = await store.getEvent(eventId);
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  await store.rawUpdateEventPayload(eventId, newPayload);
  return NextResponse.json({ ok: true, note: "Raw DB edit applied (bypassing event chain)." });
}
