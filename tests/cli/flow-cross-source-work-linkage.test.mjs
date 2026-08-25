import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('idea-to-production links canonical work ids across evidence sources', () => {
  const report = calculateFlowMetrics([
    {
      id: 'work-accepted',
      type: 'work.accepted',
      occurred_at: '2026-08-25T00:00:00Z',
      source: 'planning',
      work_id: 'work-1',
    },
    {
      id: 'deployment-succeeded',
      type: 'deployment.succeeded',
      occurred_at: '2026-08-25T00:10:00Z',
      source: 'github',
      work_id: 'work-1',
      deployment_id: 'github:repo:deployment:1',
      environment: 'production',
    },
  ], { productionEnvironments: ['production'] });

  assert.equal(report.metrics.idea_to_production.samples, 1);
  assert.equal(report.metrics.idea_to_production.average_ms, 600_000);
  assert.deepEqual(report.incomplete.idea_to_production, {
    unmatched_starts: 0,
    unmatched_ends: 0,
  });
});
