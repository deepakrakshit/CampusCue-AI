export interface SpeechRecognizerCallbacks {
  onInterimText?: (text: string) => void;
  onFinalText?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: string) => void;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private shouldRestart = false;

  constructor(private callbacks: SpeechRecognizerCallbacks) {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Indian English / Hinglish recognition

        recognition.onstart = () => {
          this.isListening = true;
        };

        recognition.onspeechstart = () => {
          this.callbacks.onSpeechStart?.();
        };

        recognition.onspeechend = () => {
          this.callbacks.onSpeechEnd?.();
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          if (interim) {
            this.callbacks.onInterimText?.(interim.trim());
          }

          if (final && final.trim().length > 0) {
            this.callbacks.onFinalText?.(final.trim());
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
          }
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            this.shouldRestart = false;
            this.callbacks.onError?.('Microphone speech recognition permission denied.');
            return;
          }
          this.callbacks.onError?.(`Speech recognition notice: ${event.error}`);
        };

        recognition.onend = () => {
          this.isListening = false;
          // Auto-restart with debounce if session is still supposed to be active
          if (this.shouldRestart) {
            setTimeout(() => {
              if (this.shouldRestart && !this.isListening) {
                try {
                  recognition.start();
                  this.isListening = true;
                } catch {
                  // ignore
                }
              }
            }, 300);
          }
        };

        this.recognition = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(): void {
    if (!this.recognition) return;
    this.shouldRestart = true;
    if (this.isListening) return;
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      if (e?.name === 'InvalidStateError') {
        this.isListening = true;
      }
    }
  }

  stop(): void {
    this.shouldRestart = false;
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      // ignore
    }
    this.isListening = false;
  }
}
