import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const pnpmCli = process.env.npm_execpath;

test('pnpm package contains the executable runtime contract', () => {
  assert.equal(typeof pnpmCli, 'string', 'package-manager executable must be available under pnpm test');
  const result = spawnSync(process.execPath, [pnpmCli, 'pack', '--dry-run'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);

  const output = `${result.stdout}\n${result.stderr}`;
  for (const required of [
    'bin/devland.mjs',
    'src/runtime.mjs',
    'src/doctor.mjs',
    'src/metrics.mjs',
    'schemas/project.schema.json',
    'templates/project.yaml',
    'profiles/project-types/backend.md',
    'adapters/generic/README.md',
  ]) {
    assert.match(output, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `packed artifact missing ${required}`);
  }
});
