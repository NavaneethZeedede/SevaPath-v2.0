import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function GET(_req: Request, { params }: { params: { anchorId: string } }) {
  const anchor = store.getAnchor(params.anchorId);
  if (!anchor) return NextResponse.json({ error: "Anchor not found" }, { status: 404 });
  const events = anchor.events_covered
    .map((c) => {
      const [caseId, seq] = c.split("#");
      const ev = store.getEventsByCase(caseId).find((e) => e.sequence_number === Number(seq));
      return ev ? { caseId, event: { event_id: ev.event_id, event_hash: ev.event_hash, action: ev.action } } : null;
    })
    .filter(Boolean);
  return NextResponse.json({ anchor, events });
}
