import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { healthRoutes } from './routes/health-routes.js';
import { sessionRoutes } from './routes/session-routes.js';
import { websocketRoutes } from './websocket/ws-handler.js';
import { getEnv } from './config/env.js';

export function buildApp(): FastifyInstance {
  const env = getEnv();

  const fastify = Fastify({
    logger: env.NODE_ENV === 'test' ? false : {
      level: env.LOG_LEVEL,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  });

  // CORS support
  fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // WebSocket support
  fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB payload limit
    },
  });

  // Register API and WebSocket routes
  fastify.register(healthRoutes);
  fastify.register(sessionRoutes);
  fastify.register(websocketRoutes);

  // Global error handler complying with openapi.yaml ApiErrorEnvelope
  fastify.setErrorHandler((error: Error & { statusCode?: number; code?: string }, request, reply) => {
    const statusCode = error.statusCode || 500;
    request.log.error(error);

    reply.status(statusCode).send({
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: statusCode === 500 && env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message,
        requestId: request.id,
        retryable: statusCode >= 500,
      },
    });
  });

  return fastify;
}
