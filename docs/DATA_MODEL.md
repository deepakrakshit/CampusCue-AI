# Data Model — Placement Arena

**Goal:** durable, auditable session state with a single canonical transcript.

## 1. Design principles

- Session is the aggregate root. Every event, provider turn and report belongs to one `sessionId`.
- IDs are opaque; do not expose sequential integer IDs as public identifiers.
- `sequence` is allocated by the backend and strictly increases per session.
- `eventId` is immutable and deduplicated within a session.
- Persist canonical transcript events, not raw provider response objects by default.
- Keep model/provider payloads only when required for debugging, under redaction and short retention; never persist API keys.
- A report records rubric version, evaluator model, creation time, event references and validation status.
- Reports are versioned; a retry produces a new report version rather than silently overwriting a previously shown report.

## 2. Main entities

### Session

| Field | Type | Notes |
|---|---|---|
| `id` | UUID/string | Primary key; public opaque ID. |
| `mode` | enum | `gd` or `interview`. |
| `status` | enum | `created`, `preparing`, `running`, `closing`, `report_pending`, `completed`, `failed`, `expired`. |
| `owner_token_hash` | text | Hash of high-entropy guest capability; never persist raw token. |
| `topic` | text nullable | Required for GD; optional/derived for interview. |
| `config_json` | JSON | Validated non-secret session configuration; no API keys. |
| `started_at`, `deadline_at`, `ended_at` | timestamptz nullable | Server timestamps, UTC. |
| `next_sequence` | bigint | Current allocation cursor; updated transactionally. |
| `active_speaker_id` | text nullable | Mirrors orchestration state for recovery; not the only source of truth during a live process. |
| `generation_epoch` | integer | Increment on cancellation/new active turn; fences late provider chunks. |
| `last_error_code` | text nullable | Sanitized stable code only. |
| `created_at`, `updated_at` | timestamptz | Audit timestamps. |
| `expires_at` | timestamptz | Retention/TTL cutoff. |

### SessionEvent (canonical event log)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Internal primary key. |
| `session_id` | FK | Session that owns this event. |
| `event_id` | UUID/string | Stable public event ID; unique per session. |
| `sequence` | bigint | Unique increasing sequence per session. |
| `turn_id` | UUID/string nullable | Groups events into an attempted speaker turn. |
| `kind` | enum | `transcript`, `state_change`, `interruption`, `moderator`, `provider_status`, `system_note`. |
| `speaker_id` | text | `student`, `moderator`, `agent_a`, `agent_b`, `agent_c`, `agent_d`, or `interviewer`. |
| `speaker_label` | text | Display label. |
| `text` | text nullable | Canonical transcript content for a transcript event. |
| `source` | enum | `live-input-transcription`, `live-output-transcription`, `fallback-stt`, `system`. |
| `started_at`, `ended_at` | timestamptz nullable | Turn/audio timestamps, if measured. |
| `metadata_json` | JSON | Non-secret metrics only, e.g. interrupted speaker ID, language tag, generation epoch. |
| `created_at` | timestamptz | Server append time. |

Constraints: `UNIQUE(session_id, event_id)`, `UNIQUE(session_id, sequence)`, `ended_at >= started_at` where both are present. Use transactions when allocating the next sequence. Do not take client-provided sequence as canonical.

### AgentSessionState

Optional persisted recovery table if provider sessions need tracking.

| Field | Type | Notes |
|---|---|---|
| `session_id` | FK | App session. |
| `agent_id` | text | Persona/interviewer. |
| `provider` | text | e.g. `gemini-live`. |
| `model_id` | text | Exact configured model ID at creation. |
| `provider_session_handle_encrypted` | text nullable | If session resumption requires persistence; encrypt with managed server-side key. Avoid storing if it can be kept in live memory only. |
| `last_synced_sequence` | bigint | Highest canonical event applied to this provider context. |
| `status` | enum | `not_started`, `connecting`, `ready`, `generating`, `reconnecting`, `failed`, `closed`. |
| `generation_epoch` | integer | Fencing token. |
| `updated_at` | timestamptz | Last update. |

