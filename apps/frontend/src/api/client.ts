import type { SessionSnapshot, SessionEvent, Report } from '../types.js';

export class ApiClient {
  private baseUrl = '';

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    if (this.baseUrl) return this.baseUrl;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('campuscue_api_base_url');
      if (stored) return stored.replace(/\/$/, '');
    }
    const envBase = (import.meta as any).env?.VITE_API_BASE_URL || '';
    return envBase.replace(/\/$/, '');
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      if (url) {
        localStorage.setItem('campuscue_api_base_url', this.baseUrl);
      } else {
        localStorage.removeItem('campuscue_api_base_url');
      }
    }
  }

  async checkHealth(): Promise<{ status: string }> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/health/live`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  }

  async createSession(payload: unknown): Promise<{ session: SessionSnapshot; sessionAccessToken: string }> {
    const base = this.getBaseUrl();
    let res: Response;
    try {
      res = await fetch(`${base}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        'Backend unreachable. Please ensure the CampusCue AI server is running locally via run.bat (http://localhost:3000) or configure a backend URL.'
      );
    }

    if (!res.ok) {
      if (res.status === 405) {
        throw new Error(
          'Backend not available on this static preview host (HTTP 405). Live AI voice discussions and WebSockets require the Fastify backend. Please launch run.bat and use http://localhost:3000, or connect a deployed backend server.'
        );
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create session (${res.status})`);
    }

    return res.json();
  }

  async getSession(sessionId: string, token: string): Promise<SessionSnapshot> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/api/v1/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch session (${res.status})`);
    return res.json();
  }

  async startSession(sessionId: string, token: string): Promise<SessionSnapshot> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/api/v1/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to start session (${res.status})`);
    return res.json();
  }

  async endSession(sessionId: string, token: string, reason = 'user-ended'): Promise<SessionSnapshot> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/api/v1/sessions/${sessionId}/end`, {
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
    const base = this.getBaseUrl();
    const res = await fetch(
      `${base}/api/v1/sessions/${sessionId}/events?afterSequence=${afterSequence}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
    return res.json();
  }

  async getReport(sessionId: string, token: string): Promise<Report | { status: 'pending' }> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/api/v1/sessions/${sessionId}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch report (${res.status})`);
    return res.json();
  }

  async retryReport(sessionId: string, token: string): Promise<{ status: 'pending' }> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/api/v1/sessions/${sessionId}/report/retry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to retry report (${res.status})`);
    return res.json();
  }

  async deleteSession(sessionId: string, token: string): Promise<void> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to delete session (${res.status})`);
  }

  createWebSocketConnection(sessionId: string, token: string): WebSocket {
    let wsBase = '';
    if (typeof window !== 'undefined') {
      wsBase = localStorage.getItem('campuscue_ws_base_url') || '';
    }
    if (!wsBase) {
      wsBase = (import.meta as any).env?.VITE_WS_BASE_URL || '';
    }

    if (wsBase) {
      const wsOrigin = wsBase.replace(/^http/, 'ws').replace(/\/$/, '');
      const wsUrl = `${wsOrigin}/ws/sessions/${sessionId}?token=${encodeURIComponent(token)}`;
      return new WebSocket(wsUrl);
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/sessions/${sessionId}?token=${encodeURIComponent(token)}`;
    return new WebSocket(wsUrl);
  }
}

export const api = new ApiClient();
