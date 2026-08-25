import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function read(path) {
  return readFile(path, 'utf8');
}

test('package metadata is runtime-correct while distribution remains intentionally private', async () => {
  const pkg = JSON.parse(await read('package.json'));

  assert.equal(pkg.private, true);
  assert.equal(pkg.engines?.node, '>=22');
  assert.equal(pkg.dependencies?.ajv !== undefined, true, 'ajv must be a runtime dependency');
  assert.equal(pkg.dependencies?.yaml !== undefined, true, 'yaml must be a runtime dependency');
  assert.equal(pkg.devDependencies?.ajv, undefined);
  assert.equal(pkg.devDependencies?.yaml, undefined);
  assert.match(pkg.description ?? '', /engineering|context|feedback/i);
  assert.equal(pkg.repository?.type, 'git');
  assert.equal(pkg.repository?.url, 'git+https://github.com/howlil/devland.git');
  assert.equal(Array.isArray(pkg.files), true);
  for (const required of ['bin/', 'src/', 'core/', 'profiles/', 'schemas/', 'templates/', 'adapters/']) {
    assert.equal(pkg.files.includes(required), true, `package files missing ${required}`);
  }
});

test('README exposes deterministic initialization and migration commands', async () => {
  const readme = await read('README.md');

  assert.match(readme, /devland init <project-name>/);
  assert.match(readme, /devland migrate/);
  assert.match(readme, /refus(?:e|es).*overwrite/i);
  assert.match(readme, /contract 1|contract `?1`?/i);
});

test('release policy separates package versions from behavioral contracts and keeps publishing gated', async () => {
  const policy = await read('docs/release-policy.md');

  assert.match(policy, /devland\.contract/);
  assert.match(policy, /package version/i);
  assert.match(policy, /breaking/i);
  assert.match(policy, /migration/i);
  assert.match(policy, /private.*true|private: true/i);
  assert.match(policy, /license/i);
  assert.match(policy, /do not publish|must not publish|publishing.*blocked/i);
});
