# CampusCue AI — Agent Skills Setup & Environment Audit

**Document Status:** Complete & Verified  
**Audit Date:** 10 October 2026  
**Harness / Agent:** Antigravity (Google DeepMind)  
**Workspace Path:** `.agents/skills/`  

---

## 1. Executive Summary

To prepare the Antigravity engineering environment for CampusCue AI without premature code generation, this setup provides a comprehensive suite of 13 agent skills:
- **Backend & Real-Time Orchestration (3 third-party + 1 project-specific):** authoritative session state management, `@google/genai` Live API streaming, Fastify architecture, and canonical transcript synchronization.
- **Post-Session Evaluation (1 third-party):** structured JSON assessment using `gemini-3.5-flash-lite`.
- **Engineering Workflows (3 third-party):** Test-Driven Development (TDD), Systematic Debugging, and Verification Before Completion.
- **Frontend & User Experience (5 third-party + 1 project-specific):** React composition patterns, performance optimization, design polish, accessibility compliance, Playwright browser testing, and frontend contract integration.

All skills are installed at the workspace level under `.agents/skills/` to ensure full project portability and version control tracking without mutating global machine configurations.

---

## 2. Inventory of Selected Skills

| Skill Name | Origin / Maintainer | Source Type | License | Audited Hash / Status | Local Path | Purpose & Justification |
|---|---|---|---|---|---|---|
| `campuscues-backend-realtime` | Internal Project | Project-Specific | Workspace Proprietary | Verified (Active) | `.agents/skills/campuscues-backend-realtime` | Authoritative session state, canonical transcript ordering, turn concurrency, generation epoch fencing on student barge-in, zero hallucinated quotes in reports. |
| `campuscues-frontend-integration` | Internal Project | Project-Specific | Workspace Proprietary | Verified (Active) | `.agents/skills/campuscues-frontend-integration` | Frontend contract alignment (`openapi.yaml`), session state visual indicators, immediate local audio cancellation on student barge-in, mock test harnesses. |
| `gemini-live-api-dev` | `google-gemini/gemini-skills` | Official Google | Apache-2.0 | `e7e16a5e...` (Verified) | `.agents/skills/gemini-live-api-dev` | Real-time bidirectional audio streaming via WebSockets, PCM format handling (16kHz in, 24kHz out), VAD, `sendClientContent`, session resumption, GoAway handling. |
| `gemini-api-dev` | `google-gemini/gemini-skills` | Official Google | Apache-2.0 | `c46a217a...` (Verified) | `.agents/skills/gemini-api-dev` | Structured JSON outputs for post-session evaluator (`gemini-3.5-flash-lite`), multi-turn chat, prompt design, and SDK error handling. |
| `fastify-best-practices` | `mcollina/skills` | Lead Fastify Maintainer | Apache-2.0 | `980cf47d...` (Verified) | `.agents/skills/fastify-best-practices` | Fastify architecture, TypeScript type stripping, WebSocket plugin integration, Pino logging, JSON Schema request validation, error boundaries. |
| `test-driven-development` | `obra/superpowers` | Community (Jesse Vincent) | MIT | `3cfe4ebb...` (Verified) | `.agents/skills/test-driven-development` | Enforces Red-Green-Refactor development cycle: no production code without a failing test first. |
| `systematic-debugging` | `obra/superpowers` | Community (Jesse Vincent) | MIT | `276fb0aa...` (Verified) | `.agents/skills/systematic-debugging` | Mandates root cause investigation across 4 phases before attempting any fixes. |
| `verification-before-completion` | `obra/superpowers` | Community (Jesse Vincent) | MIT | `b529822b...` (Verified) | `.agents/skills/verification-before-completion` | Requires running fresh verification commands and checking exit code 0 before claiming tasks are done. |
| `vercel-composition-patterns` | `vercel-labs/agent-skills` | Official Vercel Labs | MIT | `10eb4ec9...` (Verified) | `.agents/skills/vercel-composition-patterns` | Scalable React component architecture, compound components, eliminating boolean prop sprawl. |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | Official Vercel Labs | MIT | `6b526d01...` (Verified) | `.agents/skills/vercel-react-best-practices` | React and Next.js rendering performance, memoization discipline, bundle size optimization, and Core Web Vitals. |
| `web-design-guidelines` | `vercel-labs/agent-skills` | Official Vercel Labs | MIT | `d8e7d3af...` (Verified) | `.agents/skills/web-design-guidelines` | Web interface compliance, touch targets, contrast ratios, and WCAG AA accessibility. |
| `frontend-design` | `anthropics/skills` | Anthropic Official | Apache-2.0 | `106acf23...` (Verified) | `.agents/skills/frontend-design` | Distinctive, intentional aesthetic styling tailored for campus placement practice rather than generic AI templates. |
| `webapp-testing` | `anthropics/skills` | Anthropic Official | Apache-2.0 | `3f14af7f...` (Verified) | `.agents/skills/webapp-testing` | Playwright browser automation, element interaction testing, screenshots, and browser console log verification. |

