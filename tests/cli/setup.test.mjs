import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import YAML from 'yaml';
import { validateCanonical } from '../../src/runtime.mjs';

const cliPath = resolve('bin/devland.mjs');

function run(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd, encoding: 'utf8' });
}

async function tempRepo(prefix) {
  return mkdtemp(join(tmpdir(), prefix));
}

test('devland init creates a minimal valid contract-1 project without inventing project facts', async () => {
  const root = await tempRepo('devland-init-');
  try {
    const result = run(['init', 'example-service'], root);
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const project = YAML.parse(await readFile(join(root, '.devland/project.yaml'), 'utf8'));
    const state = YAML.parse(await readFile(join(root, '.devland/state.yaml'), 'utf8'));
    assert.equal(project.devland.contract, '1');
    assert.equal(project.project.name, 'example-service');
    assert.deepEqual(project.project.types, []);
    assert.equal(project.product.purpose, '');
    assert.deepEqual(state.active_work, []);

    const validation = await validateCanonical(root);
    assert.equal(validation.valid, true, JSON.stringify(validation.errors));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('devland init refuses to overwrite an existing canonical repository', async () => {
  const root = await tempRepo('devland-init-existing-');
  try {
    await mkdir(join(root, '.devland'), { recursive: true });
    await writeFile(join(root, '.devland/project.yaml'), 'sentinel\n');

    const result = run(['init', 'example-service'], root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /already exists|refus|overwrite/i);
    assert.equal(await readFile(join(root, '.devland/project.yaml'), 'utf8'), 'sentinel\n');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('devland init requires an explicit project name', async () => {
  const root = await tempRepo('devland-init-name-');
  try {
    const result = run(['init'], root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /project name|usage/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('devland migrate adds contract 1 to a legacy project v0 and preserves existing facts', async () => {
  const root = await tempRepo('devland-migrate-');
  try {
    await mkdir(join(root, '.devland'), { recursive: true });
    const legacy = {
      schema: 'devland.project/v0',
      project: { name: 'legacy-service', types: ['backend'] },
      product: { purpose: 'preserve me', priorities: ['correctness'], non_goals: [] },
      platforms: ['linux'],
      stack: { languages: ['go'], frameworks: [], runtimes: ['go'], data_stores: [] },
      architecture: { style: null, document: null },
      qualities: [],
      profiles: [],
      delivery: { model: null },
      constraints: ['keep this'],
    };
    await writeFile(join(root, '.devland/project.yaml'), YAML.stringify(legacy));
    await writeFile(join(root, '.devland/state.yaml'), 'schema: devland.state/v0\nactive_work: []\nblocked: []\nrecently_completed: []\nopen_decisions: []\n');

    const result = run(['migrate'], root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const migrated = YAML.parse(await readFile(join(root, '.devland/project.yaml'), 'utf8'));
    assert.equal(migrated.devland.contract, '1');
    assert.equal(migrated.product.purpose, 'preserve me');
    assert.deepEqual(migrated.stack.languages, ['go']);
    assert.deepEqual(migrated.constraints, ['keep this']);
    assert.equal((await validateCanonical(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('devland migrate is idempotent for contract 1', async () => {
  const root = await tempRepo('devland-migrate-idempotent-');
  try {
    const init = run(['init', 'already-current'], root);
    assert.equal(init.status, 0, init.stderr || init.stdout);
    const before = await readFile(join(root, '.devland/project.yaml'), 'utf8');

    const migrated = run(['migrate'], root);
    assert.equal(migrated.status, 0, migrated.stderr || migrated.stdout);
    assert.equal(JSON.parse(migrated.stdout).changed, false);
    assert.equal(await readFile(join(root, '.devland/project.yaml'), 'utf8'), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('devland migrate refuses unsupported future contracts instead of downgrading them', async () => {
  const root = await tempRepo('devland-migrate-future-');
  try {
    const init = run(['init', 'future-service'], root);
    assert.equal(init.status, 0, init.stderr || init.stdout);
    const projectPath = join(root, '.devland/project.yaml');
    const project = YAML.parse(await readFile(projectPath, 'utf8'));
    project.devland.contract = '999';
    await writeFile(projectPath, YAML.stringify(project));

    const result = run(['migrate'], root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unsupported.*contract|refus|downgrade/i);
    assert.equal(YAML.parse(await readFile(projectPath, 'utf8')).devland.contract, '999');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
