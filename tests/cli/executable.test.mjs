import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cliPath = resolve('bin/devland.mjs');

function run(args, cwd = process.cwd()) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('validate succeeds for the self-hosted Devland project', () => {
  const result = run(['validate']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.valid, true);
  assert.deepEqual(output.validated.sort(), ['.devland/project.yaml', '.devland/state.yaml']);
});

test('context resolves lean canonical references, relevant guidance, and requested workflow', () => {
  const result = run(['context', 'develop-change']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);

  assert.equal(output.schema, 'devland.context/v1');
  assert.equal(output.workflow.id, 'develop-change');
  assert.equal(output.workflow.path, 'core/workflows/develop-change.md');
  assert.equal(output.project.path, '.devland/project.yaml');
  assert.equal(output.state.path, '.devland/state.yaml');
  assert.ok(output.policies.some((item) => item.id === 'core.engineering'));
  assert.ok(output.policies.some((item) => item.id === 'core.testing'));
  assert.ok(Array.isArray(output.profiles));
  assert.equal(output.project.content.schema, 'devland.project/v0');
  assert.equal(output.state.content, undefined);
  assert.equal(output.work, undefined);
  assert.match(output.workflow.content, /rapid path/i);
  assert.match(output.workflow.content, /smallest valuable slice/i);
});

test('context accepts a transient work file without requiring canonical state hydration', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-work-'));
  const workPath = join(root, 'work.json');
  try {
    await writeFile(workPath, JSON.stringify({
      id: 'work-cli',
      intent: 'Carry transient requirement intent through the CLI',
      acceptance: ['resolved context contains the supplied work envelope'],
      scope: { allowed: ['src/runtime.mjs'] },
    }), 'utf8');

    const result = run(['context', '--work', workPath]);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.workflow.id, 'develop-change');
    assert.equal(output.work.id, 'work-cli');
    assert.deepEqual(output.work.acceptance, ['resolved context contains the supplied work envelope']);
    assert.equal(output.state.content, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('context resolves Devland core from the installed tool when the target repo only has canonical state', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-target-'));
  try {
    await mkdir(join(root, '.devland'));
    await copyFile('.devland/project.yaml', join(root, '.devland/project.yaml'));
    await copyFile('.devland/state.yaml', join(root, '.devland/state.yaml'));

    const result = run(['context', 'develop-change'], root);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.schema, 'devland.context/v1');
    assert.equal(output.project.path, '.devland/project.yaml');
    assert.equal(output.workflow.path, 'core/workflows/develop-change.md');
    assert.ok(output.policies.some((item) => item.id === 'core.engineering'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('context rejects an unknown workflow without pretending resolution succeeded', () => {
  const result = run(['context', 'does-not-exist']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown workflow/i);
});