---

## 3. Skill Availability & Pre-Existing Assessment

- **Pre-Existing Builtin/Global Skills:** At the start of this task, Antigravity had 19 global skills registered under `~/.gemini/antigravity/skills/` (BigQuery, GCP pipelines, Python dependencies, etc.), but none of the required project-specific, Gemini Live, Fastify, or React engineering skills were present or installed.
- **Newly Installed:** All 11 external skills and 2 custom project-specific skills were newly installed into the workspace directory `.agents/skills/`.
- **Failed Installs:** 0 failed. All requested skills installed cleanly and verified with exit code 0.

---

## 4. Security, Supply-Chain & Licensing Audit

1. **Third-Party Script Audit:**
   - The `webapp-testing` skill contains a bundled helper script `scripts/with_server.py`. Static security scanners (Socket/Snyk) flag this script with a medium risk alert because it uses `subprocess.Popen(..., shell=True)` to execute local development server commands (e.g. `npm run dev`) and poll ports until ready.
   - **Audit finding:** The script is purely a local test harness utility. It does not perform network downloads, access credentials, or execute arbitrary remote shell code. It is safe for local test runner automation.
2. **License Compatibility:**
   - Apache-2.0 (`gemini-live-api-dev`, `gemini-api-dev`, `fastify-best-practices`, `frontend-design`, `webapp-testing`) and MIT (`test-driven-development`, `systematic-debugging`, `verification-before-completion`, `vercel-composition-patterns`, `vercel-react-best-practices`, `web-design-guidelines`) are permissive, open-source licenses compatible with commercial and hackathon development.
   - Attribution and license files have been preserved in the copied directories.
3. **Secret Protection:**
   - No API keys or credentials were baked into any skill definition or configuration file.
   - A sanitized `.env.example` has been provided with empty variable names (`GEMINI_API_KEY=`, `DATABASE_URL=`).
   - `.gitignore` enforces strict exclusions for `.env`, `*.log`, `*.jsonl`, `sessions.json`, and `conversations.json`.

---

## 5. Antigravity Configuration & Skill Usage Policy

Antigravity discovers project-level skills by traversing from the current working directory up to the workspace root, searching `.agents/skills/<name>/SKILL.md`.

An authoritative instruction file `AGENTS.md` was created in the workspace root, establishing:
1. **Architectural Invariants:** Backend authority, canonical transcript ordering, turn exclusivity (0 or 1 active speaker), instant student barge-in cancellation with epoch fencing, zero hallucinated evidence quotes.
2. **Domain-Specific Skill Routing:**
   - Real-time backend & audio: `campuscues-backend-realtime` + `gemini-live-api-dev` + `fastify-best-practices`.
   - Post-session evaluation: `gemini-api-dev`.
   - Frontend UI & Audio capture: `campuscues-frontend-integration` + `vercel-composition-patterns` + `vercel-react-best-practices` + `web-design-guidelines` + `frontend-design`.
   - Automated testing: `webapp-testing` + `test-driven-development` + `systematic-debugging` + `verification-before-completion`.

---

## 6. How to Reproduce the Setup

Any team member cloning the repository can reproduce or restore this configuration using the following steps:

```bash
# 1. Install Backend Skills
npx skills add google-gemini/gemini-skills --skill gemini-live-api-dev --skill gemini-api-dev --agent antigravity --copy --yes
npx skills add mcollina/skills --skill fastify-best-practices --agent antigravity --copy --yes
npx skills add obra/superpowers --skill test-driven-development --skill systematic-debugging --skill verification-before-completion --agent antigravity --copy --yes

# 2. Install Frontend Skills
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices --skill vercel-composition-patterns --skill web-design-guidelines --agent antigravity --copy --yes
npx skills add anthropics/skills --skill frontend-design --skill webapp-testing --agent antigravity --copy --yes

# 3. Alternatively, restore directly from the lockfile
npx skills experimental_install

# 4. Verify Installed Project Skills
npx skills list
```

---

## 7. Machine-Readable Manifest

A structured manifest is saved at `docs/skills-manifest.json`, detailing each skill's provenance, category, hash, license, and verification status.
