# Deployment and Operations Runbook — Placement Arena

**Scope:** local development, a deployed WebSocket backend, a separate frontend and a durable database. Commands are templates; pin exact versions after dependency installation.

## 1. Local requirements

- Node.js current supported LTS (recommend Node 22+ for this plan).
- npm or the team's chosen package manager.
- Gemini API key for Live API/evaluator testing; mock mode must work without a key.
- PostgreSQL for persistence tests, or SQLite for local-only prototyping with the same repository interface.
- Browser with microphone and AudioWorklet support for full audio tests.

## 2. Environment variables

Copy `.env.example` to `.env` locally and fill only local development values. Never commit `.env`.

Required for model mode:
- `GEMINI_API_KEY`
- `LIVE_MODEL_ID=gemini-3.8-live`
- `EVALUATOR_MODEL_ID=gemini-3.5-flash-lite`

Optional:
- `DATABASE_URL`
- `GEMMA_PROVIDER_BASE_URL`, `GEMMA_PROVIDER_API_KEY`, `GEMMA_PROVIDER_MODEL_ID`

The hosted Gemma provider should remain disabled unless a compatible endpoint has been tested. Config validation must fail safely if model mode is selected without a required credential; mock mode should remain usable.

## 3. Local boot sequence

Exact npm scripts are owned by implementation. Recommended script names:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:integration
```

Suggested environment startup:
1. Start local PostgreSQL or enable explicitly local SQLite adapter.
2. Start backend HTTP/WebSocket service.
3. Start frontend dev server.
4. Set the frontend API URL to the backend local URL.
5. Use mock provider to verify setup/session/report before testing the external API.
6. Use HTTPS localhost or a supported secure browser context for microphone APIs when required by the browser.

## 4. Hosted architecture

Recommended separation:
- Frontend: static/SSR host (Vercel or similar).
- Backend: persistent WebSocket-capable web service (Render Web Service or equivalent).
- Database: managed PostgreSQL or another durable relational service.

A platform supporting WebSockets does not guarantee uninterrupted connections during deploy, scale, restart, idle shutdown or network changes. Add keepalive, reconnect, state snapshots and canonical event catch-up. Verify the chosen host's actual plan restrictions before demo.

For Render, official docs state Web Services can accept inbound WebSocket connections and WebSocket connections can be interrupted when instances are replaced/deployed; clients and server should send keepalives. For Vercel, WebSockets are documented as public beta in 2026. Choose based on an actual deployed test rather than familiarity alone.

## 5. Pre-deploy checklist

- [ ] `NODE_ENV=production` and strict config validation.
- [ ] HTTPS/WSS only, valid allowed origins, no wildcard CORS with credentials.
- [ ] Provider keys and DB URL exist as server-side environment secrets.
- [ ] `ALLOWED_ORIGINS` includes only actual frontend origin(s).
- [ ] `DATABASE_URL` points to durable persistence when history should survive restart.
- [ ] Health routes return sanitized data.
- [ ] Request/message size limits and rate limits are enabled.
- [ ] Provider timeouts and bounded retries are configured.
- [ ] Logs redact authorization and transcript/resume contents.
- [ ] The no-model/mock path is not exposed as a real AI result in the judged live app.
- [ ] Database migrations run safely before the release.
- [ ] At least one real deployed session completes, including report generation.

## 6. Health checks

- `/health/live`: process can respond; must not call external providers.
- `/health/ready`: required config and DB connectivity are ready. Avoid expensive or quota-consuming model calls during every health check.

Useful internal metrics:
- active sessions and active Live connections;
- WS connections and reconnects;
- provider connect/close/error counts;
- rate-limit/timeouts by provider/model ID;
- session start-to-first-audio latency;
- interruption-to-silence latency;
- event sequence gaps and duplicate events;
- report generation duration and quote-validation failure count.

Never expose metrics containing secrets, raw transcripts, resume text or provider handles to public endpoints.

## 7. Provider readiness test

Run this before the final demo on the exact deployed backend:
1. Confirm the chosen model ID is accepted by the configured project.
2. Open one Live session and capture setup confirmation.
3. Test input audio transcription and output audio transcript.
4. Confirm PCM rate/format and playback.
5. Interrupt while AI audio is playing; confirm no old chunks continue after stop.
6. Test `GoAway` and resumption behavior in a controlled session.
7. Test evaluator structured output, invalid quote rejection and fallback.
8. Test two then four concurrent Live sessions under the project's active limits; do not assume free tier implies any particular concurrency.
9. Check provider errors are sanitized and recoverable.

## 8. Release and rollback

Before redeploy:
- tag or record the known-good commit;
- check DB migration compatibility;
- run contract and session state tests;
- rehearse one GD and one report.

After deploy:
- test `/health/live`, `/health/ready`, session creation, WS connection, start, interrupt, end, report.
- keep the last known-good deployment or documented rollback command.
- if model concurrency breaks, enable a tested fallback mode (smaller active panel or hybrid text/voice) only if its behavior is explicitly disclosed and still meets the promised flow. Do not silently represent a mock/synthetic transcript as real.

## 9. Demo runbook

1. Open app fresh in a clean browser profile or incognito without stored stale tokens.
2. Confirm backend provider readiness without exposing logs/secrets.
3. Select a known stable GD topic.
4. Start microphone only after consent prompt and browser permission.
5. Show the four panel personalities and begin the moderator opening.
6. Allow Agent A to speak, then interrupt deliberately; verify audible stop and transcript capture.
7. Let another agent challenge the statement, then close the session early if needed.
8. Show the report and click an evidence quote to reveal the matching transcript event.
9. If live provider is down, use an honestly labelled backup recording; do not present a mock as a real live session.

## 10. Incident handling during demo

- **429/rate limit:** stop automatic retries; show temporary unavailability; use only a pretested fallback.
- **Live API close:** clear audio, reconnect/resume if possible, reload canonical snapshot; don't create a second overlapping session blindly.
- **Report evaluator fails:** show deterministic metrics and a truthful “qualitative review unavailable” note.
- **DB failure:** don't silently lose transcript; stop new turns if canonical writes cannot be guaranteed and offer a clear controlled end.
- **Frontend socket lost:** clear stale audio and reconnect with sequence cursor; do not restart the session from scratch by default.
