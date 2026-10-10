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
    color: 'border-blue-500/30 bg-blue-950/20 text-blue-300',
    badge: 'Analytical',
  },
  {
    id: 'rohan',
    name: 'Rohan Verma',
    role: 'Challenger & Contrarian',
    desc: 'Questions conventional assumptions, points out hidden risks and trade-offs.',
    color: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
    badge: 'Challenger',
  },
  {
    id: 'ananya',
    name: 'Ananya Iyer',
    role: 'Problem Solver & Structured',
    desc: 'Proposes actionable roadmaps, phased solutions, and realistic implementations.',
    color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
    badge: 'Problem Solver',
  },
  {
    id: 'vikram',
    name: 'Vikram Malhotra',
    role: 'Collaborator & Synthesizer',
    desc: 'Builds on peer viewpoints, harmonizes disagreements, and bridges opposing sides.',
    color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
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
    <div className="relative min-h-screen bg-black text-white px-4 sm:px-6 py-10 selection:bg-violet-500/30 selection:text-violet-200">
      {/* Ambient background glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-8">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 mb-4 cursor-pointer"
          >
            &larr; Back to Home
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Configure AI Group Discussion Arena
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Live Voice
                </span>
              </div>
              <p className="text-neutral-400 text-xs sm:text-sm mt-0.5">
                Simulate a high-stakes campus placement GD with 4 unscripted AI peers and an active moderator.
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 columns: Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Name Input */}
            <div className="bg-[#101112] border border-white/[0.08] rounded-2xl p-6 space-y-3">
              <label htmlFor="candidate-name" className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Candidate Name / Identity
              </label>
              <input
                id="candidate-name"
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g., Alex Johnson"
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors font-sans"
              />
              <p className="text-[11px] text-neutral-500 font-mono">
                The moderator and peers will use this name to address you naturally during conversational turns.
              </p>
            </div>

            {/* Topic Selection */}
            <div className="bg-[#101112] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                  Select Discussion Topic
                </label>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setIsCustom(false)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      !isCustom
                        ? 'bg-white text-black font-semibold'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Curated
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      isCustom
                        ? 'bg-white text-black font-semibold'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
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
                      className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedTopic === topic.title
                          ? 'border-violet-500/60 bg-violet-950/20 text-white shadow-lg shadow-violet-500/10'
                          : 'border-white/[0.06] bg-black/40 text-neutral-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="curated-topic"
                          checked={selectedTopic === topic.title}
                          onChange={() => setSelectedTopic(topic.title)}
                          className="mt-1 accent-violet-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{topic.title}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-neutral-400">
                            <span className="text-violet-400">{topic.category}</span>
                            <span>•</span>
                            <span className="text-neutral-500">{topic.difficulty}</span>
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
                    placeholder="Enter a specific campus placement GD topic (e.g., 'Will artificial general intelligence redefine intellectual property law?')..."
                    rows={3}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-violet-500 resize-none font-sans"
                  />
                  <p className="text-[11px] text-neutral-500 font-mono mt-1.5">
                    The moderator and all 4 AI peers will automatically ground their perspectives in this topic.
                  </p>
                </div>
              )}
            </div>

            {/* Session Parameters */}
            <div className="bg-[#101112] border border-white/[0.08] rounded-2xl p-6 space-y-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Session Duration
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[3, 4, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      durationMinutes === mins
                        ? 'border-cyan-500/60 bg-cyan-950/20 text-white font-semibold'
                        : 'border-white/[0.06] bg-black/40 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="text-base font-bold font-mono">{mins} Minutes</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                      {mins === 3 ? 'Sprint' : mins === 4 ? 'Standard GD' : 'In-Depth'}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-300 block font-mono">Test Harness Mode</span>
                  <span className="text-[11px] text-neutral-500">
                    Simulates voice events locally without consuming live Gemini audio quota.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTestHarness}
                    onChange={(e) => setUseTestHarness(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Right column: Panel & Start */}
          <div className="space-y-6">
            <div className="bg-[#101112] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Your AI Discussion Panel
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Each participant maintains independent context and natural speaking cadences.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-violet-500/30 bg-violet-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Mr. S. Rao (Moderator)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/30 text-violet-300">
                      Host
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    Introduces the topic, ensures balanced floor time, and concludes the round.
                  </p>
                </div>

                {PANEL_PARTICIPANTS.map((p) => (
                  <div key={p.id} className={`p-3 rounded-xl border ${p.color}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Student barge-in interruption armed.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !activeTopic}
              className="w-full py-4 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <span>Initializing Room & Audio Pipelines...</span>
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
    </div>
  );
};

export default GdSetupView;
