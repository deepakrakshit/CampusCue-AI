import { z } from 'zod';
import { SessionEventSchema } from './events.js';

export const ClientAudioChunkSchema = z.object({
  type: z.literal('audio.chunk'),
  audioBase64: z.string(),
  timestamp: z.number().optional(),
});

export const ClientInterruptionSchema = z.object({
  type: z.literal('student.interruption'),
  generationEpoch: z.number().optional(),
  timestamp: z.number().optional(),
});

export const ClientSpeechStartedSchema = z.object({
  type: z.literal('student.speech_started'),
});

export const ClientTurnStartSchema = z.object({
  type: z.literal('student.turn_start'),
});

export const ClientSpeechStoppedSchema = z.object({
  type: z.literal('student.speech_stopped'),
  text: z.string().optional(),
});

export const ClientTurnEndSchema = z.object({
  type: z.literal('student.turn_end'),
  text: z.string().optional(),
});

export const ClientStartRequestedSchema = z.object({
  type: z.literal('session.start_requested'),
});

export const ClientEndRequestedSchema = z.object({
  type: z.literal('session.end_requested'),
  reason: z.enum(['user-ended', 'deadline', 'provider-error']).optional().default('user-ended'),
});

export const ClientSessionEndSchema = z.object({
  type: z.literal('session.end'),
  reason: z.enum(['user-ended', 'deadline', 'provider-error']).optional().default('user-ended'),
});

export const ClientPingSchema = z.object({
  type: z.literal('client.ping'),
  timestamp: z.number(),
});

export const ClientShortPingSchema = z.object({
  type: z.literal('ping'),
  timestamp: z.number().optional(),
});

export const ClientTranscriptTextSchema = z.object({
  type: z.literal('transcript.student_text'),
  text: z.string(),
});

export const ClientMessageSchema = z.discriminatedUnion('type', [
  ClientAudioChunkSchema,
  ClientInterruptionSchema,
  ClientSpeechStartedSchema,
  ClientTurnStartSchema,
  ClientSpeechStoppedSchema,
  ClientTurnEndSchema,
  ClientStartRequestedSchema,
  ClientEndRequestedSchema,
  ClientSessionEndSchema,
  ClientPingSchema,
  ClientShortPingSchema,
  ClientTranscriptTextSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export type ServerMessage =
  | {
      type: 'server.connected';
      sessionId: string;
      sequence: number;
      generationEpoch: number;
    }
  | {
      type: 'session.state_changed';
      status: string;
      speakerLock: string;
      activeSpeakerId: string | null;
      generationEpoch: number;
    }
  | {
      type: 'agent.state_changed';
      agentId: string;
      status: string;
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
      event: z.infer<typeof SessionEventSchema>;
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
