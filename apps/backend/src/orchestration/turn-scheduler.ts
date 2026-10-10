import type { SpeakerLock, SessionRecord } from '../types/session.js';

export interface TurnSchedulerOptions {
  sessionId: string;
  mode: 'gd' | 'interview';
  onScheduleSpeaker: (speakerId: string, speakerLabel: string) => Promise<void>;
}

export class TurnScheduler {
  readonly sessionId: string;
  readonly mode: 'gd' | 'interview';
  private speakerLock: SpeakerLock = 'idle';
  private activeSpeakerId: string | null = null;
  private currentTurnId: string | null = null;
  private activeGenerationEpoch = 0;
  private onScheduleSpeaker: (speakerId: string, speakerLabel: string) => Promise<void>;

  // GD turn queue management
  private candidateQueue: Array<{ id: string; label: string }> = [
    { id: 'agent_a', label: 'Priya Sharma' },
    { id: 'agent_b', label: 'Rohan Mehta' },
    { id: 'agent_c', label: 'Ananya Iyer' },
    { id: 'agent_d', label: 'Vikram Patel' },
  ];
  private nextCandidateIndex = 0;
  private isClosing = false;

  constructor(options: TurnSchedulerOptions) {
    this.sessionId = options.sessionId;
    this.mode = options.mode;
    this.onScheduleSpeaker = options.onScheduleSpeaker;
  }

  getSpeakerLock(): SpeakerLock {
    return this.speakerLock;
  }

  getActiveSpeakerId(): string | null {
    return this.activeSpeakerId;
  }

  getCurrentTurnId(): string | null {
    return this.currentTurnId;
  }

  getActiveGenerationEpoch(): number {
    return this.activeGenerationEpoch;
  }

  setGenerationEpoch(epoch: number): void {
    this.activeGenerationEpoch = epoch;
  }

  /**
   * Acquire speaker lock for an AI speaker
   */
  acquireAiLock(speakerId: string, speakerLabel: string, turnId: string, epoch: number): boolean {
    if (this.speakerLock !== 'idle') {
      // Single speaker invariant: never allow concurrent speaker overlap
      return false;
    }
    this.speakerLock = 'ai-speaking';
    this.activeSpeakerId = speakerId;
    this.currentTurnId = turnId;
    this.activeGenerationEpoch = epoch;
    return true;
  }

  /**
   * Student barge-in: immediately preempt any AI speaker and lock to student
   */
  handleStudentBargeIn(newEpoch: number): {
    interruptedSpeakerId: string | null;
    wasAiSpeaking: boolean;
  } {
    const wasAiSpeaking = this.speakerLock === 'ai-speaking';
    const interruptedSpeakerId = this.activeSpeakerId;

    this.speakerLock = 'student-speaking';
    this.activeSpeakerId = 'student';
    this.currentTurnId = null;
    this.activeGenerationEpoch = newEpoch;

    return { interruptedSpeakerId, wasAiSpeaking };
  }

  /**
   * Release speaker lock and return to idle
   */
  releaseLock(): void {
    this.speakerLock = 'idle';
    this.activeSpeakerId = null;
    this.currentTurnId = null;
  }

  /**
   * Schedule the next AI speaker when idle
   */
  async triggerNextTurn(): Promise<void> {
    if (this.speakerLock !== 'idle' || this.isClosing) {
      return;
    }

    if (this.mode === 'interview') {
      await this.onScheduleSpeaker('interviewer', 'Arjun Das');
      return;
    }

    // Round-robin selection across the 4 distinct GD participants
    const candidate = this.candidateQueue[this.nextCandidateIndex];
    this.nextCandidateIndex = (this.nextCandidateIndex + 1) % this.candidateQueue.length;

    await this.onScheduleSpeaker(candidate.id, candidate.label);
  }

  startClosing(): void {
    this.isClosing = true;
    this.speakerLock = 'closing';
  }
}
