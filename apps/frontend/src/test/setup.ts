import '@testing-library/jest-dom';

// Polyfill window.atob and window.btoa if needed in jsdom
if (!global.window.atob) {
  global.window.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}
if (!global.window.btoa) {
  global.window.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

// Polyfill AudioContext for tests
class MockAudioBuffer {
  duration = 0.5;
  length = 12000;
  sampleRate = 24000;
  private channelData = new Float32Array(12000);
  getChannelData() {
    return this.channelData;
  }
}

class MockAudioBufferSourceNode {
  buffer: MockAudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect() {}
  disconnect() {}
  start() {}
  stop() {
    if (this.onended) this.onended();
  }
}

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 24000;
  destination = {};

  createBuffer() {
    return new MockAudioBuffer();
  }

  createBufferSource() {
    return new MockAudioBufferSourceNode();
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

(global.window as any).AudioContext = MockAudioContext;
(global.window as any).webkitAudioContext = MockAudioContext;
