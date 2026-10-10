import type { LiveProvider, LiveSessionCallbacks } from './live-provider.js';

export interface MockProviderOptions {
  agentId: string;
  modelId?: string;
  shouldFailConnect?: boolean;
  mockResponseText?: string;
  chunkDelayMs?: number;
}

export class MockGeminiLiveProvider implements LiveProvider {
  readonly agentId: string;
  readonly modelId: string;
  private connected = false;
  private callbacks: LiveSessionCallbacks = {};
  private activeTimers: NodeJS.Timeout[] = [];
  private shouldFailConnect: boolean;
  private customResponseText?: string;
  private chunkDelayMs: number;
  private contextHistory: Array<{ role: 'user' | 'model'; text: string }> = [];

  constructor(options: MockProviderOptions) {
    this.agentId = options.agentId;
    this.modelId = options.modelId || 'gemini-3.8-live';
    this.shouldFailConnect = options.shouldFailConnect || false;
    this.customResponseText = options.mockResponseText;
    this.chunkDelayMs = options.chunkDelayMs ?? 50;
  }

  setCallbacks(callbacks: LiveSessionCallbacks): void {
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    if (this.shouldFailConnect) {
      throw new Error(`Mock connection failure simulated for agent: ${this.agentId}`);
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.clearPendingGeneration();
    this.connected = false;
    this.callbacks.onClose?.();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async sendRealtimeAudio(_pcmBase64: string): Promise<void> {
    if (!this.connected) throw new Error('Provider not connected');
    // In mock mode, receiving audio simply acknowledges
  }

  async sendRealtimeText(text: string): Promise<void> {
    if (!this.connected) throw new Error('Provider not connected');
    this.contextHistory.push({ role: 'user', text });
  }

  async sendClientContent(
    turns: Array<{ role: 'user' | 'model'; text: string }>,
    turnComplete: boolean = false
  ): Promise<void> {
    if (!this.connected) throw new Error('Provider not connected');
    this.contextHistory.push(...turns);

    // Context updates only trigger speech if explicitly designated as turnComplete
    if (turnComplete) {
      this.triggerSimulatedSpeech();
    }
  }

  async interrupt(): Promise<void> {
    this.clearPendingGeneration();
    this.callbacks.onInterruption?.();
  }

  private clearPendingGeneration(): void {
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers = [];
  }

  private triggerSimulatedSpeech(): void {
    this.clearPendingGeneration();

    const responseText =
      this.customResponseText ||
      this.generatePersonaResponse(this.agentId, this.contextHistory);

    const words = responseText.split(' ');
    // Synthetic silent PCM buffer (160 bytes of 0x00, ~24kHz PCM mono)
    const mockPcmChunk = Buffer.alloc(320).toString('base64');

    const totalSteps = Math.min(words.length, 4);
    for (let i = 0; i < totalSteps; i++) {
      const isFinal = i === totalSteps - 1;
      const partialText = words.slice(0, Math.floor(((i + 1) / totalSteps) * words.length)).join(' ');

      const timer = setTimeout(() => {
        if (!this.connected) return;

        this.callbacks.onAudioChunk?.(mockPcmChunk);
        if (isFinal) {
          this.callbacks.onFinalText?.(responseText);
        } else {
          this.callbacks.onInterimText?.(partialText);
        }
      }, (i + 1) * this.chunkDelayMs);

      this.activeTimers.push(timer);
    }
  }

  private generatePersonaResponse(
    agentId: string,
    history: Array<{ role: 'user' | 'model'; text: string }>
  ): string {
    const lastUserTurn = history.filter((h) => h.role === 'user').slice(-1)[0]?.text || '';
    switch (agentId) {
      case 'agent_a':
        return `Looking at the data on this, we must examine the quantitative trade-offs before concluding. Regarding "${lastUserTurn.slice(0, 30)}", logical rigor is essential.`;
      case 'agent_b':
        return `While that point is valid, what happens if our key assumption fails? We need to stress-test this premise against real edge cases.`;
      case 'agent_c':
        return `Practically speaking, implementation constraints and timelines in Indian engineering contexts will dictate feasibility here.`;
      case 'agent_d':
        return `Both perspectives offer merit. Connecting the analytical angle with practical constraints gives us a viable roadmap.`;
      case 'interviewer':
        return `Interesting. Could you elaborate on how you handled concurrency and failure recovery in that architecture?`;
      default:
        return `Thank you everyone. Let us structure our points concisely and keep the discussion moving forward.`;
    }
  }
}
