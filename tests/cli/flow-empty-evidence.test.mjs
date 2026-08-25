import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlowMetrics } from '../../src/metrics.mjs';

test('flow reports empty when no lifecycle evidence is observed', () => {
  const report = calculateFlowMetrics([]);

  assert.equal(report.evidence_status, 'empty');
  assert.equal(Object.values(report.metrics).every((metric) => metric.samples === 0), true);
});
