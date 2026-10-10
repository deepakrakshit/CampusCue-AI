import { GoogleGenAI } from '@google/genai';
import type { LiveProvider, LiveSessionCallbacks } from './live-provider.js';
import { credentialService } from '../services/credential-service.js';

export interface RealLiveProviderOptions {
  agentId: string;
  apiKey: string;
  modelId: string;
  systemInstruction: string;
  voiceName: string;
  maxRetries?: number;
}

export class RealGeminiLiveProvider implements LiveProvider {
  readonly agentId: string;
  readonly modelId: string;
  private apiKey: string;
  private systemInstruction: string;
  private voiceName: string;
  private maxRetries: number;
  private callbacks: LiveSessionCallbacks = {};
  private session: any = null;
  private connected = false;
  private currentTurnText = '';

  constructor(options: RealLiveProviderOptions) {
    this.agentId = options.agentId;
    this.apiKey = options.apiKey;
    this.modelId = options.modelId;
    this.systemInstruction = options.systemInstruction;
    this.voiceName = options.voiceName;
    this.maxRetries = options.maxRetries ?? 3;
  }

  setCallbacks(callbacks: LiveSessionCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Connect with bounded retries for transient failures.
   * Quota exhaustion (429) and authentication errors (401/403) fail immediately
   * without retry loops or silent key alteration.
   */
  async connect(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.attemptConnect();
        this.connected = true;
        return;
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        lastError = errorObj;
        const classified = credentialService.classifyError(errorObj);

        // Fail immediately for rate limits, quota exhaustion, or auth rejections
        if (!classified.isTransient || attempt === this.maxRetries) {
          this.connected = false;
          this.callbacks.onError?.(
            new Error(`[${this.agentId}] ${classified.message}`)
          );
          throw errorObj;
        }

        // Bounded exponential backoff for transient network issues: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    this.connected = false;
    throw lastError || new Error(`[${this.agentId}] Connection failed after ${this.maxRetries} attempts`);
  }

  private async attemptConnect(): Promise<void> {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    this.session = await (ai as any).live.connect({
      model: this.modelId,
      config: {
        responseModalities: ['audio'],
        outputAudioTranscription: {},
        systemInstruction: {
          parts: [{ text: this.systemInstruction }],
        },
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: this.voiceName,
            },
          },
        },
      },
      callbacks: {
        onopen: () => {
          this.connected = true;
        },
        onmessage: (msg: any) => {
          this.handleServerMessage(msg);
        },
        onerror: (err: any) => {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          const classified = credentialService.classifyError(errorObj);
          this.callbacks.onError?.(
            new Error(`[${this.agentId}] ${classified.message}`)
          );
        },
        onclose: () => {
          this.connected = false;
          this.callbacks.onClose?.();
        },
      },
    });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.session && typeof this.session.close === 'function') {
      try {
        await this.session.close();
      } catch {
        // ignore
      }
    }
    this.session = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async sendRealtimeAudio(pcmBase64: string): Promise<void> {
    if (!this.session || !this.connected) return;
    try {
      this.session.sendRealtimeInput({
        audio: {
          data: pcmBase64,
          mimeType: 'audio/pcm;rate=16000',
        },
      });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.callbacks.onError?.(errorObj);
    }
  }

  async sendRealtimeText(text: string): Promise<void> {
    if (!this.session || !this.connected) return;
    try {
      this.session.sendRealtimeInput({ text });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.callbacks.onError?.(errorObj);
    }
  }

  async sendClientContent(
    turns: Array<{ role: 'user' | 'model'; text: string }>,
    turnComplete: boolean = false
  ): Promise<void> {
    if (!this.session || !this.connected) return;
    try {
      if (typeof this.session.sendClientContent === 'function') {
        await this.session.sendClientContent({
          turns: turns.map((t) => ({
            role: t.role,
            parts: [{ text: t.text }],
          })),
          turnComplete,
        });
      } else {
        const lastTurn = turns[turns.length - 1];
        if (lastTurn) {
          await this.session.sendRealtimeInput({ text: lastTurn.text });
        }
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.callbacks.onError?.(errorObj);
    }
  }

  async interrupt(): Promise<void> {
    if (!this.session || !this.connected) return;
    this.currentTurnText = '';
    try {
      if (typeof this.session.sendClientContent === 'function') {
        await this.session.sendClientContent({ turns: [], turnComplete: true });
      }
    } catch {
      // ignore
    }
    this.callbacks.onInterruption?.();
  }

  private handleServerMessage(msg: any): void {
    if (msg.serverContent?.interrupted) {
      this.currentTurnText = '';
      this.callbacks.onInterruption?.();
      return;
    }

    if (msg.serverContent?.modelTurn?.parts) {
      for (const part of msg.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          this.callbacks.onAudioChunk?.(part.inlineData.data);
        }
        if (part.text) {
          this.currentTurnText += part.text;
          this.callbacks.onInterimText?.(this.currentTurnText);
        }
      }
    }

    if (msg.serverContent?.outputTranscription?.text) {
      this.currentTurnText += msg.serverContent.outputTranscription.text;
      this.callbacks.onInterimText?.(this.currentTurnText);
    }

    if (msg.serverContent?.turnComplete) {
      const final = this.currentTurnText.trim();
      this.currentTurnText = '';
      this.callbacks.onFinalText?.(final || '(Spoken contribution)');
    }
  }
}
