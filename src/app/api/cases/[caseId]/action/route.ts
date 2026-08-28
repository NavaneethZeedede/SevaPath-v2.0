import { NextRequest, NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/session";
import * as store from "@/lib/store";
import { appendEvent } from "@/lib/append";
import { GrievanceAction } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OFFICER_ACTIONS: GrievanceAction[] = ["ASSIGNED", "ESCALATED", "RESPONDED", "CLOSED"];

export async function POST(req: NextRequest, { params }: { params: { caseId: string } }) {
  const actor = await getCurrentActor();
  if (!actor || (actor.role !== "OFFICER" && actor.role !== "SUPERVISOR")) {
    return NextResponse.json({ error: "Officers only" }, { status: 403 });
  }
  const gCase = await store.getCase(params.caseId);
  if (!gCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "") as GrievanceAction;
  if (!OFFICER_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "ESCALATED") {
    const toDepartment = String(body.toDepartment ?? gCase.department);
    const reason = String(body.reason ?? "").trim();
    if (!reason) return NextResponse.json({ error: "Escalation reason is required" }, { status: 400 });
    await appendEvent({
      caseId: params.caseId,
      action,
      actor,
      newDepartment: toDepartment,
      payload: { toOfficer: body.toOfficer ?? null, toDepartment, reason },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "CLOSED") {
    const closureReason = String(body.closureReason ?? "").trim();
    if (!closureReason) return NextResponse.json({ error: "Closure reason is required" }, { status: 400 });
    await appendEvent({ caseId: params.caseId, action, actor, payload: { closureReason } });
    return NextResponse.json({ ok: true });
  }

  if (action === "ASSIGNED") {
    await appendEvent({
      caseId: params.caseId,
      action,
      actor,
      payload: { assignedTo: body.assignedTo ?? actor.id, note: body.note ?? "" },
    });
    return NextResponse.json({ ok: true });
  }

  const update = String(body.update ?? "").trim();
  if (!update) return NextResponse.json({ error: "Update text is required" }, { status: 400 });
  await appendEvent({ caseId: params.caseId, action, actor, payload: { update } });
  return NextResponse.json({ ok: true });
}
