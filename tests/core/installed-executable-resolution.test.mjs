import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';

test('package exposes the devland executable contract', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(pkg.bin?.devland, './bin/devland.mjs');
  await access('bin/devland.mjs');
});
