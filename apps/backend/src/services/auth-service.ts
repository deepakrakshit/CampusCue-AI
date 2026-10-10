import { randomBytes, createHash } from 'node:crypto';

export interface GeneratedCapability {
  token: string;
  tokenHash: string;
}

export function generateSessionCapability(): GeneratedCapability {
  // 256 bits of cryptographic entropy
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  return { token, tokenHash };
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

export function verifySessionToken(token: string, expectedHash: string): boolean {
  if (!token || !expectedHash) return false;
  const hash = hashSessionToken(token);
  return hash === expectedHash;
}
