import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';

const expectedTypes = [
  'work.accepted',
  'work.started',
  'change.committed',
  'change.merged',
  'review.opened',
  'review.completed',
  'ci.started',
  'ci.completed',
  'deployment.started',
  'deployment.succeeded',
  'deployment.failed',
  'recovery.succeeded',
  'outcome.observed',
];

async function eventValidator() {
  const schema = JSON.parse(await readFile('schemas/engineering-event.schema.json', 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function baseEvent(id, type, extra = {}) {
  return {
    schema: 'devland.event/v1',
    id,
    type,
    occurred_at: '2026-09-04T00:00:00Z',
    source: 'test',
    ...extra,
  };
}

test('engineering event schema defines the normalized v1 evidence vocabulary', async () => {
  const schema = JSON.parse(await readFile('schemas/engineering-event.schema.json', 'utf8'));

  assert.equal(schema.properties.schema.const, 'devland.event/v1');
  assert.deepEqual(schema.properties.type.enum, expectedTypes);
  assert.deepEqual(schema.required, ['schema', 'id', 'type', 'occurred_at', 'source']);
  assert.equal(schema.additionalProperties, false);
  for (const field of ['work_id', 'change_id', 'commit_sha', 'deployment_id', 'environment']) {
    assert.ok(schema.properties[field], `missing linkage field ${field}`);
  }
});

test('change.merged requires an explicit change identity while keeping linkage enrichment additive', async () => {
  const validate = await eventValidator();

  assert.equal(validate(baseEvent('merge-1', 'change.merged', {
    source: 'github',
    change_id: 'change-1',
  })), true, JSON.stringify(validate.errors));

  assert.equal(validate(baseEvent('merge-invalid', 'change.merged', {
    source: 'github',
  })), false);
});

test('outcome.observed requires work linkage and constrains optional outcome status', async () => {
  const validate = await eventValidator();

  assert.equal(validate(baseEvent('outcome-compatible', 'outcome.observed', {
    work_id: 'work-1',
  })), true, JSON.stringify(validate.errors));

  assert.equal(validate(baseEvent('outcome-positive', 'outcome.observed', {
    work_id: 'work-1',
    data: {
      status: 'positive',
      observation: 'session expiry behaves consistently in production',
    },
  })), true, JSON.stringify(validate.errors));

  assert.equal(validate(baseEvent('outcome-unlinked', 'outcome.observed', {
    data: { status: 'positive' },
  })), false);

  assert.equal(validate(baseEvent('outcome-invalid-status', 'outcome.observed', {
    work_id: 'work-1',
    data: { status: 'successful' },
  })), false);
});
