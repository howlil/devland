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

const productionLifecycle = [
  event('accepted', 'work.accepted', '2026-09-04T00:00:00Z', { work_id: 'work-1' }),
  event('committed', 'change.committed', '2026-09-04T00:02:00Z', {
    work_id: 'work-1',
    change_id: 'change-1',
    commit_sha: 'abc123',
  }),
  event('merged', 'change.merged', '2026-09-04T00:05:00Z', {
    work_id: 'work-1',
    change_id: 'change-1',
    commit_sha: 'merge123',
  }),
  event('deployed', 'deployment.succeeded', '2026-09-04T00:10:00Z', {
    work_id: 'work-1',
    deployment_id: 'deploy-1',
    environment: 'production',
  }),
];

test('production and idea metrics close on the first observed outcome while current status uses the latest observation', () => {
  const events = [
    ...productionLifecycle,
    event('outcome-positive', 'outcome.observed', '2026-09-04T00:14:00Z', {
      work_id: 'work-1',
      data: { status: 'positive' },
    }),
    event('outcome-negative', 'outcome.observed', '2026-09-04T00:20:00Z', {
      work_id: 'work-1',
      data: { status: 'negative' },
    }),
  ];

  const report = calculateFlowMetrics(events, { productionEnvironments: ['production'] });

  assert.deepEqual(report.metrics.production_to_outcome, {
    samples: 1,
    average_ms: 240_000,
    max_ms: 240_000,
  });
  assert.deepEqual(report.metrics.idea_to_outcome, {
    samples: 1,
    average_ms: 840_000,
    max_ms: 840_000,
  });
  assert.deepEqual(report.outcomes.coverage, { linked: 1, total: 1 });
  assert.deepEqual(report.outcomes.status, {
    positive: 0,
    neutral: 0,
    negative: 1,
    unknown: 0,
  });
  assert.ok(report.correlation.diagnostics.some((diagnostic) => (
    diagnostic.code === 'conflicting_outcome_status'
      && diagnostic.work_id === 'work-1'
  )));
  assert.equal(report.metrics.merge_to_production.samples, 1);
});

test('shipped work without outcome evidence remains explicitly unknown', () => {
  const report = calculateFlowMetrics(productionLifecycle, { productionEnvironments: ['production'] });

  assert.deepEqual(report.outcomes.coverage, { linked: 0, total: 1 });
  assert.deepEqual(report.outcomes.status, {
    positive: 0,
    neutral: 0,
    negative: 0,
    unknown: 1,
  });
  assert.equal(report.metrics.production_to_outcome.samples, 0);
  assert.equal(report.metrics.idea_to_outcome.samples, 0);
});

test('outcome correlation is independent of append order and keeps outcome evidence on the work trace', () => {
  const events = [
    ...productionLifecycle,
    event('outcome', 'outcome.observed', '2026-09-04T00:14:00Z', {
      work_id: 'work-1',
      data: { status: 'positive', observation: 'expected behavior observed' },
    }),
  ];

  const ordered = correlateDeliveryEvents(events, { productionEnvironments: ['production'] });
  const reversed = correlateDeliveryEvents([...events].reverse(), { productionEnvironments: ['production'] });

  assert.deepEqual(reversed.outcomes, ordered.outcomes);
  assert.deepEqual(reversed.diagnostics, ordered.diagnostics);
  assert.deepEqual(ordered.outcomes.coverage, { linked: 1, total: 1 });
  assert.deepEqual(ordered.traces[0].outcomes, [{
    id: 'outcome',
    status: 'positive',
    occurred_at: '2026-09-04T00:14:00Z',
    source: 'test',
  }]);
});

test('outcome evidence before production is advisory and does not create a negative timing sample', () => {
  const events = [
    ...productionLifecycle,
    event('early-outcome', 'outcome.observed', '2026-09-04T00:08:00Z', {
      work_id: 'work-1',
      data: { status: 'positive' },
    }),
  ];

  const report = calculateFlowMetrics(events, { productionEnvironments: ['production'] });

  assert.equal(report.metrics.production_to_outcome.samples, 0);
  assert.ok(report.correlation.diagnostics.some((diagnostic) => (
    diagnostic.code === 'outcome_precedes_production'
      && diagnostic.work_id === 'work-1'
  )));
});

test('missing outcome status stays backward-compatible and is summarized as unknown', () => {
  const report = calculateFlowMetrics([
    ...productionLifecycle,
    event('outcome-legacy', 'outcome.observed', '2026-09-04T00:14:00Z', {
      work_id: 'work-1',
      data: { observation: 'observed without explicit status' },
    }),
  ], { productionEnvironments: ['production'] });

  assert.deepEqual(report.outcomes.coverage, { linked: 1, total: 1 });
  assert.deepEqual(report.outcomes.status, {
    positive: 0,
    neutral: 0,
    negative: 0,
    unknown: 1,
  });
  assert.equal(report.metrics.production_to_outcome.samples, 1);
});
