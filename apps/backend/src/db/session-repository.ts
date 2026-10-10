import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './database.js';
import type {
  CreateSessionInput,
  SessionRecord,
  SessionSnapshot,
  SessionStatus,
  SpeakerLock,
  ReportStatus,
} from '../types/session.js';

export class SessionRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  createSession(input: CreateSessionInput, ownerTokenHash: string): SessionRecord {
    const id = randomUUID();
    const now = new Date().toISOString();
    // Default 1-hour expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const topic = input.mode === 'gd' ? input.topic : (input.interview.targetRole ?? 'Technical Interview');
    const configJson = JSON.stringify(input);

    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, mode, status, owner_token_hash, topic, config_json,
        started_at, deadline_at, ended_at, next_sequence,
        active_speaker_id, speaker_lock, generation_epoch,
        last_error_code, report_status, created_at, updated_at, expires_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        NULL, NULL, NULL, 1,
        NULL, 'idle', 0,
        NULL, 'not_requested', ?, ?, ?
      )
    `);

    stmt.run(
      id,
      input.mode,
      'created',
      ownerTokenHash,
      topic,
      configJson,
      now,
      now,
      expiresAt
    );

    const created = this.getSessionById(id);
    if (!created) {
      throw new Error(`Failed to retrieve newly created session: ${id}`);
    }
    return created;
  }

  getSessionById(sessionId: string): SessionRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM sessions WHERE id = ?`);
    const row = stmt.get(sessionId) as Record<string, unknown> | undefined;
    if (!row) return null;

    return {
      id: String(row.id),
      mode: row.mode as SessionRecord['mode'],
      status: row.status as SessionStatus,
      owner_token_hash: String(row.owner_token_hash),
      topic: row.topic ? String(row.topic) : null,
      config_json: String(row.config_json),
      started_at: row.started_at ? String(row.started_at) : null,
      deadline_at: row.deadline_at ? String(row.deadline_at) : null,
      ended_at: row.ended_at ? String(row.ended_at) : null,
      next_sequence: Number(row.next_sequence),
      active_speaker_id: row.active_speaker_id ? String(row.active_speaker_id) : null,
      speaker_lock: row.speaker_lock as SpeakerLock,
      generation_epoch: Number(row.generation_epoch),
      last_error_code: row.last_error_code ? String(row.last_error_code) : null,
      report_status: row.report_status as ReportStatus,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      expires_at: String(row.expires_at),
    };
  }

  updateSessionStatus(
    sessionId: string,
    status: SessionStatus,
    updates?: Partial<SessionRecord>
  ): void {
    const now = new Date().toISOString();
    const sets = ['status = ?', 'updated_at = ?'];
    const values: (string | number | null)[] = [status, now];

    if (updates?.started_at !== undefined) {
      sets.push('started_at = ?');
      values.push(updates.started_at ?? null);
    }
    if (updates?.deadline_at !== undefined) {
      sets.push('deadline_at = ?');
      values.push(updates.deadline_at ?? null);
    }
    if (updates?.ended_at !== undefined) {
      sets.push('ended_at = ?');
      values.push(updates.ended_at ?? null);
    }
    if (updates?.active_speaker_id !== undefined) {
      sets.push('active_speaker_id = ?');
      values.push(updates.active_speaker_id ?? null);
    }
    if (updates?.speaker_lock !== undefined) {
      sets.push('speaker_lock = ?');
      values.push(updates.speaker_lock ?? null);
    }
    if (updates?.report_status !== undefined) {
      sets.push('report_status = ?');
      values.push(updates.report_status ?? null);
    }
    if (updates?.last_error_code !== undefined) {
      sets.push('last_error_code = ?');
      values.push(updates.last_error_code ?? null);
    }

    values.push(sessionId);
    const sql = `UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`;
    this.db.prepare(sql).run(...values);
  }

  updateSpeakerLock(
    sessionId: string,
    speakerLock: SpeakerLock,
    activeSpeakerId: string | null
  ): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        UPDATE sessions
        SET speaker_lock = ?, active_speaker_id = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(speakerLock, activeSpeakerId, now, sessionId);
  }

  incrementGenerationEpoch(sessionId: string): number {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        UPDATE sessions
        SET generation_epoch = generation_epoch + 1, updated_at = ?
        WHERE id = ?
      `)
      .run(now, sessionId);

    const session = this.getSessionById(sessionId);
    return session?.generation_epoch ?? 0;
  }

  allocateNextSequence(sessionId: string): number {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db
        .prepare(`SELECT next_sequence FROM sessions WHERE id = ?`)
        .get(sessionId) as { next_sequence: number } | undefined;

      if (!row) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const seq = Number(row.next_sequence);
      this.db
        .prepare(`UPDATE sessions SET next_sequence = next_sequence + 1 WHERE id = ?`)
        .run(sessionId);

      this.db.exec('COMMIT');
      return seq;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  deleteSession(sessionId: string): boolean {
    const res = this.db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
    return Number(res.changes) > 0;
  }

  toSnapshot(session: SessionRecord): SessionSnapshot {
    let durationSeconds = 300;
    try {
      const parsedConfig = JSON.parse(session.config_json);
      if (parsedConfig?.durationSeconds) {
        durationSeconds = parsedConfig.durationSeconds;
      }
    } catch {
      // default
    }

    return {
      sessionId: session.id,
      mode: session.mode,
      status: session.status,
      topic: session.topic,
      durationSeconds,
      startedAt: session.started_at,
      deadlineAt: session.deadline_at,
      endedAt: session.ended_at,
      activeSpeakerId: session.active_speaker_id,
      speakerLock: session.speaker_lock,
      sequence: Math.max(0, session.next_sequence - 1),
      generationEpoch: session.generation_epoch,
      protocolVersion: 1,
      reportStatus: session.report_status,
    };
  }
}
