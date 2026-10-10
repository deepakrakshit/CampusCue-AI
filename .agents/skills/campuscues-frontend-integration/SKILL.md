---
name: campuscues-frontend-integration
description: Authoritative frontend engineering and integration skill for CampusCue AI. Use when designing, building, testing, or reviewing React components, the live discussion room UI, microphone/audio capture controls, WebSocket client integration, real-time transcript views, technical interview mode, feedback report screens, accessibility, and responsive layouts.
---

# CampusCue AI — Frontend Engineering & Real-Time Integration

## Core Principles & Contract Alignment

1. **Authoritative Contract Compliance:**
   - Treat `openapi.yaml`, `docs/API_CONTRACT.md`, and documented WebSocket message schemas as authoritative.
   - All client and server event payloads must have explicit TypeScript types matching the backend schema definitions.
   - Maintain explicit state machines for connection, session lifecycle, audio playback, room timers, interruptions, and evaluation report generation.

2. **Explicit UI State Representation:**
   - Clearly represent all distinct session states in the UI without ambiguity:
     - `loading`
     - `connecting`
     - `listening` (student audio active)
     - `ai_speaking` (showing active speaker identity and visual indicators)
     - `interrupted` (instant visual confirmation of user barge-in)
     - `reconnecting` (non-destructive status banner with retry backoff)
     - `failed` (actionable diagnostic message with recovery actions)
     - `completed` (discussion concluded, timer finished)
     - `report_pending` (deterministic feedback generation progress indicator)

3. **Immediate Audio Cancellation on Interruption:**
   - When the student speaks while an AI participant is audible:
     - Immediately halt local Web Audio playback and clear all queued PCM audio chunks.
     - Send the interruption event to the backend over WebSocket.
     - Prevent any stale or in-flight audio buffers from playing or restarting.

4. **Robust Audio & Device Error Handling:**
   - Gracefully handle microphone permission denial, missing input hardware, device disconnects, network drops, and session timeouts.
   - Provide clear, user-friendly fallback guidance when microphone access is blocked.
   - Support test harness mode with mock audio/events for development and automated UI testing without live credentials.

5. **Distinctive & Intentional Visual Design:**
   - Deliver a purposeful, distinctive visual identity tailored for placement preparation, avoiding generic AI dashboard aesthetics.
   - Maintain consistent typography, semantic spacing tokens, balanced visual hierarchy, and polished interactive micro-interactions.
   - Fully support responsive layouts across mobile viewports and desktop displays.
   - Ensure WCAG AA accessibility compliance: keyboard navigation, screen-reader landmarks, high-contrast text, focus rings, and `prefers-reduced-motion` support.

6. **Component Architecture & Verification:**
   - Apply modular React composition patterns and performance best practices. Avoid monolithic god-components.
   - Separate audio processing hooks, WebSocket management hooks, and UI presentation components cleanly.
   - Verify critical user flows using automated browser tests (Playwright): group discussion setup, student interruption, live transcript streaming, reconnect recovery, and report evidence inspection.
