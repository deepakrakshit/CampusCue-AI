import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/database.js';
import { SessionRepository } from '../db/session-repository.js';
import { EventRepository } from '../db/event-repository.js';
import { ReportRepository } from '../db/report-repository.js';
import { EvaluatorService } from '../services/evaluator-service.js';
import type { SessionRecord } from '../types/session.js';
import type { ServerMessage } from '../types/websocket.js';
import type { LiveProvider } from '../providers/live-provider.js';
import { MockGeminiLiveProvider } from '../providers/mock-gemini-live-provider.js';
import { RealGeminiLiveProvider } from '../providers/real-gemini-live-provider.js';
import { TurnScheduler } from './turn-scheduler.js';
import { GD_PERSONAS, MODERATOR_CONFIG, createInterviewerConfig } from './personas.js';
import { getEnv, getAgentApiKey } from '../config/env.js';

export interface OrchestratorClient {
  send: (data: string) => void;
  isOpen: () => boolean;
}

export class SessionOrchestrator {
  readonly sessionId: string;
  private db: DatabaseSync;
  private sessionRepo: SessionRepository;
  private eventRepo: EventRepository;
  private reportRepo: ReportRepository;
  private evaluatorService: EvaluatorService;
  private scheduler: TurnScheduler;
  private providers: Map<string, LiveProvider> = new Map();
  private clients: Set<OrchestratorClient> = new Set();
  private isDestroyed = false;
  private isMockMode = false;
  private timerHandle: NodeJS.Timeout | null = null;
  private studentTurnTimerHandle: NodeJS.Timeout | null = null;
  private aiTurnTimerHandle: NodeJS.Timeout | null = null;
  private chunkSequence = 0;
  private currentTurnAudioBytes = 0;
  private currentTurnStartTime = 0;
  private studentAudioChunks: Buffer[] = [];

  constructor(sessionId: string, db?: DatabaseSync) {
    this.sessionId = sessionId;
    this.db = db || getDatabase();
    this.sessionRepo = new SessionRepository(this.db);
    this.eventRepo = new EventRepository(this.db);
    this.reportRepo = new ReportRepository(this.db);
    this.evaluatorService = new EvaluatorService();

    const session = this.sessionRepo.getSessionById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.scheduler = new TurnScheduler({
      sessionId,
      mode: session.mode,
      onScheduleSpeaker: (speakerId, speakerLabel) =>
        this.executeScheduledTurn(speakerId, speakerLabel),
    });
    this.scheduler.setGenerationEpoch(session.generation_epoch);
  }

  addClient(client: OrchestratorClient): void {
    this.clients.add(client);
    const session = this.sessionRepo.getSessionById(this.sessionId);
    if (!session) return;

    // Send connection handshake
    client.send(
      JSON.stringify({
        type: 'server.connected',
        sessionId: this.sessionId,
        sequence: session.next_sequence - 1,
        generationEpoch: session.generation_epoch,
      })
    );
  }

  removeClient(client: OrchestratorClient): void {
    this.clients.delete(client);
  }

