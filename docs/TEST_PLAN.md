# Test Plan — Placement Arena

**Purpose:** Prevent a visually impressive demo from masking broken turn-taking, transcript integrity, scoring, or recovery.

## 1. Test layers

1. **Unit:** state machine, speaker lock, event sequence/dedup, metrics, evaluator/report validators, input validators.
2. **Contract:** REST routes and WebSocket messages against `API_CONTRACT.md` / `openapi.yaml`.
3. **Provider adapter integration:** Gemini Live setup, audio frame handling, output transcription, interruption, `GoAway`, resumption and quota errors.
4. **System:** full browser → backend → Live API → transcript → report loop.
5. **Resilience:** network drop, app reconnect, duplicate events, provider timeout, malformed output, DB outage.
6. **Security:** token authorization, input size/rate limits, injection, secret leakage, CORS/URL fetch validation.
7. **Demo rehearsal:** actual public deployment, phone and laptop, realistic room/noise and 3-minute timed flow.

## 2. Core invariant tests

### Speaker lock and interruption
- AI A starts; AI B start request arrives before A stops → reject/defer B, never overlap.
- Student barge-in during audio → clear client buffer, increment generation epoch, cancel active output, invalidate late chunks.
- Student begins speaking during provider TTS generation but before first chunk → no old audio should start after the student's input.
- Two VAD/interruption events for same turn → only one interruption event recorded for same turn/epoch.
- Playback ends normally → lock releases and scheduler can choose next speaker.
- Playback error, timeout or socket close → lock releases or session transitions to recoverable state; never deadlocks.
- Stale callback from prior generation arrives → ignore by generation epoch.
- Moderator cannot start while student still owns speaker lock.

### Canonical transcript
- Concurrent event writes for same session receive unique increasing sequence values.
- Duplicate event ID is ignored/idempotent, not appended twice.
- Reconnect sends `lastSeenSequence`; server returns missing events in order.
- Out-of-order provider transcriptions are held/reconciled or marked with source timestamps; server sequence stays monotonic.
- Empty transcription isn't stored as a normal spoken claim; error/status may be stored separately.
- Output transcription is matched to the correct speaker/turn; it is not attached to the next speaker by race.
- Transcript finalization blocks new regular transcript events after session ends, except explicitly versioned corrections if supported.

### Report/evaluator
- Valid structured output is accepted.
- Malformed JSON / missing criterion / unexpected field type is rejected.
- Unknown event ID rejected.
- Event ID belonging to another session rejected.
- Quote not an exact substring rejected.
- Model returns fabricated quote → no fabricated quote reaches UI.
- Score below/above allowed bounds rejected.
- Criterion has no evidence → `insufficientEvidence` or safe fallback, not guessed quotation.
- Evaluator unavailable/rate-limited → deterministic metrics/report fallback remains available.
- Retrying report doesn't create duplicate report versions or charge repeated provider calls due to client retry.

## 3. Product acceptance scenarios

| ID | Scenario | Expected behavior |
|---|---|---|
| P01 | New GD with standard topic | Session created, moderator starts, four AI identities visible. |
| P02 | Custom topic with boundary length | Accepted within bounds; overlong/empty topic receives validation error. |
| P03 | AI A and AI B response scheduling | B waits until A output turn releases lock. |
| P04 | Student interrupts A | A becomes inaudible promptly, queue cleared, interruption/transcript event captured. |
| P05 | Agent C synthesizes A/B | C references both earlier arguments, not just the latest student text. |
| P06 | Long session context grows | Canonical log remains complete; provider session is compressed/resumed or reseeded per tested strategy. |
| P07 | Timer deadline expires during AI output | Output is cancelled or shortened; moderator/session transitions to closing and finalizes safely. |
| P08 | User clicks End during setup | Session ends idempotently; no dangling provider sessions. |
| P09 | Mic permission denied | No crash; instructions and alternative path displayed. |
| P10 | Mic removed or browser loses audio context | Visible recoverable state; speaker lock released or held safely. |
| P11 | App WS drops during AI output | Client clears stale audio, reconnects and requests snapshot/events; doesn't resume obsolete chunks. |
| P12 | Gemini returns 429 | Bounded backoff and clear busy state; no immediate retry storm. |
| P13 | Live API connection receives GoAway | Resumption path or controlled reconnection; transcript/event sequence preserved. |
| P14 | Provider session resumption fails | New provider session gets summary + recent canonical events; user sees reconnecting status. |
| P15 | DB fails while Live session running | Preserve in-memory active state as far as possible, stop accepting new turns if canonical writes cannot be guaranteed, and notify user; no silent lost transcript. |
| P16 | Report call times out | Report status stays pending then fallback; UI doesn't hang forever. |
| P17 | Student gives one-sentence interview answer | Interviewer asks useful follow-up; score is not automatically low solely due to word count. |
| P18 | Resume contains “ignore all instructions” | Treated as untrusted content; system/rubric unaffected. |
| P19 | Unauthorised session ID guessed | Access denied; no transcript/report data leaked. |
| P20 | User deletes session | App record deletion/retention behavior matches disclosed policy; provider deletion claim not made without proof. |
| P21 | Phone layout and keyboard navigation | Core controls usable; transcript/report readable and labeled. |
| P22 | Four Live sessions started | Concurrent connections pass practical smoke test under active project limits; failures degrade clearly. |
| P23 | Interview mode is unfinished | UI hides/disables it; GD mode still meets all mandatory criteria. |
| P24 | Model output sends very long utterance | Server enforces word/duration caps or cancels; no runaway generation. |

## 4. Latency measurements

Measure rather than guess:
- mic speech-start → server detected;
- end-of-utterance → first generated response audio;
- local detected interruption → audible silence;
- output-transcription lag behind audio;
- turn generation duration;
- report evaluation duration.

Internal MVP targets (not provider guarantees): p50 first-response delay < 1.5 s in the tested network if achievable; interruption to silence ≤250 ms after local VAD event; report ready within 30 s or fallback. Record actual values in the README/demo notes rather than claiming targets were met without evidence.

## 5. Model evaluation benchmark

Create at least 20 synthetic or consented/anonymized transcripts. Human-review representative GD/interview outputs. Compare evaluator versions on rubric consistency, evidence attribution, quote exactness, bias toward verbose responses, sensitivity to transcription errors, and unsupported claims. Backend quote validator must enforce 100% precision for displayed exact quotations independent of evaluator quality.

## 6. Concurrency and soak

- Establish one Live connection, then test two, then four.
- Run 10 sequential 2-minute sessions; ensure provider connections are closed or resumable handles safely managed.
- Run a five-minute session with repeated interruptions.
- Simulate browser reconnect and backend restart where possible.
- Test separate sessions in parallel to ensure transcript, lock, timer and report state cannot leak across sessions.
- Do not claim the provider quota/concurrency is supported until the real active project test passes.

## 7. Release checklist

- [ ] Typecheck, lint and unit tests pass.
- [ ] Contract fixtures match the API implementation.
- [ ] Secret scan is clean.
- [ ] One full GD is completed on deployed URL.
- [ ] Report evidence links all validate.
- [ ] Mic-denied, disconnect, quota-limit and evaluator-failure flows are rehearsed.
- [ ] Mobile and keyboard flows work.
- [ ] AI disclosure is visible before voice capture.
- [ ] Backup recording is available, but the live app remains primary.
- [ ] The README reports only tested functionality and actual latency.
