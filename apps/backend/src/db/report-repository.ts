import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './database.js';
import type { Report } from '../types/report.js';

export class ReportRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  saveReport(report: Report): void {
    const existing = this.getLatestReport(report.sessionId);
    const version = existing ? 2 : 1;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO reports (
        id, session_id, version, status, rubric_version,
        evaluator_provider, evaluator_model_id, metrics_json,
        assessment_json, validation_json, created_at, completed_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    stmt.run(
      report.reportId,
      report.sessionId,
      version,
      report.status,
      report.rubricVersion,
      'gemini',
      report.evaluatorModelId ?? null,
      JSON.stringify(report.metrics),
      JSON.stringify({
        overallSummary: report.overallSummary,
        criteria: report.criteria,
        overallAdvice: report.overallAdvice,
        limitations: report.limitations,
      }),
      null,
      report.createdAt || now,
      now
    );
  }

  getLatestReport(sessionId: string): Report | null {
    const stmt = this.db.prepare(`
      SELECT * FROM reports
      WHERE session_id = ?
      ORDER BY version DESC, created_at DESC
      LIMIT 1
    `);

    const row = stmt.get(sessionId) as Record<string, unknown> | undefined;
    if (!row) return null;

    let metrics: Record<string, number | string | boolean | null> = {};
    let assessment: {
      overallSummary: string;
      criteria: Report['criteria'];
      overallAdvice: string[];
      limitations?: string[];
    } = {
      overallSummary: '',
      criteria: [],
      overallAdvice: [],
      limitations: [],
    };

    try {
      metrics = JSON.parse(String(row.metrics_json));
    } catch {
      // ignore
    }

    try {
      assessment = JSON.parse(String(row.assessment_json));
    } catch {
      // ignore
    }

    return {
      reportId: String(row.id),
      sessionId: String(row.session_id),
      status: row.status as Report['status'],
      schemaVersion: 'placement-arena-report.v1',
      rubricVersion: String(row.rubric_version),
      evaluatorModelId: row.evaluator_model_id ? String(row.evaluator_model_id) : null,
      metrics,
      overallSummary: assessment.overallSummary || '',
      criteria: assessment.criteria || [],
      overallAdvice: assessment.overallAdvice || [],
      limitations: assessment.limitations || [],
      createdAt: String(row.created_at),
    };
  }
}
