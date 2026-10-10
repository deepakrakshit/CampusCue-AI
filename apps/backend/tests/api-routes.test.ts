import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('Fastify REST API Routes Contract', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/live',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
  });

  it('GET /health/ready returns ready', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ready');
    expect(body.database).toBe('ok');
  });

  it('manages full session lifecycle over REST', async () => {
    // 1. Create GD Session
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: {
        mode: 'gd',
        topic: 'Is remote work sustainable for high-growth tech startups?',
        durationSeconds: 300,
        language: 'en-IN',
        panelSize: 4,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const createBody = JSON.parse(createRes.body);
    expect(createBody.session).toBeDefined();
    expect(createBody.session.sessionId).toBeDefined();
    expect(createBody.sessionAccessToken).toBeDefined();

    const sessionId = createBody.session.sessionId;
    const token = createBody.sessionAccessToken;

    // 2. Reject unauthenticated access to GET /sessions/:sessionId
    const unauthRes = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${sessionId}`,
    });
    expect(unauthRes.statusCode).toBe(401);

    // 3. Authenticated GET /sessions/:sessionId
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${sessionId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = JSON.parse(getRes.body);
    expect(getBody.sessionId).toBe(sessionId);
    expect(getBody.status).toBe('created');

    // 4. End session
    const endRes = await app.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/end`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        reason: 'user-ended',
      },
    });
    expect(endRes.statusCode).toBe(202);

    // 5. Query session events
    const eventsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${sessionId}/events?afterSequence=0`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(eventsRes.statusCode).toBe(200);
    const eventsBody = JSON.parse(eventsRes.body);
    expect(eventsBody.sessionId).toBe(sessionId);
    expect(Array.isArray(eventsBody.events)).toBe(true);

    // 6. Delete session
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/sessions/${sessionId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(deleteRes.statusCode).toBe(204);

    // 7. Verify session deleted
    const notFoundRes = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${sessionId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(notFoundRes.statusCode).toBe(404);
  });
});
