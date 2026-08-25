import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('flow marks evidence partial when any metric has unmatched lifecycle events', () => {
  const report = calculateFlowMetrics([
    { id: 'r1-open', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', change_id: 'c1' },
  ]);

  assert.equal(report.evidence_status, 'partial');
});

test('flow marks evidence complete when all observed lifecycle events are paired', () => {
  const report = calculateFlowMetrics([
    { id: 'r1-open', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', change_id: 'c1' },
    { id: 'r1-close', type: 'review.completed', occurred_at: '2026-08-25T00:01:00Z', change_id: 'c1' },
  ]);

  assert.equal(report.evidence_status, 'complete');
});
