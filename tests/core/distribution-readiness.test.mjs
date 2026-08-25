import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';

async function read(path) {
  return readFile(path, 'utf8');
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test('package metadata is OSS-ready while npm publication remains intentionally private', async () => {
  const pkg = JSON.parse(await read('package.json'));

  assert.equal(pkg.version, '0.2.0');
  assert.equal(pkg.private, true);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.engines?.node, '>=22');
  assert.match(pkg.packageManager ?? '', /^pnpm@11\.21\.0$/);
  assert.equal(pkg.dependencies?.ajv !== undefined, true, 'ajv must be a runtime dependency');
  assert.equal(pkg.dependencies?.yaml !== undefined, true, 'yaml must be a runtime dependency');
  assert.equal(pkg.devDependencies?.ajv, undefined);
  assert.equal(pkg.devDependencies?.yaml, undefined);
  assert.match(pkg.description ?? '', /engineering|context|diagnostic/i);
  assert.equal(pkg.repository?.type, 'git');
  assert.equal(pkg.repository?.url, 'git+https://github.com/howlil/devland.git');
  assert.equal(pkg.homepage, 'https://github.com/howlil/devland#readme');
  assert.equal(pkg.bugs?.url, 'https://github.com/howlil/devland/issues');
  assert.equal(Array.isArray(pkg.keywords), true);
  assert.equal(Array.isArray(pkg.files), true);
  for (const required of ['bin/', 'src/', 'core/', 'profiles/', 'schemas/', 'templates/', 'adapters/']) {
    assert.equal(pkg.files.includes(required), true, `package files missing ${required}`);
  }
});

test('pnpm is the canonical reproducible package manager', async () => {
  assert.equal(await exists('pnpm-lock.yaml'), true, 'pnpm lockfile is required');
  assert.equal(await exists('package-lock.json'), false, 'npm lockfile must be removed after migration');

  const ci = await read('.github/workflows/ci.yml');
  const crossPlatform = await read('.github/workflows/cross-platform.yml');
  for (const workflow of [ci, crossPlatform]) {
    assert.match(workflow, /corepack enable/);
    assert.match(workflow, /pnpm install --frozen-lockfile/);
    assert.match(workflow, /pnpm test/);
    assert.doesNotMatch(workflow, /npm ci|npm test/);
  }
});

test('repository exposes the minimal OSS contribution surface', async () => {
  for (const path of [
    'LICENSE',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'SECURITY.md',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/ISSUE_TEMPLATE/config.yml',
  ]) {
    assert.equal(await exists(path), true, `missing OSS repository file: ${path}`);
  }
});

test('README exposes deterministic initialization and migration commands', async () => {
  const readme = await read('README.md');

  assert.match(readme, /devland init <project-name>/);
  assert.match(readme, /devland migrate/);
  assert.match(readme, /refus(?:e|es).*overwrite/i);
  assert.match(readme, /contract 1|contract `?1`?/i);
});

test('tagged releases are gated and produce a downloadable package archive', async () => {
  const workflow = await read('.github/workflows/release.yml');

  assert.match(workflow, /tags:/);
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /macos-latest/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /pnpm pack/);
  assert.match(workflow, /gh release create/);
  assert.match(workflow, /Tag .* does not match package version/);
});

test('release policy separates source licensing, package publication, and behavioral compatibility', async () => {
  const policy = await read('docs/release-policy.md');

  assert.match(policy, /MIT License/i);
  assert.match(policy, /devland\.contract/);
  assert.match(policy, /package version/i);
  assert.match(policy, /breaking/i);
  assert.match(policy, /migration/i);
  assert.match(policy, /private.*true|private: true/i);
  assert.match(policy, /do not publish|must not publish|publishing.*blocked/i);
  assert.match(policy, /GitHub Release/i);
});
