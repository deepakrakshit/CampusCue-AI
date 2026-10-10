import { GoogleGenAI } from '@google/genai';
import { getEnv, maskKey } from './config/env.js';

async function runSmokeTest(): Promise<void> {
  console.log('--- CampusCue AI: AI Model & Credential Smoke Test ---');
  const env = getEnv();

  console.log(`Node Environment: ${env.NODE_ENV}`);
  console.log(`Live Model: ${env.GEMINI_LIVE_MODEL}`);
  console.log(`Evaluator Model: ${env.GEMINI_EVAL_MODEL}`);
  console.log(`Reviewer Model: ${env.GEMINI_REVIEW_MODEL}`);
  console.log(`Key 1 (Agent A / Interviewer / Eval): ${maskKey(env.GEMINI_API_KEY_1)}`);
  console.log(`Key 2 (Agent B):                      ${maskKey(env.GEMINI_API_KEY_2)}`);
  console.log(`Key 3 (Agent C):                      ${maskKey(env.GEMINI_API_KEY_3)}`);
  console.log(`Key 4 (Agent D):                      ${maskKey(env.GEMINI_API_KEY_4)}`);
  console.log('----------------------------------------------------');

  // Test 1: Key 1 with gemini-3.5-flash-lite (Primary Evaluator)
  try {
    const ai1 = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY_1 });
    const startTime = Date.now();
    const res1 = await ai1.models.generateContent({
      model: env.GEMINI_EVAL_MODEL,
      contents: 'Respond with exactly the single word "VERIFIED".',
    });
    const duration = Date.now() - startTime;
    const text = res1.text?.trim() || '';
    console.log(`[PASS] Key 1 + Evaluator (${env.GEMINI_EVAL_MODEL}): "${text}" (${duration}ms)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[FAIL] Key 1 + Evaluator (${env.GEMINI_EVAL_MODEL}): ${msg}`);
  }

  // Test 2: Key 1 with gemma-4-26b-a4b-it (Supplementary Reviewer)
  try {
    const ai1 = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY_1 });
    const startTime = Date.now();
    const resGemma = await ai1.models.generateContent({
      model: env.GEMINI_REVIEW_MODEL,
      contents: 'Respond with exactly the single word "VERIFIED".',
    });
    const duration = Date.now() - startTime;
    const text = resGemma.text?.trim() || '';
    console.log(`[PASS] Key 1 + Reviewer (${env.GEMINI_REVIEW_MODEL}): "${text}" (${duration}ms)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[NOTE] Key 1 + Reviewer (${env.GEMINI_REVIEW_MODEL}): ${msg}`);
    console.log('      (Will verify fallback or adapter support if Gemma variant is hosted separately)');
  }

  // Test 3: Key 2 (Agent B)
  try {
    const ai2 = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY_2 });
    const startTime = Date.now();
    const res2 = await ai2.models.generateContent({
      model: env.GEMINI_EVAL_MODEL,
      contents: 'Ping',
    });
    const duration = Date.now() - startTime;
    console.log(`[PASS] Key 2 (Agent B Credential Valid): Response in ${duration}ms`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[FAIL] Key 2 (Agent B): ${msg}`);
  }

  // Test 4: Key 3 (Agent C)
  try {
    const ai3 = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY_3 });
    const startTime = Date.now();
    const res3 = await ai3.models.generateContent({
      model: env.GEMINI_EVAL_MODEL,
      contents: 'Ping',
    });
    const duration = Date.now() - startTime;
    console.log(`[PASS] Key 3 (Agent C Credential Valid): Response in ${duration}ms`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[FAIL] Key 3 (Agent C): ${msg}`);
  }

  // Test 5: Key 4 (Agent D)
  try {
    const ai4 = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY_4 });
    const startTime = Date.now();
    const res4 = await ai4.models.generateContent({
      model: env.GEMINI_EVAL_MODEL,
      contents: 'Ping',
    });
    const duration = Date.now() - startTime;
    console.log(`[PASS] Key 4 (Agent D Credential Valid): Response in ${duration}ms`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[FAIL] Key 4 (Agent D): ${msg}`);
  }

  console.log('----------------------------------------------------');
  console.log('Smoke test complete.');
}

runSmokeTest().catch((err) => {
  console.error('Fatal error during smoke test:', err);
  process.exit(1);
});
