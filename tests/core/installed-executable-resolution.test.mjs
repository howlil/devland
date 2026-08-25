import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const pnpmCli = process.env.npm_execpath;

function runPnpm(args, cwd) {
  assert.equal(typeof pnpmCli, 'string', 'package-manager executable must be available under pnpm test');
  return spawnSync(process.execPath, [pnpmCli, ...args], { cwd, encoding: 'utf8' });
}

test('installed package resolves the devland executable through pnpm exec', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-exec-resolution-'));
  const packageDir = join(root, 'package');
  const consumer = join(root, 'consumer');

  try {
    await mkdir(packageDir, { recursive: true });
    await mkdir(consumer, { recursive: true });
    await writeFile(join(consumer, 'package.json'), '{"name":"devland-exec-consumer","private":true}\n');

    const packed = runPnpm(['pack', '--pack-destination', packageDir], resolve('.'));
    assert.equal(packed.status, 0, packed.stderr || packed.stdout || packed.error?.message);
    const tarballs = (await readdir(packageDir)).filter((name) => name.endsWith('.tgz'));
    assert.equal(tarballs.length, 1, `expected one package archive, got ${tarballs.join(', ')}`);
    const tarball = join(packageDir, tarballs[0]);

    const installed = runPnpm(['add', '--ignore-scripts', tarball], consumer);
    assert.equal(installed.status, 0, installed.stderr || installed.stdout || installed.error?.message);

    const init = runPnpm(['exec', 'devland', 'init', 'exec-consumer'], consumer);
    assert.equal(init.status, 0, init.stderr || init.stdout || init.error?.message);

    const validate = runPnpm(['exec', 'devland', 'validate'], consumer);
    assert.equal(validate.status, 0, validate.stderr || validate.stdout || validate.error?.message);
    assert.equal(JSON.parse(validate.stdout).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
