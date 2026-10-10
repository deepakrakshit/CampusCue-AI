import { randomUUID } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { getEnv, getAgentApiKey } from '../config/env.js';
import type { SessionEvent } from '../types/events.js';
import type { Report, ReportCriterion, ReportEvidence, DeterministicMetrics } from '../types/report.js';
import { calculateDeterministicMetrics } from './metrics-service.js';

export interface EvaluateSessionParams {
  sessionId: string;
  mode: 'gd' | 'interview';
  topicOrRole: string;
  events: SessionEvent[];
}

export class EvaluatorService {
  private primaryAi: GoogleGenAI;

  constructor() {
    const key = getAgentApiKey('evaluator');
    this.primaryAi = new GoogleGenAI({ apiKey: key });
  }

  async evaluateSession(params: EvaluateSessionParams & { useMock?: boolean }): Promise<Report> {
    const { sessionId, mode, topicOrRole, events, useMock } = params;
    const metrics = calculateDeterministicMetrics(events);
    const transcriptEvents = events.filter((e) => e.kind === 'transcript' && e.text);

    const env = getEnv();
    if (useMock || env.MOCK_PROVIDERS) {
      return this.generateFallbackReport(
        sessionId,
        mode,
        metrics,
        transcriptEvents,
        'Deterministic evaluation completed in mock mode.'
      );
    }

    // If there is very little student participation, generate truthful fallback report
    if (metrics.studentWords < 5) {
      return this.generateFallbackReport(
        sessionId,
        mode,
        metrics,
        transcriptEvents,
        'Insufficient student speech recorded during this session to produce a complete qualitative AI evaluation.'
      );
    }

    try {
      const rawEvaluation = await this.callGeminiFlashLite(mode, topicOrRole, transcriptEvents, metrics);
      const validatedReport = this.verifyAndAssembleReport(
        sessionId,
        mode,
        metrics,
        transcriptEvents,
        rawEvaluation
      );

      // Supplementary reviewer check (Gemma) if configured
      await this.runSupplementaryGemmaReview(transcriptEvents, validatedReport);

      return validatedReport;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return this.generateFallbackReport(
        sessionId,
        mode,
        metrics,
        transcriptEvents,
        `AI evaluator encountered an error (${errMsg}). Deterministic session metrics are provided below.`
      );
    }
  }

