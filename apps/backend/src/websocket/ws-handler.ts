import type { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';
import { SessionRepository } from '../db/session-repository.js';
import { verifySessionToken } from '../services/auth-service.js';
import { orchestratorRegistry } from '../orchestration/orchestrator-registry.js';
import { ClientMessageSchema } from '../types/websocket.js';

export const websocketRoutes: FastifyPluginAsync = async (fastify) => {
  const sessionRepo = new SessionRepository();

  fastify.get<{
    Params: { sessionId: string };
    Querystring: { token?: string };
  }>('/ws/sessions/:sessionId', { websocket: true }, (socket: WebSocket, request) => {
    const { sessionId } = request.params;
    const token = request.query.token;

    const session = sessionRepo.getSessionById(sessionId);
    if (!session) {
      socket.close(4004, 'Session not found');
      return;
    }

    if (!token || !verifySessionToken(token, session.owner_token_hash)) {
      socket.close(4001, 'Unauthorized capability token');
      return;
    }

    const orchestrator = orchestratorRegistry.getOrCreate(sessionId);

    const clientWrapper = {
      send: (data: string) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      },
      isOpen: () => socket.readyState === WebSocket.OPEN,
    };

    orchestrator.addClient(clientWrapper);

    socket.on('message', async (raw: Buffer | string) => {
      try {
        const text = typeof raw === 'string' ? raw : raw.toString('utf-8');
        const parsedJson = JSON.parse(text);
        const parsedMessage = ClientMessageSchema.safeParse(parsedJson);

        if (!parsedMessage.success) {
          socket.send(
            JSON.stringify({
              type: 'notice',
              level: 'warn',
              message: `Invalid message format: ${parsedMessage.error.message}`,
            })
          );
          return;
        }

        const msg = parsedMessage.data;

        switch (msg.type) {
          case 'audio.chunk':
            // Audio streaming from student microphone
            break;

          case 'student.interruption':
            await orchestrator.handleStudentBargeIn();
            break;

          case 'student.speech_started':
            // Student started speaking
            break;

          case 'student.speech_stopped':
            await orchestrator.handleStudentSpeechStopped(msg.text || '');
            break;

          case 'transcript.student_text':
            await orchestrator.handleStudentSpeechStopped(msg.text);
            break;

          case 'session.start_requested':
            await orchestrator.initializeProviders();
            await orchestrator.startSession();
            break;

          case 'session.end_requested':
            await orchestrator.endSession(msg.reason);
            break;

          case 'client.ping':
            socket.send(
              JSON.stringify({
                type: 'pong',
                timestamp: msg.timestamp,
              })
            );
            break;
        }
      } catch (err) {
        socket.send(
          JSON.stringify({
            type: 'notice',
            level: 'error',
            message: err instanceof Error ? err.message : 'Message handling error',
          })
        );
      }
    });

    socket.on('close', () => {
      orchestrator.removeClient(clientWrapper);
    });

    socket.on('error', () => {
      orchestrator.removeClient(clientWrapper);
    });
  });
};
