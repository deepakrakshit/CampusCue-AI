import { z } from 'zod';

export const ReportEvidenceSchema = z.object({
  eventId: z.string(),
  quote: z.string().max(1000),
  reasoning: z.string().max(2000),
});

export type ReportEvidence = z.infer<typeof ReportEvidenceSchema>;

export const ReportCriterionSchema = z.object({
  criterionId: z.string(),
  score: z.number().int().min(1).max(5).nullable(),
  summary: z.string().max(2000),
  evidence: z.array(ReportEvidenceSchema),
  suggestions: z.array(z.string().max(500)).max(5),
  insufficientEvidence: z.boolean(),
});

export type ReportCriterion = z.infer<typeof ReportCriterionSchema>;

export const ReportSchema = z.object({
  reportId: z.string(),
  sessionId: z.string(),
  status: z.enum(['ready', 'fallback', 'pending', 'failed']),
  schemaVersion: z.literal('placement-arena-report.v1').default('placement-arena-report.v1'),
  rubricVersion: z.string(),
  evaluatorModelId: z.string().nullable(),
  metrics: z.record(z.union([z.number(), z.string(), z.boolean(), z.null()])),
  overallSummary: z.string().max(3000),
  criteria: z.array(ReportCriterionSchema),
  overallAdvice: z.array(z.string().max(500)).max(10),
  limitations: z.array(z.string().max(500)).optional().default([]),
  createdAt: z.string(),
});

export type Report = z.infer<typeof ReportSchema>;

export interface DeterministicMetrics {
  totalTurns: number;
  studentTurns: number;
  totalWords: number;
  studentWords: number;
  studentWordSharePct: number;
  aiInterruptionCount: number;
  discussionDurationSeconds: number;
  speakerWordCounts: Record<string, number>;
  speakerTurnCounts: Record<string, number>;
}
