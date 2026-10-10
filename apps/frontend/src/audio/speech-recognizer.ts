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
          if (event.error === 'no-speech') {
            // Normal silence; do not treat as fatal error
            return;
          }
          if (event.error === 'aborted') {
            return;
          }
          this.callbacks.onError?.(`Speech recognition error: ${event.error}`);
        };

        recognition.onend = () => {
          this.isListening = false;
          // Auto-restart if session is still supposed to be active
          if (this.shouldRestart) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
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
    if (!this.recognition || this.isListening) return;
    this.shouldRestart = true;
    try {
      this.recognition.start();
    } catch {
      // ignore if already started
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
