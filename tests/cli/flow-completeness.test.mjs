import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('flow reports unmatched starts and ends instead of silently dropping incomplete evidence', () => {
  const events = [
    { id: 'r1-open', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', change_id: 'c1' },
    { id: 'r1-close', type: 'review.completed', occurred_at: '2026-08-25T00:01:00Z', change_id: 'c1' },
    { id: 'r2-open', type: 'review.opened', occurred_at: '2026-08-25T00:02:00Z', change_id: 'c2' },
    { id: 'r3-close', type: 'review.completed', occurred_at: '2026-08-25T00:03:00Z', change_id: 'c3' },
  ];

  const report = calculateFlowMetrics(events);

  assert.equal(report.metrics.review_wait.samples, 1);
  assert.deepEqual(report.incomplete.review_wait, {
    unmatched_starts: 1,
    unmatched_ends: 1,
  });
});
