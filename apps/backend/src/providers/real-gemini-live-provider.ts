import { GoogleGenAI } from '@google/genai';
import type { LiveProvider, LiveSessionCallbacks } from './live-provider.js';

export interface RealLiveProviderOptions {
  agentId: string;
  apiKey: string;
  modelId: string;
  systemInstruction: string;
  voiceName: string;
}

export class RealGeminiLiveProvider implements LiveProvider {
  readonly agentId: string;
  readonly modelId: string;
  private apiKey: string;
  private systemInstruction: string;
  private voiceName: string;
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
  }

  setCallbacks(callbacks: LiveSessionCallbacks): void {
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    try {
      this.session = await (ai as any).live.connect({
        model: this.modelId,
        config: {
          responseModalities: ['audio'],
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
            this.callbacks.onError?.(errorObj);
          },
          onclose: () => {
            this.connected = false;
            this.callbacks.onClose?.();
          },
        },
      });
      this.connected = true;
    } catch (err) {
      this.connected = false;
      const errorObj = err instanceof Error ? err : new Error(String(err));
      throw errorObj;
    }
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
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async sendRealtimeText(text: string): Promise<void> {
    if (!this.session || !this.connected) return;
    try {
      this.session.sendRealtimeInput({ text });
    } catch (err) {
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
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
        // Fallback to text input if sendClientContent is unavailable
        const lastTurn = turns[turns.length - 1];
        if (lastTurn) {
          await this.session.sendRealtimeInput({ text: lastTurn.text });
        }
      }
    } catch (err) {
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async interrupt(): Promise<void> {
    if (!this.session || !this.connected) return;
    this.currentTurnText = '';
    try {
      if (typeof this.session.sendClientContent === 'function') {
        // turnComplete=true cancels pending active generation
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
      this.currentTurnText = msg.serverContent.outputTranscription.text;
      this.callbacks.onInterimText?.(this.currentTurnText);
    }

    if (msg.serverContent?.turnComplete) {
      const final = this.currentTurnText;
      this.currentTurnText = '';
      if (final) {
        this.callbacks.onFinalText?.(final);
      }
    }
  }
}
