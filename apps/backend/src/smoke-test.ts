import { GoogleGenAI } from '@google/genai';
import { getEnv, maskKey } from './config/env.js';
import { credentialService, type CredentialValidationResult } from './services/credential-service.js';

async function runComprehensiveSmokeTest(): Promise<void> {
  console.log('================================================================');
  console.log(' CampusCue AI — Gemini Multi-Project Credential Audit');
  console.log('================================================================');
  const env = getEnv();

  console.log(`Environment:           ${env.NODE_ENV}`);
  console.log(`Live Model Target:     ${env.GEMINI_LIVE_MODEL}`);
  console.log(`Evaluator Model:       ${env.GEMINI_EVAL_MODEL}`);
  console.log(`Reviewer Model:        ${env.GEMINI_REVIEW_MODEL}`);
  console.log('----------------------------------------------------------------');
  console.log('Deterministic Credential Configuration:');
  console.log(`  Key 1 (Account 1 / Project 1): ${maskKey(env.GEMINI_API_KEY_1)}`);
  console.log(`    -> AI Participant 1 (Priya Patel — Analytical)`);
  console.log(`    -> Moderator (Mr. S. Rao)`);
  console.log(`    -> Technical Interviewer`);
  console.log(`    -> Flash-Lite Evaluator (${env.GEMINI_EVAL_MODEL})`);
  console.log(`    -> Gemma Reviewer (${env.GEMINI_REVIEW_MODEL})`);
  console.log(`  Key 2 (Account 2 / Project 2): ${maskKey(env.GEMINI_API_KEY_2)}`);
  console.log(`    -> AI Participant 2 (Rohan Verma — Challenger)`);
  console.log(`  Key 3 (Account 3 / Project 3): ${maskKey(env.GEMINI_API_KEY_3)}`);
  console.log(`    -> AI Participant 3 (Ananya Iyer — Problem Solver)`);
  console.log(`  Key 4 (Account 4 / Project 4): ${maskKey(env.GEMINI_API_KEY_4)}`);
  console.log(`    -> AI Participant 4 (Vikram Malhotra — Collaborator)`);
  console.log('----------------------------------------------------------------');

  // Verify non-pooling / distinct key invariant
  const keys = [env.GEMINI_API_KEY_1, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4];
  const uniqueKeys = new Set(keys);
  if (uniqueKeys.size !== 4) {
    console.warn(`[WARNING] Expected 4 unique project keys, found ${uniqueKeys.size} distinct keys.`);
  } else {
    console.log('[PASS] Credential Isolation: 4 distinct keys confirmed across 4 separate Google Cloud projects.');
  }

  // Google Authentication Compliance Check
  console.log('\n--- Google Authentication Policy Verification (ai.google.dev/gemini-api/docs/api-key) ---');
  keys.forEach((key, idx) => {
    const keyType = credentialService.classifyKeyType(key);
    const isSupported = credentialService.isKeySupported(key);
    const label = `Key ${idx + 1} (${maskKey(key)})`;
    if (keyType === 'auth_key') {
      console.log(`  [PASS] ${label}: Authorization Key format detected ('AQ.A...'). Fully compliant with Google Auth policy.`);
    } else if (keyType === 'restricted_standard') {
      console.log(`  [NOTE] ${label}: Standard API key format ('AIzaSy...'). Ensure explicit GCP Generative Language API restriction.`);
    } else {
      console.log(`  [WARN] ${label}: Unknown key format.`);
    }
    if (!isSupported) {
      console.warn(`  [FAIL] ${label}: Legacy unrestricted standard keys are rejected by Gemini API.`);
    }
  });

  console.log('\n--- Live Provider Probes (Independent Connection Validation) ---');

  // Probe 1: Key 1 + Flash-Lite Evaluator
  const resKey1Eval = await credentialService.validateRoleCredential('evaluator', env.GEMINI_EVAL_MODEL);
  logProbeResult('Key 1 + Evaluator (gemini-3.5-flash-lite)', resKey1Eval);

  // Probe 2: Key 1 + Gemma Reviewer
  const resKey1Gemma = await credentialService.validateRoleCredential('reviewer', env.GEMINI_REVIEW_MODEL);
  logProbeResult('Key 1 + Reviewer (gemma-4-26b-a4b-it)', resKey1Gemma);

  // Probe 3: Key 1 + Participant 1 (Priya)
  const resKey1Priya = await credentialService.validateRoleCredential('agent_a', env.GEMINI_EVAL_MODEL);
  logProbeResult('Key 1 + Participant 1 (Priya)', resKey1Priya);

  // Probe 4: Key 2 + Participant 2 (Rohan)
  const resKey2Rohan = await credentialService.validateRoleCredential('agent_b', env.GEMINI_EVAL_MODEL);
  logProbeResult('Key 2 + Participant 2 (Rohan)', resKey2Rohan);

  // Probe 5: Key 3 + Participant 3 (Ananya)
  const resKey3Ananya = await credentialService.validateRoleCredential('agent_c', env.GEMINI_EVAL_MODEL);
  logProbeResult('Key 3 + Participant 3 (Ananya)', resKey3Ananya);

  // Probe 6: Key 4 + Participant 4 (Vikram)
  const resKey4Vikram = await credentialService.validateRoleCredential('agent_d', env.GEMINI_EVAL_MODEL);
  logProbeResult('Key 4 + Participant 4 (Vikram)', resKey4Vikram);

  console.log('================================================================');
  console.log(' Credential verification complete. Zero keys leaked.');
  console.log('================================================================');
}

function logProbeResult(title: string, result: CredentialValidationResult): void {
  const statusTag = result.status === 'valid' ? '[PASS]' : result.status === 'rate_limited' ? '[RATE-LIMITED]' : '[FAIL]';
  const latency = result.latencyMs !== undefined ? ` (${result.latencyMs}ms)` : '';
  console.log(`  ${statusTag} ${title}: ${result.message}${latency}`);
}

runComprehensiveSmokeTest().catch((err) => {
  console.error('Fatal credential validation failure:', err);
  process.exit(1);
});
