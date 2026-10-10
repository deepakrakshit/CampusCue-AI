import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { getDatabase, closeDatabase } from '../src/db/database.js';
import { SessionRepository } from '../src/db/session-repository.js';
import { EventRepository } from '../src/db/event-repository.js';
import { generateSessionCapability } from '../src/services/auth-service.js';

describe('Session & Canonical Event Repositories', () => {
  let db: DatabaseSync;
  let sessionRepo: SessionRepository;
  let eventRepo: EventRepository;

  beforeEach(() => {
    db = getDatabase(':memory:');
    sessionRepo = new SessionRepository(db);
    eventRepo = new EventRepository(db);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {
      // ignore
    }
  });

  it('creates and snapshots a GD session', () => {
    const { tokenHash } = generateSessionCapability();
    const session = sessionRepo.createSession(
      {
        mode: 'gd',
        topic: 'AI in Healthcare: Opportunities and Risks',
        durationSeconds: 300,
        language: 'en-IN',
        panelSize: 4,
      },
      tokenHash
    );

    expect(session.id).toBeDefined();
    expect(session.mode).toBe('gd');
    expect(session.status).toBe('created');
    expect(session.topic).toBe('AI in Healthcare: Opportunities and Risks');

    const snapshot = sessionRepo.toSnapshot(session);
    expect(snapshot.sessionId).toBe(session.id);
    expect(snapshot.protocolVersion).toBe(1);
    expect(snapshot.speakerLock).toBe('idle');
  });

  it('allocates strictly increasing sequences and prevents duplicate event IDs', () => {
    const { tokenHash } = generateSessionCapability();
    const session = sessionRepo.createSession(
      {
        mode: 'gd',
        topic: 'Renewable Energy Adoption',
        durationSeconds: 180,
        language: 'en-IN',
        panelSize: 4,
      },
      tokenHash
    );

    // Append first event
    const evt1 = eventRepo.appendEvent({
      sessionId: session.id,
      eventId: 'evt-1',
      kind: 'transcript',
      speakerId: 'student',
      speakerLabel: 'Candidate',
      text: 'Hello everyone, I believe solar adoption needs distributed microgrids.',
    });
    expect(evt1.sequence).toBe(1);

    // Append second event
    const evt2 = eventRepo.appendEvent({
      sessionId: session.id,
      eventId: 'evt-2',
      kind: 'transcript',
      speakerId: 'agent_a',
      speakerLabel: 'Priya Sharma',
      text: 'Analyzing the capital cost, grid parity is improving.',
    });
    expect(evt2.sequence).toBe(2);

    // Deduplication check: submitting evt-1 again should return the existing record without incrementing sequence
    const duplicate = eventRepo.appendEvent({
      sessionId: session.id,
      eventId: 'evt-1',
      kind: 'transcript',
      speakerId: 'student',
      speakerLabel: 'Candidate',
      text: 'Hello everyone, I believe solar adoption needs distributed microgrids.',
    });
    expect(duplicate.sequence).toBe(1);

    // Query events afterSequence
    const res = eventRepo.getEventsAfterSequence(session.id, 0, 10);
    expect(res.events.length).toBe(2);
    expect(res.events[0].sequence).toBe(1);
    expect(res.events[1].sequence).toBe(2);
    expect(res.lastSequence).toBe(2);
    expect(res.hasMore).toBe(false);
  });

  it('increments generation epoch correctly', () => {
    const { tokenHash } = generateSessionCapability();
    const session = sessionRepo.createSession(
      {
        mode: 'gd',
        topic: 'Test Topic',
        durationSeconds: 300,
        language: 'en-IN',
        panelSize: 4,
      },
      tokenHash
    );

    expect(session.generation_epoch).toBe(0);

    const epoch1 = sessionRepo.incrementGenerationEpoch(session.id);
    expect(epoch1).toBe(1);

    const epoch2 = sessionRepo.incrementGenerationEpoch(session.id);
    expect(epoch2).toBe(2);
  });
});
