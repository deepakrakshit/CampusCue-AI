import { describe, it, expect } from 'vitest';
import {
  generateSessionCapability,
  hashSessionToken,
  verifySessionToken,
} from '../src/services/auth-service.js';

describe('Auth & Session Capability Service', () => {
  it('generates high-entropy 256-bit capability token', () => {
    const { token, tokenHash } = generateSessionCapability();
    expect(token).toBeDefined();
    expect(token.length).toBe(64); // 32 bytes in hex = 64 characters
    expect(tokenHash).toBeDefined();
    expect(tokenHash.length).toBe(64); // SHA-256 in hex
    expect(tokenHash).toBe(hashSessionToken(token));
  });

  it('verifies valid capability token', () => {
    const { token, tokenHash } = generateSessionCapability();
    expect(verifySessionToken(token, tokenHash)).toBe(true);
  });

  it('rejects tampered or mismatched tokens', () => {
    const { token, tokenHash } = generateSessionCapability();
    const wrongToken = 'a'.repeat(64);
    expect(verifySessionToken(wrongToken, tokenHash)).toBe(false);
    expect(verifySessionToken('', tokenHash)).toBe(false);
    expect(verifySessionToken(token, '')).toBe(false);
  });
});
