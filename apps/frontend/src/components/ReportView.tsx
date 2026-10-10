import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Sparkles,
  BarChart2,
  Quote,
  Lightbulb,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/client';
import type { Report } from '../types';

interface ReportViewProps {
  sessionId: string;
  reportId?: string;
  token?: string;
  onHome: () => void;
  onRetrySession: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ sessionId, reportId: _reportId, token, onHome, onRetrySession }) => {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 30; // 30 * 2s = 60s max polling

    const fetchReport = async () => {
      try {
        const data = await api.getReport(sessionId, token || '');
        if (!isMounted) return;

        if (data.status === 'ready' || data.status === 'fallback') {
          setReport(data);
          setLoading(false);
        } else if (data.status === 'failed') {
          setError('Automated evaluation encountered an unrecoverable failure.');
          setLoading(false);
        } else {
          // Status is 'pending', keep polling
          pollCount++;
          if (pollCount >= maxPolls) {
            setError('Report generation is taking longer than expected. Please check back shortly.');
            setLoading(false);
          } else {
            setTimeout(fetchReport, 2000);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to retrieve evaluation report.';
        setError(msg);
        setLoading(false);
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [sessionId, token]);

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campus-cue-report-${sessionId.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-6 animate-pulse">
          <Sparkles className="w-12 h-12 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing Discussion Performance</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          Aggregating canonical transcripts, calculating deterministic speaking metrics, and verifying evidence quotes
          with Google Gemini...
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Hallucinated Quotes Invariant active</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-400 mb-6 inline-flex">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Unable to Load Evaluation Report</h2>
        <p className="text-slate-400 text-sm mb-6">{error || 'Report not found.'}</p>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onHome}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Return to Dashboard
          </button>
          <button
            type="button"
            onClick={onRetrySession}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  // Calculate average criteria score
  const validScores = report.criteria.map((c) => c.score).filter((s): s is number => s !== null);
  const avgScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : null;

  const metrics = report.metrics || {};
  const studentWordShare = typeof metrics.studentWordSharePct === 'number' ? metrics.studentWordSharePct : 0;
  const studentTurns = typeof metrics.studentTurns === 'number' ? metrics.studentTurns : 0;
  const totalTurns = typeof metrics.totalTurns === 'number' ? metrics.totalTurns : 0;
  const studentWords = typeof metrics.studentWordCount === 'number' ? metrics.studentWordCount : 0;
  const interruptions = typeof metrics.studentBargeInCount === 'number' ? metrics.studentBargeInCount : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onHome}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Report (JSON)</span>
          </button>
          <button
            type="button"
            onClick={onRetrySession}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Practice Another Session</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-semibold">
                Evaluation Report
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Rubric {report.rubricVersion}
              </span>
              {report.evaluatorModelId && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                  {report.evaluatorModelId}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Performance Feedback & Evidence
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              {report.overallSummary}
            </p>
          </div>

          {/* Overall Rating Card */}
          {avgScore && (
            <div className="flex-shrink-0 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-3xl font-black text-white">{avgScore}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Out of 5.0
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deterministic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Word Share</span>
            <BarChart2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{studentWordShare}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Target benchmark: 15–25%</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Your Speaking Turns</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {studentTurns}{' '}
            <span className="text-xs font-normal text-slate-500">/ {totalTurns} total</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Interactions across panel</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Spoken Words</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{studentWords}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total words spoken</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Barge-In Interruptions</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{interruptions}</div>
          <p className="text-[11px] text-slate-500 mt-1">Floor claims registered</p>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <span>Competency & Rubric Breakdown</span>
        </h2>

        <div className="space-y-4">
          {report.criteria.map((criterion) => {
            const scoreColor =
              criterion.score && criterion.score >= 4
                ? 'bg-emerald-500'
                : criterion.score && criterion.score >= 3
                ? 'bg-indigo-500'
                : 'bg-amber-500';

            return (
              <div
                key={criterion.criterionId}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white capitalize">
                      {criterion.criterionId.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{criterion.summary}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {criterion.insufficientEvidence ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-400 text-xs font-semibold">
                        Insufficient Evidence
                      </span>
                    ) : (
                      criterion.score !== null && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${scoreColor} transition-all duration-500`}
                              style={{ width: `${(criterion.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white font-mono">
                            {criterion.score}/5
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Evidence Section (Verified Quotes) */}
                {criterion.evidence.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Verified Canonical Evidence Quotes</span>
                    </span>

                    <div className="space-y-2">
                      {criterion.evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
                        >
                          <div className="flex items-start gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] flex-shrink-0">
                              Event #{ev.eventId.slice(0, 8)}
                            </span>
                            <blockquote className="italic text-slate-200 border-l-2 border-indigo-500 pl-2">
                              &ldquo;{ev.quote}&rdquo;
                            </blockquote>
                          </div>
                          <p className="text-slate-400 text-[11px] pl-2">{ev.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Suggestions */}
                {criterion.suggestions.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Targeted Placement Recommendations</span>
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc marker:text-amber-400">
                      {criterion.suggestions.map((sug, idx) => (
                        <li key={idx}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Placement Advice */}
      {report.overallAdvice && report.overallAdvice.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Key Placement Takeaways for Next Round</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.overallAdvice.map((advice, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  {idx + 1}
                </span>
                <p className="leading-relaxed">{advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
