import React from 'react';
import { Users, UserCheck, Shield, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onStartGd: () => void;
  onStartInterview: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStartGd, onStartInterview }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-brand-400" />
          Placement Season Preparation
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Master Group Discussions & Technical Interviews with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
            Real-Time AI
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300">
          Practice realistic spoken GDs with 4 distinct AI personalities and an active moderator.
          Interrupt naturally, defend your ideas, and receive rubric-graded feedback tied to exact
          transcript evidence.
        </p>
      </div>

      {/* Main Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* GD Arena Card */}
        <div className="group relative rounded-2xl bg-slate-900 border border-slate-800 p-8 hover:border-brand-500/50 transition-all hover:shadow-2xl hover:shadow-brand-500/10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">AI Group Discussion</h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Primary Mode
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Step into a 4-person discussion with Priya (Analytical), Rohan (Challenger),
                Ananya (Problem-Solver), and Vikram (Collaborator), plus a professional moderator.
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Real-time voice powered by Google Gemini Live API</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Instant barge-in interruption halts AI playback</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Shared canonical transcript synchronized across all agents</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Rubric evaluation with exact verified quotations</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={onStartGd}
              className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
            >
              <span>Configure GD Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Technical Interview Card */}
        <div className="group relative rounded-2xl bg-slate-900 border border-slate-800 p-8 hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <UserCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">Technical Deep-Dive</h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  5-Min Extension
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                One-on-one technical screening with a Senior Staff Engineer. Evaluates your architecture,
                trade-offs, debugging skills, and project ownership.
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Tailored to your target role, resume, or project context</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Adaptive follow-up questions testing trade-offs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Bounded 5-minute timed placement interview flow</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Technical depth & communication rubric report</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={onStartInterview}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <span>Setup Technical Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trust, Security & Privacy Notice */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <Shield className="w-4 h-4 text-brand-400" />
          <span>Student Privacy & Responsible AI Notice</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          CampusCue AI is designed as a formative preparation simulator for campus placements. You will interact with AI agents using live audio processed by the configured Google Gemini model provider. High-entropy guest tokens protect your session data, and no raw audio is permanently stored. Every quotation in your feedback report is cryptographically verified against the canonical session transcript to guarantee zero fabricated claims.
        </p>
      </div>
    </div>
  );
};
