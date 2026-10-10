export type SessionMode = 'gd' | 'interview';

export type SessionStatus =
  | 'created'
  | 'preparing'
  | 'running'
  | 'closing'
  | 'report_pending'
  | 'completed'
  | 'failed'
  | 'expired';

export type SpeakerLock = 'idle' | 'ai-speaking' | 'student-speaking' | 'closing';

export type ReportStatus = 'not_requested' | 'pending' | 'ready' | 'fallback' | 'failed';

export interface SessionSnapshot {
  sessionId: string;
  mode: SessionMode;
  status: SessionStatus;
  topic: string | null;
  durationSeconds: number;
  startedAt: string | null;
  deadlineAt: string | null;
  endedAt: string | null;
  activeSpeakerId: string | null;
  speakerLock: SpeakerLock;
  sequence: number;
  generationEpoch: number;
  protocolVersion: 1;
  reportStatus: ReportStatus;
}

export interface SessionEvent {
  eventId: string;
  sessionId: string;
  sequence: number;
  turnId: string | null;
  kind: 'transcript' | 'state_change' | 'interruption' | 'moderator' | 'provider_status' | 'system_note';
  speakerId: string;
  speakerLabel: string;
  text: string | null;
  source?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ReportEvidence {
  eventId: string;
  quote: string;
  reasoning: string;
}

export interface ReportCriterion {
  criterionId: string;
  score: number | null;
  summary: string;
  evidence: ReportEvidence[];
  suggestions: string[];
  insufficientEvidence: boolean;
}

export interface Report {
  reportId: string;
  sessionId: string;
  status: 'ready' | 'fallback' | 'pending' | 'failed';
  schemaVersion: string;
  rubricVersion: string;
  evaluatorModelId: string | null;
  metrics: Record<string, number | string | boolean | null>;
  overallSummary: string;
  criteria: ReportCriterion[];
  overallAdvice: string[];
  limitations?: string[];
  createdAt: string;
}

export type ServerMessage =
  | {
      type: 'server.connected';
      sessionId: string;
      sequence: number;
      generationEpoch: number;
    }
  | {
      type: 'session.state_changed';
      status: SessionStatus;
      speakerLock: SpeakerLock;
      activeSpeakerId: string | null;
      generationEpoch: number;
    }
  | {
      type: 'speaker.turn_started';
      speakerId: string;
      speakerLabel: string;
      turnId: string;
      generationEpoch: number;
    }
  | {
      type: 'speaker.turn_completed';
      speakerId: string;
      turnId: string;
      text?: string;
    }
  | {
      type: 'audio.chunk';
      speakerId: string;
      turnId: string;
      chunkSequence: number;
      generationEpoch: number;
      audioBase64: string;
    }
  | {
      type: 'transcript.interim';
      speakerId: string;
      speakerLabel: string;
      text: string;
      turnId?: string;
    }
  | {
      type: 'transcript.final';
      event: SessionEvent;
    }
  | {
      type: 'student.interruption_detected';
      generationEpoch: number;
      interruptedSpeakerId: string | null;
    }
  | {
      type: 'session.reconnecting';
      reason: string;
    }
  | {
      type: 'report.pending';
      sessionId: string;
    }
  | {
      type: 'report.ready';
      sessionId: string;
      reportId: string;
    }
  | {
      type: 'report.failed';
      sessionId: string;
      error: string;
    }
  | {
      type: 'notice';
      level: 'info' | 'warn' | 'error';
      message: string;
    }
  | {
      type: 'pong';
      timestamp: number;
    };
