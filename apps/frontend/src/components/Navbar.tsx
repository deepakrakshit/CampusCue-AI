import React from 'react';
import { Sparkles, Radio, Users, UserCheck, Info } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigateHome?: () => void;
  onHomeClick?: () => void;
  onNavigateAbout?: () => void;
  onNavigateGd?: () => void;
  onNavigateInterview?: () => void;
  statusText?: string;
  inSession?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateHome,
  onHomeClick,
  onNavigateAbout,
  onNavigateGd,
  onNavigateInterview,
  statusText,
  inSession = false,
}) => {
  const handleHome = () => {
    if (onNavigateHome) onNavigateHome();
    else if (onHomeClick) onHomeClick();
  };

  return (
    <header className="fixed top-3 left-0 right-0 z-50 transition-all duration-500 px-4 sm:px-6">
      <nav className="relative mx-auto w-full max-w-[1344px] before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-white/10 after:absolute after:inset-x-0 after:bottom-0 after:z-10 after:h-px after:bg-white/10 bg-[#07080d]/85 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/80">
        <div className="flex h-14 items-center justify-between px-5 transition-all">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={handleHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleHome()}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform border border-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                CampusCue
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 font-semibold border border-violet-500/20">
                AI Arena
              </span>
            </div>
          </div>

          {/* Center Navigation - 3 Sections: About, GD ARENA, Interview */}
          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={onNavigateAbout}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'about'
                  ? 'text-white bg-white/10 border border-white/15'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About</span>
            </button>

            <button
              onClick={onNavigateGd}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'gd-setup' || (currentView === 'room' && !inSession)
                  ? 'text-white bg-white/10 border border-white/15'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>GD ARENA</span>
            </button>

            <button
              onClick={onNavigateInterview}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'interview-setup'
                  ? 'text-white bg-white/10 border border-white/15'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Interview</span>
            </button>
          </div>

          {/* Right Action & Status */}
          <div className="flex items-center gap-2.5">
            {statusText ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>{statusText}</span>
              </div>
            ) : inSession ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/40 border border-violet-500/30 text-xs font-mono text-violet-300">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span>Discussion Active</span>
              </div>
            ) : (
              <button
                onClick={onNavigateGd}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
              >
                <span>Launch Arena</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            {/* Mobile Quick Dropdown / Nav trigger buttons */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={onNavigateAbout}
                className={`p-2 rounded-lg text-xs ${currentView === 'about' ? 'text-white bg-white/10' : 'text-neutral-400'}`}
                title="About"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateGd}
                className={`p-2 rounded-lg text-xs ${currentView === 'gd-setup' ? 'text-white bg-white/10' : 'text-neutral-400'}`}
                title="GD Arena"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateInterview}
                className={`p-2 rounded-lg text-xs ${currentView === 'interview-setup' ? 'text-white bg-white/10' : 'text-neutral-400'}`}
                title="Interview"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
