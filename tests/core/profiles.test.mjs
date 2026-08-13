import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir } from 'node:fs/promises';
import { readText } from '../helpers/files.mjs';
import { parseFrontmatter } from '../helpers/frontmatter.mjs';

const expected = [
  'delivery/container-image.md',
  'delivery/desktop-release.md',
  'project-types/backend.md',
  'project-types/desktop.md',
  'qualities/performance-sensitive.md',
  'qualities/security-sensitive.md',
  'stacks/go.md',
  'stacks/typescript.md',
];

const kindByDir = {
  'project-types': 'project-type',
  qualities: 'quality',
  stacks: 'stack',
  delivery: 'delivery',
};

async function listProfiles() {
  const result = [];
  for (const dir of Object.keys(kindByDir)) {
    const files = await readdir(`profiles/${dir}`);
    for (const file of files.filter((name) => name.endsWith('.md'))) {
      result.push(`${dir}/${file}`);
    }
  }
  return result.sort();
}

test('v0 profile set is fixed, composable, and path-addressable', async () => {
  const files = await listProfiles();
  assert.deepEqual(files, expected);

  const seenIds = new Set();
  for (const relativePath of files) {
    const [dir, file] = relativePath.split('/');
    const stem = file.slice(0, -3);
    const { metadata, body } = parseFrontmatter(await readText(`profiles/${relativePath}`));
    const expectedId = `${dir}.${stem}`;

    assert.equal(metadata.id, expectedId);
    assert.equal(metadata.kind, kindByDir[dir]);
    assert.equal(seenIds.has(metadata.id), false, `duplicate profile id: ${metadata.id}`);
    seenIds.add(metadata.id);
    assert.match(body, /^# .+/m);
    assert.match(body, /^## Guidance$/m);
    assert.equal(body.includes('## Required'), false);
    assert.equal(body.includes('## Defaults'), false);
  }
});
