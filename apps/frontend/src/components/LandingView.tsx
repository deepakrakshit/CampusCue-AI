import React from 'react';
import {
  Users,
  UserCheck,
  Shield,
  CheckCircle2,
  Zap,
  ArrowRight,
  Radio,
  Mic,
  FileCheck,
  Volume2,
  Layers,
} from 'lucide-react';
import { SpiralFunnel } from './ui/spiral-funnel';

interface LandingViewProps {
  onStartGd: () => void;
  onStartInterview: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStartGd, onStartInterview }) => {
  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden">
      {/* ----------------- HERO SECTION with SPIRAL FUNNEL ----------------- */}
      <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-black text-center pt-28 pb-16 px-5">
        {/* Animated Spiral Funnel vortex background */}
        <div className="absolute inset-0 z-0 pointer-events-auto opacity-70">
          <SpiralFunnel strands={160} speed={0.75} interactive={true} />
        </div>

        {/* Ambient top light gradient */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.22),transparent)] pointer-events-none z-[1]" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-neutral-300 backdrop-blur-md shadow-lg shadow-black/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-semibold">Gemini Live Powered</span>
            <span className="text-neutral-500">·</span>
            <span>Placement Arena</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl">
            Master Group Discussions & Technical Interviews with{' '}
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
              Real-Time AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-neutral-300 max-w-2xl leading-relaxed font-normal">
            Step into unscripted campus GDs with 4 distinct AI personalities and an active moderator.
            Real-time Gemini Live audio streaming, sub-300ms barge-in interruption, canonical transcripts,
            and evidence-verified rubrics.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
            <button
              onClick={onStartGd}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-white/10 group cursor-pointer"
            >
              <Users className="w-4 h-4 text-black" />
              <span>Launch GD Arena</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={onStartInterview}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 bg-white/[0.05] text-white font-semibold text-sm hover:bg-white/[0.1] hover:border-white/30 backdrop-blur-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Start 1-on-1 Interview</span>
            </button>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400 font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>4 Autonomous AI Peers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instant Barge-In Interruption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Zero Hallucinated Quotes</span>
            </div>
          </div>
        </div>

        {/* ----------------- INTERACTIVE LIVE ROOM PREVIEW ----------------- */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-16 rounded-2xl border border-white/[0.1] bg-[#0c0d11]/90 backdrop-blur-xl shadow-2xl shadow-black p-4 sm:p-6 text-left">
          <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] pb-4 mb-5 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                Live Simulation · Room #GD-2026-X
              </span>
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                AI & Software Engineering: Augmentation vs. Replacement
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Floor: Open
              </span>
              <span>04:12 Remaining</span>
            </div>
          </div>

          {/* Participant Mock Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-violet-300 font-bold">Mr. S. Rao</span>
                <span className="text-neutral-500">Mod</span>
              </div>
              <p className="text-[10px] text-neutral-400">Discussion Moderator</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Steered Turn
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/40 bg-blue-950/30 p-3 space-y-1 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-blue-300 font-bold">Priya Patel</span>
                <span className="text-blue-400 animate-pulse text-[10px]">Speaking</span>
              </div>
              <p className="text-[10px] text-neutral-300">Analytical & Data-Driven</p>
              <div className="flex items-center gap-1 text-[10px] text-blue-300 font-mono">
                <Volume2 className="w-3 h-3 text-blue-400" /> 24kHz Live Audio
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-300 font-bold">Rohan Verma</span>
                <span className="text-neutral-500">Peer 2</span>
              </div>
              <p className="text-[10px] text-neutral-400">Challenger & Contrarian</p>
              <span className="text-[10px] text-neutral-500">Listening</span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-300 font-bold">Ananya Iyer</span>
                <span className="text-neutral-500">Peer 3</span>
              </div>
              <p className="text-[10px] text-neutral-400">Problem Solver</p>
              <span className="text-[10px] text-neutral-500">Listening</span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-300 font-bold">Vikram Malhotra</span>
                <span className="text-neutral-500">Peer 4</span>
              </div>
              <p className="text-[10px] text-neutral-400">Synthesizer</p>
              <span className="text-[10px] text-neutral-500">Listening</span>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-300 font-bold">You (Student)</span>
                <span className="text-emerald-400 text-[10px]">Mic Ready</span>
              </div>
              <p className="text-[10px] text-neutral-300">Candidate Floor Lock</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <Mic className="w-3 h-3" /> Barge-in Armed
              </div>
            </div>
          </div>

          {/* Transcript Feed Preview */}
          <div className="rounded-xl border border-white/[0.06] bg-black/50 p-4 space-y-2.5 font-mono text-xs">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>Canonical Live Transcript Feed</span>
              <span>Seq #28 · Synchronized</span>
            </div>
            <div className="space-y-1.5 text-neutral-300">
              <p>
                <span className="text-blue-400 font-semibold">[Priya]</span> "Looking at Stack Overflow's 2025 engineering benchmark, AI code assistants improved developer velocity by 28%, yet architecture reviews took 14% longer due to subtle edge cases."
              </p>
              <p className="text-neutral-500 italic">
                <span className="text-emerald-400 font-semibold">[You]</span> (Barge in anytime — Speaking instantly claims the floor and pauses Priya...)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 1: STATEFUL EXECUTION & CAPABILITIES ----------------- */}
      <section className="relative py-24 sm:py-32 border-t border-white/[0.08] bg-[#07080d]">
        <div className="max-w-[1344px] mx-auto px-5 space-y-16">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-violet-400">
              <Zap className="w-4 h-4" />
              <span>Real-Time Voice Orchestration</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Stateful execution. CampusCue keeps voice discussions in motion.
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Autonomous AI peers collaborate, debate, and react to your points without script locks,
              governed by a central backend turn scheduler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 01 Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#101112] p-8 flex flex-col justify-between space-y-6 hover:border-violet-500/40 transition-colors">
              <div className="space-y-4">
                <span className="text-xs font-mono text-violet-400 font-semibold">01</span>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Multi-Agent Voice Sessions
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Five independent Gemini 3.8 Live streaming instances operate concurrently with individual memory, vocal styles, and domain personas.
                </p>
              </div>
              <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">Live Concurrency</span>
                <span className="text-emerald-400 font-bold">5 Independent Agents</span>
              </div>
            </div>

            {/* 02 Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#101112] p-8 flex flex-col justify-between space-y-6 hover:border-cyan-500/40 transition-colors">
              <div className="space-y-4">
                <span className="text-xs font-mono text-cyan-400 font-semibold">02</span>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Sub-300ms Barge-In Interruption
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  When you speak into your microphone, floor ownership locks instantly and late AI audio chunks are purged by generation epoch fencing.
                </p>
              </div>
              <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">Floor Acquisition</span>
                <span className="text-cyan-400 font-bold">&lt;300ms Audio Cutoff</span>
              </div>
            </div>

            {/* 03 Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#101112] p-8 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-colors">
              <div className="space-y-4">
                <span className="text-xs font-mono text-emerald-400 font-semibold">03</span>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Canonical Ordered Transcript
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  The Fastify server maintains a strictly ordered, monotonically sequenced event log that syncs context across all participants in real time.
                </p>
              </div>
              <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">Sequence Integrity</span>
                <span className="text-emerald-400 font-bold">100% Deterministic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 2: THE 2 PRACTICE MODES ----------------- */}
      <section className="relative py-24 sm:py-32 border-t border-white/[0.08] bg-black">
        <div className="max-w-[1344px] mx-auto px-5 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
              <Layers className="w-4 h-4" />
              <span>Placement Preparation Suite</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Two Specialized Placement Formats
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base">
              Hone your spoken articulation across group collaborative dynamics and individual technical grill rounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mode 1: AI Group Discussion */}
            <div className="rounded-3xl border border-white/[0.1] bg-[#0d0e12] p-8 sm:p-10 flex flex-col justify-between space-y-8 hover:border-violet-500/50 transition-all shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Primary Experience
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">AI Group Discussion</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Join a round with 4 unscripted AI peers and an active moderator. Defend your opinions, counter weak logic, and build collaborative consensus.
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-neutral-300 font-mono">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time voice powered by Google Gemini Live API</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant barge-in interruption halts AI playback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Shared canonical transcript synchronized across all agents</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rubric evaluation with exact verified quotations</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStartGd}
                className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Configure GD Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mode 2: Technical Deep-Dive */}
            <div className="rounded-3xl border border-white/[0.1] bg-[#0d0e12] p-8 sm:p-10 flex flex-col justify-between space-y-8 hover:border-cyan-500/50 transition-all shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    5-Minute Deep Dive
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Technical Deep-Dive</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    One-on-one technical screening with a Staff AI Interviewer. Evaluates your architecture decisions, debugging methodologies, and project ownership.
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-neutral-300 font-mono">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Customized to your role, resume, or GitHub repository</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Adaptive follow-up questions challenging trade-offs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Strict 5-minute timed placement interview flow</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Evidence-grounded technical depth scorecard</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStartInterview}
                className="w-full py-3.5 px-6 rounded-xl border border-white/20 bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Setup Technical Interview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 3: EVIDENCE VERIFICATION & RUBRIC REPORT ----------------- */}
      <section className="relative py-24 sm:py-32 border-t border-white/[0.08] bg-[#07080d]">
        <div className="max-w-[1344px] mx-auto px-5 space-y-16">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
              <FileCheck className="w-4 h-4" />
              <span>Evidence-Verified Feedback</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Track candidate insights in real time.
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Every score, strength, and critique is verified against the canonical transcript,
              guaranteeing 100% transcript-grounded verification.
            </p>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0f13] p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6 lg:col-span-1">
              <div className="space-y-2">
                <span className="text-xs font-mono text-neutral-500 uppercase">Assessment Engine</span>
                <h3 className="text-xl font-bold text-white">4 Dimension Placement Rubric</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Evaluated using structured schema outputs via Gemini 3.5 Flash-Lite with supplemental qualitative reviews via Gemma 4.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-300">Communication Clarity</span>
                    <span className="text-emerald-400 font-bold">92%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="w-[92%] h-full bg-emerald-400 rounded-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-300">Argumentation Depth</span>
                    <span className="text-cyan-400 font-bold">85%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="w-[85%] h-full bg-cyan-400 rounded-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-300">Active Listening & Synthesis</span>
                    <span className="text-violet-400 font-bold">88%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="w-[88%] h-full bg-violet-400 rounded-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/[0.06] bg-black/40 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-300">Interruption Etiquette</span>
                    <span className="text-amber-400 font-bold">90%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="w-[90%] h-full bg-amber-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Verifiable Quote Verification Demo */}
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-black/60 p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Substring Evidence Verified
                  </span>
                  <span className="text-xs font-mono text-neutral-500">Event Seq #19</span>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-neutral-200 text-sm font-mono leading-relaxed">
                  "While automated code generation speeds up unit scaffolding, the architectural burden of maintaining high cohesion still fundamentally requires human engineering judgment."
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  <strong>Evaluator Assessment:</strong> Candidate effectively countered Priya's pure-speed premise by highlighting downstream maintainability debt. Excellent poise during floor acquisition.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs font-mono text-neutral-400">
                <span>Transcript Verification Check</span>
                <span className="text-emerald-400 font-semibold">100% Substring Match Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 4: PRIVACY & TRUST NOTICE ----------------- */}
      <section className="relative py-20 border-t border-white/[0.08] bg-black">
        <div className="max-w-[1344px] mx-auto px-5">
          <div className="rounded-3xl border border-white/[0.08] bg-[#0b0c0f] p-8 sm:p-12 space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-base sm:text-lg">
              <Shield className="w-5 h-5 text-violet-400" />
              <span>Student Privacy & Responsible AI Notice</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-4xl">
              CampusCue AI is designed as a formative preparation simulator for campus placements. You will interact with AI agents using live audio processed by the configured Google Gemini model provider. High-entropy guest tokens protect your session data, and no raw audio is permanently stored. Every quotation in your feedback report is cryptographically verified against the canonical session transcript to guarantee <span className="text-white font-medium">Zero fabricated claims</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------- FINAL CALL TO ACTION ----------------- */}
      <section className="relative py-24 sm:py-32 border-t border-white/[0.08] bg-gradient-to-b from-[#07080d] to-black text-center">
        <div className="max-w-3xl mx-auto px-5 space-y-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Stop babysitting scripts. Own the discussion floor.
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
            Practice until speaking with confidence, interrupting politely, and articulating technical depth becomes second nature.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onStartGd}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/10"
            >
              <span>Enter Discussion Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onStartInterview}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Begin Interview Session</span>
            </button>
          </div>
        </div>
      </section>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="relative border-t border-white/[0.08] bg-black py-12 px-5 text-neutral-500 text-xs font-mono">
        <div className="max-w-[1344px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="text-white font-semibold">CampusCue AI</span>
            <span>— Voice-First Placement Preparation</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Server-Side Verified</span>
            <span>Gemini 3.8 Live</span>
            <span>Fastify Real-Time Core</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
