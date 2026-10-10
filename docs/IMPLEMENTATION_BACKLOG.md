# Implementation Backlog — Placement Arena

Priorities are ordered to protect the PS 2 core. The frontend teammate can begin mock-driven UI while backend provider work is underway.

## P0 — Must finish for a credible PS 2 demo

### Foundation
- [ ] Agree repository and folder layout.
- [ ] Add environment parsing, `.env.example`, `.gitignore`, typecheck/lint/test scripts.
- [ ] Implement health/readiness routes and structured request-ID logging.
- [ ] Freeze REST + WebSocket contract with frontend.

### Session backend
- [ ] Session state machine with server-side deadline.
- [ ] Guest capability token + session authorization.
- [ ] Canonical event store with monotonic sequence and deduplication.
- [ ] Per-session serialized orchestration.
- [ ] Single-speaker lock with generation epoch.
- [ ] Mock provider and deterministic transcript/report fixture.

### Realtime integration
- [ ] One `gemini-3.8-live` session works end-to-end.
- [ ] PCM input/output formats verified, including resampling.
- [ ] Input/output transcription configured and captured.
- [ ] Student interruption immediately stops queued playback.
- [ ] Handle provider errors, timeout, disconnect and GoAway.
- [ ] Measure one, then two, then four concurrent sessions.
- [ ] Four agent contexts receive canonical events exactly once.

### Report
- [ ] Deterministic counts/share/turns computed from transcript events.
- [ ] Gemini structured-output evaluator with rubric version.
- [ ] Exact quote/event validation.
- [ ] Safe fallback on model timeout/invalid JSON/invalid evidence.

### Frontend core
- [ ] Session setup and clear AI disclosure.
- [ ] Room UI with four personas, moderator, timer, transcript and mic control.
- [ ] Playback stops immediately on interruption.
- [ ] Connection and session state visible.
- [ ] Report cards navigate to verified transcript evidence.

### Release
- [ ] Deployment and public endpoint verified.
- [ ] Secret scan passes.
- [ ] Mobile and microphone failure paths work.
- [ ] Full judge demo rehearsed and backup recording ready.

## P1 — Strong improvements if P0 is stable

- [ ] Project Deep-Dive Interview mode.
- [ ] Resume/project context extraction with file size/type limits.
- [ ] Interview-specific adaptive question stages and rubric.
- [ ] Report download/export.
- [ ] History of recent sessions within disclosed retention period.
- [ ] Better voice/persona differentiation after verifying supported voices.
- [ ] Add report evaluator benchmark transcripts and human review.
- [ ] Persist interrupted session and recover after backend deploy when feasible.

## P2 — Defer unless core is finished

- [ ] Gemma 4 31B IT hosted evaluator comparison.
- [ ] Hinglish/regional language mode with measured transcription quality.
- [ ] Multiple user panel/peer room.
- [ ] Faculty dashboard and cohort analytics.
- [ ] Model-based topic research/citations.
- [ ] Long-term learner progress and trend graphs.
- [ ] Audio download or raw voice replay (requires separate consent/retention design).

## Work split

### Backend/realtime teammate
- Own API endpoints and `openapi.yaml` conformance.
- Own WebSocket protocol, Gemini Live adapter, session lifecycle, context synchronization, speaker lock, canonical events, durable persistence and provider failure handling.
- Own quote validation, report endpoint and deployment environment secrets.

### Frontend teammate
- Build screens against mock fixtures immediately.
- Own microphone capture, PCM resampling, audio playback queue, interruption UX, transcript timeline, connection states, report visualisation and mobile/accessibility.
- Do not implement the turn scheduler or score computation as client authority.

### Shared
- Freeze protocol fields.
- Test actual browser and deployed backend together.
- Review every security/contract change.
- Rehearse the demo on the same network and devices.

## Definition of done for each task

A task is done only when its acceptance criteria are written, behavior is implemented, tests pass, error behavior is defined, docs/contracts are updated, and the frontend/backend contract remains aligned. “Works on my machine” without a repeatable test is not done.
