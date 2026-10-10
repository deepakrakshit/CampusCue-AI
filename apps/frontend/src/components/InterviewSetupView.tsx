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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 mb-4"
        >
          &larr; Back to Home
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Setup 5-Minute Technical Interview</h1>
            <p className="text-slate-400 text-sm">
              Adaptive 1-on-1 voice interview customized to your target role, flagship project, and codebase.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-medium">Initialization Error</p>
            <p className="text-red-300/90 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Candidate Profile */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="interviewee-name" className="block text-sm font-semibold text-slate-200 mb-2">
                Your Name
              </label>
              <input
                id="interviewee-name"
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g., Jane Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label htmlFor="seniority-level" className="block text-sm font-semibold text-slate-200 mb-2">
                Seniority Level
              </label>
              <select
                id="seniority-level"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="Campus Placement / New Grad">Campus Placement / New Grad</option>
                <option value="Associate / Junior (0-2 Years)">Associate / Junior (0-2 Years)</option>
                <option value="Mid-Level Engineer (2-4 Years)">Mid-Level Engineer (2-4 Years)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              Target Engineering Role
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsCustomRole(false)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  !isCustomRole
                    ? 'bg-purple-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Preset
              </button>
              <button
                type="button"
                onClick={() => setIsCustomRole(true)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  isCustomRole
                    ? 'bg-purple-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {!isCustomRole ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                    role === r
                      ? 'border-purple-500 bg-purple-950/20 text-white shadow-sm shadow-purple-500/10'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="role"
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="text-purple-600 focus:ring-purple-500"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          )}
        </div>

        {/* Project Description or Resume */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <label htmlFor="project-desc" className="block text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            Flagship Project / Résumé Summary
          </label>
          <p className="text-xs text-slate-400 mb-3">
            The interviewer uses this technical summary to probe architecture decisions, trade-offs, and failure recovery.
          </p>
          <textarea
            id="project-desc"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={4}
            placeholder="Describe your architecture, database choices, concurrency model, and notable challenges..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-mono text-xs leading-relaxed"
          />

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <label htmlFor="github-url" className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
              Repository Link (Optional)
            </label>
            <input
              id="github-url"
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/project"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Duration & Mode Settings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-sm font-semibold text-slate-200 block">Session Length</span>
                <span className="text-xs text-slate-500">Standard campus technical round duration</span>
              </div>
            </div>
            <div className="flex gap-2">
              {[3, 5].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-4 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    durationMinutes === mins
                      ? 'border-purple-500 bg-purple-950/30 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Test Harness Mode</span>
              <span className="text-xs text-slate-500">
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
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Strict single-speaker control & candidate interruption enabled.</span>
          </div>
          <button
            type="submit"
            disabled={loading || !activeRole}
            className="py-3.5 px-8 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/25 flex items-center gap-2 group"
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
  );
};
