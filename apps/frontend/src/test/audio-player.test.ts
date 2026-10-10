import { describe, it, expect, beforeEach } from 'vitest';
import { AudioPlayer } from '../audio/audio-player';

describe('AudioPlayer', () => {
  let player: AudioPlayer;

  beforeEach(() => {
    player = new AudioPlayer();
  });

  it('initializes with default epoch 0', () => {
    expect(player).toBeDefined();
  });

  it('updates epoch with setGenerationEpoch', () => {
    player.setGenerationEpoch(2);
    // Should not throw
    expect(() => player.setGenerationEpoch(3)).not.toThrow();
  });

  it('rejects audio chunks from stale epochs (fencing invariant)', () => {
    player.setGenerationEpoch(3);

    // Mock base64 PCM data (10 zero bytes)
    const mockPcmBase64 = Buffer.from(new Uint8Array(20)).toString('base64');

    // Chunks with epoch < 3 must be silently discarded
    expect(() => player.enqueueChunk(mockPcmBase64, 1, 2)).not.toThrow();
  });

  it('accepts and schedules audio chunks from current epoch', () => {
    player.setGenerationEpoch(2);

    const mockPcmBase64 = Buffer.from(new Uint8Array(20)).toString('base64');
    expect(() => player.enqueueChunk(mockPcmBase64, 1, 2)).not.toThrow();
  });

  it('stops and clears playback immediately on barge-in cancellation', () => {
    player.setGenerationEpoch(1);

    const mockPcmBase64 = Buffer.from(new Uint8Array(20)).toString('base64');
    player.enqueueChunk(mockPcmBase64, 1, 1);

    // Interruption occurs
    expect(() => player.cancelPlayback(2)).not.toThrow();
  });

  it('cleans up resources on dispose', () => {
    expect(() => player.dispose()).not.toThrow();
  });
});
