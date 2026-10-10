import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../src/db/database.js';
import { SessionRepository } from '../src/db/session-repository.js';
import { EventRepository } from '../src/db/event-repository.js';
import { SessionOrchestrator } from '../src/orchestration/session-orchestrator.js';
import { generateSessionCapability } from '../src/services/auth-service.js';

describe('Four-Agent Group Discussion Orchestration & Interruption', () => {
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

  it('initializes four distinct agents and synchronizes canonical events', async () => {
    const { tokenHash } = generateSessionCapability();
    const session = sessionRepo.createSession(
      {
        mode: 'gd',
        topic: 'Ethics of Generative AI in Code Automation',
        durationSeconds: 300,
        language: 'en-IN',
        panelSize: 4,
      },
      tokenHash
    );

    const orchestrator = new SessionOrchestrator(session.id, db);
    const messagesReceived: any[] = [];

    orchestrator.addClient({
      send: (data: string) => messagesReceived.push(JSON.parse(data)),
      isOpen: () => true,
    });

    // Initialize mock providers
    await orchestrator.initializeProviders(true);

    // Start session
    await orchestrator.startSession();

    // Verify moderator opening was dispatched
    const events = eventRepo.getAllEvents(session.id);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].kind).toBe('moderator');
    expect(events[0].speakerId).toBe('moderator');
    expect(events[0].sequence).toBe(1);

    // Simulate student barge-in interruption
    await orchestrator.handleStudentBargeIn();

    const freshSession = sessionRepo.getSessionById(session.id)!;
    expect(freshSession.generation_epoch).toBe(1);
    expect(freshSession.speaker_lock).toBe('student-speaking');

    // Simulate student speech committed
    await orchestrator.handleStudentSpeechStopped('I believe developer agency and security audits must remain human-verified.');

    const eventsAfterSpeech = eventRepo.getAllEvents(session.id);
    const studentEvent = eventsAfterSpeech.find((e) => e.speakerId === 'student' && e.kind === 'transcript');
    expect(studentEvent).toBeDefined();
    expect(studentEvent?.text).toContain('developer agency');

    // End session
    await orchestrator.endSession('user-ended');
    const finalSession = sessionRepo.getSessionById(session.id)!;
    expect(finalSession.status).toBe('completed');
    expect(finalSession.report_status).toBe('fallback'); // deterministic fallback in mock/test mode without API key
  });

  it('buffers student PCM audio chunks and transcribes them when speech completes without browser text', async () => {
    const { tokenHash } = generateSessionCapability();
    const session = sessionRepo.createSession(
      {
        mode: 'gd',
        topic: 'AI and Job Automation',
        durationSeconds: 300,
        language: 'en-IN',
        panelSize: 4,
      },
      tokenHash
    );

    const orchestrator = new SessionOrchestrator(session.id, db);
    await orchestrator.initializeProviders(true);
    await orchestrator.startSession();

    // Student claims floor
    await orchestrator.handleStudentSpeechStarted();

    // Send 16kHz PCM audio chunk (1 second of audio)
    const dummyPcm = Buffer.alloc(16000 * 2, 0x12);
    orchestrator.handleStudentAudioChunk(dummyPcm.toString('base64'));

    // Student speech stops with empty text (browser STT unavailable or silent)
    await orchestrator.handleStudentSpeechStopped('');

    // Verify transcript event was created from backend audio transcription fallback
    const events = eventRepo.getAllEvents(session.id);
    const audioTranscript = events.find((e) => e.speakerId === 'student' && e.kind === 'transcript');
    expect(audioTranscript).toBeDefined();
    expect(audioTranscript?.source).toBe('backend-audio-transcription');
    expect(audioTranscript?.text).toBeTruthy();

    await orchestrator.endSession('user-ended');
  });
});
