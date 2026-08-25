import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test('package manifest includes the executable runtime contract', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const includedRoots = new Set(pkg.files ?? []);

  for (const requiredRoot of ['bin/', 'src/', 'core/', 'profiles/', 'schemas/', 'templates/', 'adapters/']) {
    assert.equal(includedRoots.has(requiredRoot), true, `package files missing ${requiredRoot}`);
  }

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
    assert.equal(await exists(required), true, `package source missing ${required}`);
  }
});
