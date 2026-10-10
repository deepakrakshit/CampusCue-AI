# Security and Privacy Requirements — Placement Arena

**Scope:** hackathon MVP with anonymous/guest sessions, microphone audio, model-provider calls, transcript storage and optional resume/project text.

## 1. Threat model

Assets to protect:
- Gemini provider API keys and any hosted Gemma provider key;
- guest-session capability tokens;
- transcripts, resumes, project descriptions and generated reports;
- cross-session boundaries and report/source integrity;
- service availability/quota and the judge demo;
- application integrity and trusted report metrics.

Adversaries/risks:
- malicious browser/client sends forged session events or oversized audio frames;
- another user guesses a session ID and attempts to read/delete a transcript;
- prompt injection inside a transcript, resume or public repository;
- model output contains invalid JSON, fabricated quotes, unsafe content or accidental secrets;
- bot floods session creation, audio input or expensive evaluation endpoints;
- SSRF through user-provided GitHub/repository URLs;
- provider rate-limit/network outage at demo time;
- secrets are committed, logged or embedded in frontend build.

## 2. Authentication and session ownership

For a low-friction hackathon demo, use guest sessions rather than full account creation, but treat the access token as a secret capability.

- Generate at least 256 bits of randomness with a cryptographic RNG.
- Return the token once at session creation and persist only a secure hash server-side.
- Store it in browser `sessionStorage` (not query params, localStorage or logs); clear it when the session is deleted/expired.
- Use TLS (`https`/`wss`) only in deployed environments.
- Require token authorization on every session REST route, report route, deletion and WebSocket handshake.
- A session ID is not authorization.
- If the token is lost, require a new guest session; don't provide ID-only recovery.
- Apply per-IP and per-session rate limits to prevent token guessing/resource abuse.

For an app used beyond a supervised hackathon demo, replace guest capability ownership with a proper authentication system and explicit account/session authorization.

## 3. Secret management

- Keep `GEMINI_API_KEY`, hosted Gemma credentials and database URL server-side.
- Never use `NEXT_PUBLIC_GEMINI_API_KEY` or any public-prefixed secret.
- `.env` is local-only and gitignored; `.env.example` contains names with empty values.
- Rotate any secret that was pasted into chat, committed, logged or deployed in frontend code.
- Do not put API keys, auth tokens, provider session handles, full prompt bodies or user transcript text into logs.
- For browser-direct Live API, use backend-created ephemeral tokens and restrict model/config/expiry where provider supports it. Prefer a backend-mediated audio path for this MVP if it simplifies secret and scheduling control.

## 4. Data privacy and notice

Before recording microphone input:
- explain that the participant is interacting with AI;
- explain that voice may be processed by the configured model provider and that a transcript/report is generated;
- obtain user action to enable mic/session;
- say whether transcript/report is persisted and for how long;
- offer end/delete controls.

Gemini API unpaid service terms state that submitted prompts and responses may be used to improve/develop products and human reviewers may read/process inputs and outputs; the terms advise not submitting sensitive, confidential or personal information to unpaid services. Make the app notice reflect the actual tier/account terms. Do not use genuine private resumes, employer-confidential project descriptions, credentials or student records in the unpaid demo. Consider synthetic data.

Do not retain raw audio by default. Persist transcripts and event-level metrics only as necessary. Publish a precise demo retention period and implement an expiry/deletion task. If an external provider retains session history, do not claim the app's local deletion also deletes provider-side data unless verified.

## 5. Uploads, resumes and repository URLs

- Upload size cap: 5 MB default; reject unsupported/empty files and malformed documents.
- Allow only required file types (PDF, DOCX, TXT); use maintained parsing libraries and timeouts.
- Do not store files permanently unless required; delete temp files after extraction and ensure cleanup on failures.
- Treat extracted text as untrusted content, not system instructions.
- Do not fetch arbitrary URLs from a request parameter. If GitHub import is implemented, accept only public `github.com/{owner}/{repo}` URLs or a GitHub-host allow-list, disable redirects or revalidate every redirect, reject private IP ranges, non-HTTP schemes and unusual ports, enforce timeout/response size, and fetch with a controlled server-side client.
- Safer MVP default: allow the user to paste a project description/README excerpt rather than fetch arbitrary URLs.

## 6. LLM prompt injection and output validation

- System instructions and server rubric are trusted; transcript/source material is quoted/delimited untrusted evidence.
- No evaluator tools that modify state or access arbitrary sites.
- Treat every model response as untrusted: schema parse, field limits, enum validation, score bounds, HTML escaping, quote/event matching.
- Do not render model HTML; use plain text and markdown only through a safe renderer.
- Reject invalid event IDs/quotes and never show them as evidence.
- Do not let a model set `session.status`, `speakerLock`, `deadlineAt`, DB query, access scope or report version.
- Apply output length caps to prevent malicious prompts from triggering massive output.

## 7. API/WebSocket abuse controls

- Validate JSON schema at the boundary; reject unknown message types and invalid state transitions.
- Audio frame cap: configure a strict max (e.g. 64 KB per frame), max duration, total audio rate and bounded buffering; adjust only after tests.
- Limit session creation per IP; one or few concurrent sessions per guest/IP for demo.
- Cap evaluation retries; honor rate-limit responses and backoff.
- Apply HTTP body size limits, WebSocket idle timeouts, heartbeat/ping-pong, max frame size and bounded output queue.
- Use per-session serialized state transitions and generation epochs to prevent stale model callbacks.
- Configure explicit CORS origin allowlist; do not use `*` with credentials.
- Return sanitized error codes; never return raw provider error bodies to browser.
- Ensure routes check both object-level ownership and intended action.

## 8. Logging and observability

Log only operational metadata:
- request ID, opaque session ID or hash, event type, duration, status/error code, provider model ID, retry count and latency;
- no full transcript, raw audio, resume text, access tokens, API keys or secret provider handles.

Use separate protected debugging logs only if truly needed; ensure retention and redaction. Track:
- session start success/failure;
- Live provider connection/reconnect/error;
- interruption-to-silence timing;
- turn duration and schedule decisions;
- transcript lag and event sequence gaps;
- evaluator schema/quote validation failures;
- rate limit/timeout counts.

## 9. Security acceptance checklist

- [ ] Secret scan passes and `.env` is not tracked.
- [ ] Client bundle and network requests reveal no permanent provider key.
- [ ] An invalid/other session token cannot read/write/delete the session.
- [ ] An untrusted client cannot choose model ID, system prompt, evaluator prompt or score.
- [ ] Oversized/malformed WebSocket/audio payloads are rejected safely.
- [ ] Prompt injection in transcript/resume cannot change system behavior or bypass validation.
- [ ] Report quotes are exact and event/session-bound.
- [ ] CORS, TLS, request IDs, error redaction and rate limits are tested.
- [ ] Mic disclosure and consent appear before capture.
- [ ] Free-tier provider data terms are disclosed accurately and no sensitive content is used unintentionally.
