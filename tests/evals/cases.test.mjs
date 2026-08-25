import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readdir } from 'node:fs/promises';
import { readText, readYaml } from '../helpers/files.mjs';
import { createValidator } from '../helpers/schema.mjs';

const cases = ['cliplingo', 'mypaas', 'podland', 'simple', 'sop-auto-fill', 'wago'];
const requiredFiles = ['source.yaml', 'evidence.md', 'expected/project.yaml', 'expected/state.yaml', 'assertions.yaml'];
const secretKeys = ['access_token', 'private_key', 'client_secret', 'api_key_value', 'cookie_value'];
const doctorScenarios = ['cliplingo/doctor/stack-drift.yaml'];
const doctorCategories = new Set(['stack/runtime drift', 'invalid/missing referenced files']);

async function profileIds() {
  const result = new Set();
  for (const dir of ['project-types', 'qualities', 'stacks', 'delivery']) {
    for (const file of await readdir(`profiles/${dir}`)) {
      if (file.endsWith('.md')) result.add(`${dir}.${file.slice(0, -3)}`);
    }
  }
  return result;
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

test('the six v0 eval cases have valid canonical fixtures and assertions', async () => {
  const projectValidate = await createValidator('schemas/project.schema.json');
  const stateValidate = await createValidator('schemas/state.schema.json');
  const profiles = await profileIds();

  const caseDirs = (await readdir('evals/cases', { withFileTypes: true }))
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert.deepEqual(caseDirs, cases);

  for (const caseId of cases) {
    const root = `evals/cases/${caseId}`;
    for (const file of requiredFiles) assert.equal(await exists(`${root}/${file}`), true, `${caseId} missing ${file}`);

    const source = await readYaml(`${root}/source.yaml`);
    assert.equal(source.case, caseId);
    assert.match(source.source.observed_commit, /^[0-9a-f]{40}$/);
    assert.notEqual(source.source.observed_commit, 'master');
    assert.notEqual(source.source.observed_commit, 'main');

    const project = await readYaml(`${root}/expected/project.yaml`);
    assert.equal(projectValidate(project), true, `${caseId} project invalid: ${JSON.stringify(projectValidate.errors)}`);
    const state = await readYaml(`${root}/expected/state.yaml`);
    assert.equal(stateValidate(state), true, `${caseId} state invalid: ${JSON.stringify(stateValidate.errors)}`);

    const assertions = await readYaml(`${root}/assertions.yaml`);
    for (const field of ['must_preserve', 'must_not_infer', 'expected_profiles', 'forbidden_profiles', 'optional_artifacts', 'doctor_seed_expectations']) {
      assert.ok(Array.isArray(assertions[field]), `${caseId}.${field} must be an array`);
    }
    assert.ok(['change', 'change-with-iteration-group'].includes(assertions.work_model));
    for (const id of assertions.expected_profiles) assert.equal(profiles.has(id), true, `${caseId} expects unknown profile ${id}`);
    for (const id of assertions.forbidden_profiles) assert.equal(project.profiles.includes(id), false, `${caseId} contains forbidden profile ${id}`);
    for (const category of assertions.doctor_seed_expectations) {
      assert.equal(doctorCategories.has(category), true, `${caseId} expects unsupported doctor category ${category}`);
    }

    const serialized = [
      await readText(`${root}/source.yaml`), await readText(`${root}/evidence.md`),
      await readText(`${root}/expected/project.yaml`), await readText(`${root}/expected/state.yaml`),
      await readText(`${root}/assertions.yaml`),
    ].join('\n').toLowerCase();
    for (const key of secretKeys) assert.equal(serialized.includes(key), false, `${caseId} contains secret-bearing key ${key}`);
  }

  const simple = 'evals/cases/simple';
  assert.equal(await exists(`${simple}/expected/architecture.md`), false);
  assert.equal(await exists(`${simple}/expected/changes`), false);
  const simpleAssertions = await readYaml(`${simple}/assertions.yaml`);
  assert.equal(simpleAssertions.optional_artifacts.includes('architecture'), false);
  assert.equal(simpleAssertions.optional_artifacts.includes('plan'), false);
  assert.equal(simpleAssertions.optional_artifacts.includes('evidence'), false);
});

test('seeded doctor scenarios use only currently supported diagnostic categories', async () => {
  for (const relativePath of doctorScenarios) {
    const path = `evals/cases/${relativePath}`;
    assert.equal(await exists(path), true, `missing doctor scenario: ${relativePath}`);
    const scenario = await readYaml(path);
    assert.equal(typeof scenario.seed, 'string');
    assert.ok(scenario.seed.trim().length > 0);
    assert.equal(doctorCategories.has(scenario.expected_category), true, `invalid doctor category: ${scenario.expected_category}`);
    assert.ok(Array.isArray(scenario.evidence));
    assert.ok(scenario.evidence.length > 0);
    assert.equal(typeof scenario.recommended_correction, 'string');
    assert.ok(scenario.recommended_correction.trim().length > 0);
    assert.ok(Array.isArray(scenario.must_not_do));
    assert.ok(scenario.must_not_do.length > 0);
    assert.equal(
      scenario.must_not_do.some((item) => /automatic|silently|without verifying|fabricat/i.test(item)),
      true,
      `${relativePath} must explicitly forbid unsafe automatic resolution`,
    );
  }
});
