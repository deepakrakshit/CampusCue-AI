# CampusCue AI — Agent Guidelines & Skill Usage Policy

## Project Context
CampusCue AI is a voice-first practice platform for college students preparing for campus placements. The core application provides an AI Group Discussion room with four distinct AI participants and a moderator, real-time spoken interactions via Google Gemini Live API, student barge-in interruption, a canonical ordered transcript, and evidence-verified feedback reports.

All technical specifications are documented in `docs/`:
- Architecture & Threat Model: `docs/ARCHITECTURE.md`
- Data Model & Persistence: `docs/DATA_MODEL.md`
- AI Model Strategy: `docs/AI_MODEL_STRATEGY.md`
- Security & Privacy: `docs/SECURITY_PRIVACY.md`
- Test Plan: `docs/TEST_PLAN.md`
- Deployment Runbook: `docs/DEPLOYMENT_RUNBOOK.md`
- API Specification: `docs/openapi.yaml` and `docs/README.md`

---

## Skill Usage Policy

The workspace is equipped with 13 specialized agent skills under `.agents/skills/`. Agents must invoke the relevant skills based on the technical domain of each task:

### 1. Real-Time Backend & Audio Orchestration
When designing, modifying, or testing the backend server, WebSockets, or live voice sessions:
- **`campuscues-backend-realtime`**: Authoritative domain rules for session state machines, canonical transcript ordering, turn scheduling, agent context sync, interruption cancellation epochs, and evidence quote verification.
- **`gemini-live-api-dev`**: Official guidance for `@google/genai`, `gemini-3.8-live`, PCM 16kHz input / 24kHz output, `sendClientContent`, session resumption, and GoAway handling.
- **`fastify-best-practices`**: Fastify server structure, plugin encapsulation, TypeScript type stripping, WebSocket adapters, Pino logging, and JSON Schema validation.

### 2. Post-Session Evaluation & Model Queries
When building post-session evaluation, rubric scoring, or prompt definitions:
- **`gemini-api-dev`**: Structured JSON outputs with `gemini-3.5-flash-lite`, error handling, and prompt design for text assessment.

### 3. Frontend Engineering & User Experience
When implementing or reviewing React components, audio recording, and room user interfaces:
- **`campuscues-frontend-integration`**: Authoritative frontend rules for contract compliance, explicit session UI state representation, instant audio cancellation on student barge-in, and mock harness testing.
- **`vercel-composition-patterns`**: Component architecture, avoiding boolean prop sprawl, compound components, and clean state lifting.
- **`vercel-react-best-practices`**: React/Next.js rendering performance, bundle size optimization, and re-render elimination.
- **`web-design-guidelines`**: Accessibility (WCAG AA), keyboard navigation, focus management, and readable visual design.
- **`frontend-design`**: Distinctive, intentional aesthetic styling tailored for campus placement practice.

### 4. Automated Testing & Verification
When writing or executing tests:
- **`webapp-testing`**: Playwright browser automation, DOM interaction validation, screenshot verification, and console log inspection.
- **`test-driven-development`**: Red-Green-Refactor cycle. No production code without a failing test first.
- **`systematic-debugging`**: Root cause investigation before proposing or applying fixes.
- **`verification-before-completion`**: Fresh command execution and exit code verification before making any completion claim.

---

## Architectural Invariants (Non-Negotiable)

1. **Backend Authority:** The backend is the sole source of truth for session status, sequence numbers, speaker exclusivity, timers, and report validation.
2. **Exclusivity & Interruption:** Exactly zero or one AI speaker may be audible at any time. When a student speaks, AI playback must cease immediately, and late chunks must be fenced by generation epoch.
3. **Explicit Context Sync:** Each AI participant has an independent Gemini Live session; context is propagated explicitly via canonical transcript events, never assumed shared.
4. **Zero Hallucinated Quotes:** Every quoted phrase in a generated report must be an exact verified substring of a stored canonical event.
5. **Secret Protection:** `GEMINI_API_KEY` stays exclusively on the server. Never commit, log, or send keys to the browser.
