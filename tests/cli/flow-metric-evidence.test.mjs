import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('flow exposes evidence confidence per metric instead of hiding unobserved metrics behind a global status', () => {
  const report = calculateFlowMetrics([
    { id: 'r-open', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', change_id: 'c1' },
    { id: 'r-close', type: 'review.completed', occurred_at: '2026-08-25T00:01:00Z', change_id: 'c1' },
    { id: 'ci-open', type: 'ci.started', occurred_at: '2026-08-25T00:02:00Z', change_id: 'c2' },
  ]);

  assert.equal(report.metric_evidence.review_wait, 'complete');
  assert.equal(report.metric_evidence.ci_feedback_latency, 'partial');
  assert.equal(report.metric_evidence.idea_to_production, 'empty');
  assert.equal(report.metric_evidence.deployment_latency, 'empty');
  assert.equal(report.metric_evidence.failed_deployment_recovery, 'empty');
});
