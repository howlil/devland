import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const pnpmCli = process.env.npm_execpath;

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: 'utf8' });
}

function runPnpm(args, cwd) {
  assert.equal(typeof pnpmCli, 'string', 'package-manager executable must be available under pnpm test');
  return run(process.execPath, [pnpmCli, ...args], cwd);
}

test('packed Devland installs and runs init validate and context outside the source tree', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-installed-smoke-'));
  const packageDir = join(root, 'package');
  const consumer = join(root, 'consumer');

  try {
    await mkdir(packageDir, { recursive: true });
    await mkdir(consumer, { recursive: true });
    await writeFile(join(consumer, 'package.json'), '{"name":"devland-smoke-consumer","private":true}\n');

    const packed = runPnpm(['pack', '--pack-destination', packageDir], resolve('.'));
    assert.equal(packed.status, 0, packed.stderr || packed.stdout || packed.error?.message);
    const tarballs = (await readdir(packageDir)).filter((name) => name.endsWith('.tgz'));
    assert.equal(tarballs.length, 1, `expected one package archive, got ${tarballs.join(', ')}`);
    const tarball = join(packageDir, tarballs[0]);

    const installed = runPnpm(['add', '--ignore-scripts', tarball], consumer);
    assert.equal(installed.status, 0, installed.stderr || installed.stdout || installed.error?.message);

    const bin = join(consumer, 'node_modules', 'devland', 'bin', 'devland.mjs');
    const init = run(process.execPath, [bin, 'init', 'smoke-consumer'], consumer);
    assert.equal(init.status, 0, init.stderr || init.stdout);

    const validate = run(process.execPath, [bin, 'validate'], consumer);
    assert.equal(validate.status, 0, validate.stderr || validate.stdout);
    assert.equal(JSON.parse(validate.stdout).valid, true);

    const context = run(process.execPath, [bin, 'context', 'develop-change'], consumer);
    assert.equal(context.status, 0, context.stderr || context.stdout);
    const resolved = JSON.parse(context.stdout);
    assert.equal(resolved.workflow.id, 'develop-change');

    const project = await readFile(join(consumer, '.devland', 'project.yaml'), 'utf8');
    assert.match(project, /contract: ['"]?1['"]?/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
