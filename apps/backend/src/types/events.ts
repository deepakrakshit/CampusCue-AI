import { z } from 'zod';

export type EventKind =
  | 'transcript'
  | 'state_change'
  | 'interruption'
  | 'moderator'
  | 'provider_status'
  | 'system_note';

export type SpeakerId =
  | 'student'
  | 'moderator'
  | 'agent_a'
  | 'agent_b'
  | 'agent_c'
  | 'agent_d'
  | 'interviewer'
  | 'system';

export interface SessionEvent {
  eventId: string;
  sessionId: string;
  sequence: number;
  turnId: string | null;
  kind: EventKind;
  speakerId: SpeakerId;
  speakerLabel: string;
  text: string | null;
  source: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export const SessionEventSchema = z.object({
  eventId: z.string(),
  sessionId: z.string(),
  sequence: z.number().int().min(1),
  turnId: z.string().nullable(),
  kind: z.enum([
    'transcript',
    'state_change',
    'interruption',
    'moderator',
    'provider_status',
    'system_note',
  ]),
  speakerId: z.string(),
  speakerLabel: z.string(),
  text: z.string().nullable(),
  source: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).default({}),
});
