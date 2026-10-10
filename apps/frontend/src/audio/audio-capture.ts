export class AudioCapture {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private wasSpeaking = false;
  private speakingBlockCount = 0;
  private silentBlockCount = 0;

  constructor(
    private onChunk: (base64Pcm: string) => void,
    private onSpeaking?: (speaking: boolean) => void
  ) {}

  async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Buffer size 4096 = ~256ms of audio at 16kHz
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS amplitude to detect if student is actively speaking
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        
        // Voice activity threshold (0.045 filters room noise/hum while detecting clear speech)
        if (rms > 0.045) {
          this.speakingBlockCount++;
          this.silentBlockCount = 0;
        } else {
          this.silentBlockCount++;
          this.speakingBlockCount = 0;
        }

        // Debounced speaking transition: require 2 blocks (~500ms) to start, 4 blocks (~1s) to stop
        if (!this.wasSpeaking && this.speakingBlockCount >= 2) {
          this.wasSpeaking = true;
          this.onSpeaking?.(true);
        } else if (this.wasSpeaking && this.silentBlockCount >= 4) {
          this.wasSpeaking = false;
          this.onSpeaking?.(false);
        }

        // Convert Float32Array to 16-bit PCM little-endian
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const bytes = new Uint8Array(pcm16.buffer);
        let binaryStr = '';
        for (let i = 0; i < bytes.length; i++) {
          binaryStr += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binaryStr);
        this.onChunk(base64);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;
    } catch (err) {
      this.stop();
      throw err;
    }
  }

  stop(): void {
    this.isRecording = false;
    this.wasSpeaking = false;
    this.speakingBlockCount = 0;
    this.silentBlockCount = 0;

    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch {
        // ignore
      }
      this.processor = null;
    }

    if (this.source) {
      try {
        this.source.disconnect();
      } catch {
        // ignore
      }
      this.source = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  isActive(): boolean {
    return this.isRecording;
  }
}
