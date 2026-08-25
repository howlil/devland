import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('flow reports the evidence sources observed for each metric', () => {
  const report = calculateFlowMetrics([
    { id: 'r-open', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', change_id: 'c1', source: 'github' },
    { id: 'r-close', type: 'review.completed', occurred_at: '2026-08-25T00:01:00Z', change_id: 'c1', source: 'github' },
    { id: 'ci-open', type: 'ci.started', occurred_at: '2026-08-25T00:02:00Z', change_id: 'c2', source: 'manual' },
  ]);

  assert.deepEqual(report.metric_sources.review_wait, ['github']);
  assert.deepEqual(report.metric_sources.ci_feedback_latency, ['manual']);
  assert.deepEqual(report.metric_sources.idea_to_production, []);
  assert.deepEqual(report.metric_sources.deployment_latency, []);
  assert.deepEqual(report.metric_sources.failed_deployment_recovery, []);
});
