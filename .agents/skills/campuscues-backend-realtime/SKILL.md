---
name: campuscues-backend-realtime
description: Authoritative backend and real-time orchestration skill for CampusCue AI. Use when designing, implementing, testing, or debugging Fastify backend services, session state orchestration, Gemini Live API integration, WebSocket event protocols, audio streaming, canonical transcript ordering, speaker exclusivity, persistence, and evidence-verified post-session evaluation.
---

# CampusCue AI — Authoritative Backend & Real-Time Orchestration

## Core Principles & Backend Authority

1. **Backend Authority Invariant:**
   - The backend service—never the client browser and never an external model provider—is the single authority for session state, event ordering, turn timers, speaker selection, cancellation epochs, data persistence, and report validation.
   - Client applications submit intent; the backend determines transitions and sequence numbers.

2. **Canonical Event Log:**
   - Every session maintains a single canonical event log.
   - Each event contains:
     - Stable immutable `eventId` (UUID/string, unique per session).
     - Monotonically increasing `sequence` allocated transactionally by the backend.
     - Server timestamp `createdAt` (UTC).
     - `speakerId` (`student`, `moderator`, `agent_a`, `agent_b`, `agent_c`, `agent_d`, `interviewer`).
     - `speakerLabel` (human-readable display name).
     - `kind` (`transcript`, `state_change`, `interruption`, `moderator`, `provider_status`, `system_note`).
     - `text` (canonical transcription for transcript events).
     - `turnId` and `generationEpoch` metadata.

3. **Explicit Agent Context Synchronization:**
   - In Group Discussion mode, each AI participant maintains an independent Gemini Live session.
   - Independent Live sessions NEVER share conversational memory automatically.
   - Every finalized turn (student or AI) must be explicitly propagated to all other participants' session contexts via `sendClientContent` with appropriate speaker role attribution.

4. **Central Turn Scheduler & Exclusive Audio:**
   - Exactly zero or one AI participant may be audible at any time.
   - A centralized turn scheduler decides which agent speaks next based on discussion dynamics and moderator rules.
   - Non-selected agents MUST NOT produce audible output simply because their contexts were updated.

5. **Interruption Handling & Fencing Epochs:**
   - When student speech is detected (barge-in):
     - The backend immediately signals the active provider session to cancel/stop generation.
     - An active `generationEpoch` counter increments on each new turn or interruption.
     - Late-arriving audio chunks or transcription fragments carrying stale epochs MUST be discarded.
     - The cancellation state and interruption event are immediately recorded in the canonical log.

6. **Provider Mocking & Testing First:**
   - Implement and thoroughly test a deterministic mock provider before requiring live Google Gemini credentials.
   - Unit tests, contract tests, and concurrency tests must pass against mock adapters without network calls.
   - When testing real Gemini Live sessions:
     - Verify one Live session first.
     - Then progressively verify multiple concurrent sessions against documented project quotas and rate limits.
     - NEVER rotate Google accounts or project IDs to evade documented quotas.

7. **Runtime Validation & Evidence Integrity:**
   - Every inbound WebSocket message, HTTP request, provider payload, and persisted row must be strictly validated with runtime schema parsers (e.g. Zod).
   - **Zero Hallucinated Evidence:** An evaluation report must NEVER publish a quotation unless that quote is an exact, verified substring match of a canonical transcript event from the same session. Reject invalid or unverified evidence.

8. **Security, Secrets & Privacy:**
   - API keys (`GEMINI_API_KEY`) and infrastructure credentials stay strictly server-side in environment variables.
   - Never expose secrets in client bundles, browser storage, WebSocket payloads, query parameters, or application logs.
   - Redact all sensitive fields, credentials, and full transcript text from diagnostic logs.
   - Bounded retries, strict request timeouts, and deterministic safe fallbacks must prevent infinite loops or cascading failures.

9. **Architecture & Module Boundaries:**
   - Keep modules small, strongly typed, and decoupled via clean interfaces (`SessionManager`, `TurnScheduler`, `GeminiLiveAdapter`, `TranscriptRepository`, `Evaluator`).
   - Avoid monolithic files and avoid unnecessary microservice sprawl.
   - Follow strict Test-Driven Development (TDD) and run fresh verification commands before completing backend tasks.
   - Check official Google documentation whenever SDK methods (`@google/genai`), model identifiers (`gemini-3.8-live`, `gemini-3.5-flash-lite`), audio formats (16kHz PCM input, 24kHz PCM output), or session protocols are updated.
