import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const pnpmCli = process.env.npm_execpath;

function runPnpm(args, cwd) {
  assert.equal(typeof pnpmCli, 'string', 'package-manager executable must be available under pnpm test');
  return spawnSync(process.execPath, [pnpmCli, ...args], { cwd, encoding: 'utf8' });
}

test('pnpm package contains the executable runtime contract', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-packed-artifact-'));
  const packageDir = join(root, 'package');

  try {
    await mkdir(packageDir, { recursive: true });
    const packed = runPnpm(['pack', '--pack-destination', packageDir], resolve('.'));
    assert.equal(packed.status, 0, packed.stderr || packed.stdout || packed.error?.message);

    const tarballs = (await readdir(packageDir)).filter((name) => name.endsWith('.tgz'));
    assert.equal(tarballs.length, 1, `expected one package archive, got ${tarballs.join(', ')}`);
    const tarball = join(packageDir, tarballs[0]);

    const listed = spawnSync('tar', ['-tf', tarball], { encoding: 'utf8' });
    assert.equal(listed.status, 0, listed.stderr || listed.stdout || listed.error?.message);
    const paths = new Set(listed.stdout.split(/\r?\n/).filter(Boolean).map((path) => path.replace(/^package\//, '')));

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
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
