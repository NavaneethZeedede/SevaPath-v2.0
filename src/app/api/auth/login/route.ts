import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getCurrentActor, endSession } from "@/lib/session";
import * as store from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";

const COOKIE = "sid";

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const actor = await store.getActorByEmail(email);
  if (!actor) {
    return NextResponse.json({ error: "No demo account for that email" }, { status: 401 });
  }
  const res = NextResponse.json({
    ok: true,
    actor: { id: actor.id, name: actor.name, role: actor.role, department: actor.department, email: actor.email },
  });
  res.cookies.set(COOKIE, createSessionToken(actor.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function GET() {
  const actor = await getCurrentActor();
  if (!actor) return NextResponse.json({ actor: null });
  return NextResponse.json({
    actor: { id: actor.id, name: actor.name, role: actor.role, department: actor.department, email: actor.email },
  });
}

export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
