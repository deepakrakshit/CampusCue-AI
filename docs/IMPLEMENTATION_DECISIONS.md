# CampusCue AI — Implementation Architecture Decisions

## Document Context
This document captures key engineering decisions and architectural resolutions made during the end-to-end implementation of CampusCue AI, ensuring strict alignment with `ARCHITECTURE.md`, `DATA_MODEL.md`, `SECURITY_PRIVACY.md`, and `AI_MODEL_STRATEGY.md`.

---

## Decision 1: Database Engine — Native `node:sqlite` (`DatabaseSync`)
- **Context:** Node.js v24.13.1 provides native built-in `node:sqlite` with the synchronous SQLite engine (`DatabaseSync`).
- **Decision:** Utilize Node 24 native `node:sqlite` instead of `better-sqlite3`.
- **Rationale:**
  - Zero external C++ native build toolchain dependencies (avoiding Python / Visual Studio Build Tools build failures on Windows).
  - Native WAL (`Write-Ahead Logging`) mode and foreign key constraint enforcement.
  - Configured `PRAGMA busy_timeout = 5000;` to ensure graceful lock acquisition across concurrent operations and parallel test suites.

---

## Decision 2: Multi-Key Mapping & Secret Isolation
- **Context:** Four distinct Gemini Live API keys are provisioned in `.env` (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, `GEMINI_API_KEY_4`).
- **Decision:** Map keys deterministically by functional persona:
  - **Key 1:** Agent A (Priya Patel — Analytical), Moderator, Technical Interviewer, Evaluation (`gemini-3.5-flash-lite`), and Reviewer (`gemma-4-26b-a4b-it`).
  - **Key 2:** Agent B (Rohan Verma — Challenger & Contrarian).
  - **Key 3:** Agent C (Ananya Iyer — Problem Solver & Structured).
  - **Key 4:** Agent D (Vikram Malhotra — Collaborator & Synthesizer).
- **Security Invariant:**
  - All keys remain exclusively on the server runtime.
  - Zero keys are transmitted to the browser or exposed via frontend bundles.
  - Masking utilities (`maskKey`) redact key values in error logs and diagnostics.

---

## Decision 3: Single-Speaker Exclusivity & Generation Epoch Fencing
- **Context:** In real-time voice discussions, overlapping speech between multiple AI participants or during student barge-in destroys conversational realism.
- **Decision:**
  - Implement a central `TurnScheduler` maintaining an exclusive speaker lock (`idle`, `ai-speaking`, `student-speaking`, `closing`).
  - Maintain a monotonically increasing `generation_epoch` in the database and in memory.
  - On student barge-in, `generation_epoch` increments immediately:
    - Frontend `AudioPlayer` instantly halts Web Audio output and clears queued PCM chunks.
    - Any in-flight or late-arriving audio chunk with `chunkEpoch < currentEpoch` is fenced and discarded.
    - AI providers receive cancellation signals to cease generation immediately.

---

## Decision 4: Canonical Monotonic Transcript & Explicit Context Sync
- **Context:** Each AI participant connects to an independent Gemini Live session without native shared memory.
- **Decision:**
  - Backend is the sole authority for sequence numbers (`next_sequence`).
  - All events (AI speech, student speech, moderator guidance, system notes) are recorded atomically as canonical events in SQLite.
  - The orchestrator explicitly synchronizes newly committed canonical events into the other participants' sessions via `sendClientContent`, guaranteeing unified context.

---

## Decision 5: Zero Hallucinated Quotes Invariant
- **Context:** Post-session feedback must provide grounded, actionable evidence from the student's actual performance.
- **Decision:**
  - In `EvaluatorService`, every evidence quote produced by `gemini-3.5-flash-lite` is cross-referenced against stored canonical events.
  - A quote is only approved if `event.text.includes(evidence.quote)`.
  - If a quote cannot be verified as an exact substring, it is rejected.
  - If all quotes for a rubric competency fail validation, the score is nullified and `insufficientEvidence` is flagged.

---

## Decision 6: Full-Stack Monorepo Architecture
- **Context:** Need unified development, shared contract types, and isolated execution for Fastify backend and React frontend.
- **Decision:**
  - Setup an npm workspace monorepo: `apps/backend` (Fastify 5 + TypeScript + Pino) and `apps/frontend` (React 19 + Vite 6 + Tailwind CSS).
  - Proxied WebSocket (`/ws`) and REST endpoints (`/api`, `/health`) from Vite dev server to Fastify port 3001.
