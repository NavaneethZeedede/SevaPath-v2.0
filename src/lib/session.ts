import { cookies } from "next/headers";
import crypto from "crypto";
import { Actor } from "./types";
import * as store from "./store";

export function getCurrentActor(): Actor | undefined {
  const sid = cookies().get("sid")?.value;
  if (!sid) return undefined;
  return store.getSessionActor(sid);
}

export function startSession(actorId: string): void {
  const token = crypto.randomUUID();
  store.createSession(token, actorId);
  cookies().set("sid", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function endSession(): void {
  const sid = cookies().get("sid")?.value;
  if (sid) store.deleteSession(sid);
  cookies().delete("sid");
}
