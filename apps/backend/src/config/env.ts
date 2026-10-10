import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Walk up to find root .env
function loadRootEnv(): void {
  let dir = process.cwd();
  for (let i = 0; i < 4; i++) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
    dir = resolve(dir, '..');
  }
  dotenv.config();
}

loadRootEnv();

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  GEMINI_API_KEY_1: z.string().min(1, 'GEMINI_API_KEY_1 is required'),
  GEMINI_API_KEY_2: z.string().min(1, 'GEMINI_API_KEY_2 is required'),
  GEMINI_API_KEY_3: z.string().min(1, 'GEMINI_API_KEY_3 is required'),
  GEMINI_API_KEY_4: z.string().min(1, 'GEMINI_API_KEY_4 is required'),
  GEMINI_LIVE_MODEL: z.string().default('gemini-3.8-live'),
  GEMINI_EVAL_MODEL: z.string().default('gemini-3.5-flash-lite'),
  GEMINI_REVIEW_MODEL: z.string().default('gemma-4-26b-a4b-it'),
  DATABASE_PATH: z.string().default('campus_cue.sqlite'),
  MOCK_PROVIDERS: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cachedEnv) return cachedEnv;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missingKeys = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Environment validation failed for variables: [${missingKeys}]`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export type AgentRole =
  | 'agent_a'
  | 'agent_b'
  | 'agent_c'
  | 'agent_d'
  | 'interviewer'
  | 'evaluator'
  | 'reviewer';

export function getAgentApiKey(role: AgentRole): string {
  const env = getEnv();
  switch (role) {
    case 'agent_a':
      return env.GEMINI_API_KEY_1;
    case 'agent_b':
      return env.GEMINI_API_KEY_2;
    case 'agent_c':
      return env.GEMINI_API_KEY_3;
    case 'agent_d':
      return env.GEMINI_API_KEY_4;
    case 'interviewer':
      return env.GEMINI_API_KEY_1;
    case 'evaluator':
      return env.GEMINI_API_KEY_1;
    case 'reviewer':
      return env.GEMINI_API_KEY_1;
    default: {
      const _exhaustive: never = role;
      throw new Error(`Unknown role: ${_exhaustive}`);
    }
  }
}

export function maskKey(key: string): string {
  if (!key || key.length < 8) return '********';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
