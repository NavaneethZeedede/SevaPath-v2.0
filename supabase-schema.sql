-- Supabase schema for SevaPath cross-instance store

create table if not exists actors (
  id text primary key,
  name text not null,
  role text not null,
  department text,
  email text not null,
  secret_key text not null
);

create table if not exists cases (
  case_id text primary key,
  citizen_id text not null references actors(id),
  title text not null,
  category text not null default 'General',
  description text not null,
  location_text text,
  lat double precision,
  lng double precision,
  department text not null default 'Water Dept',
  status text not null default 'FILED',
  created_at text not null
);

create table if not exists events (
  event_id text primary key,
  case_id text not null references cases(case_id),
  sequence_number integer not null,
  prev_event_hash text not null,
  action text not null,
  actor_id text not null references actors(id),
  actor_role text not null,
  timestamp text not null,
  payload jsonb not null,
  payload_hash text not null,
  signature text not null,
  event_hash text not null
);

create table if not exists anchors (
  anchor_id text primary key,
  root_hash text not null,
  external_reference text not null,
  method text not null,
  anchored_at text not null,
  events_covered text[] not null
);

create table if not exists inbox (
  id integer primary key generated always as identity,
  to_email text not null,
  subject text not null,
  body text not null,
  case_id text references cases(case_id),
  created_at text not null
);

create index if not exists idx_events_case_id on events(case_id);
create index if not exists idx_anchors_case_id on anchors using gin(events_covered);
