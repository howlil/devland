import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('flow never pairs lifecycle events across different evidence sources', () => {
  const report = calculateFlowMetrics([
    { id: 'r-open', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', change_id: 'c1', source: 'github' },
    { id: 'r-close', type: 'review.completed', occurred_at: '2026-08-25T00:01:00Z', change_id: 'c1', source: 'manual' },
  ]);

  assert.equal(report.metrics.review_wait.samples, 0);
  assert.deepEqual(report.incomplete.review_wait, {
    unmatched_starts: 1,
    unmatched_ends: 1,
  });
  assert.equal(report.metric_evidence.review_wait, 'partial');
  assert.deepEqual(report.metric_sources.review_wait, ['github', 'manual']);
});
