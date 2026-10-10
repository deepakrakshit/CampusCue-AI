import { describe, it, expect } from 'vitest';
import { EvaluatorService } from '../src/services/evaluator-service.js';
import type { SessionEvent } from '../src/types/events.js';

describe('Zero Hallucinated Quotes & Evidence Verification', () => {
  const evaluator = new EvaluatorService();

  const mockEvents: SessionEvent[] = [
    {
      eventId: 'evt-101',
      sessionId: 'sess-1',
      sequence: 1,
      turnId: 't-1',
      kind: 'transcript',
      speakerId: 'student',
      speakerLabel: 'Candidate',
      text: 'I suggest we adopt microservices for the payment gateway to isolate failure domains.',
      source: 'live-input-transcription',
      startedAt: null,
      endedAt: null,
      createdAt: '2026-10-10T10:00:00Z',
      metadata: {},
    },
    {
      eventId: 'evt-102',
      sessionId: 'sess-1',
      sequence: 2,
      turnId: 't-2',
      kind: 'transcript',
      speakerId: 'agent_b',
      speakerLabel: 'Rohan Mehta',
      text: 'However, microservices introduce distributed tracing complexity.',
      source: 'live-output-transcription',
      startedAt: null,
      endedAt: null,
      createdAt: '2026-10-10T10:00:10Z',
      metadata: {},
    },
  ];

  it('verifies exact substring quotations and rejects fabricated quotes', () => {
    const rawModelOutput = {
      overallSummary: 'Good technical discussion on microservices architecture.',
      criteria: [
        {
          criterionId: 'idea_quality',
          score: 4,
          summary: 'Proactively addressed fault tolerance.',
          evidence: [
            {
              eventId: 'evt-101',
              quote: 'adopt microservices for the payment gateway',
              reasoning: 'Demonstrated fault isolation awareness.',
            },
            {
              // Fake quote not present in transcript -> MUST BE REJECTED
              eventId: 'evt-101',
              quote: 'we should build a Kubernetes cluster on AWS immediately',
              reasoning: 'Hallucinated quotation.',
            },
            {
              // Non-existent eventId -> MUST BE REJECTED
              eventId: 'evt-999',
              quote: 'some imaginary words',
              reasoning: 'Fake event reference.',
            },
          ],
          suggestions: ['Deepen understanding of network partition fallbacks.'],
        },
      ],
      overallAdvice: ['Practice concise architecture summaries.'],
    };

    const metrics = {
      totalTurns: 2,
      studentTurns: 1,
      totalWords: 18,
      studentWords: 12,
      studentWordSharePct: 66.7,
      aiInterruptionCount: 0,
      discussionDurationSeconds: 10,
      speakerWordCounts: { student: 12, agent_b: 6 },
      speakerTurnCounts: { student: 1, agent_b: 1 },
    };

    const report = (evaluator as any).verifyAndAssembleReport(
      'sess-1',
      'gd',
      metrics,
      mockEvents,
      rawModelOutput
    );

    expect(report.criteria.length).toBe(1);
    const crit = report.criteria[0];
    expect(crit.score).toBe(4);
    // Only the exact verified quote remains; the other two were dropped
    expect(crit.evidence.length).toBe(1);
    expect(crit.evidence[0].quote).toBe('adopt microservices for the payment gateway');
    expect(crit.insufficientEvidence).toBe(false);
  });

  it('marks insufficientEvidence if all model quotes were invalid', () => {
    const rawModelOutput = {
      overallSummary: 'Summary with bogus evidence',
      criteria: [
        {
          criterionId: 'building_on_others',
          score: 5,
          summary: 'Great collaboration',
          evidence: [
            {
              eventId: 'evt-101',
              quote: 'completely fabricated sentence that was never spoken',
              reasoning: 'Made up by LLM',
            },
          ],
          suggestions: [],
        },
      ],
      overallAdvice: [],
    };

    const metrics = {
      totalTurns: 2,
      studentTurns: 1,
      totalWords: 18,
      studentWords: 12,
      studentWordSharePct: 66.7,
      aiInterruptionCount: 0,
      discussionDurationSeconds: 10,
      speakerWordCounts: { student: 12, agent_b: 6 },
      speakerTurnCounts: { student: 1, agent_b: 1 },
    };

    const report = (evaluator as any).verifyAndAssembleReport(
      'sess-1',
      'gd',
      metrics,
      mockEvents,
      rawModelOutput
    );

    const crit = report.criteria[0];
    expect(crit.evidence.length).toBe(0);
    expect(crit.score).toBeNull(); // Score nulled when evidence is unsubstantiated
    expect(crit.insufficientEvidence).toBe(true);
  });

  it('generates truthful deterministic fallback report when evaluation fails', () => {
    const metrics = {
      totalTurns: 2,
      studentTurns: 1,
      totalWords: 18,
      studentWords: 12,
      studentWordSharePct: 66.7,
      aiInterruptionCount: 0,
      discussionDurationSeconds: 10,
      speakerWordCounts: { student: 12, agent_b: 6 },
      speakerTurnCounts: { student: 1, agent_b: 1 },
    };

    const fallbackReport = evaluator.generateFallbackReport(
      'sess-1',
      'gd',
      metrics,
      mockEvents,
      'Service temporarily overloaded.'
    );

    expect(fallbackReport.status).toBe('fallback');
    expect(fallbackReport.metrics.studentWords).toBe(12);
    expect(fallbackReport.criteria[0].evidence.length).toBe(1);
    expect(fallbackReport.criteria[0].evidence[0].eventId).toBe('evt-101');
  });
});
