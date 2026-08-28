import crypto from "crypto";
import path from "path";
import { sha256 } from "./crypto";
import { GrievanceAction } from "./types";
import * as store from "./store";
import { DATA_DIR } from "./db";

/**
 * External anchoring layer.
 *
 * WHY: a tamper-evidence system that only checks its own database against
 * itself is circular - an attacker with DB access could rewrite the whole
 * chain consistently and it would "verify" against itself. Anchoring publishes
 * a fingerprint of recent events somewhere the application cannot quietly edit
 * afterward, so integrity is independently checkable.
 *
 * WHAT IS ANCHORED: not every event, but a combined (Merkle-style) root hash of
 * the event hashes added since the previous anchor. Only this hash leaves the
 * server - never any grievance content.
 *
 * PROVIDER PRIORITY:
 *   1. GitHub Gist (real, immutable, public, clickable) when GITHUB_TOKEN set.
 *   2. Local append-only public ledger (clearly labelled demo fallback) when
 *      no token is available, so the demo always works offline.
 *
 * TUNING: anchor after every 3 new events, or every 2 minutes, or immediately on
 * CLOSE so the closure anchor is visible in the live demo.
 */

const ANCHOR_EVERY_N = 3;
const ANCHOR_MAX_AGE_MS = 2 * 60 * 1000;

function lastAnchoredSeq(caseId: string): number {
  let max = 0;
  for (const a of store.listAnchors()) {
    for (const covered of a.events_covered as string[]) {
      const [c, s] = covered.split("#");
      if (c === caseId) max = Math.max(max, Number(s) || 0);
    }
  }
  return max;
}

function lastAnchorTime(): number {
  const all = store.listAnchors();
  if (all.length === 0) return 0;
  return Math.max(...all.map((a) => new Date(a.anchored_at).getTime()));
}

function coveredKey(caseId: string, seq: number) {
  return `${caseId}#${seq}`;
}

export async function maybeAnchor(
  caseId: string,
  action: GrievanceAction
): Promise<void> {
  const since = lastAnchoredSeq(caseId);
  const events = store.getEventsByCase(caseId).filter((e) => e.sequence_number > since);
  if (events.length === 0) return;

  const age = Date.now() - lastAnchorTime();
  const shouldAnchor =
    events.length >= ANCHOR_EVERY_N || action === "CLOSED" || age > ANCHOR_MAX_AGE_MS;

  if (!shouldAnchor) return;

  const rootHash = sha256(events.map((e) => e.event_hash).join(""));
  const eventsCovered = events.map((e) => coveredKey(caseId, e.sequence_number));

  const anchorId = `anc_${crypto.randomUUID()}`;
  const anchoredAt = new Date().toISOString();

  const token = process.env.GITHUB_TOKEN;
  let method = "local-ledger";
  let externalReference = "";

  if (token) {
    try {
      const res = await anchorToGist(token, {
        anchorId,
        rootHash,
        eventsCovered,
        anchoredAt,
      });
      method = "github-gist";
      externalReference = res;
    } catch {
      method = "local-ledger";
    }
  }

  if (method === "local-ledger") {
    externalReference = await anchorToLocalLedger({
      anchorId,
      rootHash,
      eventsCovered,
      anchoredAt,
    });
  }

  store.insertAnchor({
    anchor_id: anchorId,
    root_hash: rootHash,
    external_reference: externalReference,
    method,
    anchored_at: anchoredAt,
    events_covered: eventsCovered,
  });
}

async function anchorToGist(
  token: string,
  payload: {
    anchorId: string;
    rootHash: string;
    eventsCovered: string[];
    anchoredAt: string;
  }
): Promise<string> {
  const body = {
    description: `SevaPath integrity anchor ${payload.anchorId}`,
    public: true,
    files: {
      [`${payload.anchorId}.json`]: {
        content: JSON.stringify(
          {
            anchorId: payload.anchorId,
            rootHash: payload.rootHash,
            eventsCovered: payload.eventsCovered,
            anchoredAt: payload.anchoredAt,
            note: "Tamper-evidence anchor. This hash commits the case history to an externally visible, immutable record. In production this would be a permissioned inter-department ledger or a Bitcoin timestamp via OpenTimestamps.",
          },
          null,
          2
        ),
      },
    },
  };
  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "SevaPath-Integrity-Tracker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = (await res.json()) as { html_url: string };
  return data.html_url;
}

/** Anchor every event in a case unconditionally (used to pre-anchor seed cases). */
export async function forceAnchor(caseId: string): Promise<void> {
  const since = lastAnchoredSeq(caseId);
  const events = store.getEventsByCase(caseId).filter((e) => e.sequence_number > since);
  if (events.length === 0) return;
  const rootHash = sha256(events.map((e) => e.event_hash).join(""));
  const eventsCovered = events.map((e) => coveredKey(caseId, e.sequence_number));
  const anchorId = `anc_${crypto.randomUUID()}`;
  const anchoredAt = new Date().toISOString();
  const token = process.env.GITHUB_TOKEN;
  let method = "local-ledger";
  let externalReference = "";
  if (token) {
    try {
      externalReference = await anchorToGist(token, { anchorId, rootHash, eventsCovered, anchoredAt });
      method = "github-gist";
    } catch {
      method = "local-ledger";
    }
  }
  if (method === "local-ledger") {
    externalReference = await anchorToLocalLedger({ anchorId, rootHash, eventsCovered, anchoredAt });
  }
  store.insertAnchor({ anchor_id: anchorId, root_hash: rootHash, external_reference: externalReference, method, anchored_at: anchoredAt, events_covered: eventsCovered });
}

async function anchorToLocalLedger(payload: {
  anchorId: string;
  rootHash: string;
  eventsCovered: string[];
  anchoredAt: string;
}): Promise<string> {
  const fs = await import("fs");
  const path = await import("path");
  const ledgerDir = path.join(DATA_DIR, "anchor-ledger");
  if (!fs.existsSync(ledgerDir)) fs.mkdirSync(ledgerDir, { recursive: true });

  const record = {
    anchorId: payload.anchorId,
    rootHash: payload.rootHash,
    eventsCovered: payload.eventsCovered,
    anchoredAt: payload.anchoredAt,
    method: "local-ledger",
    note: "Demo anchoring fallback: append-only public ledger served by this app. Not an independent third party - it exists to demonstrate the anchor/verify flow. Set GITHUB_TOKEN to anchor to a real, immutable GitHub Gist, or wire OpenTimestamps for a Bitcoin timestamp.",
  };
  fs.writeFileSync(
    path.join(ledgerDir, `${payload.anchorId}.json`),
    JSON.stringify(record, null, 2)
  );

  const ledgerPath = path.join(ledgerDir, "ledger.json");
  const existing = fs.existsSync(ledgerPath)
    ? JSON.parse(fs.readFileSync(ledgerPath, "utf8"))
    : [];
  existing.push(record);
  fs.writeFileSync(ledgerPath, JSON.stringify(existing, null, 2));

  return `/verify-anchor/${payload.anchorId}`;
}
