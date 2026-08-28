# SevaPath — Grievance Escalation Integrity Tracker

A tamper-evident grievance tracking system for the Indian public-service hackathon.
Instead of a single mutable `status` field, **every case action is an immutable,
append-only, cryptographically-linked event**. Citizens see a full, verifiable
timeline — and if anyone rewrites a past record (even with direct database
access), the system detects and names the exact failure.

> No crypto wallets, no citizen/officer keys, no blockchain jargon in the UI.
> "Verified", "anchored", "tamper-evident" — never "blockchain", "gas", or "wallet".

---

## Architecture

```
Browser (React/Next.js)
   │  fetch
   ▼
Next.js App Router  ── API routes + Server Components
   │  appendEvent() — the ONLY write path for case state
   ▼
Store layer (auto-switches)
   ├─ Supabase Postgres (when SUPABASE_URL set)   ← guaranteed cross-instance
   └─ JSON file store (local dev fallback)        ├─ actors  (simulated HMAC keys)
                                                  ├─ cases   (current stage)
                                                  ├─ events  (the hash chain)
                                                  ├─ anchors (external fingerprints)
                                                  └─ inbox   (demo emails)
   ▲
External integrations
   ├─ Anchoring  (GitHub Gist / local ledger)
   ├─ Geocoding  (OSM Nominatim)
   └─ Email      (Resend / demo inbox)
```

### The hash chain (`src/lib/crypto.ts`)

Each event stores: `event_id, case_id, sequence_number, prev_event_hash,
action, actor_id, actor_role, timestamp, payload, payload_hash, signature,
event_hash`.

- `payload_hash` = SHA-256 of the canonicalized JSON payload.
- `signature` = HMAC-SHA256(actor secret key, `prev_event_hash + payload_hash + timestamp + actor_id`).
- `event_hash` = SHA-256(`event_id + prev_event_hash + payload_hash + timestamp + signature`) —
  this is what the **next** event links to via its `prev_event_hash`.
- The first event links to the fixed `GENESIS` value.

There is **no PUT/PATCH for events**. State only ever changes by appending a new
event (e.g. a closure, not an edit). This forces an attacker who wants to "fix"
a closure to go around the app — exactly what the demo simulates.

### Verification (`verifyChain`)

Recomputes, in order, for every event:

1. `payload_hash` — payload matches stored hash → content unaltered.
2. `signature` — HMAC valid for the known actor key → not forged.
3. `event_hash` — fields consistent → nothing mutated.
4. `chain_link` — `prev_event_hash` equals the previous event's `event_hash` → nothing deleted/reordered/swapped.

If all pass → `VERIFIED`. If any fail → `INTEGRITY_BREACH`, and the UI shows
**which event and which specific check failed** (e.g. `Failed check:
payload_hash`), not a generic "tampered".

---

## External anchoring (`src/lib/anchoring.ts`)

**Why:** a system that only checks its own DB against itself is circular — an
attacker with DB access could rewrite the whole chain consistently and it would
still "verify". Anchoring publishes a fingerprint of recent events somewhere the
app cannot quietly edit afterward.

**What is anchored:** a combined (Merkle-style) root hash of the `event_hash`
values added since the last anchor — never any grievance content.

**When:** every 3 new events, or every 2 minutes, or immediately on `CLOSED`
(so the closure anchor is visible in the live demo).

**Method used (priority order):**

1. **GitHub Gist** — real, immutable, public, clickable — used automatically when
   `GITHUB_TOKEN` is set. This is the honest "external, independently checkable"
   anchor recommended by the brief.
2. **Local append-only public ledger** — used when no token is set, so the demo
   always works offline. It is **clearly labelled "demo fallback"** in the UI and
   at `/verify-anchor/[id]`. In production you would instead wire
   **OpenTimestamps** (Bitcoin timestamp, no signup) or a permissioned
   inter-department ledger — the provider is a single pluggable function.

The "How this works" panel inside the app states the exact method in use.

---

## What is real vs. simulated

| Piece | Status |
|-------|--------|
| Hash chain + verification | **Real** (Node `crypto`) |
| Officer signing | **Simulated** — server-side HMAC keys per actor (not real PKI / hardware), labelled everywhere |
| Geocoding | **Real** — OpenStreetMap Nominatim (`/api/geocode`) |
| Email | **Real** — Resend when `RESEND_API_KEY` set; otherwise written to the in-app `/inbox` |
| External anchor | **Real** GitHub Gist when `GITHUB_TOKEN` set; **demo** local ledger otherwise |

