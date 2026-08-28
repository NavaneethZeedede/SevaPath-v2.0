import { cookies } from "next/headers";
import crypto from "crypto";
import { Actor } from "./types";
import * as store from "./store";

const SECRET = process.env.APP_SECRET || "sevapath-dev-secret-change-me";
const COOKIE = "sid";

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export async function getCurrentActor(): Promise<Actor | undefined> {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return undefined;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return undefined;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))) {
    return undefined;
  }
  const id = Buffer.from(payload, "base64").toString("utf8");
  return await store.getActor(id);
}

export function createSessionToken(actorId: string): string {
  const payload = Buffer.from(actorId, "utf8").toString("base64");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export async function startSession(actorId: string): Promise<void> {
  cookies().set(COOKIE, createSessionToken(actorId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession(): Promise<void> {
  cookies().delete(COOKIE);
}
