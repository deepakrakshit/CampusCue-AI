export interface LiveSessionCallbacks {
  onAudioChunk?: (audioBase64: string) => void;
  onInterimText?: (text: string) => void;
  onFinalText?: (text: string) => void;
  onInterruption?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface LiveProvider {
  readonly agentId: string;
  readonly modelId: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendRealtimeAudio(pcmBase64: string): Promise<void>;
  sendRealtimeText(text: string): Promise<void>;
  sendClientContent(
    turns: Array<{ role: 'user' | 'model'; text: string }>,
    turnComplete?: boolean
  ): Promise<void>;
  interrupt(): Promise<void>;
  isConnected(): boolean;
  setCallbacks(callbacks: LiveSessionCallbacks): void;
}
