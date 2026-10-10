import React from 'react';
import {
  Sparkles,
  Users,
  ShieldCheck,
  Cpu,
  Mic,
  ArrowRight,
  CheckCircle2,
  Zap,
  Radio,
  FileCheck,
} from 'lucide-react';

interface AboutViewProps {
  onStartGd: () => void;
  onStartInterview: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onStartGd, onStartInterview }) => {
  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-violet-500/30 selection:text-violet-200">
      {/* Background ambient light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(94,73,86,0.22),transparent_65%)] pointer-events-none" />

      <div className="relative max-w-[1344px] mx-auto px-5 py-24 sm:py-32 space-y-24">
        {/* Header Header */}
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-white/80">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Architecture & Placement Mission</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Built for College Students Facing Competitive{' '}
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
              Campus Placements
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
            CampusCue AI transforms high-stakes campus placement preparation with voice-first AI.
            Practice in live, unscripted Group Discussion rooms with 4 distinct AI peers and an active moderator,
            or complete focused 5-minute technical interviews grounded in verifiable evaluation rubrics.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#101112] p-8 space-y-4 hover:border-violet-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Voice-First Immersion</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              No chatbots, no artificial typing turn delays. Speak naturally into your microphone at 16kHz PCM and hear 24kHz synthesized voices powered by Google Gemini Live API.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101112] p-8 space-y-4 hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Sub-300ms Barge-In</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Real GDs require jumping in and defending your position. Our backend exclusivity scheduler cancels active AI audio playback immediately the moment you speak.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101112] p-8 space-y-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Zero Hallucinated Quotes</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Every quote and evaluation claim in your post-discussion report is substring-verified against the canonical transcript, eliminating AI fabrication entirely.
            </p>
          </div>
        </div>

        {/* The 4 Personalities Section */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0c0d0f] p-8 sm:p-12 space-y-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
              <Users className="w-4 h-4" />
              <span>Simulated Placement Panel</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Four Realistic Peer Candidates & One Moderator
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Each AI participant maintains its own Gemini Live streaming session with distinct reasoning prompts, vocal styles, and conversational behaviors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Analytical
                </span>
                <span className="text-xs text-neutral-500 font-mono">Peer 1</span>
              </div>
              <h4 className="text-lg font-bold text-white">Priya Patel</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Leads with empirical market data, verified metrics, structured pros & cons, and regulatory analysis.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Challenger
                </span>
                <span className="text-xs text-neutral-500 font-mono">Peer 2</span>
              </div>
              <h4 className="text-lg font-bold text-white">Rohan Verma</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Probes underlying assumptions, highlights hidden risks, acts as contrarian devil's advocate, and questions consensus.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Problem Solver
                </span>
                <span className="text-xs text-neutral-500 font-mono">Peer 3</span>
              </div>
              <h4 className="text-lg font-bold text-white">Ananya Iyer</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Proposes pragmatic roadmaps, actionable step-by-step implementations, feasibility balances, and execution frameworks.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Synthesizer
                </span>
                <span className="text-xs text-neutral-500 font-mono">Peer 4</span>
              </div>
              <h4 className="text-lg font-bold text-white">Vikram Malhotra</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Integrates diverse perspectives, builds upon student contributions, bridges disagreements, and drives collective consensus.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Moderator
                </span>
                <h4 className="text-base font-bold text-white">Mr. S. Rao</h4>
              </div>
              <p className="text-xs text-neutral-400">
                Frames the central placement topic, intervenes when candidates monopolize time, invites quiet candidates to speak, and closes the round with executive synthesis.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-neutral-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Session Master</span>
            </div>
          </div>
        </div>

        {/* Technical Architecture & Privacy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-white/[0.08] bg-[#101112] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Technical Architecture</h3>
                <p className="text-xs text-neutral-400">Fastify · WebSocket Protocol · Gemini Live</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-neutral-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Single-Speaker Exclusivity:</strong> Exactly zero or one AI candidate speaks at any given moment.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Canonical Transcript Sync:</strong> Monotonically numbered event logs propagate speech segments to all agents in real time.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Dual-Model Evaluation:</strong> Reports evaluated via Gemini 3.5 Flash-Lite with supplemental qualitative reviews via Gemma.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101112] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Privacy & Security Invariants</h3>
                <p className="text-xs text-neutral-400">Zero Audio Storage · Cryptographic Guest Tokens</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-neutral-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Ephemeral Audio:</strong> Microphone audio is streamed live for transcription only; no raw audio is permanently stored on disk.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Zero Credential Exposure:</strong> Gemini API keys stay strictly on the backend server. The client never receives secret tokens.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Grounded Feedback:</strong> Every scored feedback claim links directly to timestamped session transcripts.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-10 sm:p-14 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Accelerate Your Placement Preparation?
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
            Choose between a collaborative 4-person AI Group Discussion or an intensive 1-on-1 technical interview.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartGd}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch GD Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onStartInterview}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-white/20 bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Technical Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
