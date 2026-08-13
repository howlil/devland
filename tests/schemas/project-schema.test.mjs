import assert from 'node:assert/strict';
import test from 'node:test';
import { readYaml } from '../helpers/files.mjs';
import { createValidator } from '../helpers/schema.mjs';

const schemaPath = 'schemas/project.schema.json';

async function validateFixture(path) {
  const validate = await createValidator(schemaPath);
  const value = await readYaml(path);
  return { valid: validate(value), errors: validate.errors };
}

test('project schema accepts the canonical minimal model', async () => {
  const result = await validateFixture('tests/fixtures/project-valid.yaml');
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('project schema requires project.name', async () => {
  const result = await validateFixture('tests/fixtures/project-invalid-missing-name.yaml');
  assert.equal(result.valid, false);
});

test('project schema rejects unknown top-level fields', async () => {
  const result = await validateFixture('tests/fixtures/project-invalid-extra-field.yaml');
  assert.equal(result.valid, false);
});
