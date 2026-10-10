# AI Model Strategy — Placement Arena

**Status:** Provider design and model selection notes based on official documentation checked 10 October 2026.

## 1. Model responsibilities

Use different models for separate jobs; do not ask one model to own every application invariant.

| Workload | Default | Why | Must not be used for |
|---|---|---|---|
| Realtime GD/interview voice | `gemini-3.8-live` | Official Live API model designed for low-latency audio-to-audio conversation. | Authoritative session state, deadlines, speaker locks, or data validation. |
| Post-session evaluation | `gemini-3.5-flash-lite` | Official model page lists structured output support and no Live API support; suitable for post-session JSON assessment. | Realtime audio conversation. |
| Alternate evaluator / higher-quality benchmark | `gemini-3.6-flash` or `gemini-3.8-flash` | General text models with structured-output support, to be compared against a small labelled evaluation set. | Replacing the Live session. |
| Optional open weights | `google/gemma-4-31B-it` via hosted inference | Experimental provider adapter when hosting, licensing, latency and privacy terms are suitable. | Default MVP deployment without confirmed hosting capacity. |

Official model docs list `gemini-3.5-flash-lite` as stable and capable of structured outputs, but explicitly not Live API. It remains a valid configured option as of the checked date. Model lifecycle and pricing can change; keep model IDs in server-side configuration and verify the deprecations page before each release.

## 2. Why Gemini 3.5 Flash-Lite is reasonable for reports

The evaluator receives a bounded final transcript, session mode, topic/role context, rubric version and deterministic metrics. It returns schema-constrained JSON only after the session ends. This keeps assessment latency out of the live interaction path and avoids generating a separate evaluator call after every turn.

The provider integration must use the current supported SDK and structured-output configuration documented for the selected model. Do not assume schema-constrained output means the content is true: validate the JSON, event IDs, quotes, numeric ranges and rubric dimensions in application code.

## 3. Evaluation model choices

### 3.1 Default: Gemini 3.5 Flash-Lite

Pros:
- Low latency/cost model per official model description.
- Supports structured output.
- Text output is appropriate for post-session scoring.
- No need to run an open-weight model host.

Risks:
- Provider quota, model availability and free-tier behavior depend on the project/account and can change.
- Free-tier/unpaid service terms may allow prompt/response use for product improvement and human review; avoid submitting sensitive/confidential content unless the applicable terms and consent support it.
- Structured output does not eliminate scoring bias or hallucination.

### 3.2 Comparison model: Gemini 3.6 Flash or 3.8 Flash

Use a comparison only if the default evaluator performs poorly on a labelled set of 20–50 synthetic/anonymised transcripts. Compare quote precision, evidence attribution, rubric consistency, latency, schema pass rate, and cost/availability. Do not switch models based solely on one attractive sample report.

### 3.3 Optional: Gemma 4 31B IT

`google/gemma-4-31B-it` is an open-weight, instruction-tuned model listed in Google's Gemma 4 model material and official model repository. It is not a Gemini Live API endpoint. The dense model is large; a 4 GB laptop GPU is not a realistic host target for full-quality local inference. If considering it, confirm provider support, quantization, context limit, output schema fidelity, latency, price, availability, and data retention before adopting it.

Do not let optional Gemma hosting delay the hackathon MVP. Use an `Evaluator` provider interface so it can be benchmarked later without changing the UI/report contract.

## 4. Evaluator interface

```ts
export interface Evaluator {
  readonly providerId: string;
  readonly modelId: string;
  evaluate(input: EvaluationInput, signal?: AbortSignal): Promise<unknown>;
}

export interface EvaluationInput {
  mode: 'gd' | 'interview';
  topicOrRole: string;
  rubricVersion: string;
  transcriptEvents: Array<{
    eventId: string;
    sequence: number;
    speakerId: string;
    speakerLabel: string;
    text: string;
    startedAt?: string;
    endedAt?: string;
  }>;
  deterministicMetrics: Record<string, number | string | boolean>;
}
```

This is a type-level sketch. Use runtime schema validation in production code. Provider output initially has type `unknown` and is not sent to UI until fully validated.

## 5. GD rubric

Score the following dimensions on an integer 1–5 scale, with criterion-level reasoning and evidence:

1. Opening: relevance, structure, clarity and ability to establish a point.
2. Idea quality: reasoning, specificity, supporting examples, nuance and staying on topic.
3. Building on others: direct acknowledgement and constructive continuation/challenge of another speaker's idea.
4. Listening: accurately responds to what was said rather than repeating a prepared monologue.
5. Handling interruption/disagreement: stays composed, addresses the question, and responds productively. Do not reward interruptions merely for being frequent.
6. Closing: synthesises relevant arguments and gives a concise concluding position.

