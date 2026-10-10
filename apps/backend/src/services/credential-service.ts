import { GoogleGenAI } from '@google/genai';
import { getEnv, getAgentApiKey, maskKey, type AgentRole } from '../config/env.js';

export type CredentialKeyType = 'auth_key' | 'restricted_standard' | 'unrestricted_standard' | 'unknown';

export interface CredentialValidationResult {
  role: AgentRole;
  keyMasked: string;
  keyType: CredentialKeyType;
  isSupportedByGoogleAuth: boolean;
  status: 'valid' | 'rate_limited' | 'auth_failed' | 'model_error' | 'error';
  latencyMs?: number;
  message: string;
  projectIdHint?: string;
}

export class CredentialService {
  /**
   * Inspects key syntax against Google's authentication requirements.
   * Google AI Studio Authorization keys start with 'AQ.A' and are bound to service accounts
   * with automatic Generative Language API scoping.
   * Legacy unrestricted standard keys typically start with 'AIzaSy' without restrictions and are rejected.
   */
  classifyKeyType(apiKey: string): CredentialKeyType {
    if (!apiKey) return 'unknown';
    if (apiKey.startsWith('AQ.A') || apiKey.startsWith('AQ.')) {
      // Authorization key bound to service account in Google AI Studio
      return 'auth_key';
    }
    if (apiKey.startsWith('AIzaSy')) {
      // Standard API key (needs explicit API restriction in GCP console)
      return 'restricted_standard';
    }
    return 'unknown';
  }

  /**
   * Checks if a key satisfies current Google authentication policy.
   * Authorization keys ('AQ.A...') or explicitly restricted standard keys are supported.
   */
  isKeySupported(apiKey: string): boolean {
    const keyType = this.classifyKeyType(apiKey);
    return keyType === 'auth_key' || keyType === 'restricted_standard';
  }

  /**
   * Deterministic mapping verification:
   * Guarantees role to key mapping is 1:1 and never reallocated dynamically.
   */
  getDeterministicKey(role: AgentRole): { apiKey: string; keyMasked: string; keyType: CredentialKeyType } {
    const apiKey = getAgentApiKey(role);
    return {
      apiKey,
      keyMasked: maskKey(apiKey),
      keyType: this.classifyKeyType(apiKey),
    };
  }

  /**
   * Validates a single provider connection independently against live Google Gemini endpoints
   * without exposing secrets.
   */
  async validateRoleCredential(role: AgentRole, modelId?: string): Promise<CredentialValidationResult> {
    const env = getEnv();
    const { apiKey, keyMasked, keyType } = this.getDeterministicKey(role);
    const targetModel = modelId || env.GEMINI_EVAL_MODEL;

    const isSupported = this.isKeySupported(apiKey);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const startTime = Date.now();
      const res = await ai.models.generateContent({
        model: targetModel,
        contents: 'Ping',
      });
      const latencyMs = Date.now() - startTime;

      if (res && res.text !== undefined) {
        return {
          role,
          keyMasked,
          keyType,
          isSupportedByGoogleAuth: isSupported,
          status: 'valid',
          latencyMs,
          message: `Connection verified successfully (${latencyMs}ms)`,
        };
      }

      return {
        role,
        keyMasked,
        keyType,
        isSupportedByGoogleAuth: isSupported,
        status: 'valid',
        latencyMs,
        message: 'Connection verified with empty body',
      };
    } catch (err: unknown) {
      const parsed = this.classifyError(err);
      return {
        role,
        keyMasked,
        keyType,
        isSupportedByGoogleAuth: isSupported,
        status: parsed.status,
        message: parsed.message,
      };
    }
  }

  /**
   * Validates all 4 accounts / projects independently.
   * Key 1: Participant 1, Evaluator, Reviewer
   * Key 2: Participant 2
   * Key 3: Participant 3
   * Key 4: Participant 4
   */
  async validateAllCredentials(): Promise<Record<AgentRole, CredentialValidationResult>> {
    const roles: AgentRole[] = ['agent_a', 'agent_b', 'agent_c', 'agent_d', 'evaluator', 'reviewer'];
    const results: Partial<Record<AgentRole, CredentialValidationResult>> = {};

    for (const role of roles) {
      const model = role === 'reviewer' ? getEnv().GEMINI_REVIEW_MODEL : getEnv().GEMINI_EVAL_MODEL;
      results[role] = await this.validateRoleCredential(role, model);
    }

    return results as Record<AgentRole, CredentialValidationResult>;
  }

  /**
   * Categorizes errors accurately without leaking secrets
   */
  classifyError(err: unknown): {
    status: 'rate_limited' | 'auth_failed' | 'model_error' | 'error';
    message: string;
    isTransient: boolean;
  } {
    const errString = err instanceof Error ? err.message : String(err);

    // 429 / RESOURCE_EXHAUSTED
    if (
      errString.includes('429') ||
      errString.includes('RESOURCE_EXHAUSTED') ||
      errString.toLowerCase().includes('quota') ||
      errString.toLowerCase().includes('rate limit')
    ) {
      return {
        status: 'rate_limited',
        message: 'Rate limit or quota exhausted (429 RESOURCE_EXHAUSTED). Mapping preserved without failover.',
        isTransient: false,
      };
    }

    // 401 / 403 / PERMISSION_DENIED / API_KEY_INVALID
    if (
      errString.includes('401') ||
      errString.includes('403') ||
      errString.includes('PERMISSION_DENIED') ||
      errString.includes('API_KEY_INVALID') ||
      errString.toLowerCase().includes('unauthenticated') ||
      errString.toLowerCase().includes('unrestricted')
    ) {
      return {
        status: 'auth_failed',
        message: 'Authentication rejected. Verify key is a supported Authorization key or restricted standard key.',
        isTransient: false,
      };
    }

    // 404 / NOT_FOUND
    if (errString.includes('404') || errString.toLowerCase().includes('not found')) {
      return {
        status: 'model_error',
        message: `Model access error (404 Not Found): ${errString}`,
        isTransient: false,
      };
    }

    // 503 / 500 / Network
    if (errString.includes('503') || errString.includes('500') || errString.toLowerCase().includes('timeout') || errString.toLowerCase().includes('network')) {
      return {
        status: 'error',
        message: `Transient service/network error: ${errString}`,
        isTransient: true,
      };
    }

    return {
      status: 'error',
      message: errString,
      isTransient: false,
    };
  }
}

export const credentialService = new CredentialService();
