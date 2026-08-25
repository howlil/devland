import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { doctorProject } from '../../src/doctor.mjs';

test('doctor evaluates adapter semantic divergence instead of leaving it unknown', async () => {
  const report = await doctorProject(resolve('.'));
  const check = report.checks.find((candidate) => candidate.category === 'adapter duplication/divergence');

  assert.equal(check?.status, 'clean');
  assert.deepEqual(check?.evaluated_adapters, ['agents-md', 'generic']);
});