  private async callGeminiFlashLite(
    mode: 'gd' | 'interview',
    topicOrRole: string,
    transcriptEvents: SessionEvent[],
    metrics: DeterministicMetrics
  ): Promise<RawModelEvaluation> {
    const env = getEnv();

    const formattedTranscript = transcriptEvents
      .map((e) => `[ID: ${e.eventId}] ${e.speakerLabel} (${e.speakerId}): "${e.text}"`)
      .join('\n');

    const criteriaList =
      mode === 'gd'
        ? [
            { id: 'opening', name: 'Opening & Setting Direction' },
            { id: 'idea_quality', name: 'Idea Quality & Reasoning' },
            { id: 'building_on_others', name: 'Building On Others & Listening' },
            { id: 'handling_interruption', name: 'Handling Interruption & Disagreement' },
            { id: 'closing', name: 'Closing Synthesis & Impact' },
          ]
        : [
            { id: 'technical_depth', name: 'Technical Depth & Correctness' },
            { id: 'project_ownership', name: 'Project Ownership & Contribution' },
            { id: 'problem_solving', name: 'Problem Solving & Trade-offs' },
            { id: 'communication_clarity', name: 'Communication Clarity & Conciseness' },
          ];

    const systemPrompt = `You are a strict, evidence-based campus placement evaluator assessing an Indian engineering college student in an AI ${
      mode === 'gd' ? 'Group Discussion' : 'Technical Interview'
    }.

Topic/Role: ${topicOrRole}

MANDATORY EVIDENCE RULES:
1. Every piece of evidence MUST include an eventId and an EXACT quotation substring spoken by the student or another participant in the transcript.
2. DO NOT paraphrase quotes or invent words. If you quote something that is not an exact substring in the transcript, the evidence will be automatically rejected.
3. If there is insufficient evidence in the transcript for a criterion, set score to null, set insufficientEvidence to true, and leave evidence empty.
4. Score integer between 1 and 5 (1=Poor, 3=Average, 5=Outstanding).

CRITERIA TO EVALUATE:
${criteriaList.map((c) => `- ${c.id}: ${c.name}`).join('\n')}

Format your response as valid, parseable JSON matching this schema:
{
  "overallSummary": "Concise summary of student performance...",
  "criteria": [
    {
      "criterionId": "string",
      "score": 1-5 or null,
      "summary": "Specific assessment tied to rubric",
      "evidence": [
        {
          "eventId": "valid-eventId-from-transcript",
          "quote": "EXACT substring from that event",
          "reasoning": "Why this quote demonstrates the score"
        }
      ],
      "suggestions": ["Specific practical practice advice"],
      "insufficientEvidence": boolean
    }
  ],
  "overallAdvice": ["Actionable improvement tips"],
  "limitations": ["Any limitations in context or transcript quality"]
}`;

    const userPrompt = `DETERMINISTIC METRICS:
- Total turns: ${metrics.totalTurns} (Student turns: ${metrics.studentTurns})
- Student word count: ${metrics.studentWords} out of ${metrics.totalWords} (${metrics.studentWordSharePct}% word share)
- AI interruptions: ${metrics.aiInterruptionCount}

TRANSCRIPT:
${formattedTranscript}

Evaluate the student now. Return only JSON.`;

    const response = await this.primaryAi.models.generateContent({
      model: env.GEMINI_EVAL_MODEL,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    return JSON.parse(responseText) as RawModelEvaluation;
  }

  private verifyAndAssembleReport(
    sessionId: string,
    mode: 'gd' | 'interview',
    metrics: DeterministicMetrics,
    transcriptEvents: SessionEvent[],
    raw: RawModelEvaluation
  ): Report {
    const env = getEnv();
    const eventMap = new Map<string, SessionEvent>();
    for (const event of transcriptEvents) {
      eventMap.set(event.eventId, event);
    }

    const verifiedCriteria: ReportCriterion[] = [];

    for (const crit of raw.criteria || []) {
      const verifiedEvidence: ReportEvidence[] = [];

      for (const ev of crit.evidence || []) {
        const matchingEvent = eventMap.get(ev.eventId);
        if (!matchingEvent || !matchingEvent.text) {
          // Event not found in this session transcript; reject hallucinated eventId
          continue;
        }

        const normalizedEventText = matchingEvent.text.toLowerCase();
        const normalizedQuote = ev.quote.trim().toLowerCase();

        // Exact substring match check (ignoring case/whitespace trim)
        if (normalizedQuote.length > 0 && normalizedEventText.includes(normalizedQuote)) {
          verifiedEvidence.push({
            eventId: ev.eventId,
            quote: ev.quote.trim(),
            reasoning: ev.reasoning || '',
          });
        }
        // If not an exact substring, quotation is rejected (Zero Hallucinated Quotes Invariant)
      }

      const hasEvidence = verifiedEvidence.length > 0;
      verifiedCriteria.push({
        criterionId: crit.criterionId,
        score: hasEvidence ? crit.score : null,
        summary: crit.summary || '',
        evidence: verifiedEvidence,
        suggestions: crit.suggestions || [],
        insufficientEvidence: !hasEvidence,
      });
    }

    return {
      reportId: randomUUID(),
      sessionId,
      status: 'ready',
      schemaVersion: 'placement-arena-report.v1',
      rubricVersion: mode === 'gd' ? 'gd-rubric-v1' : 'interview-rubric-v1',
      evaluatorModelId: env.GEMINI_EVAL_MODEL,
      metrics: {
        totalTurns: metrics.totalTurns,
        studentTurns: metrics.studentTurns,
        totalWords: metrics.totalWords,
        studentWords: metrics.studentWords,
        studentWordSharePct: metrics.studentWordSharePct,
        aiInterruptionCount: metrics.aiInterruptionCount,
        durationSeconds: metrics.discussionDurationSeconds,
      },
      overallSummary: raw.overallSummary || 'Discussion completed.',
      criteria: verifiedCriteria,
      overallAdvice: raw.overallAdvice || [],
      limitations: raw.limitations || [],
      createdAt: new Date().toISOString(),
    };
  }

  private async runSupplementaryGemmaReview(
    transcriptEvents: SessionEvent[],
    report: Report
  ): Promise<void> {
    const env = getEnv();
    try {
      const gemmaAi = new GoogleGenAI({ apiKey: getAgentApiKey('reviewer') });
      const prompt = `Review this candidate evaluation for consistency and specificity.
Candidate summary: ${report.overallSummary}
Criteria scores: ${report.criteria.map((c) => `${c.criterionId}: ${c.score ?? 'N/A'}`).join(', ')}
Transcript turn count: ${transcriptEvents.length}

Return one concise sentence of constructive reviewer feedback.`;

      const res = await gemmaAi.models.generateContent({
        model: env.GEMINI_REVIEW_MODEL,
        contents: prompt,
      });
      const note = res.text?.trim();
      if (note) {
        report.limitations = report.limitations || [];
        report.limitations.push(`Supplementary Reviewer Note (${env.GEMINI_REVIEW_MODEL}): ${note}`);
      }
    } catch {
      // Supplementary reviewer failure does not invalidate the primary report
    }
  }

  generateFallbackReport(
    sessionId: string,
    mode: 'gd' | 'interview',
    metrics: DeterministicMetrics,
    transcriptEvents: SessionEvent[],
    noticeText: string
  ): Report {
    const studentEvents = transcriptEvents.filter((e) => e.speakerId === 'student');
    const sampleQuotes: ReportEvidence[] = [];

    // Deterministically pick up to 2 student quotes with valid event IDs
    for (let i = 0; i < Math.min(2, studentEvents.length); i++) {
      const e = studentEvents[i];
      if (e.text) {
        sampleQuotes.push({
          eventId: e.eventId,
          quote: e.text.slice(0, 200),
          reasoning: 'Direct student excerpt from canonical session log.',
        });
      }
    }

    return {
      reportId: randomUUID(),
      sessionId,
      status: 'fallback',
      schemaVersion: 'placement-arena-report.v1',
      rubricVersion: mode === 'gd' ? 'gd-rubric-v1' : 'interview-rubric-v1',
      evaluatorModelId: null,
      metrics: {
        totalTurns: metrics.totalTurns,
        studentTurns: metrics.studentTurns,
        totalWords: metrics.totalWords,
        studentWords: metrics.studentWords,
        studentWordSharePct: metrics.studentWordSharePct,
        aiInterruptionCount: metrics.aiInterruptionCount,
        durationSeconds: metrics.discussionDurationSeconds,
      },
      overallSummary: `${noticeText} You contributed ${metrics.studentWords} words across ${metrics.studentTurns} turns (${metrics.studentWordSharePct}% total word share).`,
      criteria: [
        {
          criterionId: 'participation_metrics',
          score: metrics.studentWords >= 50 ? 3 : 2,
          summary: 'Deterministic metrics calculated directly from verified session events.',
          evidence: sampleQuotes,
          suggestions: [
            'Speak clearly with concrete examples to give the qualitative evaluator sufficient substance to review.',
          ],
          insufficientEvidence: sampleQuotes.length === 0,
        },
      ],
      overallAdvice: [
        'Practice entering the discussion earlier to establish your viewpoint.',
        'Actively acknowledge and challenge statements made by peer participants.',
      ],
      limitations: [noticeText],
      createdAt: new Date().toISOString(),
    };
  }
}

interface RawModelEvaluation {
  overallSummary?: string;
  criteria?: Array<{
    criterionId: string;
    score: number | null;
    summary: string;
    evidence: Array<{
      eventId: string;
      quote: string;
      reasoning: string;
    }>;
    suggestions: string[];
    insufficientEvidence?: boolean;
  }>;
  overallAdvice?: string[];
  limitations?: string[];
}
