import { describe, it, expect } from 'vitest';
import { credentialService } from '../src/services/credential-service.js';
import { getAgentApiKey, getEnv, type AgentRole } from '../src/config/env.js';

describe('Deterministic Credential Mapping & Google Auth Validation', () => {
  it('strictly maps roles to deterministic keys without pooling or round-robin failover', () => {
    const env = getEnv();

    // Verify Participant 1 -> Key 1
    expect(getAgentApiKey('agent_a')).toBe(env.GEMINI_API_KEY_1);

    // Verify Participant 2 -> Key 2
    expect(getAgentApiKey('agent_b')).toBe(env.GEMINI_API_KEY_2);

    // Verify Participant 3 -> Key 3
    expect(getAgentApiKey('agent_c')).toBe(env.GEMINI_API_KEY_3);

    // Verify Participant 4 -> Key 4
    expect(getAgentApiKey('agent_d')).toBe(env.GEMINI_API_KEY_4);

    // Verify Interviewer -> Key 1
    expect(getAgentApiKey('interviewer')).toBe(env.GEMINI_API_KEY_1);

    // Verify Evaluator (Flash-Lite) -> Key 1
    expect(getAgentApiKey('evaluator')).toBe(env.GEMINI_API_KEY_1);

    // Verify Reviewer (Gemma) -> Key 1
    expect(getAgentApiKey('reviewer')).toBe(env.GEMINI_API_KEY_1);
  });

  it('guarantees keys across participants are distinct accounts and projects', () => {
    const env = getEnv();
    const distinctKeys = new Set([
      env.GEMINI_API_KEY_1,
      env.GEMINI_API_KEY_2,
      env.GEMINI_API_KEY_3,
      env.GEMINI_API_KEY_4,
    ]);

    expect(distinctKeys.size).toBe(4);
  });

  it('verifies keys against Google Auth key policy requirements', () => {
    // Current Google Auth keys generated in Google AI Studio start with AQ.A
    expect(credentialService.classifyKeyType('AQ.AB1234567890abcdef')).toBe('auth_key');
    expect(credentialService.isKeySupported('AQ.AB1234567890abcdef')).toBe(true);

    // Standard API keys
    expect(credentialService.classifyKeyType('AIzaSyAbc123xyz')).toBe('restricted_standard');
    expect(credentialService.isKeySupported('AIzaSyAbc123xyz')).toBe(true);

    // Unknown or empty
    expect(credentialService.classifyKeyType('')).toBe('unknown');
    expect(credentialService.isKeySupported('')).toBe(false);
  });

  it('accurately categorizes rate limits without flagging them as transient for endless retry', () => {
    const err429 = new Error('429 Resource has been exhausted (e.g. check quota).');
    const classification = credentialService.classifyError(err429);

    expect(classification.status).toBe('rate_limited');
    expect(classification.isTransient).toBe(false);
    expect(classification.message).toContain('RESOURCE_EXHAUSTED');
    expect(classification.message).toContain('Mapping preserved without failover');
  });

  it('accurately categorizes authentication rejections', () => {
    const errAuth = new Error('403 PERMISSION_DENIED: API keys must have Generative Language API enabled.');
    const classification = credentialService.classifyError(errAuth);

    expect(classification.status).toBe('auth_failed');
    expect(classification.isTransient).toBe(false);
    expect(classification.message).toContain('Authentication rejected');
  });

  it('identifies transient network / 503 errors as suitable for bounded retry', () => {
    const err503 = new Error('503 Service Unavailable: The backend server is temporarily overloaded.');
    const classification = credentialService.classifyError(err503);

    expect(classification.status).toBe('error');
    expect(classification.isTransient).toBe(true);
  });
});
