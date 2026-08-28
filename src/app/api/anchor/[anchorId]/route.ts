import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { anchorId: string } }) {
  const anchor = await store.getAnchor(params.anchorId);
  if (!anchor) return NextResponse.json({ error: "Anchor not found" }, { status: 404 });
  const events = await Promise.all(
    anchor.events_covered.map(async (c) => {
      const [caseId, seq] = c.split("#");
      const ev = (await store.getEventsByCase(caseId)).find((e) => e.sequence_number === Number(seq));
      return ev ? { caseId, event: { event_id: ev.event_id, event_hash: ev.event_hash, action: ev.action } } : null;
    })
  );
  return NextResponse.json({ anchor, events: events.filter(Boolean) });
}
