import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir } from 'node:fs/promises';
import { readText } from '../helpers/files.mjs';
import { parseFrontmatter } from '../helpers/frontmatter.mjs';

const policyDir = 'core/policies';
const expectedFiles = [
  'dependencies.md',
  'documentation.md',
  'engineering.md',
  'git.md',
  'security.md',
  'testing.md',
  'verification.md',
];

const leakageTokens = [
  'Named Pipe',
  'CTranslate2',
  'Baileys',
  'Caddy',
  'BuildKit',
  'Svelte',
  'React',
  'PostgreSQL',
  'SQLite',
  'Rust owns',
  'Docker socket',
  'ClipLingo',
  'Podland',
  'Wago',
  'MyPaas',
];

test('core policy set is fixed and has valid metadata without project leakage', async () => {
  const files = (await readdir(policyDir)).filter((name) => name.endsWith('.md')).sort();
  assert.deepEqual(files, expectedFiles);

  for (const file of files) {
    const { metadata, body } = parseFrontmatter(await readText(`${policyDir}/${file}`));
    const stem = file.slice(0, -3);
    assert.equal(metadata.id, `core.${stem}`);
    assert.equal(metadata.scope, 'core');
    assert.match(body, /^## (Required|Defaults)$/m);

    for (const token of leakageTokens) {
      assert.equal(body.includes(token), false, `${file} leaks project-specific token: ${token}`);
    }
  }
});
