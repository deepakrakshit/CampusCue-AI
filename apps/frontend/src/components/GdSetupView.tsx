import React, { useState } from 'react';
import { Users, Clock, Sparkles, ArrowRight, BookOpen, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import type { SessionSnapshot } from '../types';

interface GdSetupViewProps {
  onSessionCreated: (session: SessionSnapshot, token: string) => void;
  onCancel: () => void;
}

const CURATED_TOPICS = [
  {
    id: 'ai-software-jobs',
    title: 'AI and Software Engineering: Augmentation vs. Replacement in the Next Decade',
    category: 'Technology & Work',
    difficulty: 'Moderate',
  },
  {
    id: 'remote-vs-office',
    title: 'Remote Work vs. In-Office Mandates: Impact on Innovation, Mentorship, and Culture',
    category: 'Workplace & Strategy',
    difficulty: 'Beginner',
  },
  {
    id: 'cbdc-crypto',
    title: 'Central Bank Digital Currencies (CBDCs) vs. Decentralized Crypto: Future of Money',
    category: 'Finance & Policy',
    difficulty: 'Advanced',
  },
  {
    id: 'ev-infrastructure',
    title: 'Electric Vehicles in Emerging Markets: Infrastructure Challenges vs. Environmental Urgency',
    category: 'Sustainability & Industry',
    difficulty: 'Moderate',
  },
  {
    id: 'gen-ai-education',
    title: 'Generative AI in Higher Education: Academic Integrity vs. Essential Professional Skill',
    category: 'Education & Ethics',
    difficulty: 'Moderate',
  },
];

const PANEL_PARTICIPANTS = [
  {
    id: 'priya',
    name: 'Priya Patel',
    role: 'Analytical & Data-Driven',
    desc: 'Brings empirical statistics, structured frameworks, and objective data points.',
    color: 'border-blue-500/40 bg-blue-950/20 text-blue-300',
    badge: 'Analytical',
  },
  {
    id: 'rohan',
    name: 'Rohan Verma',
    role: 'Challenger & Contrarian',
    desc: 'Questions conventional assumptions, points out hidden risks and trade-offs.',
    color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
    badge: 'Challenger',
  },
  {
    id: 'ananya',
    name: 'Ananya Iyer',
    role: 'Problem Solver & Structured',
    desc: 'Proposes actionable roadmaps, phased solutions, and realistic implementations.',
    color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
    badge: 'Problem Solver',
  },
  {
    id: 'vikram',
    name: 'Vikram Malhotra',
    role: 'Collaborator & Synthesizer',
    desc: 'Builds on peer viewpoints, harmonizes disagreements, and bridges opposing sides.',
    color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
    badge: 'Collaborator',
  },
];

export const GdSetupView: React.FC<GdSetupViewProps> = ({ onSessionCreated, onCancel }) => {
  const [selectedTopic, setSelectedTopic] = useState(CURATED_TOPICS[0].title);
  const [customTopic, setCustomTopic] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(4);
  const [useTestHarness, setUseTestHarness] = useState(false);
  const [candidateName, setCandidateName] = useState('Candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTopic = isCustom ? customTopic.trim() : selectedTopic;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic) {
      setError('Please select or specify a discussion topic.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.createSession({
        mode: 'gd',
        topic: activeTopic,
        durationSeconds: durationMinutes * 60,
        testHarness: useTestHarness,
        metadata: {
          candidateName: candidateName.trim() || 'Candidate',
        },
      });

      onSessionCreated(res.session, res.sessionAccessToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create discussion session.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 mb-4"
        >
          &larr; Back to Home
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Setup AI Group Discussion</h1>
            <p className="text-slate-400 text-sm">
              Practice placement GDs with 4 distinct AI peers and an active moderator in real-time.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-medium">Session Initialization Error</p>
            <p className="text-red-300/90 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 cols: Topic and Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Name */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <label htmlFor="candidate-name" className="block text-sm font-semibold text-slate-200 mb-2">
              Your Name / Alias
            </label>
            <input
              id="candidate-name"
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g., Alex Johnson"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Used by the AI Moderator and peers to address you naturally during the conversation.
            </p>
          </div>

          {/* Topic Selection */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Select Discussion Topic
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    !isCustom
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Curated
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    isCustom
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {!isCustom ? (
              <div className="space-y-2.5">
                {CURATED_TOPICS.map((topic) => (
                  <label
                    key={topic.id}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTopic === topic.title
                        ? 'border-indigo-500 bg-indigo-950/20 text-white shadow-sm shadow-indigo-500/10'
                        : 'border-slate-800/80 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="curated-topic"
                        checked={selectedTopic === topic.title}
                        onChange={() => setSelectedTopic(topic.title)}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{topic.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span className="text-indigo-400">{topic.category}</span>
                          <span>•</span>
                          <span>{topic.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <textarea
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Enter a specific campus placement GD topic (e.g., 'Is ethical consumerism realistic under modern supply chain constraints?')..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  The moderator and all 4 AI peers will automatically ground their perspectives in this topic.
                </p>
              </div>
            )}
          </div>

          {/* Session Parameters */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Session Duration
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[3, 4, 5].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    durationMinutes === mins
                      ? 'border-indigo-500 bg-indigo-950/20 text-white font-semibold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-base font-bold">{mins} Minutes</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {mins === 3 ? 'Quick Sprint' : mins === 4 ? 'Standard GD' : 'Comprehensive'}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Test Harness Mode</span>
                <span className="text-xs text-slate-500">
                  Simulates AI voice events without calling live Gemini audio endpoints.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTestHarness}
                  onChange={(e) => setUseTestHarness(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Right col: Discussion Panel & Start Button */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Your AI Discussion Panel
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Each peer has a distinct persona and voice, maintaining real-time awareness of every contribution.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Mr. S. Rao (Moderator)</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Host
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Introduces the topic, ensures equal speaking opportunities, and calls for final conclusions.
                </p>
              </div>

              {PANEL_PARTICIPANTS.map((p) => (
                <div key={p.id} className={`p-3 rounded-xl border ${p.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900/80">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300/80 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Full student barge-in interruption enabled.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !activeTopic}
            className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <span>Initializing Discussion Room...</span>
            ) : (
              <>
                <span>Enter Discussion Room</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
