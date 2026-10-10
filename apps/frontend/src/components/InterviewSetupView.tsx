import React, { useState } from 'react';
import { UserCheck, Clock, ArrowRight, AlertCircle, Code2, Briefcase, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import type { SessionSnapshot } from '../types';

interface InterviewSetupViewProps {
  onSessionCreated: (session: SessionSnapshot, token: string) => void;
  onCancel: () => void;
}

const ROLES = [
  'Backend & Distributed Systems Engineer',
  'Frontend Software Engineer (React / TypeScript)',
  'Full-Stack Web Engineer',
  'Machine Learning / AI Applications Engineer',
  'Cloud Infrastructure & DevOps Engineer',
];

const DEFAULT_PROJECT_EXAMPLE = `Built a distributed real-time chat application with WebSocket clustering, Redis pub/sub for message routing across instances, and PostgreSQL for persistent message history. Solved a critical race condition in message ordering using monotonic client-server sequence numbers and idempotent delivery.`;

export const InterviewSetupView: React.FC<InterviewSetupViewProps> = ({ onSessionCreated, onCancel }) => {
  const [role, setRole] = useState(ROLES[0]);
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [seniority, setSeniority] = useState('Campus Placement / New Grad');
  const [projectDescription, setProjectDescription] = useState(DEFAULT_PROJECT_EXAMPLE);
  const [githubUrl, setGithubUrl] = useState('');
  const [candidateName, setCandidateName] = useState('Candidate');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [useTestHarness, setUseTestHarness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRole = isCustomRole ? customRole.trim() : role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRole) {
      setError('Please select or specify your target interview role.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.createSession({
        mode: 'interview',
        topic: activeRole,
        durationSeconds: durationMinutes * 60,
        testHarness: useTestHarness,
        metadata: {
          candidateName: candidateName.trim() || 'Candidate',
          role: activeRole,
          seniority,
          projectDescription: projectDescription.trim(),
          githubUrl: githubUrl.trim() || undefined,
        },
      });

      onSessionCreated(res.session, res.sessionAccessToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create interview session.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white px-4 sm:px-6 py-10 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient background glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(6,182,212,0.14),transparent)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto space-y-8">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 mb-4 cursor-pointer"
          >
            &larr; Back to Home
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Setup 5-Minute Technical Interview
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  Adaptive Grill
                </span>
              </div>
              <p className="text-neutral-400 text-xs sm:text-sm mt-0.5">
                Adaptive 1-on-1 voice interview customized to your target role, flagship project, and codebase.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-semibold text-xs font-mono uppercase">Initialization Error</p>
              <p className="text-red-300/90 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Candidate Profile */}
          <div className="bg-[#101112] border border-white/[0.08] rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="interviewee-name" className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                  Candidate Name
                </label>
                <input
                  id="interviewee-name"
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g., Alex Johnson"
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors font-sans"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="seniority-level" className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                  Target Seniority
                </label>
                <select
                  id="seniority-level"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors font-sans"
                >
                  <option value="Campus Placement / New Grad">Campus Placement / New Grad</option>
                  <option value="Associate / Junior (0-2 Years)">Associate / Junior (0-2 Years)</option>
                  <option value="Mid-Level Engineer (2-4 Years)">Mid-Level Engineer (2-4 Years)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="bg-[#101112] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                Target Engineering Role
              </label>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setIsCustomRole(false)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    !isCustomRole
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  Preset
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomRole(true)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    isCustomRole
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {!isCustomRole ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <label
                    key={r}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      role === r
                        ? 'border-cyan-500/60 bg-cyan-950/20 text-white shadow-lg shadow-cyan-500/10'
                        : 'border-white/[0.06] bg-black/40 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="accent-cyan-500"
                      />
                      <span className="text-sm font-medium">{r}</span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g., SRE & Distributed Storage Engineer"
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors font-sans"
              />
            )}
          </div>

          {/* Project Description or Resume */}
          <div className="bg-[#101112] border border-white/[0.08] rounded-2xl p-6 space-y-3">
            <label htmlFor="project-desc" className="block text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              Flagship Project / Résumé Summary
            </label>
            <p className="text-[11px] text-neutral-500 font-mono">
              The interviewer uses this technical summary to probe architecture decisions, trade-offs, and failure recovery.
            </p>
            <textarea
              id="project-desc"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={4}
              placeholder="Describe your architecture, database choices, concurrency model, and notable challenges..."
              className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-3.5 text-white text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
            />

            <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
              <label htmlFor="github-url" className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Code2 className="w-3 h-3 text-neutral-500" />
                Repository Link (Optional)
              </label>
              <input
                id="github-url"
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/project"
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Duration & Test Mode */}
          <div className="bg-[#101112] border border-white/[0.08] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 block">Session Length</span>
                  <span className="text-[11px] text-neutral-500">Standard campus technical round duration</span>
                </div>
              </div>
              <div className="flex gap-2 font-mono">
                {[3, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-4 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      durationMinutes === mins
                        ? 'border-cyan-500/60 bg-cyan-950/20 text-white font-semibold'
                        : 'border-white/[0.08] bg-black/40 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-300 block font-mono">Test Harness Mode</span>
                <span className="text-[11px] text-neutral-500">
                  Run deterministic simulation without calling live Gemini audio endpoints.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTestHarness}
                  onChange={(e) => setUseTestHarness(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Strict single-speaker control & candidate interruption enabled.</span>
            </div>
            <button
              type="submit"
              disabled={loading || !activeRole}
              className="w-full sm:w-auto py-4 px-8 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <span>Preparing Interviewer...</span>
              ) : (
                <>
                  <span>Start Technical Interview</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewSetupView;
