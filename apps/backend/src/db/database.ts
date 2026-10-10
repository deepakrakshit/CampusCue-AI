import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { getEnv } from '../config/env.js';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) return dbInstance;

  const env = getEnv();
  const dbPath = customPath || env.DATABASE_PATH;
  
  if (dbPath !== ':memory:') {
    const dir = resolve(dbPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  
  // Set busy timeout so concurrent processes/threads wait for file lock instead of throwing instantly
  db.exec('PRAGMA busy_timeout = 5000;');
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  
  if (dbPath !== ':memory:') {
    try {
      db.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // WAL pragma might fail if another process is concurrently initializing; safe to proceed
    }
  }

  initSchema(db);

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      owner_token_hash TEXT NOT NULL,
      topic TEXT,
      config_json TEXT NOT NULL,
      started_at TEXT,
      deadline_at TEXT,
      ended_at TEXT,
      next_sequence INTEGER NOT NULL DEFAULT 1,
      active_speaker_id TEXT,
      speaker_lock TEXT NOT NULL DEFAULT 'idle',
      generation_epoch INTEGER NOT NULL DEFAULT 0,
      last_error_code TEXT,
      report_status TEXT NOT NULL DEFAULT 'not_requested',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      turn_id TEXT,
      kind TEXT NOT NULL,
      speaker_id TEXT NOT NULL,
      speaker_label TEXT NOT NULL,
      text TEXT,
      source TEXT,
      started_at TEXT,
      ended_at TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE(session_id, event_id),
      UNIQUE(session_id, sequence)
    );

    CREATE INDEX IF NOT EXISTS idx_session_events_seq ON session_events(session_id, sequence);

    CREATE TABLE IF NOT EXISTS agent_session_states (
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      model_id TEXT NOT NULL,
      last_synced_sequence INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'not_started',
      generation_epoch INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(session_id, agent_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL,
      rubric_version TEXT NOT NULL,
      evaluator_provider TEXT,
      evaluator_model_id TEXT,
      metrics_json TEXT NOT NULL,
      assessment_json TEXT NOT NULL,
      validation_json TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
  `);
}
