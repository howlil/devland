import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('flow reports the observed time window for each metric evidence set', () => {
  const report = calculateFlowMetrics([
    { id: 'r-open', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', change_id: 'c1', source: 'github' },
    { id: 'r-close', type: 'review.completed', occurred_at: '2026-08-25T00:04:00Z', change_id: 'c1', source: 'github' },
    { id: 'ci-open', type: 'ci.started', occurred_at: '2026-08-25T00:02:00Z', change_id: 'c2', source: 'github' },
  ]);

  assert.deepEqual(report.metric_windows.review_wait, {
    first_occurred_at: '2026-08-25T00:00:00Z',
    last_occurred_at: '2026-08-25T00:04:00Z',
  });
  assert.deepEqual(report.metric_windows.ci_feedback_latency, {
    first_occurred_at: '2026-08-25T00:02:00Z',
    last_occurred_at: '2026-08-25T00:02:00Z',
  });
  assert.equal(report.metric_windows.idea_to_production, null);
  assert.equal(report.metric_windows.deployment_latency, null);
  assert.equal(report.metric_windows.failed_deployment_recovery, null);
});
