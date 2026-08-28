import { Actor, GrievanceAction, GrievanceCase } from "./types";
import * as store from "./store";

const ACTION_LABEL: Record<GrievanceAction, string> = {
  FILED: "received",
  ASSIGNED: "assigned to an officer",
  ESCALATED: "escalated to another department",
  RESPONDED: "updated by the handling officer",
  CLOSED: "closed",
};

export async function notifyCaseChange(
  gCase: GrievanceCase,
  action: GrievanceAction,
  actor: Actor
): Promise<void> {
  const citizen = await store.getActor(gCase.citizen_id);
  const to = citizen?.email ?? "citizen@example.com";
  const subject = `SevaPath update: your grievance ${gCase.case_id} has been ${ACTION_LABEL[action]}`;
  const body =
    `Dear ${citizen?.name ?? "Citizen"},\n\n` +
    `Your grievance "${gCase.title}" (Ref: ${gCase.case_id}) has been ${ACTION_LABEL[action]}.\n` +
    `Department: ${gCase.department}\n` +
    `Action taken by: ${actor.name} (${actor.role})\n\n` +
    `Open your case to view the full, verified timeline: /citizen/${gCase.case_id}\n\n` +
    `— SevaPath Integrity Tracker`;

  await store.insertEmail(to, subject, body, gCase.case_id);

  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "SevaPath <onboarding@resend.dev>",
          to: [to],
          subject,
          text: body,
        }),
      });
    } catch {
      /* swallow - demo inbox already has the record */
    }
  }
}
