import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('flow separates observed evidence integrity from metric coverage breadth', () => {
  const report = calculateFlowMetrics([
    { id: 'r-open', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', change_id: 'c1' },
    { id: 'r-close', type: 'review.completed', occurred_at: '2026-08-25T00:01:00Z', change_id: 'c1' },
  ]);

  assert.equal(report.evidence_status, 'complete');
  assert.equal(report.metric_evidence.review_wait, 'complete');
  assert.equal(report.coverage_status, 'partial');
});

test('flow coverage is empty when no metric lifecycle evidence is observed', () => {
  const report = calculateFlowMetrics([]);
  assert.equal(report.evidence_status, 'empty');
  assert.equal(report.coverage_status, 'empty');
});
