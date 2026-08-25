import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;

test('npm package contains the executable runtime contract', () => {
  assert.equal(typeof npmCli, 'string', 'npm_execpath must be available under npm test');
  const result = spawnSync(process.execPath, [npmCli, 'pack', '--dry-run', '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);

  const [manifest] = JSON.parse(result.stdout);
  const paths = new Set(manifest.files.map((file) => file.path));

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
    assert.equal(paths.has(required), true, `packed artifact missing ${required}`);
  }
});
