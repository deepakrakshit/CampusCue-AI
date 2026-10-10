import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { buildApp } from '../src/app.js';

describe('WebSocket Real-Time End-to-End Protocol', () => {
  let app: FastifyInstance;
  let serverPort: number;

  beforeAll(async () => {
    app = buildApp();
    const address = await app.listen({ port: 0, host: '127.0.0.1' });
    const portMatch = address.match(/:(\d+)$/);
    serverPort = portMatch ? parseInt(portMatch[1], 10) : 3001;
  });

  afterAll(async () => {
    await app.close();
  });

  it('connects over WebSocket, receives server.connected, responds to ping, accepts student text, and handles barge-in interruption', async () => {
    // 1. Create a session via REST API
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: {
        mode: 'gd',
        topic: 'AI and Sustainable Urban Transit Systems',
        durationSeconds: 180,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const { session, sessionAccessToken } = JSON.parse(createRes.body);
    const sessionId = session.sessionId;

    // 2. Reject unauthorized WebSocket connection (invalid token)
    const badWsPromise = new Promise<number>((resolve) => {
      const badWs = new WebSocket(`ws://127.0.0.1:${serverPort}/ws/sessions/${sessionId}?token=invalid_token`);
      badWs.on('close', (code) => {
        resolve(code);
      });
      badWs.on('error', () => {
        // error will trigger close
      });
    });
    const badCode = await badWsPromise;
    expect(badCode).toBe(4001);

    // 3. Connect valid WebSocket
    const receivedMessages: any[] = [];
    const ws = new WebSocket(`ws://127.0.0.1:${serverPort}/ws/sessions/${sessionId}?token=${sessionAccessToken}`);

    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString('utf-8'));
        receivedMessages.push(parsed);
      } catch {
        // ignore
      }
    });

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => resolve());
      ws.on('error', (err) => reject(err));
    });

    // 4. Wait for server.connected message
    await new Promise((r) => setTimeout(r, 200));
    const connectedMsg = receivedMessages.find((m) => m.type === 'server.connected');
    expect(connectedMsg).toBeDefined();
    expect(connectedMsg.sessionId).toBe(sessionId);
    expect(connectedMsg.generationEpoch).toBeGreaterThanOrEqual(0);

    // 5. Test ping/pong heartbeat
    const pingTimestamp = Date.now();
    ws.send(JSON.stringify({ type: 'client.ping', timestamp: pingTimestamp }));

    await new Promise((r) => setTimeout(r, 100));
    const pongMsg = receivedMessages.find((m) => m.type === 'pong');
    expect(pongMsg).toBeDefined();
    expect(pongMsg.timestamp).toBe(pingTimestamp);

    // 6. Test student text submission (fallback or typed turn)
    const studentSpeech = 'I believe multi-modal transit networks must integrate EV feeder loops';
    ws.send(
      JSON.stringify({
        type: 'transcript.student_text',
        text: studentSpeech,
      })
    );

    await new Promise((r) => setTimeout(r, 300));
    const transcriptFinal = receivedMessages.find(
      (m) => m.type === 'transcript.final' && m.event.speakerId === 'student'
    );
    expect(transcriptFinal).toBeDefined();
    expect(transcriptFinal.event.text).toBe(studentSpeech);
    expect(transcriptFinal.event.sequence).toBeGreaterThan(0);

    // 7. Test Student Barge-In / Interruption
    const epochBefore = connectedMsg.generationEpoch;
    ws.send(
      JSON.stringify({
        type: 'student.interruption',
      })
    );

    await new Promise((r) => setTimeout(r, 300));
    const interruptionMsg = receivedMessages.find((m) => m.type === 'student.interruption_detected');
    expect(interruptionMsg).toBeDefined();
    expect(interruptionMsg.generationEpoch).toBeGreaterThan(epochBefore);

    // 8. Close client socket cleanly
    ws.close();
    await new Promise((r) => setTimeout(r, 100));
  });
});
