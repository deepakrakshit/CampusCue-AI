import React from 'react';
import { Sparkles, Radio, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigateHome?: () => void;
  onHomeClick?: () => void;
  statusText?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigateHome, onHomeClick, statusText }) => {
  const handleHome = () => {
    if (onNavigateHome) onNavigateHome();
    else if (onHomeClick) onHomeClick();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleHome()}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">CampusCue</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20">
                AI Arena
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Voice-First Campus Placement Practice Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentView !== 'landing' && (
            <span className="hidden md:inline-block px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium uppercase tracking-wider">
              {currentView.replace('-', ' ')}
            </span>
          )}

          {statusText && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{statusText}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Server-Side Verified</span>
          </div>
        </div>
      </div>
    </header>
  );
};
