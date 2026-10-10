# Placement Arena — Engineering Starter Pack

**Purpose:** Working starting documents for a two-person hackathon team building Placement Arena. The backend/realtime teammate owns the service and model orchestration. The frontend teammate can build against the contracts before the backend is complete.

**Core deliverable:** PS 2 — GD Arena, a voice-first group discussion with four AI participants, a moderator, student interruption, a canonical transcript, and evidence-linked feedback.

**Extension:** Project Deep-Dive Interview, a five-minute role- and project-specific interview with a post-session report. Do not let this extension delay completion of the core PS 2 rubric.

**Research review date:** 10 October 2026. Model names, quotas, API behavior, terms, and hosting policies change. Check `RESEARCH_SOURCES.md` before release.

## Start here

Read the docs in this order:

1. `PRD.md` — scope, users, acceptance criteria, priorities.
2. `ARCHITECTURE.md` — system boundaries, design principles, model/session choices, threat model.
3. `BACKEND_IMPLEMENTATION_PLAN.md` — build order, module responsibilities, backend-first plan.
4. `API_CONTRACT.md` and `openapi.yaml` — the frontend/backend integration contract.
5. `FRONTEND_INTEGRATION.md` — instructions for building the frontend in parallel.
6. `DATA_MODEL.md` — canonical transcript and persistence model.
7. `AI_MODEL_STRATEGY.md` — live model, evaluator, prompts, fallback behavior.
8. `SECURITY_PRIVACY.md` — secrets, guest session access, uploads, prompt injection, privacy.
9. `TEST_PLAN.md` — unit/integration/system tests and demo rehearsal gates.
10. `DEPLOYMENT_RUNBOOK.md` — local setup, environment, deploy, health checks, rollback.
11. `IMPLEMENTATION_BACKLOG.md` — prioritized work split and definition of done.
12. `RESEARCH_SOURCES.md` — primary references and decisions they support.

## Recommended stack

- Backend: Node.js 22+ (or current supported LTS), TypeScript, Fastify or Express, `ws` or a tested WebSocket adapter, official `@google/genai` SDK.
- Frontend: React + TypeScript; Next.js or Vite is acceptable. Keep the agreed frontend choice in its own app directory.
- Persistence: PostgreSQL for deployed, durable session/report data; SQLite is fine for local development only if repository interfaces stay portable.
- Validation: Zod or an equivalent runtime schema validator for all external messages and model responses.
- Tests: Vitest or Node test runner for unit tests; Playwright for browser end-to-end tests; a script for concurrent session checks.
- Deployment: separate frontend and a persistent WebSocket-capable backend service. Confirm actual service behavior on the target plan.

These are recommendations, not mandatory dependencies. Pick and freeze the stack in the first implementation commit. Do not build microservices for a two-person hackathon.

## Product invariants

1. The backend—not the model and not the browser—is authoritative for session state, order, deadlines, speaker exclusivity, final transcript, scoring metrics, and report quote validation.
2. Exactly zero or one AI speaker may be audible at any time. The student may barge in at any time.
3. All four agents share one canonical transcript through explicit context synchronization. Independent Live sessions do not share memory automatically.
4. A generated report cannot publish a quotation unless the exact quote is found in the corresponding canonical transcript event.
5. Every external input and model output is untrusted and must be validated.
6. API keys never enter frontend bundles, browser storage, logs, or Git.
7. No quota circumvention through account/project rotation. Use configured limits and test concurrent Live sessions legitimately.
8. The core GD flow must be done and tested before the interview extension is completed.

## Repository structure recommendation

```text
placement-arena/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── config/
│   │   │   ├── http/
│   │   │   ├── websocket/
│   │   │   ├── sessions/
│   │   │   ├── orchestration/
│   │   │   ├── providers/gemini-live/
│   │   │   ├── evaluation/
│   │   │   ├── persistence/
│   │   │   ├── security/
│   │   │   └── observability/
│   │   └── tests/
│   └── frontend/
├── docs/                     # this documentation set
├── openapi.yaml
├── .env.example
├── .gitignore
└── README.md
```

The docs are intended to be copied into the repository root or `docs/`. If your hackathon has a rule that all code must be created during the event, use these documents as design references and ensure the submitted code/repository history complies.

## Current known unknowns

Before a full implementation, test the exact Gemini Live model and SDK in the active project: four concurrent sessions, interruption latency, output audio format, transcript events, `sendClientContent` context synchronization, `GoAway`/session resumption, and current rate limits. The documentation cannot guarantee your specific free-tier concurrency or uptime.
