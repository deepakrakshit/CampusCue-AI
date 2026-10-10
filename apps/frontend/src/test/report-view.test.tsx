import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReportView } from '../components/ReportView';
import { api } from '../api/client';
import type { Report } from '../types';

vi.mock('../api/client', () => ({
  api: {
    getReport: vi.fn(),
  },
}));

const mockReport: Report = {
  reportId: 'rep_12345678',
  sessionId: 'sess_12345678',
  status: 'ready',
  schemaVersion: '1.0.0',
  rubricVersion: 'gd-v1',
  evaluatorModelId: 'gemini-3.5-flash-lite',
  metrics: {
    studentWordSharePct: 22,
    studentTurns: 4,
    totalTurns: 18,
    studentWordCount: 165,
    studentBargeInCount: 1,
  },
  overallSummary: 'Strong analytical contribution with clear structured arguments.',
  criteria: [
    {
      criterionId: 'analytical_depth',
      score: 4,
      summary: 'Demonstrated solid analytical grasp of the subject.',
      evidence: [
        {
          eventId: 'evt_001_11111111',
          quote: 'We need to differentiate between augmenting workflow and outright workforce displacement',
          reasoning: 'Demonstrated nuance and framework thinking.',
        },
      ],
      suggestions: ['Provide empirical market numbers where available.'],
      insufficientEvidence: false,
    },
    {
      criterionId: 'leadership_synthesis',
      score: null,
      summary: 'Candidate did not attempt a final summary.',
      evidence: [],
      suggestions: ['Try stepping in towards the closing 30 seconds to synthesize agreement.'],
      insufficientEvidence: true,
    },
  ],
  overallAdvice: ['Work on concluding statements', 'Maintain eye contact and pace'],
  createdAt: '2026-03-30T10:00:00Z',
};

describe('ReportView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially and then renders full report', async () => {
    vi.mocked(api.getReport).mockResolvedValueOnce(mockReport);

    render(
      <ReportView
        sessionId="sess_12345678"
        token="test_token"
        onHome={vi.fn()}
        onRetrySession={vi.fn()}
      />
    );

    expect(screen.getByText(/Analyzing Discussion Performance/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Performance Feedback & Evidence/i)).toBeInTheDocument();
    });

    // Check summary and model badge
    expect(screen.getByText(/Strong analytical contribution/i)).toBeInTheDocument();
    expect(screen.getByText(/gemini-3.5-flash-lite/i)).toBeInTheDocument();

    // Check deterministic metrics
    expect(screen.getByText('22%')).toBeInTheDocument();
    expect(screen.getByText('165')).toBeInTheDocument();

    // Check verified quote
    expect(
      screen.getByText(/We need to differentiate between augmenting workflow and outright workforce displacement/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Event #evt_001_/i)).toBeInTheDocument();

    // Check insufficient evidence badge
    expect(screen.getByText(/Insufficient Evidence/i)).toBeInTheDocument();
  });

  it('renders error state when report fails to load', async () => {
    vi.mocked(api.getReport).mockRejectedValue(new Error('Network error'));

    render(
      <ReportView
        sessionId="sess_failed"
        token="test_token"
        onHome={vi.fn()}
        onRetrySession={vi.fn()}
      />
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Unable to Load Evaluation Report/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