---

## Run it

Requires **Node.js 18+**. The persistence layer is a pure-JS JSON store (no native
modules), so it runs identically on local Node, containers, and Vercel serverless.

```bash
npm install
npm run build
npm run start          # http://localhost:3000
```

(Coming from a clean checkout the database auto-seeds on first request.)

Optional `.env` (copy from `.env.example`):

```
GITHUB_TOKEN=            # enables real external anchoring via GitHub Gist
RESEND_API_KEY=          # enables real email via Resend
```

### Demo accounts (sign in with the email; any password works)

- Citizens: `priya.sharma@example.com`, `arjun.mehta@example.com`, `lakshmi.rao@example.com`, `faiz@example.com`
- Officers: `ravik@water.gov.in`, `sunitai@water.gov.in` (Water);
  `deepakn@elec.gov.in`, `anitab@elec.gov.in` (Electricity)

---

## Deploying on Vercel

The app deliberately uses a **pure-JS JSON store with no native dependencies**
so it runs unchanged on Vercel serverless. Vercel's filesystem is read-only
except `/tmp`; when `VERCEL=1` is set (Vercel sets it automatically) the store
and the anchor ledger are written to `/tmp/sevapath-data` instead of `./data`.

**Auth is stateless** (a signed, HTTP-only cookie carrying the actor id), so a
login on one serverless instance is valid on any other instance — there is no
shared server-side session store to fall out of sync.

### Persistence on Vercel

**Important:** `/tmp` on Vercel is ephemeral and **per-instance**. For a
single-presenter demo this is usually fine if you keep the deployment warm
(don't let it idle between steps) — Vercel typically reuses one warm instance
for a low-traffic demo.

For **guaranteed shared/durable state across instances** (e.g. filing a
grievance from one request and seeing it after a refresh that hits a different
instance), deploy the free Supabase Postgres tier and set these environment
variables in Vercel:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Then run the schema in `supabase-schema.sql` against your Supabase database
(Supabase → SQL Editor → New query). No code changes are required beyond the
store layer already included in this repo.

**Cross-instance consistency:** When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
are set, every read and write goes to Supabase Postgres, so data is immediately
visible to all Vercel instances. When they are unset, the app falls back to
the local JSON file store (works for local development and single-instance demos).
- Supervisor: `sup@gov.in`

Seed data includes 3 completed sample cases (full clean chains, pre-anchored) and
leaves the live-file flow open.

---

## Tamper-detection demo (end-to-end)

1. **Citizen** (`priya.sharma@example.com`) → *My grievances* → *File a new
   grievance* ("Water tanker hasn't arrived in 3 weeks", Ward 12). Confirmation
   email lands in `/inbox`. Location auto-tags via Nominatim.
2. **Officer** (`ravik@water.gov.in`) → sees it in the queue → **Assign** to self.
   The event appears instantly in the citizen's timeline (open both side by side).
3. Officer **Escalate** to another department with a reason → event appears.
4. Second officer **Close** with a reason → event appears. Anchor fires; the
   *Anchored ✅* indicator gets a clickable "Verify externally →" link.
5. **Citizen** view shows **✅ VERIFIED** with the full timeline + anchor link.
6. Open the hidden **`/admin/raw-edit`** route (not in any navigation), pick the
   case, pick event #4 (Closed), and change the closure reason — this writes
   directly to the DB, bypassing the event chain (simulating an attacker).
7. Refresh the citizen timeline → it now shows **🚨 INTEGRITY BREACH** on event
   #4, specifying `Failed check: payload_hash` and the two mismatched hashes.
8. **Supervisor** (`sup@gov.in`) dashboard lists the same case at the top under
   **"Cases needing audit"**.

---

## Project layout

```
src/lib/        crypto.ts (chain+verify) · anchoring.ts · email.ts · geocode.ts
                store.ts / db.ts (SQLite) · seed.ts · session.ts · caseService.ts
src/app/        citizen/ officer/ supervisor/  (role areas + layouts)
                admin/raw-edit/  (hidden demo tamper panel)
                verify-anchor/[id]/  inbox/  login/  api/...
src/components/ Timeline · IntegrityBadge · AnchorIndicator · TopBar ·
                FileGrievanceForm · OfficerActions · RawEditForm · HowItWorks
```

## Out of scope (per brief)

Real PKI/certificates, wallets, mobile app, multi-language, SMS, payment logic,
and any "blockchain" terminology in citizen/officer UI.
