import type { FastifyPluginAsync } from 'fastify';
import { getDatabase } from '../db/database.js';
import { getEnv } from '../config/env.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health/live', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  fastify.get('/health/ready', async (_request, reply) => {
    try {
      const db = getDatabase();
      db.prepare('SELECT 1').get();

      const env = getEnv();
      const hasKey = Boolean(env.GEMINI_API_KEY_1);

      return reply.status(200).send({
        status: 'ready',
        database: 'ok',
        providerConfig: hasKey ? 'ok' : 'mock',
      });
    } catch (err) {
      return reply.status(503).send({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: err instanceof Error ? err.message : 'Readiness check failed',
          requestId: _request.id,
          retryable: true,
        },
      });
    }
  });
};
