import { describe, it, expect, vi } from 'vitest';
import { TurnScheduler } from '../src/orchestration/turn-scheduler.js';

describe('TurnScheduler & Single-Speaker Invariant', () => {
  it('enforces that exactly one AI speaker may acquire the lock', () => {
    const onSchedule = vi.fn().mockResolvedValue(undefined);
    const scheduler = new TurnScheduler({
      sessionId: 'sess-123',
      mode: 'gd',
      onScheduleSpeaker: onSchedule,
    });

    expect(scheduler.getSpeakerLock()).toBe('idle');

    // First speaker acquires lock
    const acquired1 = scheduler.acquireAiLock('agent_a', 'Priya Sharma', 'turn-1', 0);
    expect(acquired1).toBe(true);
    expect(scheduler.getSpeakerLock()).toBe('ai-speaking');
    expect(scheduler.getActiveSpeakerId()).toBe('agent_a');

    // Second speaker attempts to acquire while first is active -> MUST BE REJECTED
    const acquired2 = scheduler.acquireAiLock('agent_b', 'Rohan Mehta', 'turn-2', 0);
    expect(acquired2).toBe(false);
    expect(scheduler.getActiveSpeakerId()).toBe('agent_a');

    // Releasing lock allows new speaker
    scheduler.releaseLock();
    expect(scheduler.getSpeakerLock()).toBe('idle');

    const acquired3 = scheduler.acquireAiLock('agent_b', 'Rohan Mehta', 'turn-2', 0);
    expect(acquired3).toBe(true);
    expect(scheduler.getActiveSpeakerId()).toBe('agent_b');
  });

  it('student barge-in preempts active AI speaker and updates generation epoch', () => {
    const onSchedule = vi.fn().mockResolvedValue(undefined);
    const scheduler = new TurnScheduler({
      sessionId: 'sess-123',
      mode: 'gd',
      onScheduleSpeaker: onSchedule,
    });

    scheduler.acquireAiLock('agent_a', 'Priya Sharma', 'turn-1', 0);
    expect(scheduler.getSpeakerLock()).toBe('ai-speaking');

    // Student barges in
    const bargeInResult = scheduler.handleStudentBargeIn(1);
    expect(bargeInResult.wasAiSpeaking).toBe(true);
    expect(bargeInResult.interruptedSpeakerId).toBe('agent_a');

    expect(scheduler.getSpeakerLock()).toBe('student-speaking');
    expect(scheduler.getActiveSpeakerId()).toBe('student');
    expect(scheduler.getActiveGenerationEpoch()).toBe(1);
  });
});
