import { NextRequest, NextResponse } from "next/server";
import { startSession, getCurrentActor, endSession } from "@/lib/session";
import * as store from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const actor = store.getActorByEmail(email);
  if (!actor) {
    return NextResponse.json({ error: "No demo account for that email" }, { status: 401 });
  }
  startSession(actor.id);
  return NextResponse.json({
    ok: true,
    actor: { id: actor.id, name: actor.name, role: actor.role, department: actor.department, email: actor.email },
  });
}

export async function GET() {
  const actor = getCurrentActor();
  if (!actor) return NextResponse.json({ actor: null });
  return NextResponse.json({
    actor: { id: actor.id, name: actor.name, role: actor.role, department: actor.department, email: actor.email },
  });
}

export async function DELETE() {
  endSession();
  return NextResponse.json({ ok: true });
}
