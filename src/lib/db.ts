import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  const { ensureSeeded } = require("./seed") as typeof import("./seed");
  ensureSeeded();
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS actors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      email TEXT NOT NULL,
      secret_key TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cases (
      case_id TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      location_text TEXT,
      lat REAL,
      lng REAL,
      department TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (citizen_id) REFERENCES actors(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      prev_event_hash TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      payload TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      signature TEXT NOT NULL,
      event_hash TEXT NOT NULL,
      UNIQUE (case_id, sequence_number),
      FOREIGN KEY (case_id) REFERENCES cases(case_id)
    );

    CREATE TABLE IF NOT EXISTS anchors (
      anchor_id TEXT PRIMARY KEY,
      root_hash TEXT NOT NULL,
      external_reference TEXT NOT NULL,
      method TEXT NOT NULL,
      anchored_at TEXT NOT NULL,
      events_covered TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS demo_inbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      case_id TEXT,
      created_at TEXT NOT NULL
    );
  `);
}
