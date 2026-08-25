import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { validateCanonical } from '../../src/runtime.mjs';

async function withProject(project, fn) {
  const root = await mkdtemp(join(tmpdir(), 'devland-compat-'));
  try {
    await mkdir(join(root, '.devland'), { recursive: true });
    await writeFile(join(root, '.devland/project.yaml'), YAML.stringify(project));
    await writeFile(join(root, '.devland/state.yaml'), await readFile('.devland/state.yaml', 'utf8'));
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function currentProject() {
  return YAML.parse(await readFile('.devland/project.yaml', 'utf8'));
}

test('canonical project requires an explicit Devland behavioral contract', async () => {
  const project = await currentProject();
  delete project.devland;

  await withProject(project, async (root) => {
    const result = await validateCanonical(root);
    assert.equal(result.valid, false);
    assert.equal(result.errors.some((error) => /devland|contract/i.test(`${error.instancePath} ${error.message}`)), true, JSON.stringify(result.errors));
  });
});

test('runtime rejects unsupported Devland behavioral contracts explicitly', async () => {
  const project = await currentProject();
  project.devland = { contract: '999' };

  await withProject(project, async (root) => {
    const result = await validateCanonical(root);
    assert.equal(result.valid, false);
    assert.equal(result.errors.some((error) => /unsupported devland contract.*999/i.test(error.message)), true, JSON.stringify(result.errors));
  });
});

test('package and template declare the current compatibility boundary', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  const template = YAML.parse(await readFile('templates/project.yaml', 'utf8'));

  assert.equal(packageJson.version, '0.2.0');
  assert.equal(packageJson.engines?.node, '>=22');
  assert.deepEqual(template.devland, { contract: '1' });
});
