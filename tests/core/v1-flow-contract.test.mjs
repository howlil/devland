import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { readText } from '../helpers/files.mjs';

const specPath = 'docs/superpowers/specs/2026-08-22-devland-v1-flow-contract.md';

test('v1 defines rapid XP delivery as a small-batch feedback system', async () => {
  assert.equal(existsSync(specPath), true, `${specPath} must exist`);
  const spec = await readText(specPath);

  assert.match(spec, /smallest valuable slice/i);
  assert.match(spec, /RED\s*(?:->|→)\s*GREEN\s*(?:->|→)\s*REFACTOR/i);
  assert.match(spec, /continuous integration/i);
  assert.match(spec, /production/i);
  assert.match(spec, /observe/i);
  assert.match(spec, /learn/i);
  assert.match(spec, /small batch|batch size/i);
});

test('v1 measures delivery speed, stability, flow, and product value separately', async () => {
  assert.equal(existsSync(specPath), true, `${specPath} must exist`);
  const spec = await readText(specPath);

  for (const metric of [
    'change lead time',
    'deployment frequency',
    'change fail rate',
    'failed deployment recovery time',
    'deployment rework rate',
    'idea-to-production cycle time',
  ]) {
    assert.match(spec, new RegExp(metric, 'i'));
  }

  assert.match(spec, /outcome metric/i);
  assert.match(spec, /guardrail metric/i);
  assert.match(spec, /acceptance.*correct|correct.*acceptance/is);
  assert.match(spec, /outcome.*value|value.*outcome/is);
});

test('v1 remains agent-agnostic and keeps heavyweight platform concerns out of iteration 0', async () => {
  assert.equal(existsSync(specPath), true, `${specPath} must exist`);
  const spec = await readText(specPath);

  assert.match(spec, /agent-agnostic/i);
  assert.match(spec, /non-goals/i);
  assert.match(spec, /web dashboard/i);
  assert.match(spec, /database/i);
  assert.match(spec, /agent runtime/i);
  assert.match(spec, /provider.*adapter|adapter.*provider/is);
});
