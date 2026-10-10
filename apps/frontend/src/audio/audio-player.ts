export class AudioPlayer {
  private ctx: AudioContext | null = null;
  private nextPlayTime = 0;
  private currentEpoch = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {
    // AudioContext created lazily on user gesture
  }

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 24000 });
      this.nextPlayTime = this.ctx.currentTime;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setEpoch(epoch: number): void {
    this.currentEpoch = epoch;
  }

  setGenerationEpoch(epoch: number): void {
    this.setEpoch(epoch);
  }

  /**
   * Enqueue a 24kHz 16-bit PCM chunk (Base64) for sequential audio playback
   */
  queueAudioChunk(base64Pcm: string, chunkEpoch: number): void {
    // Fencing: reject late-arriving chunks from stale generation epochs
    if (chunkEpoch < this.currentEpoch) {
      return;
    }

    try {
      const ctx = this.initContext();
      const binaryStr = window.atob(base64Pcm);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      if (float32.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch {
      // ignore audio decode errors
    }
  }

  enqueueChunk(base64Pcm: string, _chunkSequence: number, chunkEpoch: number): void {
    this.queueAudioChunk(base64Pcm, chunkEpoch);
  }

  /**
   * Immediately cancel all audio playback and clear queued chunks upon student interruption
   */
  stopAndClear(newEpoch?: number): void {
    if (newEpoch !== undefined) {
      this.currentEpoch = newEpoch;
    }

    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore
      }
    }
    this.activeSources = [];

    if (this.ctx) {
      this.nextPlayTime = this.ctx.currentTime;
    }
  }

  cancelPlayback(newEpoch?: number): void {
    this.stopAndClear(newEpoch);
  }

  destroy(): void {
    this.stopAndClear();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
    }
    this.ctx = null;
  }

  dispose(): void {
    this.destroy();
  }
}
