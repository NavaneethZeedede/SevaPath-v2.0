import { cookies } from "next/headers";
import crypto from "crypto";
import { Actor } from "./types";
import * as store from "./store";

/**
 * Stateless, signed-cookie auth.
 *
 * Why: on serverless platforms (Vercel) each request can hit a different
 * instance with its own ephemeral storage, so a server-side session table is
 * not shared across instances and login breaks. Instead the cookie carries a
 * signed actor id; any instance can verify it. Actor records (and their HMAC
 * keys) are seeded deterministically, so store.getActor(id) resolves on every
 * instance.
 */
const SECRET = process.env.APP_SECRET || "sevapath-dev-secret-change-me";
const COOKIE = "sid";

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function getCurrentActor(): Actor | undefined {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return undefined;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return undefined;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))) {
    return undefined;
  }
  const id = Buffer.from(payload, "base64").toString("utf8");
  return store.getActor(id);
}

export function createSessionToken(actorId: string): string {
  const payload = Buffer.from(actorId, "utf8").toString("base64");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function startSession(actorId: string): void {
  cookies().set(COOKIE, createSessionToken(actorId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function endSession(): void {
  cookies().delete(COOKIE);
}