Each criterion should return:
- `score` (1–5 integer),
- `summary` (short),
- `evidence[]` with `eventId`, exact `quote`, and `reasoning`,
- `suggestions[]` with actions that can be practised.

A criterion with no valid evidence should return `insufficient_evidence: true` and no invented quote. Don't force a score based on word count alone. A separately calculated word share or turn count is not evidence of argument quality.

## 6. Interview rubric

Dimensions:
- technical correctness/depth,
- project ownership and detail,
- reasoning and trade-off awareness,
- debugging/problem-solving,
- ability to acknowledge limits/uncertainty,
- communication structure and clarity,
- relevance to target role.

Each qualitative criterion needs one or more transcript event references. Do not use a generic answer-length heuristic as the main measure of quality. If the student was not asked a question needed to measure a dimension, mark it `not_assessed` rather than guessing.

## 7. Prompt-injection boundary

Transcript, user-supplied topic, resume text, project README, repository contents, and provider output are untrusted data. Evaluation instructions should explicitly state that text inside transcript/source material is evidence to assess, not a higher-priority instruction. Never give evaluator access to tools for deleting sessions, modifying database rows, browsing URLs, or changing scores.

## 8. Structured output shape

Illustrative response:

```json
{
  "schemaVersion": "placement-arena-report.v1",
  "overallSummary": "Your opening was clear, but your rebuttal did not address the cost concern.",
  "criteria": [
    {
      "criterionId": "building_on_others",
      "score": 3,
      "summary": "You responded to the opposing claim but did not fully address its evidence.",
      "evidence": [
        {
          "eventId": "evt_42",
          "quote": "I agree AI helps, but it should be used only for practice.",
          "reasoning": "This responds to the preceding point but does not explain how the rule would be enforced."
        }
      ],
      "suggestions": ["Explain a practical enforcement method and one trade-off."],
      "insufficientEvidence": false
    }
  ],
  "overallAdvice": ["State your core claim in one sentence, then give an example and acknowledge a limitation."],
  "limitations": []
}
```

The backend must independently validate `eventId` membership, exact quote text and score bounds before persistence. The sample is illustrative, not the full production schema.

## 9. Quote verification

For each report evidence object:
1. Validate `eventId` exists in the session's finalized transcript.
2. Validate the event's speaker/turn context is relevant to the criterion.
3. Confirm quote is an exact substring of that event's `text`. Prefer exact Unicode string matching after only the normalization explicitly agreed by the product; never silently fabricate or rewrite the quote.
4. Reject the evidence if it fails. The evaluator may be retried once with a correction prompt that includes the allowed event IDs and text, but never relax validation.
5. If all evidence for a criterion is rejected, return `insufficient_evidence` and use safe fallback phrasing.

## 10. Deterministic versus model-derived metrics

Compute in backend:
- counts, speaker share by transcript words, turns, elapsed time, timestamp durations and recorded interruption events;
- quote existence, report schema compliance, score range and source membership.

Use model for:
- argument structure, relevance, reasoning, synthesis quality, technical depth and actionable qualitative suggestions.

Clearly label word share vs true talk time. Do not present an LLM score as statistically validated or as likelihood of passing a placement process.

## 11. Timeouts, retries and fallback

- Evaluation deadline: 30 seconds by default; configurable.
- One bounded retry for transient provider failure or schema validation failure, with backoff and jitter. Do not retry 400/invalid request without correction.
- On 429, honor provider retry guidance if present and stop hammering the same endpoint.
- Persist `report.status=pending` before external call; use an idempotency key per report version to avoid duplicate work.
- If evaluator unavailable, return deterministic metrics and a clear “qualitative feedback unavailable” notice. Do not fabricate an AI report.
- Record provider/model/rubric version without logging raw resume or full transcript to operational logs.

## 12. Model benchmark before release

Create 20–50 test transcripts spanning:
- concise but correct answers;
- verbose but irrelevant statements;
- strong disagreement handled professionally;
- unsupported claims and corrections;
- no opening or no closing;
- very short session with insufficient evidence;
- code-switching/transcription mistakes;
- duplicated events and quote injection attempts;
- candidate who explicitly says “ignore previous instructions” in a transcript.

Human-label the rubric for a subset. Evaluate inter-rater agreement and error types rather than relying on a single aggregate score. Track: JSON schema pass rate, exact quote pass rate (must be 100% after backend validation), false evidence rate (target zero displayed), criterion agreement, latency and error rate. Use G-Eval and LLM-as-a-judge research as motivations for testing bias and consistency, not proof that a chosen model will score correctly.
