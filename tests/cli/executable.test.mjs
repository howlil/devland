import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

function run(args, cwd = process.cwd()) {
  return spawnSync(process.execPath, ['bin/devland.mjs', ...args], {
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

test('context resolves canonical files, core policies, applicable profiles, and requested workflow', () => {
  const result = run(['context', 'develop-change']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);

  assert.equal(output.workflow.id, 'develop-change');
  assert.equal(output.workflow.path, 'core/workflows/develop-change.md');
  assert.equal(output.project.path, '.devland/project.yaml');
  assert.equal(output.state.path, '.devland/state.yaml');
  assert.ok(output.policies.some((item) => item.id === 'core.engineering'));
  assert.ok(output.policies.some((item) => item.id === 'core.testing'));
  assert.ok(Array.isArray(output.profiles));
  assert.equal(output.project.content.schema, 'devland.project/v0');
  assert.equal(output.state.content.schema, 'devland.state/v0');
  assert.match(output.workflow.content, /smallest valuable slice/i);
});

test('context rejects an unknown workflow without pretending resolution succeeded', () => {
  const result = run(['context', 'does-not-exist']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown workflow/i);
});
