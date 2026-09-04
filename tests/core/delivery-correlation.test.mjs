import assert from 'node:assert/strict';
import test from 'node:test';
import { correlateDeliveryEvents } from '../../src/correlation.mjs';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

function event(id, type, occurredAt, extra = {}) {
  return {
    schema: 'devland.event/v1',
    id,
    type,
    occurred_at: occurredAt,
    source: 'test',
    ...extra,
  };
}

const linkedLifecycle = [
  event('accepted', 'work.accepted', '2026-09-04T00:00:00Z', { work_id: 'work-1' }),
  event('started', 'work.started', '2026-09-04T00:01:00Z', { work_id: 'work-1' }),
  event('commit-1', 'change.committed', '2026-09-04T00:03:00Z', {
    work_id: 'work-1',
    change_id: 'change-1',
    commit_sha: 'abc123',
  }),
  event('commit-2', 'change.committed', '2026-09-04T00:04:00Z', {
    work_id: 'work-1',
    change_id: 'change-1',
    commit_sha: 'def456',
  }),
  event('merged', 'change.merged', '2026-09-04T00:08:00Z', {
    work_id: 'work-1',
    change_id: 'change-1',
    commit_sha: 'merge789',
  }),
  event('deployed', 'deployment.succeeded', '2026-09-04T00:12:00Z', {
    deployment_id: 'deploy-1',
    environment: 'production',
    work_id: 'work-1',
  }),
];

test('correlation links work, change, commits, merge, and deployment without requiring append order', () => {
  const ordered = correlateDeliveryEvents(linkedLifecycle);
  const reversed = correlateDeliveryEvents([...linkedLifecycle].reverse());

  assert.deepEqual(reversed.coverage, ordered.coverage);
  assert.deepEqual(reversed.diagnostics, ordered.diagnostics);
  assert.deepEqual(ordered.coverage, {
    work_to_change: { linked: 1, total: 1 },
    change_to_merge: { linked: 1, total: 1 },
    merge_to_deploy: { linked: 1, total: 1 },
  });
  assert.deepEqual(ordered.diagnostics, []);
  assert.deepEqual(ordered.traces, [{
    work_id: 'work-1',
    change_ids: ['change-1'],
    commit_shas: ['abc123', 'def456', 'merge789'],
    deployment_ids: ['deploy-1'],
  }]);

  const deployment = ordered.events.find((candidate) => candidate.id === 'deployed');
  assert.equal(deployment.change_id, 'change-1');
});

test('delivery metrics use first meaningful milestones instead of double-counting repeated commits', () => {
  const report = calculateFlowMetrics(linkedLifecycle, { productionEnvironments: ['production'] });

  assert.deepEqual(report.metrics.accept_to_start, {
    samples: 1,
    average_ms: 60_000,
    max_ms: 60_000,
  });
  assert.deepEqual(report.metrics.start_to_change, {
    samples: 1,
    average_ms: 120_000,
    max_ms: 120_000,
  });
  assert.deepEqual(report.metrics.change_to_merge, {
    samples: 1,
    average_ms: 300_000,
    max_ms: 300_000,
  });
  assert.deepEqual(report.metrics.merge_to_production, {
    samples: 1,
    average_ms: 240_000,
    max_ms: 240_000,
  });
  assert.deepEqual(report.correlation.coverage, {
    work_to_change: { linked: 1, total: 1 },
    change_to_merge: { linked: 1, total: 1 },
    merge_to_deploy: { linked: 1, total: 1 },
  });
});

test('conflicting work relationships are diagnostic and never silently resolved', () => {
  const result = correlateDeliveryEvents([
    event('commit-a', 'change.committed', '2026-09-04T00:00:00Z', {
      work_id: 'work-a',
      change_id: 'change-1',
      commit_sha: 'aaa',
    }),
    event('review-b', 'review.opened', '2026-09-04T00:01:00Z', {
      work_id: 'work-b',
      change_id: 'change-1',
    }),
  ]);

  assert.equal(result.coverage.work_to_change.linked, 0);
  assert.ok(result.diagnostics.some((diagnostic) => (
    diagnostic.code === 'conflicting_work_link'
      && diagnostic.change_id === 'change-1'
  )));
});

test('unlinked deployments degrade correlation coverage instead of inventing a relationship', () => {
  const result = correlateDeliveryEvents([
    event('commit', 'change.committed', '2026-09-04T00:00:00Z', {
      work_id: 'work-1',
      change_id: 'change-1',
      commit_sha: 'aaa',
    }),
    event('merged', 'change.merged', '2026-09-04T00:01:00Z', {
      work_id: 'work-1',
      change_id: 'change-1',
    }),
    event('deploy-other', 'deployment.succeeded', '2026-09-04T00:02:00Z', {
      deployment_id: 'deploy-other',
      environment: 'production',
      work_id: 'work-2',
    }),
  ]);

  assert.deepEqual(result.coverage.merge_to_deploy, { linked: 0, total: 1 });
  assert.ok(result.diagnostics.some((diagnostic) => (
    diagnostic.code === 'unlinked_deployment'
      && diagnostic.deployment_id === 'deploy-other'
  )));
});
