import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { AboutView } from './components/AboutView';
import { GdSetupView } from './components/GdSetupView';
import { InterviewSetupView } from './components/InterviewSetupView';
import { DiscussionRoomView } from './components/DiscussionRoomView';
import { ReportView } from './components/ReportView';
import type { SessionSnapshot } from './types';

type AppView = 'landing' | 'about' | 'gd-setup' | 'interview-setup' | 'room' | 'report';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeSession, setActiveSession] = useState<SessionSnapshot | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  const handleStartGd = () => {
    setCurrentView('gd-setup');
  };

  const handleStartInterview = () => {
    setCurrentView('interview-setup');
  };

  const handleNavigateAbout = () => {
    setCurrentView('about');
  };

  const handleSessionCreated = (session: SessionSnapshot, token: string) => {
    setActiveSession(session);
    setSessionToken(token);
    setCurrentReportId(null);
    setCurrentView('room');
  };

  const handleSessionEnded = (_sessionId: string) => {
    // When ended, wait for report ready or transition
  };

  const handleReportReady = (_sessionId: string, reportId: string) => {
    setCurrentReportId(reportId);
    setCurrentView('report');
  };

  const handleHome = () => {
    setActiveSession(null);
    setSessionToken('');
    setCurrentReportId(null);
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200">
      <Navbar
        onHomeClick={handleHome}
        onNavigateHome={handleHome}
        onNavigateAbout={handleNavigateAbout}
        onNavigateGd={handleStartGd}
        onNavigateInterview={handleStartInterview}
        currentView={currentView}
        inSession={currentView === 'room'}
      />

      <main className="flex-1 flex flex-col pt-16">
        {currentView === 'landing' && (
          <LandingView onStartGd={handleStartGd} onStartInterview={handleStartInterview} />
        )}

        {currentView === 'about' && (
          <AboutView onStartGd={handleStartGd} onStartInterview={handleStartInterview} />
        )}

        {currentView === 'gd-setup' && (
          <GdSetupView onSessionCreated={handleSessionCreated} onCancel={handleHome} />
        )}

        {currentView === 'interview-setup' && (
          <InterviewSetupView onSessionCreated={handleSessionCreated} onCancel={handleHome} />
        )}

        {currentView === 'room' && activeSession && (
          <DiscussionRoomView
            session={activeSession}
            token={sessionToken}
            onSessionEnded={handleSessionEnded}
            onReportReady={handleReportReady}
          />
        )}

        {currentView === 'report' && activeSession && (
          <ReportView
            sessionId={activeSession.sessionId}
            reportId={currentReportId || undefined}
            token={sessionToken}
            onHome={handleHome}
            onRetrySession={activeSession.mode === 'gd' ? handleStartGd : handleStartInterview}
          />
        )}
      </main>
    </div>
  );
};

export default App;
