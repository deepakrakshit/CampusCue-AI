import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { SessionRepository } from '../db/session-repository.js';
import { EventRepository } from '../db/event-repository.js';
import { ReportRepository } from '../db/report-repository.js';
import { CreateSessionSchema } from '../types/session.js';
import { generateSessionCapability, verifySessionToken } from '../services/auth-service.js';
import { orchestratorRegistry } from '../orchestration/orchestrator-registry.js';
import type { SessionRecord } from '../types/session.js';

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  const sessionRepo = new SessionRepository();
  const eventRepo = new EventRepository();
  const reportRepo = new ReportRepository();

  function authenticateSession(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply
  ): SessionRecord | null {
    const { sessionId } = request.params;
    const session = sessionRepo.getSessionById(sessionId);

    if (!session) {
      reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `Session ${sessionId} not found`,
          requestId: request.id,
          retryable: false,
        },
      });
      return null;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid session capability token',
          requestId: request.id,
          retryable: false,
        },
      });
      return null;
    }

    const token = authHeader.slice(7).trim();
    if (!verifySessionToken(token, session.owner_token_hash)) {
      reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid session capability token',
          requestId: request.id,
          retryable: false,
        },
      });
      return null;
    }

    return session;
  }

  // POST /api/v1/sessions
  fastify.post('/api/v1/sessions', async (request, reply) => {
    const parseResult = CreateSessionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.message,
          requestId: request.id,
          retryable: false,
        },
      });
    }

    const { token, tokenHash } = generateSessionCapability();
    const session = sessionRepo.createSession(parseResult.data, tokenHash);

    return reply.status(201).send({
      session: sessionRepo.toSnapshot(session),
      sessionAccessToken: token,
    });
  });

  // GET /api/v1/sessions/:sessionId
  fastify.get<{ Params: { sessionId: string } }>('/api/v1/sessions/:sessionId', async (request, reply) => {
    const session = authenticateSession(request, reply);
    if (!session) return;

    return reply.status(200).send(sessionRepo.toSnapshot(session));
  });

  // DELETE /api/v1/sessions/:sessionId
  fastify.delete<{ Params: { sessionId: string } }>('/api/v1/sessions/:sessionId', async (request, reply) => {
    const session = authenticateSession(request, reply);
    if (!session) return;

    orchestratorRegistry.delete(session.id);
    sessionRepo.deleteSession(session.id);

    return reply.status(204).send();
  });

  // POST /api/v1/sessions/:sessionId/start
  fastify.post<{ Params: { sessionId: string } }>('/api/v1/sessions/:sessionId/start', async (request, reply) => {
    const session = authenticateSession(request, reply);
    if (!session) return;

    try {
      const orchestrator = orchestratorRegistry.getOrCreate(session.id);
      await orchestrator.initializeProviders();
      const updated = await orchestrator.startSession();
      return reply.status(200).send(sessionRepo.toSnapshot(updated));
    } catch (err) {
      return reply.status(500).send({
        error: {
          code: 'PROVIDER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to start session',
          requestId: request.id,
          retryable: true,
        },
      });
    }
  });

  // POST /api/v1/sessions/:sessionId/end
  fastify.post<{
    Params: { sessionId: string };
    Body: { reason?: 'user-ended' | 'deadline' | 'provider-error' };
  }>('/api/v1/sessions/:sessionId/end', async (request, reply) => {
    const session = authenticateSession(request, reply);
    if (!session) return;

    const orchestrator = orchestratorRegistry.getOrCreate(session.id);
    const reason = request.body?.reason || 'user-ended';
    await orchestrator.endSession(reason);

    const freshSession = sessionRepo.getSessionById(session.id)!;
    return reply.status(202).send(sessionRepo.toSnapshot(freshSession));
  });

  // GET /api/v1/sessions/:sessionId/events
  fastify.get<{
    Params: { sessionId: string };
    Querystring: { afterSequence?: string; limit?: string };
  }>('/api/v1/sessions/:sessionId/events', async (request, reply) => {
    const session = authenticateSession(request, reply);
    if (!session) return;

    const afterSequence = Number(request.query.afterSequence || 0);
    const limit = Number(request.query.limit || 100);

    const result = eventRepo.getEventsAfterSequence(session.id, afterSequence, limit);
    return reply.status(200).send({
      sessionId: session.id,
      events: result.events,
      lastSequence: result.lastSequence,
      hasMore: result.hasMore,
    });
  });

  // GET /api/v1/sessions/:sessionId/report
  fastify.get<{ Params: { sessionId: string } }>('/api/v1/sessions/:sessionId/report', async (request, reply) => {
    const session = authenticateSession(request, reply);
    if (!session) return;

    const report = reportRepo.getLatestReport(session.id);
    if (report) {
      return reply.status(200).send(report);
    }

    if (session.report_status === 'pending' || session.status === 'report_pending') {
      return reply.status(202).send({ status: 'pending' });
    }

    return reply.status(404).send({
      error: {
        code: 'REPORT_NOT_FOUND',
        message: 'No report found for this session',
        requestId: request.id,
        retryable: false,
      },
    });
  });

  // POST /api/v1/sessions/:sessionId/report/retry
  fastify.post<{ Params: { sessionId: string } }>('/api/v1/sessions/:sessionId/report/retry', async (request, reply) => {
    const session = authenticateSession(request, reply);
    if (!session) return;

    const orchestrator = orchestratorRegistry.getOrCreate(session.id);
    sessionRepo.updateSessionStatus(session.id, 'report_pending', { report_status: 'pending' });

    // Trigger async evaluation retry
    const freshSession = sessionRepo.getSessionById(session.id)!;
    (orchestrator as any).generateSessionReport(freshSession);

    return reply.status(202).send({ status: 'pending' });
  });
};
