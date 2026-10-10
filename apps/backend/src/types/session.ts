import { z } from 'zod';

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

export interface SessionRecord {
  id: string;
  mode: SessionMode;
  status: SessionStatus;
  owner_token_hash: string;
  topic: string | null;
  config_json: string;
  started_at: string | null;
  deadline_at: string | null;
  ended_at: string | null;
  next_sequence: number;
  active_speaker_id: string | null;
  speaker_lock: SpeakerLock;
  generation_epoch: number;
  last_error_code: string | null;
  report_status: ReportStatus;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

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

export const CreateGdSessionSchema = z.object({
  mode: z.literal('gd'),
  topic: z.string().min(1).max(300),
  durationSeconds: z.number().int().min(60).max(600).default(300),
  language: z.enum(['en-IN', 'en-US', 'hi-IN', 'hinglish']).default('en-IN'),
  panelSize: z.literal(4).default(4),
  interview: z.null().optional(),
});

export const CreateInterviewSessionSchema = z.object({
  mode: z.literal('interview'),
  topic: z.null().optional(),
  durationSeconds: z.number().int().min(60).max(600).default(300),
  language: z.enum(['en-IN', 'en-US', 'hi-IN', 'hinglish']).default('en-IN'),
  panelSize: z.literal(1).default(1),
  interview: z.object({
    targetRole: z.string().min(2).max(120),
    seniority: z.string().max(80).default('student-entry-level'),
    projectDescription: z.string().max(10000).nullable().optional(),
    resumeText: z.string().max(20000).nullable().optional(),
    githubUrl: z.string().url().nullable().optional(),
  }),
});

export const CreateSessionSchema = z.discriminatedUnion('mode', [
  CreateGdSessionSchema,
  CreateInterviewSessionSchema,
]);

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
