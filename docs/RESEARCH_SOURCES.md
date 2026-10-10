# Research Sources and Decision Notes

**Research checked:** 10 October 2026. This is a curated research record, not a claim that literally every webpage or repository on the internet was read. Sources are prioritized toward official provider/platform documentation, relevant public repositories and primary technical specifications.

## 1. Gemini Live API

- [Live API capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities) — audio input/output formats, VAD, barge-in interruption events, output/input transcription, `audioStreamEnd`, and live configuration.
- [Live API session management](https://ai.google.dev/gemini-api/docs/live-api/session-management) — 15-minute audio-only limit without context compression; around-10-minute connection limit; `GoAway`; context compression and session resumption.
- [Live API quickstart](https://ai.google.dev/gemini-api/docs/live-api/get-started) — supported SDK/API connection setup.
- [Live API best practices](https://ai.google.dev/gemini-api/docs/live-api/best-practices) — low-latency interaction and configuration recommendations.
- [Live WebSocket API reference](https://ai.google.dev/api/live) — setup and message fields including session resumption, compression and transcription configuration.
- [Ephemeral tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens) — browser-direct token option; permanent API keys must not be exposed.

### Architecture consequences
- Do not equate session duration with WebSocket connection duration.
- Keep the canonical transcript independent of model-side session state.
- Handle interruption by stopping local playback and clearing queued output, not just by asking the model to stop.
- Prototype `sendClientContent` history synchronization, turn completion, output-audio framing and recovery using the exact SDK/model versions before assuming semantics.

## 2. Model choice and lifecycle

- [Gemini API models catalog](https://ai.google.dev/gemini-api/docs/models.md) — model identifiers and modality/capability overview.
- [Gemini 3.8 Live in model catalog](https://ai.google.dev/gemini-api/docs/models.md) — official catalog currently lists `gemini-3.8-live` for low-latency realtime voice.
- [Gemini 3.5 Flash-Lite model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) — stable ID `gemini-3.5-flash-lite`, structured outputs supported, Live API not supported.
- [Gemini 3.6 Flash model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash) — general text-output model with structured outputs supported, Live API not supported.
- [Gemini model deprecations](https://ai.google.dev/gemini-api/docs/deprecations/) — lifecycle and replacement announcements.
- [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4) — official variants, parameters, modalities and context characteristics.
- [Gemma 4 31B IT on Hugging Face](https://huggingface.co/google/gemma-4-31B-it) — official weight repository and deployment ecosystem.

### Architecture consequences
- Live model owns realtime speech; evaluator model is called after the session.
- Model ID must be configurable and verified at release.
- Gemma hosting, latency, context support and provider data terms must be validated separately; do not treat it as a drop-in Live API endpoint.

## 3. Quota, pricing and terms

- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) — project-level rate-limit model, usage tiers and actual limit visibility in AI Studio.
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) — model-specific free/paid rates and data-use information; terms/prices can change.
- [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms) — terms for unpaid services and other use restrictions.
- [Google APIs Terms of Service](https://developers.google.com/terms) — general API usage restrictions.
- [Gemini API logs policy](https://ai.google.dev/gemini-api/docs/logs-policy) — logging, retention and data handling.

### Architecture consequences
- Quotas and concurrency are tested with the actual project rather than inferred from model names or number of keys.
- Account/project rotation must not be used to circumvent limits.
- On the unpaid service tier, prompts/responses may be used to improve products and may be subject to human review; avoid sensitive/confidential resumes or transcripts unless the applicable terms and consent support the use.

## 4. Structured output and evaluation research

- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output) — constrained JSON/schema output.
- [G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) — LLM-based evaluation methods and human alignment evidence.
- [Judging the Judges: A Systematic Study of Position Bias in LLM-as-a-Judge](https://arxiv.org/abs/2406.07791) — demonstrates systematic bias risks in model judging.

### Architecture consequences
- Schema validation is necessary but not sufficient.
- Keep deterministic metrics separate from qualitative LLM assessments.
- Test report consistency against human-reviewed example transcripts.
- Exact quote validation must be implemented in application code.

## 5. Security, web media and hosting

- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — broken object authorization, auth, resource consumption, SSRF and other API risks.
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — prompt injection, sensitive data disclosure, improper output handling and overreliance.
- [MDN `getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — microphone permission and secure-context behavior.
- [MDN AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) — audio processing away from main UI thread.
- [Render WebSockets](https://render.com/docs/websocket) — inbound/outbound WS, keepalive and reconnect considerations.
- [Vercel WebSockets public beta announcement](https://vercel.com/changelog/websocket-support-is-now-in-public-beta) — 2026 WebSocket support status.
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) — accessibility baseline.

## 6. Existing open-source projects inspected

These repositories informed competitive/gap analysis. They are references for research only; do not copy their application code if the event requires all submitted code to be written during the hackathon.

- [kartikey-bhadauria/gd-arena](https://github.com/kartikey-bhadauria/gd-arena) — exact PS 2-style multi-agent GD, persona prompts, turn engine, speaker lock and transcript report engine. README and selected source files inspected.
- [Anshika-cse26/gd-arena](https://github.com/Anshika-cse26/gd-arena) — simpler Express/Gemini three-persona prototype with browser speech synthesis and transcript feedback.
- [udaykumar0515/speakup](https://github.com/udaykumar0515/speakup) — placement-preparation suite with GD monitor/bot coordination.
- [Samuel148-tech/AI-Group-Discussion-Analyzer](https://github.com/Samuel148-tech/AI-Group-Discussion-Analyzer) — TypeScript, WebSocket, session/transcript persistence and Gemini-based analysis.
- [PrudhviCharan17/AI-Recruitment-Simulator](https://github.com/PrudhviCharan17/AI-Recruitment-Simulator) — multi-persona GD and broader placement preparation.
- [premmsharma122/GD-Web](https://github.com/premmsharma122/GD-Web) — live group rooms, WebRTC, transcript and contribution analysis for human participants.
- [techietinker1/ARIMeet](https://github.com/techietinker1/ARIMeet) — meeting infrastructure with WebRTC, Socket.IO, transcription and scoring.

## 7. Remaining unknowns to verify empirically

- Actual free-tier concurrency and rate limits for four Live sessions on the chosen project.
- Exact model support/voice settings and output frame format from the selected `@google/genai` SDK release.
- Measured student interruption-to-silence latency on the judge device/network.
- Input/output transcription behavior and exact event ordering when using `turnComplete: false` for history sync.
- Recovery behavior after connection `GoAway` and failed resumption.
- Evaluator rubric consistency and bias on student speech transcripts.
- Availability, terms, throughput, latency and data handling for any hosted Gemma 4 31B IT endpoint.
- Actual hosting plan WebSocket lifecycle and durable persistence behavior.