Do not persist raw ephemeral credentials. Treat provider session handles as sensitive, short-lived capability-like values.

### Report

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Report version ID. |
| `session_id` | FK | Parent session. |
| `version` | integer | Increasing version. |
| `status` | enum | `pending`, `validating`, `ready`, `fallback`, `failed`. |
| `rubric_version` | text | Versioned rubric ID. |
| `evaluator_provider` | text | Provider abstraction key. |
| `evaluator_model_id` | text | Exact model ID returned by adapter. |
| `metrics_json` | JSON | Deterministic computed metrics. |
| `assessment_json` | JSON | Schema-validated qualitative assessment. |
| `validation_json` | JSON | Quote/event validation findings; avoid retaining unnecessary raw failure payloads. |
| `created_at`, `completed_at` | timestamptz nullable | Timestamps. |

### ReportEvidence

| Field | Type | Notes |
|---|---|---|
| `report_id` | FK | Specific report version. |
| `criterion_id` | text | E.g. `building_on_others`. |
| `event_id` | FK/public event ID | Must refer to an event in the same session. |
| `quote` | text | Exact substring from referenced transcript event. |
| `explanation` | text | Qualitative claim about the evidence. |
| `suggestion` | text | Actionable recommendation. |
| `validation_status` | enum | `verified`, `rejected`, `not_applicable`. |

All report evidence must validate with `Report.session_id == Event.session_id`, and `quote` must match the stored event text exactly after a clearly defined normalization policy. Prefer literal exact match; if whitespace normalization is needed, document it and preserve the original text.

## 3. Derived metrics

Compute these in application code, not from model prose:

- turn count per speaker;
- words per speaker;
- speaking-share by words as a proxy when true audio duration is unavailable;
- speaking duration from timestamps where available;
- interruption count from deduplicated interruption events;
- number of student turns and duration;
- topic coverage can be model-assessed but should be separated from deterministic counts.

Do not label word-share as actual talk-time. If audio timestamps are incomplete, show “share of transcript words,” not “speaking time.”

## 4. PostgreSQL schema sketch

Use migrations rather than applying this hand-written sketch literally.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('gd', 'interview')),
  status TEXT NOT NULL,
  owner_token_hash TEXT NOT NULL,
  topic TEXT,
  config_json JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  next_sequence BIGINT NOT NULL DEFAULT 1,
  active_speaker_id TEXT,
  generation_epoch INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE session_events (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  sequence BIGINT NOT NULL,
  turn_id TEXT,
  kind TEXT NOT NULL,
  speaker_id TEXT NOT NULL,
  speaker_label TEXT NOT NULL,
  text TEXT,
  source TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, event_id),
  UNIQUE (session_id, sequence),
  CHECK (started_at IS NULL OR ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  rubric_version TEXT NOT NULL,
  evaluator_provider TEXT,
  evaluator_model_id TEXT,
  metrics_json JSONB NOT NULL DEFAULT '{}',
  assessment_json JSONB NOT NULL DEFAULT '{}',
  validation_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (session_id, version)
);

CREATE INDEX idx_events_session_sequence ON session_events(session_id, sequence);
CREATE INDEX idx_sessions_status_deadline ON sessions(status, deadline_at);
```

## 5. Retention and deletion

- Define and publish a retention period for guest sessions (example: 24 hours for demo history). The exact TTL is a product decision; don't claim deletion before the cleanup job actually runs.
- Delete transcript and report rows together with the session on explicit delete, unless legal requirements or immutable audit policy apply; for hackathon use, prefer deletion.
- Do not store raw audio unless needed for a demonstrated feature and the user consents.
- Provider logs, SDK exceptions and tracing systems must be redacted and have separately defined retention.
- Provider-side session/context deletion cannot be promised unless the provider documents and implementation verifies it.
