import type { SessionEvent } from '../types/events.js';
import type { DeterministicMetrics } from '../types/report.js';

export function calculateDeterministicMetrics(events: SessionEvent[]): DeterministicMetrics {
  const speakerWordCounts: Record<string, number> = {};
  const speakerTurnCounts: Record<string, number> = {};
  let totalWords = 0;
  let studentWords = 0;
  let totalTurns = 0;
  let studentTurns = 0;
  let aiInterruptionCount = 0;

  for (const event of events) {
    if (event.kind === 'interruption') {
      aiInterruptionCount++;
      continue;
    }

    if (event.kind === 'transcript' && event.text) {
      const words = event.text.trim().split(/\s+/).filter(Boolean).length;
      const speakerId = event.speakerId;

      speakerWordCounts[speakerId] = (speakerWordCounts[speakerId] || 0) + words;
      speakerTurnCounts[speakerId] = (speakerTurnCounts[speakerId] || 0) + 1;
      totalWords += words;
      totalTurns += 1;

      if (speakerId === 'student') {
        studentWords += words;
        studentTurns += 1;
      }
    }
  }

  const studentWordSharePct =
    totalWords > 0 ? Math.round((studentWords / totalWords) * 1000) / 10 : 0;

  let discussionDurationSeconds = 0;
  if (events.length >= 2) {
    const firstTime = new Date(events[0].createdAt).getTime();
    const lastTime = new Date(events[events.length - 1].createdAt).getTime();
    if (!isNaN(firstTime) && !isNaN(lastTime) && lastTime >= firstTime) {
      discussionDurationSeconds = Math.round((lastTime - firstTime) / 1000);
    }
  }

  return {
    totalTurns,
    studentTurns,
    totalWords,
    studentWords,
    studentWordSharePct,
    aiInterruptionCount,
    discussionDurationSeconds,
    speakerWordCounts,
    speakerTurnCounts,
  };
}