  broadcast(message: ServerMessage): void {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.isOpen()) {
        try {
          client.send(payload);
        } catch {
          // ignore client send error
        }
      }
    }
  }

  async initializeProviders(useMock = false): Promise<void> {
    if (this.providers.size > 0) return;

    const session = this.sessionRepo.getSessionById(this.sessionId);
    if (!session) return;

    const env = getEnv();
    const isMock = useMock || env.MOCK_PROVIDERS || env.NODE_ENV === 'test';
    this.isMockMode = isMock;

    if (session.mode === 'gd') {
      const personaKeys: Array<'agent_a' | 'agent_b' | 'agent_c' | 'agent_d'> = [
        'agent_a',
        'agent_b',
        'agent_c',
        'agent_d',
      ];

      for (const pKey of personaKeys) {
        const persona = GD_PERSONAS[pKey];
        const provider: LiveProvider = isMock
          ? new MockGeminiLiveProvider({ agentId: pKey, modelId: env.GEMINI_LIVE_MODEL })
          : new RealGeminiLiveProvider({
              agentId: pKey,
              apiKey: getAgentApiKey(pKey),
              modelId: env.GEMINI_LIVE_MODEL,
              systemInstruction: `${persona.systemInstruction}\nTopic of discussion: ${session.topic}`,
              voiceName: persona.voiceName,
            });

        this.setupProviderCallbacks(provider, pKey, persona.name);
        await provider.connect();
        this.providers.set(pKey, provider);
      }
    } else {
      // Interview Mode
      let configInput: any = {};
      try {
        configInput = JSON.parse(session.config_json);
      } catch {
        // ignore
      }

      const interviewerPersona = createInterviewerConfig(
        configInput.interview?.targetRole || 'Software Engineer',
        configInput.interview?.projectDescription,
        configInput.interview?.resumeText
      );

      const provider: LiveProvider = isMock
        ? new MockGeminiLiveProvider({ agentId: 'interviewer', modelId: env.GEMINI_LIVE_MODEL })
        : new RealGeminiLiveProvider({
            agentId: 'interviewer',
            apiKey: getAgentApiKey('interviewer'),
            modelId: env.GEMINI_LIVE_MODEL,
            systemInstruction: interviewerPersona.systemInstruction,
            voiceName: interviewerPersona.voiceName,
          });

      this.setupProviderCallbacks(provider, 'interviewer', interviewerPersona.name);
      await provider.connect();
      this.providers.set('interviewer', provider);
    }
  }

  private setupProviderCallbacks(
    provider: LiveProvider,
    speakerId: string,
    speakerLabel: string
  ): void {
    provider.setCallbacks({
      onAudioChunk: (audioBase64) => {
        const currentTurnId = this.scheduler.getCurrentTurnId();
        const activeSpeaker = this.scheduler.getActiveSpeakerId();
        const activeEpoch = this.scheduler.getActiveGenerationEpoch();

        // One-Speaker Invariant & Epoch Fencing:
        // Only publish audio if this provider owns the speaker lock and epoch matches
        if (
          this.scheduler.getSpeakerLock() === 'ai-speaking' &&
          activeSpeaker === speakerId &&
          currentTurnId
        ) {
          const chunkBytes = Buffer.from(audioBase64, 'base64').length;
          this.currentTurnAudioBytes += chunkBytes;

          this.chunkSequence++;
          this.broadcast({
            type: 'audio.chunk',
            speakerId,
            turnId: currentTurnId,
            chunkSequence: this.chunkSequence,
            generationEpoch: activeEpoch,
            audioBase64,
          });
        }
      },
      onInterimText: (text) => {
        const activeSpeaker = this.scheduler.getActiveSpeakerId();
        if (activeSpeaker === speakerId) {
          this.broadcast({
            type: 'transcript.interim',
            speakerId,
            speakerLabel,
            text,
            turnId: this.scheduler.getCurrentTurnId() || undefined,
          });
        }
      },
      onFinalText: (text) => {
        const activeSpeaker = this.scheduler.getActiveSpeakerId();
        if (activeSpeaker === speakerId) {
          this.onAiTurnFinished(speakerId, speakerLabel, text);
        }
      },
      onInterruption: () => {
        // Provider confirmed local generation halted
      },
      onError: (err) => {
        this.broadcast({
          type: 'notice',
          level: 'warn',
          message: `Provider ${speakerId} warning: ${err.message}`,
        });
      },
    });
  }

  async startSession(): Promise<SessionRecord> {
    let session = this.sessionRepo.getSessionById(this.sessionId);
    if (!session) throw new Error(`Session not found: ${this.sessionId}`);

    if (session.status === 'running') {
      return session;
    }

    const now = new Date().toISOString();
    let durationSeconds = 300;
    try {
      const cfg = JSON.parse(session.config_json);
      if (cfg?.durationSeconds) durationSeconds = cfg.durationSeconds;
    } catch {
      // default
    }
    const deadlineAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

    this.sessionRepo.updateSessionStatus(this.sessionId, 'running', {
      started_at: now,
      deadline_at: deadlineAt,
    });

    session = this.sessionRepo.getSessionById(this.sessionId)!;

    this.broadcast({
      type: 'session.state_changed',
      status: 'running',
      speakerLock: this.scheduler.getSpeakerLock(),
      activeSpeakerId: this.scheduler.getActiveSpeakerId(),
      generationEpoch: session.generation_epoch,
    });

    // If GD mode, moderator opens the discussion
    if (session.mode === 'gd') {
      const openingText = `Welcome participants to today's placement group discussion on the topic: "${session.topic}". Each of you will have the floor to share your insights. Priya, would you like to start?`;
      const modEvent = this.eventRepo.appendEvent({
        sessionId: this.sessionId,
        kind: 'moderator',
        speakerId: 'moderator',
        speakerLabel: MODERATOR_CONFIG.name,
        text: openingText,
      });

      this.broadcast({
        type: 'transcript.final',
        event: modEvent,
      });

      // Synchronize context to all background participants
      await this.syncContextToAllAgents({ role: 'user', text: `[Moderator]: ${openingText}` });

      // Trigger first participant turn
      setTimeout(() => {
        this.scheduler.triggerNextTurn();
      }, 1000);
    } else {
      // Interview mode: opening greeting
      const openingText = `Hello! Welcome to your technical interview. I will be probing your project experience, architecture choices, and debugging skills. To begin, could you briefly summarize your primary project and your personal role in it?`;
      const modEvent = this.eventRepo.appendEvent({
        sessionId: this.sessionId,
        kind: 'moderator',
        speakerId: 'interviewer',
        speakerLabel: 'Arjun Das',
        text: openingText,
      });

      this.broadcast({
        type: 'transcript.final',
        event: modEvent,
      });

      await this.syncContextToAllAgents({ role: 'model', text: openingText });
    }

    // Set deadline timer
    this.timerHandle = setTimeout(() => {
      this.handleDeadlineExpired();
    }, durationSeconds * 1000);

    return session;
  }

  private async executeScheduledTurn(speakerId: string, speakerLabel: string): Promise<void> {
    if (this.isDestroyed) return;

    const session = this.sessionRepo.getSessionById(this.sessionId);
    if (!session || session.status !== 'running') return;

    const turnId = randomUUID();
    const epoch = session.generation_epoch;

    if (speakerId === 'student') {
      // Formally yield floor to the candidate in discussion flow
      this.scheduler.handleStudentBargeIn(epoch);
      this.sessionRepo.updateSpeakerLock(this.sessionId, 'student-speaking', 'student');

      const inviteText = `Candidate, we would love to hear your thoughts on this. The floor is yours, please go ahead!`;
      const modEvent = this.eventRepo.appendEvent({
        sessionId: this.sessionId,
        kind: 'moderator',
        speakerId: 'moderator',
        speakerLabel: 'Mr. S. Rao (Moderator)',
        text: inviteText,
      });

      this.broadcast({
        type: 'transcript.final',
        event: modEvent,
      });

      this.broadcast({
        type: 'speaker.turn_started',
        speakerId: 'student',
        speakerLabel: 'Candidate',
        turnId,
        generationEpoch: epoch,
      });

      this.broadcast({
        type: 'session.state_changed',
        status: 'running',
        speakerLock: 'student-speaking',
        activeSpeakerId: 'student',
        generationEpoch: epoch,
      });

      // Synchronize moderator invite to background agents
      await this.syncContextToAllAgents({ role: 'user', text: `[Moderator]: ${inviteText}` });

      // Student turn window timer (25 seconds). If candidate does not speak, move to next turn
      if (this.studentTurnTimerHandle) {
        clearTimeout(this.studentTurnTimerHandle);
      }
      this.studentTurnTimerHandle = setTimeout(() => {
        const freshSession = this.sessionRepo.getSessionById(this.sessionId);
        if (freshSession?.speaker_lock === 'student-speaking' && this.scheduler.getActiveSpeakerId() === 'student') {
          this.scheduler.releaseLock();
          this.sessionRepo.updateSpeakerLock(this.sessionId, 'idle', null);
          this.broadcast({
            type: 'session.state_changed',
            status: 'running',
            speakerLock: 'idle',
            activeSpeakerId: null,
            generationEpoch: epoch,
          });
          setTimeout(() => {
            if (this.scheduler.getSpeakerLock() === 'idle') {
              this.scheduler.triggerNextTurn();
            }
          }, 1000);
        }
      }, 25000);

      return;
    }

    const lockAcquired = this.scheduler.acquireAiLock(speakerId, speakerLabel, turnId, epoch);
    if (!lockAcquired) return;

    this.currentTurnAudioBytes = 0;
    this.currentTurnStartTime = Date.now();

    this.sessionRepo.updateSpeakerLock(this.sessionId, 'ai-speaking', speakerId);

    this.broadcast({
      type: 'speaker.turn_started',
      speakerId,
      speakerLabel,
      turnId,
      generationEpoch: epoch,
    });

    this.broadcast({
      type: 'session.state_changed',
      status: 'running',
      speakerLock: 'ai-speaking',
      activeSpeakerId: speakerId,
      generationEpoch: epoch,
    });

    const provider = this.providers.get(speakerId);
    if (provider) {
      try {
        const recentEvents = this.eventRepo.getRecentTranscriptEvents(this.sessionId, 4);
        let contextualGuidance = '';
        if (recentEvents.length > 0) {
          const flowLines = recentEvents
            .map((e) => {
              const name = e.speakerId === 'student' ? 'Candidate' : e.speakerLabel;
              return `- [${name}]: "${e.text}"`;
            })
            .join('\n');

          const lastSpeakerEvent = recentEvents[recentEvents.length - 1];
          const lastSpeakerName =
            lastSpeakerEvent.speakerId === 'student' ? 'Candidate' : lastSpeakerEvent.speakerLabel;

          contextualGuidance = `\nRecent group discussion flow:\n${flowLines}\n\nCRITICAL CONTEXT: In your opening sentence, you MUST directly address or react to what was just spoken, especially acknowledging ${lastSpeakerName}'s point. Build upon their point or politely challenge it with your perspective. Never ignore the previous speaker!`;
        }

        const promptText =
          session.mode === 'gd'
            ? `You are ${speakerLabel}. Discussion topic: "${session.topic}".${contextualGuidance}\nSpeak in natural conversational Hinglish (blend fluent English with natural conversational Hindi words like 'bilkul', 'sahi point hai', 'dekho', 'yaar', 'actually', 'point yeh hai', 'matlab'). Keep your response concise (2-3 sentences max). Address the group now.`
            : `Please ask the candidate your next technical interview question concisely.`;

        await provider.sendClientContent(
          [{ role: 'user', text: promptText }],
          true // turnComplete = true triggers speech generation
        );
      } catch (err) {
        // Recover cleanly if provider call throws
        this.scheduler.releaseLock();
        this.sessionRepo.updateSpeakerLock(this.sessionId, 'idle', null);
        this.broadcast({
          type: 'session.state_changed',
          status: 'running',
          speakerLock: 'idle',
          activeSpeakerId: null,
          generationEpoch: epoch,
        });
        setTimeout(() => {
          if (this.scheduler.getSpeakerLock() === 'idle') {
            this.scheduler.triggerNextTurn();
          }
        }, 1500);
      }
    }
  }

  /**
   * Student starts speaking (VAD transition or mic claim): acquire lock or interrupt
   */
  async handleStudentSpeechStarted(): Promise<void> {
    const session = this.sessionRepo.getSessionById(this.sessionId);
    if (!session || session.status !== 'running') return;

    if (this.scheduler.getSpeakerLock() === 'ai-speaking') {
      await this.handleStudentBargeIn();
      return;
    }

    this.studentAudioChunks = [];

    if (this.scheduler.getSpeakerLock() === 'idle') {
      this.scheduler.handleStudentBargeIn(session.generation_epoch);
      this.sessionRepo.updateSpeakerLock(this.sessionId, 'student-speaking', 'student');
      this.broadcast({
        type: 'session.state_changed',
        status: 'running',
        speakerLock: 'student-speaking',
        activeSpeakerId: 'student',
        generationEpoch: session.generation_epoch,
      });
    }
  }

  /**
   * Buffer real-time PCM audio chunks streamed from candidate microphone
   */
  handleStudentAudioChunk(audioBase64: string): void {
    if (this.isDestroyed) return;
    if (
      this.scheduler.getActiveSpeakerId() === 'student' ||
      this.scheduler.getSpeakerLock() === 'student-speaking'
    ) {
      try {
        const buf = Buffer.from(audioBase64, 'base64');
        this.studentAudioChunks.push(buf);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Student barge-in: immediately cancel AI generation and lock to student
   */
  async handleStudentBargeIn(): Promise<void> {
    if (this.aiTurnTimerHandle) {
      clearTimeout(this.aiTurnTimerHandle);
      this.aiTurnTimerHandle = null;
    }
    if (this.studentTurnTimerHandle) {
      clearTimeout(this.studentTurnTimerHandle);
      this.studentTurnTimerHandle = null;
    }
    this.studentAudioChunks = [];

    const newEpoch = this.sessionRepo.incrementGenerationEpoch(this.sessionId);
    const { interruptedSpeakerId, wasAiSpeaking } = this.scheduler.handleStudentBargeIn(newEpoch);

    // Cancel active generation on all providers immediately
    for (const provider of this.providers.values()) {
      await provider.interrupt();
    }

    this.sessionRepo.updateSpeakerLock(this.sessionId, 'student-speaking', 'student');

    // Record interruption event in canonical event log
    if (wasAiSpeaking && interruptedSpeakerId) {
      const intEvent = this.eventRepo.appendEvent({
        sessionId: this.sessionId,
        kind: 'interruption',
        speakerId: 'student',
        speakerLabel: 'Candidate',
        text: `Candidate interrupted ${interruptedSpeakerId}.`,
        metadata: { interruptedSpeakerId, generationEpoch: newEpoch },
      });

      this.broadcast({
        type: 'transcript.final',
        event: intEvent,
      });
    }

    this.broadcast({
      type: 'student.interruption_detected',
      generationEpoch: newEpoch,
      interruptedSpeakerId,
    });

    this.broadcast({
      type: 'session.state_changed',
      status: 'running',
      speakerLock: 'student-speaking',
      activeSpeakerId: 'student',
      generationEpoch: newEpoch,
    });
  }

  /**
   * Student speech completed: append to canonical transcript and synchronize context
   */
  async handleStudentSpeechStopped(text: string): Promise<void> {
    if (this.studentTurnTimerHandle) {
      clearTimeout(this.studentTurnTimerHandle);
      this.studentTurnTimerHandle = null;
    }
    if (this.aiTurnTimerHandle) {
      clearTimeout(this.aiTurnTimerHandle);
      this.aiTurnTimerHandle = null;
    }

    let resolvedText = (text || '').trim();

    // If Web Speech API provided no text, transcribe accumulated microphone audio via Gemini
    if (!resolvedText && this.studentAudioChunks.length > 0) {
      const combinedAudio = Buffer.concat(this.studentAudioChunks);
      this.studentAudioChunks = [];
      try {
        resolvedText = (await this.evaluatorService.transcribeAudio(combinedAudio)).trim();
      } catch (err) {
        console.warn('Backend audio transcription notice:', err);
      }
    } else {
      this.studentAudioChunks = [];
    }

    if (!resolvedText || resolvedText.length === 0) {
      this.scheduler.releaseLock();
      this.sessionRepo.updateSpeakerLock(this.sessionId, 'idle', null);
      this.broadcast({
        type: 'session.state_changed',
        status: 'running',
        speakerLock: 'idle',
        activeSpeakerId: null,
        generationEpoch: this.scheduler.getActiveGenerationEpoch(),
      });
      // Conversational flow: if student yielded without speaking, resume next AI participant
      setTimeout(() => {
        if (this.scheduler.getSpeakerLock() === 'idle') {
          this.scheduler.triggerNextTurn();
        }
      }, 1000);
      return;
    }

    // Append to canonical transcript
    const event = this.eventRepo.appendEvent({
      sessionId: this.sessionId,
      kind: 'transcript',
      speakerId: 'student',
      speakerLabel: 'Candidate',
      text: resolvedText,
      source: text ? 'live-input-transcription' : 'backend-audio-transcription',
    });

    this.broadcast({
      type: 'transcript.final',
      event,
    });

    // Explicit Context Synchronization to all background agents without speaking
    await this.syncContextToAllAgents({ role: 'user', text: `[Candidate]: ${resolvedText}` });

    this.scheduler.releaseLock();
    this.sessionRepo.updateSpeakerLock(this.sessionId, 'idle', null);

    this.broadcast({
      type: 'session.state_changed',
      status: 'running',
      speakerLock: 'idle',
      activeSpeakerId: null,
      generationEpoch: this.scheduler.getActiveGenerationEpoch(),
    });

    // Schedule next response
    setTimeout(() => {
      this.scheduler.triggerNextTurn();
    }, 800);
  }

  /**
   * AI turn finished: append to canonical transcript and propagate context
   */
  private async onAiTurnFinished(
    speakerId: string,
    speakerLabel: string,
    text: string
  ): Promise<void> {
    const turnId = this.scheduler.getCurrentTurnId();

    if (text && text.trim().length > 0) {
      const event = this.eventRepo.appendEvent({
        sessionId: this.sessionId,
        kind: 'transcript',
        speakerId: speakerId as any,
        speakerLabel,
        turnId,
        text: text.trim(),
        source: 'live-output-transcription',
      });

      this.broadcast({
        type: 'transcript.final',
        event,
      });

      // Synchronize context to OTHER participants
      for (const [id, provider] of this.providers.entries()) {
        if (id !== speakerId) {
          await provider.sendClientContent(
            [{ role: 'model', text: `[${speakerLabel}]: ${text.trim()}` }],
            false // turnComplete = false ensures background agents DO NOT speak
          );
        }
      }
    }

    // Audio Playback Synchronization:
    // Gemini 3.8 Live audio format is 24kHz 16-bit mono PCM = 48,000 bytes/sec.
    // Streaming produces audio much faster than real-time. Calculate remaining playback time.
    const totalAudioSeconds = this.currentTurnAudioBytes > 0 ? this.currentTurnAudioBytes / 48000 : 0;
    const elapsedSeconds = this.currentTurnStartTime > 0 ? (Date.now() - this.currentTurnStartTime) / 1000 : 0;
    const remainingPlaybackSeconds = Math.max(0, totalAudioSeconds - elapsedSeconds);

    // Conversational breathing pause: 1.6 seconds after audio completes playing
    const delayMs = Math.round((remainingPlaybackSeconds + 1.6) * 1000);

    if (this.aiTurnTimerHandle) {
      clearTimeout(this.aiTurnTimerHandle);
    }

    this.aiTurnTimerHandle = setTimeout(() => {
      this.aiTurnTimerHandle = null;

      // Only complete and schedule next if still running and not preempted by barge-in
      if (this.isDestroyed) return;
      const currentSpeaker = this.scheduler.getActiveSpeakerId();
      if (currentSpeaker !== speakerId) return;

      this.broadcast({
        type: 'speaker.turn_completed',
        speakerId,
        turnId: turnId || '',
        text,
      });

      this.scheduler.releaseLock();
      this.sessionRepo.updateSpeakerLock(this.sessionId, 'idle', null);

      this.broadcast({
        type: 'session.state_changed',
        status: 'running',
        speakerLock: 'idle',
        activeSpeakerId: null,
        generationEpoch: this.scheduler.getActiveGenerationEpoch(),
      });

      // Trigger next turn after short gap
      setTimeout(() => {
        if (this.scheduler.getSpeakerLock() === 'idle') {
          this.scheduler.triggerNextTurn();
        }
      }, 500);
    }, delayMs);
  }

  private async syncContextToAllAgents(turn: { role: 'user' | 'model'; text: string }): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.sendClientContent([turn], false);
    }
  }

  private async handleDeadlineExpired(): Promise<void> {
    await this.endSession('deadline');
  }

  async endSession(reason: 'user-ended' | 'deadline' | 'provider-error' = 'user-ended'): Promise<void> {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }

    this.scheduler.startClosing();
    const now = new Date().toISOString();

    this.sessionRepo.updateSessionStatus(this.sessionId, 'closing', {
      ended_at: now,
      speaker_lock: 'closing',
      active_speaker_id: null,
      report_status: 'pending',
    });

    this.broadcast({
      type: 'session.state_changed',
      status: 'closing',
      speakerLock: 'closing',
      activeSpeakerId: null,
      generationEpoch: this.scheduler.getActiveGenerationEpoch(),
    });

    // Moderator closing remarks
    const session = this.sessionRepo.getSessionById(this.sessionId)!;
    const closingRemarks =
      session.mode === 'gd'
        ? 'Time is up. Thank you all for a constructive and engaging group discussion. The session has concluded.'
        : 'Thank you for answering my questions today. This concludes your technical interview.';

    const closingEvent = this.eventRepo.appendEvent({
      sessionId: this.sessionId,
      kind: 'moderator',
      speakerId: 'moderator',
      speakerLabel: MODERATOR_CONFIG.name,
      text: closingRemarks,
    });

    this.broadcast({
      type: 'transcript.final',
      event: closingEvent,
    });

    // Transition to report_pending
    this.sessionRepo.updateSessionStatus(this.sessionId, 'report_pending', {
      report_status: 'pending',
    });

    this.broadcast({
      type: 'report.pending',
      sessionId: this.sessionId,
    });

    // Disconnect live providers
    for (const provider of this.providers.values()) {
      await provider.disconnect();
    }

    // Trigger post-session report generation
    await this.generateSessionReport(session);
  }

  private async generateSessionReport(session: SessionRecord): Promise<void> {
    try {
      const events = this.eventRepo.getAllEvents(this.sessionId);
      const report = await this.evaluatorService.evaluateSession({
        sessionId: this.sessionId,
        mode: session.mode,
        topicOrRole: session.topic || 'General Technical Assessment',
        events,
        useMock: this.isMockMode,
      });

      this.reportRepo.saveReport(report);
      this.sessionRepo.updateSessionStatus(this.sessionId, 'completed', {
        report_status: report.status === 'ready' ? 'ready' : 'fallback',
      });

      this.broadcast({
        type: 'report.ready',
        sessionId: this.sessionId,
        reportId: report.reportId,
      });

      this.broadcast({
        type: 'session.state_changed',
        status: 'completed',
        speakerLock: 'idle',
        activeSpeakerId: null,
        generationEpoch: session.generation_epoch,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.sessionRepo.updateSessionStatus(this.sessionId, 'completed', {
        report_status: 'failed',
        last_error_code: 'REPORT_EVALUATION_FAILED',
      });

      this.broadcast({
        type: 'report.failed',
        sessionId: this.sessionId,
        error: errMsg,
      });
    }
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true;
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.studentTurnTimerHandle) {
      clearTimeout(this.studentTurnTimerHandle);
      this.studentTurnTimerHandle = null;
    }
    if (this.aiTurnTimerHandle) {
      clearTimeout(this.aiTurnTimerHandle);
      this.aiTurnTimerHandle = null;
    }
    for (const provider of this.providers.values()) {
      await provider.disconnect();
    }
    this.providers.clear();
    this.clients.clear();
  }
}
