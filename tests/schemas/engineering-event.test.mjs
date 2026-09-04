import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createValidator } from '../helpers/schema.mjs';

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
  const validate = await createValidator('schemas/engineering-event.schema.json');

  assert.equal(validate({
    schema: 'devland.event/v1',
    id: 'merge-1',
    type: 'change.merged',
    occurred_at: '2026-09-04T00:00:00Z',
    source: 'github',
    change_id: 'change-1',
  }), true, JSON.stringify(validate.errors));

  assert.equal(validate({
    schema: 'devland.event/v1',
    id: 'merge-invalid',
    type: 'change.merged',
    occurred_at: '2026-09-04T00:00:00Z',
    source: 'github',
  }), false);
});
