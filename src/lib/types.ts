export type ActorRole = "CITIZEN" | "OFFICER" | "SUPERVISOR";

export type GrievanceAction =
  | "FILED"
  | "ASSIGNED"
  | "ESCALATED"
  | "RESPONDED"
  | "CLOSED";

export interface Actor {
  id: string;
  name: string;
  role: ActorRole;
  department: string | null;
  email: string;
  secretKey: string;
}

export interface GrievanceEvent {
  event_id: string;
  case_id: string;
  sequence_number: number;
  prev_event_hash: string;
  action: GrievanceAction;
  actor_id: string;
  actor_role: ActorRole;
  timestamp: string;
  payload: unknown;
  payload_hash: string;
  signature: string;
  event_hash: string;
}

export interface GrievanceCase {
  case_id: string;
  citizen_id: string;
  title: string;
  category: string;
  description: string;
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  department: string;
  status: GrievanceAction;
  created_at: string;
}

export interface Anchor {
  anchor_id: string;
  root_hash: string;
  external_reference: string;
  method: string;
  anchored_at: string;
  events_covered: string[];
}

export interface VerificationCheck {
  name: "payload_hash" | "event_hash" | "chain_link" | "signature";
  ok: boolean;
  detail: string;
}

export interface VerifiedEvent extends GrievanceEvent {
  checks: VerificationCheck[];
  ok: boolean;
}

export interface VerificationResult {
  status: "VERIFIED" | "INTEGRITY_BREACH";
  events: VerifiedEvent[];
}

export const GENESIS = "GENESIS";
