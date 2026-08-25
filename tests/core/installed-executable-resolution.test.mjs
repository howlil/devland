import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const npmCli = process.env.npm_execpath;

function runNpm(args, cwd) {
  assert.equal(typeof npmCli, 'string', 'npm_execpath must be available under npm test');
  return spawnSync(process.execPath, [npmCli, ...args], { cwd, encoding: 'utf8' });
}

test('installed package resolves the devland executable through npm exec', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-exec-resolution-'));
  const packageDir = join(root, 'package');
  const consumer = join(root, 'consumer');

  try {
    await mkdir(packageDir, { recursive: true });
    await mkdir(consumer, { recursive: true });
    await writeFile(join(consumer, 'package.json'), '{"name":"devland-exec-consumer","private":true}\n');

    const packed = runNpm(['pack', '--pack-destination', packageDir, '--json'], resolve('.'));
    assert.equal(packed.status, 0, packed.stderr || packed.stdout || packed.error?.message);
    const [manifest] = JSON.parse(packed.stdout);
    const tarball = join(packageDir, manifest.filename);

    const installed = runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], consumer);
    assert.equal(installed.status, 0, installed.stderr || installed.stdout || installed.error?.message);

    const init = runNpm(['exec', '--offline', '--', 'devland', 'init', 'exec-consumer'], consumer);
    assert.equal(init.status, 0, init.stderr || init.stdout || init.error?.message);

    const validate = runNpm(['exec', '--offline', '--', 'devland', 'validate'], consumer);
    assert.equal(validate.status, 0, validate.stderr || validate.stdout || validate.error?.message);
    assert.equal(JSON.parse(validate.stdout).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
