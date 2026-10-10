import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './database.js';
import { SessionRepository } from './session-repository.js';
import type { SessionEvent, EventKind, SpeakerId } from '../types/events.js';

export interface AppendEventInput {
  sessionId: string;
  eventId?: string;
  turnId?: string | null;
  kind: EventKind;
  speakerId: SpeakerId;
  speakerLabel: string;
  text?: string | null;
  source?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export class EventRepository {
  private db: DatabaseSync;
  private sessionRepo: SessionRepository;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
    this.sessionRepo = new SessionRepository(this.db);
  }

  appendEvent(input: AppendEventInput): SessionEvent {
    const eventId = input.eventId || randomUUID();
    const now = new Date().toISOString();

    // Check if event already exists (deduplication)
    const existing = this.getEventBySessionAndEventId(input.sessionId, eventId);
    if (existing) {
      return existing;
    }

    const sequence = this.sessionRepo.allocateNextSequence(input.sessionId);
    const id = randomUUID();
    const metadataJson = JSON.stringify(input.metadata || {});

    const stmt = this.db.prepare(`
      INSERT INTO session_events (
        id, session_id, event_id, sequence, turn_id, kind,
        speaker_id, speaker_label, text, source,
        started_at, ended_at, metadata_json, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      input.sessionId,
      eventId,
      sequence,
      input.turnId ?? null,
      input.kind,
      input.speakerId,
      input.speakerLabel,
      input.text ?? null,
      input.source ?? null,
      input.startedAt ?? null,
      input.endedAt ?? null,
      metadataJson,
      now
    );

    return {
      eventId,
      sessionId: input.sessionId,
      sequence,
      turnId: input.turnId ?? null,
      kind: input.kind,
      speakerId: input.speakerId,
      speakerLabel: input.speakerLabel,
      text: input.text ?? null,
      source: input.source ?? null,
      startedAt: input.startedAt ?? null,
      endedAt: input.endedAt ?? null,
      createdAt: now,
      metadata: input.metadata || {},
    };
  }

  getEventBySessionAndEventId(sessionId: string, eventId: string): SessionEvent | null {
    const stmt = this.db.prepare(`
      SELECT * FROM session_events WHERE session_id = ? AND event_id = ?
    `);
    const row = stmt.get(sessionId, eventId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToEvent(row);
  }

  getEventsAfterSequence(
    sessionId: string,
    afterSequence: number = 0,
    limit: number = 100
  ): { events: SessionEvent[]; lastSequence: number; hasMore: boolean } {
    const boundedLimit = Math.min(Math.max(1, limit), 200);
    const stmt = this.db.prepare(`
      SELECT * FROM session_events
      WHERE session_id = ? AND sequence > ?
      ORDER BY sequence ASC
      LIMIT ?
    `);

    const rows = stmt.all(sessionId, afterSequence, boundedLimit + 1) as Record<string, unknown>[];
    const hasMore = rows.length > boundedLimit;
    const resultRows = hasMore ? rows.slice(0, boundedLimit) : rows;

    const events = resultRows.map((r) => this.mapRowToEvent(r));
    const lastSequence = events.length > 0 ? events[events.length - 1].sequence : afterSequence;

    return { events, lastSequence, hasMore };
  }

  getAllTranscriptEvents(sessionId: string): SessionEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM session_events
      WHERE session_id = ? AND kind = 'transcript' AND text IS NOT NULL
      ORDER BY sequence ASC
    `);
    const rows = stmt.all(sessionId) as Record<string, unknown>[];
    return rows.map((r) => this.mapRowToEvent(r));
  }

  getAllEvents(sessionId: string): SessionEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM session_events
      WHERE session_id = ?
      ORDER BY sequence ASC
    `);
    const rows = stmt.all(sessionId) as Record<string, unknown>[];
    return rows.map((r) => this.mapRowToEvent(r));
  }

  getLastEvent(sessionId: string): SessionEvent | null {
    const stmt = this.db.prepare(`
      SELECT * FROM session_events
      WHERE session_id = ? AND text IS NOT NULL AND trim(text) != ''
      ORDER BY sequence DESC
      LIMIT 1
    `);
    const row = stmt.get(sessionId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToEvent(row);
  }

  private mapRowToEvent(row: Record<string, unknown>): SessionEvent {
    let metadata: Record<string, unknown> = {};
    try {
      if (row.metadata_json) {
        metadata = JSON.parse(String(row.metadata_json));
      }
    } catch {
      // ignore
    }

    return {
      eventId: String(row.event_id),
      sessionId: String(row.session_id),
      sequence: Number(row.sequence),
      turnId: row.turn_id ? String(row.turn_id) : null,
      kind: row.kind as EventKind,
      speakerId: row.speaker_id as SpeakerId,
      speakerLabel: String(row.speaker_label),
      text: row.text ? String(row.text) : null,
      source: row.source ? String(row.source) : null,
      startedAt: row.started_at ? String(row.started_at) : null,
      endedAt: row.ended_at ? String(row.ended_at) : null,
      createdAt: String(row.created_at),
      metadata,
    };
  }
}
