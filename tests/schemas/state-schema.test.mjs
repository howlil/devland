import assert from 'node:assert/strict';
import test from 'node:test';
import { readYaml } from '../helpers/files.mjs';
import { createValidator } from '../helpers/schema.mjs';

const schemaPath = 'schemas/state.schema.json';

async function validateValue(value) {
  const validate = await createValidator(schemaPath);
  return { valid: validate(value), errors: validate.errors };
}

async function validateFixture(path) {
  return validateValue(await readYaml(path));
}

test('state schema accepts a lightweight current-work item', async () => {
  const result = await validateValue({
    schema: 'devland.state/v0',
    active_work: [{ id: 'dogfood-codeflow', status: 'active', goal: 'Validate Devland on one real vertical slice.' }],
    blocked: [],
    recently_completed: [],
    open_decisions: [],
  });
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('state schema remains backward-compatible with a detailed change', async () => {
  const result = await validateFixture('tests/fixtures/state-valid-change.yaml');
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('state schema accepts optional iteration grouping', async () => {
  const result = await validateFixture('tests/fixtures/state-valid-iteration-group.yaml');
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('state schema rejects unknown work status', async () => {
  const result = await validateFixture('tests/fixtures/state-invalid-status.yaml');
  assert.equal(result.valid, false);
});

test('state schema rejects unknown work-item fields', async () => {
  const value = await readYaml('tests/fixtures/state-valid-change.yaml');
  value.active_work[0].uncontrolled_field = true;
  const result = await validateValue(value);
  assert.equal(result.valid, false);
});
