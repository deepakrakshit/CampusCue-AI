import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Send,
  PhoneOff,
  AlertTriangle,
  Volume2,
  Sparkles,
  Zap,
  RotateCcw,
  User,
  Bot,
  MessageSquare,
} from 'lucide-react';
import { api } from '../api/client';
import { AudioPlayer } from '../audio/audio-player';
import { AudioCapture } from '../audio/audio-capture';
import { SpeechRecognizer } from '../audio/speech-recognizer';
import type {
  SessionSnapshot,
  SessionEvent,
  ServerMessage,
  SessionStatus,
  SpeakerLock,
} from '../types';

interface DiscussionRoomViewProps {
  session: SessionSnapshot;
  token: string;
  onSessionEnded: (sessionId: string) => void;
  onReportReady: (sessionId: string, reportId: string) => void;
}

type UIConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'closed';

interface ParticipantMeta {
  id: string;
  name: string;
  role: string;
  badge: string;
  color: string;
  activeColor: string;
  isAi: boolean;
}

const GD_PARTICIPANTS: ParticipantMeta[] = [
  {
    id: 'moderator',
    name: 'Mr. S. Rao (Moderator)',
    role: 'Discussion Moderator',
    badge: 'Moderator',
    color: 'border-slate-700 bg-slate-900/60 text-slate-300',
    activeColor: 'border-blue-500 bg-blue-950/40 text-blue-200 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20',
    isAi: true,
  },
  {
    id: 'agent_a',
    name: 'Priya Sharma',
    role: 'Analytical & Data-Driven',
    badge: 'Analytical',
    color: 'border-slate-800 bg-slate-900/40 text-slate-300',
    activeColor: 'border-blue-400 bg-blue-950/40 text-blue-100 ring-2 ring-blue-400/50 shadow-lg shadow-blue-400/20',
    isAi: true,
  },
  {
    id: 'agent_b',
    name: 'Rohan Mehta',
    role: 'Challenger & Contrarian',
    badge: 'Challenger',
    color: 'border-slate-800 bg-slate-900/40 text-slate-300',
    activeColor: 'border-amber-400 bg-amber-950/40 text-amber-100 ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/20',
    isAi: true,
  },
  {
    id: 'agent_c',
    name: 'Ananya Iyer',
    role: 'Problem Solver & Structured',
    badge: 'Problem Solver',
    color: 'border-slate-800 bg-slate-900/40 text-slate-300',
    activeColor: 'border-emerald-400 bg-emerald-950/40 text-emerald-100 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-400/20',
    isAi: true,
  },
  {
    id: 'agent_d',
    name: 'Vikram Patel',
    role: 'Collaborator & Synthesizer',
    badge: 'Collaborator',
    color: 'border-slate-800 bg-slate-900/40 text-slate-300',
    activeColor: 'border-cyan-400 bg-cyan-950/40 text-cyan-100 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-400/20',
    isAi: true,
  },
];

function isParticipantSpeaking(participantId: string, speakerId: string | null): boolean {
  if (!speakerId) return false;
  if (speakerId === participantId) return true;
  if (participantId === 'agent_a' && (speakerId === 'priya' || speakerId.includes('Priya'))) return true;
  if (participantId === 'agent_b' && (speakerId === 'rohan' || speakerId.includes('Rohan'))) return true;
  if (participantId === 'agent_c' && (speakerId === 'ananya' || speakerId.includes('Ananya'))) return true;
  if (participantId === 'agent_d' && (speakerId === 'vikram' || speakerId.includes('Vikram'))) return true;
  if (participantId === 'moderator' && (speakerId === 'moderator' || speakerId.includes('Moderator') || speakerId.includes('Rao'))) return true;
  return false;
}

const INTERVIEW_PARTICIPANTS: ParticipantMeta[] = [
  {
    id: 'interviewer',
    name: 'Lead Technical Interviewer',
    role: 'Senior Staff Engineer',
    badge: 'Interviewer',
    color: 'border-slate-700 bg-slate-900/60 text-slate-300',
    activeColor: 'border-purple-400 bg-purple-950/40 text-purple-100 ring-2 ring-purple-400/50 shadow-lg shadow-purple-400/20',
    isAi: true,
  },
];

