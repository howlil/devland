import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const expectedTypes = [
  'work.accepted',
  'work.started',
  'change.committed',
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
