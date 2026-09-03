import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { requiresPackageSmoke } from '../../scripts/ci-scope.mjs';

test('semantic and repository-only changes do not pay package-install smoke cost', () => {
  for (const path of [
    'README.md',
    'docs/release-policy.md',
    'AGENTS.md',
    'tests/core/v1-develop-change.test.mjs',
    'src/runtime.mjs',
    'core/workflows/develop-change.md',
    'profiles/qualities/security-sensitive.md',
    'schemas/project.schema.json',
    'adapters/agents-md/AGENTS.template.md',
  ]) {
    assert.equal(requiresPackageSmoke([path]), false, path);
  }
});

test('package and installed-CLI boundaries require package smoke', () => {
  for (const path of [
    'package.json',
    'pnpm-lock.yaml',
    'bin/devland.mjs',
    'templates/project.yaml',
  ]) {
    assert.equal(requiresPackageSmoke([path]), true, path);
  }
});

test('CI classifier and release contract changes force their own package smoke verification', () => {
  assert.equal(requiresPackageSmoke(['.github/workflows/ci.yml']), true);
  assert.equal(requiresPackageSmoke(['.github/workflows/release.yml']), true);
  assert.equal(requiresPackageSmoke(['scripts/ci-scope.mjs']), true);
});

test('CI scope CLI emits a GitHub Actions output assignment', () => {
  const cheapResult = spawnSync(process.execPath, ['scripts/ci-scope.mjs'], {
    input: 'README.md\nsrc/runtime.mjs\n',
    encoding: 'utf8',
  });
  assert.equal(cheapResult.status, 0, cheapResult.stderr);
  assert.equal(cheapResult.stdout, 'package_smoke=false\n');

  const packageResult = spawnSync(process.execPath, ['scripts/ci-scope.mjs'], {
    input: 'README.md\npackage.json\n',
    encoding: 'utf8',
  });
  assert.equal(packageResult.status, 0, packageResult.stderr);
  assert.equal(packageResult.stdout, 'package_smoke=true\n');
});