export const DiscussionRoomView: React.FC<DiscussionRoomViewProps> = ({
  session,
  token,
  onSessionEnded,
  onReportReady,
}) => {
  // Session states
  const [connectionState, setConnectionState] = useState<UIConnectionState>('connecting');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(session.status);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(session.activeSpeakerId);
  const [speakerLock, setSpeakerLock] = useState<SpeakerLock>(session.speakerLock);
  const [generationEpoch, setGenerationEpoch] = useState<number>(session.generationEpoch);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(session.durationSeconds);
  const [interruptionNotice, setInterruptionNotice] = useState<boolean>(false);

  // Transcript state
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [interimText, setInterimText] = useState<{ speakerId: string; speakerLabel: string; text: string } | null>(
    null
  );
  const [textInput, setTextInput] = useState('');

  // Audio state
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isMicSpeaking, setIsMicSpeaking] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const currentEpochRef = useRef<number>(session.generationEpoch);
  const isInterruptionCooldownRef = useRef<boolean>(false);
  const isMicMutedRef = useRef<boolean>(isMicMuted);
  const sessionStatusRef = useRef<SessionStatus>(sessionStatus);
  const activeSpeakerIdRef = useRef<string | null>(activeSpeakerId);
  const speechRecognizerRef = useRef<SpeechRecognizer | null>(null);

  // Synchronize state to refs for non-tearing background loops
  useEffect(() => {
    currentEpochRef.current = generationEpoch;
  }, [generationEpoch]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
    if (speechRecognizerRef.current) {
      if (isMicMuted) {
        speechRecognizerRef.current.stop();
      } else if (sessionStatus === 'running') {
        speechRecognizerRef.current.start();
      }
    }
  }, [isMicMuted, sessionStatus]);

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  useEffect(() => {
    activeSpeakerIdRef.current = activeSpeakerId;
  }, [activeSpeakerId]);

  // Auto-scroll transcript to bottom
  const scrollToBottom = useCallback(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [events, interimText, scrollToBottom]);

  // Timer countdown
  useEffect(() => {
    if (sessionStatus !== 'running') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStatus]);

  // Handle WebSocket message
  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'server.connected':
          setConnectionState('connected');
          setGenerationEpoch(msg.generationEpoch);
          if (audioPlayerRef.current) {
            audioPlayerRef.current.setGenerationEpoch(msg.generationEpoch);
          }
          break;

        case 'session.state_changed':
          setSessionStatus(msg.status);
          setSpeakerLock(msg.speakerLock);
          setActiveSpeakerId(msg.activeSpeakerId);
          setGenerationEpoch(msg.generationEpoch);
          if (audioPlayerRef.current) {
            audioPlayerRef.current.setGenerationEpoch(msg.generationEpoch);
          }
          break;

        case 'speaker.turn_started':
          setActiveSpeakerId(msg.speakerId);
          setGenerationEpoch(msg.generationEpoch);
          if (audioPlayerRef.current) {
            audioPlayerRef.current.setGenerationEpoch(msg.generationEpoch);
          }
          break;

        case 'speaker.turn_completed':
          if (activeSpeakerId === msg.speakerId) {
            setActiveSpeakerId(null);
          }
          setInterimText(null);
          break;

        case 'audio.chunk':
          // Pass chunk directly to audio player (player fences stale epochs)
          if (audioPlayerRef.current) {
            audioPlayerRef.current.enqueueChunk(msg.audioBase64, msg.chunkSequence, msg.generationEpoch);
          }
          break;

        case 'transcript.interim':
          setInterimText({
            speakerId: msg.speakerId,
            speakerLabel: msg.speakerLabel,
            text: msg.text,
          });
          break;

        case 'transcript.final':
          setInterimText(null);
          setEvents((prev) => {
            // Deduplicate by eventId or sequence
            if (prev.some((e) => e.eventId === msg.event.eventId || e.sequence === msg.event.sequence)) {
              return prev;
            }
            return [...prev, msg.event].sort((a, b) => a.sequence - b.sequence);
          });
          break;

        case 'student.interruption_detected':
          // Immediate visual and audio feedback
          setGenerationEpoch(msg.generationEpoch);
          if (audioPlayerRef.current) {
            audioPlayerRef.current.cancelPlayback();
            audioPlayerRef.current.setGenerationEpoch(msg.generationEpoch);
          }
          setInterruptionNotice(true);
          setTimeout(() => setInterruptionNotice(false), 2000);
          break;

        case 'session.reconnecting':
          setConnectionState('reconnecting');
          break;

        case 'report.pending':
          setSessionStatus('report_pending');
          break;

        case 'report.ready':
          setSessionStatus('completed');
          onReportReady(msg.sessionId, msg.reportId);
          break;

        case 'report.failed':
          setAudioError(`Report generation failed: ${msg.error}`);
          break;

        default:
          break;
      }
    },
    [activeSpeakerId, onReportReady]
  );

  // Trigger Student Barge-In / Interruption
  const handleStudentInterruption = useCallback(() => {
    if (isInterruptionCooldownRef.current) return;
    isInterruptionCooldownRef.current = true;
    setTimeout(() => {
      isInterruptionCooldownRef.current = false;
    }, 1000);

    // 1. Immediately cancel all audio playback locally
    if (audioPlayerRef.current) {
      audioPlayerRef.current.cancelPlayback();
    }

    // 2. Visual interruption feedback
    setInterruptionNotice(true);
    setTimeout(() => setInterruptionNotice(false), 2000);

    // 3. Send interruption event to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'student.interruption',
          generationEpoch: currentEpochRef.current,
        })
      );
    }
  }, []);

  // Send student text fallback
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // If an AI is currently speaking, sending a text contribution immediately takes the floor
    if (activeSpeakerIdRef.current && activeSpeakerIdRef.current !== 'student') {
      handleStudentInterruption();
    }

    wsRef.current.send(
      JSON.stringify({
        type: 'transcript.student_text',
        text: textInput.trim(),
      })
    );
    setTextInput('');
  };

  // Keyboard shortcut: Spacebar to Barge-In / Claim Floor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleStudentInterruption();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleStudentInterruption]);

  // End Session Early
  const handleEndSession = async () => {
    const confirmed = window.confirm('Are you sure you want to conclude this session and generate your report?');
    if (!confirmed) return;

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'session.end',
          })
        );
      }
      setSessionStatus('closing');
      await api.endSession(session.sessionId, token);
      onSessionEnded(session.sessionId);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  // Initialize WebSocket & Audio
  useEffect(() => {
    // 1. Initialize Audio Player
    const player = new AudioPlayer();
    audioPlayerRef.current = player;
    player.setGenerationEpoch(session.generationEpoch);

    // 2. Initialize WebSocket
    const ws = api.createWebSocketConnection(session.sessionId, token);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('connected');
      // Request backend to start session orchestration and initialize providers
      ws.send(JSON.stringify({ type: 'session.start_requested' }));
    };

    // Auto-start via REST API if session is in 'created' state
    if (session.status === 'created') {
      api.startSession(session.sessionId, token).catch((err) => {
        console.warn('REST startSession notice:', err);
      });
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        handleServerMessage(msg);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (_err: Event) => {
      console.error('WebSocket error occurred');
      setConnectionState('reconnecting');
    };

    ws.onclose = () => {
      setConnectionState('closed');
    };

    // 3. Heartbeat ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);

    // Fetch initial canonical transcript events from SQLite
    api
      .getEvents(session.sessionId, token)
      .then((data) => {
        if (data?.events?.length) {
          setEvents(data.events);
        }
      })
      .catch((err) => {
        console.warn('Initial events load notice:', err);
      });

    // 4. Initialize Microphone Capture
    const capture = new AudioCapture(
      (audioBase64) => {
        // Callback on audio chunk from microphone
        if (ws.readyState === WebSocket.OPEN && !isMicMutedRef.current && sessionStatusRef.current === 'running') {
          ws.send(
            JSON.stringify({
              type: 'audio.chunk',
              audioBase64,
            })
          );
        }
      },
      (speaking) => {
        // Disregard speech if mic is muted or session is not actively running
        if (isMicMutedRef.current || sessionStatusRef.current !== 'running') {
          setIsMicSpeaking(false);
          return;
        }

        setIsMicSpeaking(speaking);
        if (speaking && ws.readyState === WebSocket.OPEN) {
          // If candidate is the active speaker or floor is idle, broadcast turn start
          // Note: Automatic interruption solely by mic energy during AI speech is disabled
          // to prevent laptop speaker acoustic echo from self-interrupting the AI speaker.
          // Explicit barge-in is triggered via [⚡ Barge In], Spacebar, or typing chat.
          if (activeSpeakerIdRef.current === 'student' || activeSpeakerIdRef.current === null) {
            ws.send(JSON.stringify({ type: 'student.turn_start' }));
          }
        } else if (!speaking && ws.readyState === WebSocket.OPEN) {
          if (activeSpeakerIdRef.current === 'student') {
            ws.send(JSON.stringify({ type: 'student.turn_end' }));
          }
        }
      }
    );
    audioCaptureRef.current = capture;

    // 5. Initialize Live Speech Recognizer for candidate microphone
    const recognizer = new SpeechRecognizer({
      onSpeechStart: () => {
        if (isMicMutedRef.current || sessionStatusRef.current !== 'running') return;
        setIsMicSpeaking(true);
        if (activeSpeakerIdRef.current === 'student' || activeSpeakerIdRef.current === null) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'student.turn_start' }));
          }
        }
      },
      onSpeechEnd: () => {
        setIsMicSpeaking(false);
      },
      onInterimText: (text) => {
        if (isMicMutedRef.current || sessionStatusRef.current !== 'running') return;
        setInterimText({
          speakerId: 'student',
          speakerLabel: 'You (Candidate)',
          text,
        });
      },
      onFinalText: (text) => {
        if (isMicMutedRef.current || sessionStatusRef.current !== 'running') return;
        setInterimText(null);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'transcript.student_text',
              text,
            })
          );
        }
      },
      onError: (err) => {
        console.warn('Speech recognition notice:', err);
      },
    });
    speechRecognizerRef.current = recognizer;

    // Start audio capture, then start SpeechRecognizer once microphone permission is granted
    capture
      .start()
      .then(() => {
        if (recognizer.isSupported() && !isMicMutedRef.current) {
          recognizer.start();
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Microphone access denied or unavailable.';
        setAudioError(`${msg} (You can use text chat input below as fallback)`);
      });

    return () => {
      clearInterval(pingInterval);
      recognizer.stop();
      capture.stop();
      player.dispose();
      ws.close();
    };
  }, [session.sessionId, token, session.status, session.generationEpoch, handleServerMessage, handleStudentInterruption]);

  // Format seconds mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const participants = session.mode === 'gd' ? GD_PARTICIPANTS : INTERVIEW_PARTICIPANTS;
  const isAiSpeaking = activeSpeakerId !== null && activeSpeakerId !== 'student';
  const activeAiParticipant = participants.find((p) => isParticipantSpeaking(p.id, activeSpeakerId));

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 py-4 gap-4">
      {/* Top Header Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              session.mode === 'gd' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
            }`}
          >
            {session.mode === 'gd' ? 'Group Discussion' : 'Technical Interview'}
          </span>
          <h2 className="text-sm font-semibold text-white max-w-md truncate" title={session.topic || 'Discussion Session'}>
            {session.topic || 'Placement Session'}
          </h2>
        </div>

        {/* Live Timer and Connection Status */}
        <div className="flex items-center gap-4">
          {/* Interruption Alert Banner */}
          {interruptionNotice && (
            <div className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>Student Barge-In Active</span>
            </div>
          )}

          {/* Timer Display */}
          <div
            className={`px-3 py-1 rounded-xl font-mono text-sm font-bold border flex items-center gap-1.5 ${
              secondsRemaining <= 30
                ? 'bg-red-950/40 border-red-500/60 text-red-400 animate-pulse'
                : secondsRemaining <= 60
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 text-xs">
            {connectionState === 'connected' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Live</span>
              </span>
            ) : connectionState === 'reconnecting' ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <RotateCcw className="w-3 h-3 animate-spin" />
                <span>Reconnecting...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Disconnected</span>
              </span>
            )}
          </div>

          {/* End Session Button */}
          <button
            type="button"
            onClick={handleEndSession}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/50 border border-slate-700/80 text-slate-400 transition-colors"
            title="Conclude Session Early"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {audioError && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{audioError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAudioError(null)}
            className="text-amber-400 hover:text-amber-200 text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Room Grid: Left = Video/Avatar Grid, Right = Real-Time Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Column: Participant Cards (8 cols on large screens) */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 overflow-y-auto pr-1">
            {/* Student Card */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all relative ${
                activeSpeakerId === 'student' || isMicSpeaking
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">You (Student)</h3>
                    <span className="text-[10px] text-slate-400">Candidate</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isMicMuted ? (
                    <span className="p-1 rounded bg-red-950/60 text-red-400 text-xs" title="Mic Muted">
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span
                      className={`p-1 rounded text-xs ${
                        isMicSpeaking ? 'bg-indigo-600/30 text-indigo-400 animate-pulse' : 'bg-slate-800 text-slate-400'
                      }`}
                      title={isMicSpeaking ? 'Speaking' : 'Listening'}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Status and Audio Waves */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {isMicSpeaking ? 'Active Speaker' : isMicMuted ? 'Muted' : 'Ready to Speak'}
                </span>
                {isMicSpeaking && (
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-1 h-5 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Participant Cards */}
            {participants.map((p) => {
              const isSpeaking = isParticipantSpeaking(p.id, activeSpeakerId);
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all relative ${
                    isSpeaking ? p.activeColor : p.color
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                        <span className="text-[10px] text-slate-400 truncate block">{p.badge}</span>
                      </div>
                    </div>
                    {isSpeaking && (
                      <span className="p-1 rounded bg-indigo-600/30 text-indigo-300" title="Audible Speaker">
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{p.role}</p>

                  {/* Waveform indicator when speaking */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {isSpeaking ? 'Speaking...' : 'Listening'}
                    </span>
                    {isSpeaking && (
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-current rounded-full animate-bounce [animation-delay:0ms]"></span>
                        <span className="w-1 h-5 bg-current rounded-full animate-bounce [animation-delay:150ms]"></span>
                        <span className="w-1 h-3 bg-current rounded-full animate-bounce [animation-delay:300ms]"></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Speaker Banner / Barge-In Dock */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isAiSpeaking
                    ? 'bg-amber-400 animate-ping'
                    : isMicSpeaking
                    ? 'bg-indigo-500 animate-ping'
                    : 'bg-emerald-500'
                }`}
              />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {isAiSpeaking
                    ? `${activeAiParticipant?.name || 'AI Participant'} is speaking`
                    : isMicSpeaking
                    ? 'You are speaking'
                    : 'Floor is open — Jump in anytime'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isAiSpeaking
                    ? 'Press Barge In below or speak into mic to take the floor immediately'
                    : `Backend single-speaker lock: ${speakerLock}`}
                </p>
              </div>
            </div>

            {/* Prominent Barge-In Button */}
            <button
              type="button"
              onClick={handleStudentInterruption}
              className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                isAiSpeaking
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isAiSpeaking ? 'Barge In / Interrupt' : 'Claim Floor'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Canonical Transcript Stream (5 cols on large screens) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl min-h-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Canonical Live Transcript</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Seq #{events.length > 0 ? events[events.length - 1].sequence : 0}
            </span>
          </div>

          {/* Transcript Scroll Area */}
          <div ref={transcriptScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
            {events.length === 0 && !interimText && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Sparkles className="w-8 h-8 mb-2 text-slate-600 animate-pulse" />
                <p className="text-xs">Connecting to discussion room...</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  The moderator will open the discussion shortly.
                </p>
              </div>
            )}

            {events.map((e) => {
              const isStudent = e.speakerId === 'student';
              return (
                <div
                  key={e.eventId}
                  className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                    isStudent
                      ? 'border-indigo-500/30 bg-indigo-950/20 text-indigo-100 ml-4'
                      : e.speakerId === 'moderator'
                      ? 'border-slate-700/60 bg-slate-950/70 text-slate-200 mr-4'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`font-bold text-[11px] ${
                        isStudent ? 'text-indigo-400' : 'text-slate-300'
                      }`}
                    >
                      {e.speakerLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">#{e.sequence}</span>
                  </div>
                  <p className="break-words">{e.text}</p>
                </div>
              );
            })}

            {/* Interim live transcription preview */}
            {interimText && (
              <div className="p-3 rounded-xl border border-dashed border-indigo-500/40 bg-slate-950/40 text-xs italic text-slate-400 animate-pulse">
                <span className="font-bold text-[11px] text-indigo-400 not-italic block mb-1">
                  {interimText.speakerLabel} (speaking...)
                </span>
                <p>{interimText.text}</p>
              </div>
            )}
          </div>

          {/* Fallback Text Message Form */}
          <form onSubmit={handleSendText} className="p-3 border-t border-slate-800 bg-slate-950/80 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type message fallback..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Control Dock */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMicMuted((prev) => !prev)}
            className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold ${
              isMicMuted
                ? 'bg-red-950/40 border-red-800/60 text-red-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-400" />}
            <span>{isMicMuted ? 'Mic Muted' : 'Mic Active'}</span>
          </button>
        </div>

        <div className="text-center hidden sm:block">
          <p className="text-xs text-slate-400">
            {sessionStatus === 'report_pending'
              ? 'Finalizing discussion transcript & evaluating metrics...'
              : 'Speaking into your mic automatically downsamples to 16kHz PCM'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleEndSession}
          className="py-2.5 px-5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold transition-colors flex items-center gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Conclude & Generate Report</span>
        </button>
      </div>
    </div>
  );
};
