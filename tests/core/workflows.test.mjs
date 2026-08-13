import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir } from 'node:fs/promises';
import { readText, readYaml } from '../helpers/files.mjs';
import { parseFrontmatter } from '../helpers/frontmatter.mjs';

const workflowDir = 'core/workflows';
const expectedFiles = ['bootstrap-project.md', 'develop-change.md', 'doctor-project.md'];
const forbiddenToolSyntax = ['github.', 'GitHub.create_', 'gitlab.', 'mcp.call', 'api_tool.'];

test('workflows are capability-aware and vendor-neutral', async () => {
  const vocabulary = await readYaml('core/capabilities.yaml');
  assert.equal(vocabulary.schema, 'devland.capabilities/v0');
  const capabilities = new Set(vocabulary.capabilities);
  assert.equal(capabilities.size, vocabulary.capabilities.length);

  const files = (await readdir(workflowDir)).filter((name) => name.endsWith('.md')).sort();
  assert.deepEqual(files, expectedFiles);

  for (const file of files) {
    const { metadata, body } = parseFrontmatter(await readText(`${workflowDir}/${file}`));
    assert.equal(metadata.id, file.slice(0, -3));
    assert.ok(Array.isArray(metadata.requires));
    assert.ok(Array.isArray(metadata.optional));

    const required = new Set(metadata.requires);
    const optional = new Set(metadata.optional);
    for (const capability of [...required, ...optional]) {
      assert.equal(capabilities.has(capability), true, `${file} uses unknown capability ${capability}`);
    }
    for (const capability of required) {
      assert.equal(optional.has(capability), false, `${file} duplicates ${capability} across requires/optional`);
    }

    for (const token of forbiddenToolSyntax) {
      assert.equal(body.includes(token), false, `${file} hard-codes vendor tool syntax: ${token}`);
    }
    assert.match(body, /^## Procedure$/m);
    assert.match(body, /^## Stop conditions$/m);
    assert.match(body, /^## Outputs$/m);
  }
});

test('canonical writes guard against active branches that predate Devland bootstrap', async () => {
  const bootstrap = (parseFrontmatter(await readText(`${workflowDir}/bootstrap-project.md`))).body;
  const develop = (parseFrontmatter(await readText(`${workflowDir}/develop-change.md`))).body;

  assert.match(bootstrap, /branch ancestry|branch point|predates? .*bootstrap/i);
  assert.match(bootstrap, /reconcile .*base|reconcile .*canonical|avoid .*add\/add/i);
  assert.match(develop, /branch ancestry|branch point|predates? .*bootstrap/i);
  assert.match(develop, /reconcile .*base|reconcile .*canonical|avoid .*add\/add/i);
});
