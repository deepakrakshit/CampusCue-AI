import type { SessionSnapshot, SessionEvent, Report } from '../types.js';

export class ApiClient {
  private baseUrl = '';

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async checkHealth(): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/health/live`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  }

  async createSession(payload: unknown): Promise<{ session: SessionSnapshot; sessionAccessToken: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create session (${res.status})`);
    }

    return res.json();
  }

  async getSession(sessionId: string, token: string): Promise<SessionSnapshot> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch session (${res.status})`);
    return res.json();
  }

  async startSession(sessionId: string, token: string): Promise<SessionSnapshot> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to start session (${res.status})`);
    return res.json();
  }

  async endSession(sessionId: string, token: string, reason = 'user-ended'): Promise<SessionSnapshot> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) throw new Error(`Failed to end session (${res.status})`);
    return res.json();
  }

  async getEvents(
    sessionId: string,
    token: string,
    afterSequence = 0,
    limit = 100
  ): Promise<{ sessionId: string; events: SessionEvent[]; lastSequence: number; hasMore: boolean }> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/sessions/${sessionId}/events?afterSequence=${afterSequence}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
    return res.json();
  }

  async getReport(sessionId: string, token: string): Promise<Report | { status: 'pending' }> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch report (${res.status})`);
    return res.json();
  }

  async retryReport(sessionId: string, token: string): Promise<{ status: 'pending' }> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/report/retry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to retry report (${res.status})`);
    return res.json();
  }

  async deleteSession(sessionId: string, token: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to delete session (${res.status})`);
  }

  createWebSocketConnection(sessionId: string, token: string): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/sessions/${sessionId}?token=${encodeURIComponent(token)}`;
    return new WebSocket(wsUrl);
  }
}

export const api = new ApiClient();
