import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { requiresPackageSmoke } from '../../scripts/ci-scope.mjs';

test('docs and repository-only metadata do not require package smoke', () => {
  assert.equal(requiresPackageSmoke([
    'README.md',
    'docs/release-policy.md',
    'AGENTS.md',
    'tests/core/v1-develop-change.test.mjs',
  ]), false);
});

test('shipped runtime and semantic package paths require package smoke', () => {
  for (const path of [
    'package.json',
    'pnpm-lock.yaml',
    'bin/devland.mjs',
    'src/runtime.mjs',
    'core/workflows/develop-change.md',
    'profiles/qualities/security-sensitive.md',
    'schemas/project.schema.json',
    'templates/project.yaml',
    'adapters/agents-md/AGENTS.template.md',
  ]) {
    assert.equal(requiresPackageSmoke([path]), true, path);
  }
});

test('CI classifier changes force their own package smoke verification', () => {
  assert.equal(requiresPackageSmoke(['.github/workflows/ci.yml']), true);
  assert.equal(requiresPackageSmoke(['scripts/ci-scope.mjs']), true);
});

test('CI scope CLI emits a GitHub Actions output assignment', () => {
  const result = spawnSync(process.execPath, ['scripts/ci-scope.mjs'], {
    input: 'README.md\nsrc/runtime.mjs\n',
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'package_smoke=true\n');
});
