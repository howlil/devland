import assert from 'node:assert/strict';
import test from 'node:test';
import { readText } from '../helpers/files.mjs';
import { parseFrontmatter } from '../helpers/frontmatter.mjs';

const fixedFacts = [
  'ClipLingo', 'Podland', 'Wago', 'MyPaas',
  'Tauri', 'Svelte', 'Baileys', 'Caddy', 'BuildKit', 'PostgreSQL', 'SQLite',
];

test('AGENTS adapter routes to canonical state without embedding project truth', async () => {
  const text = await readText('adapters/agents-md/AGENTS.template.md');
  assert.match(text, /\.devland\/project\.yaml/);
  assert.match(text, /\.devland\/state\.yaml/);
  assert.match(text, /not an independent source of truth/i);
  for (const token of fixedFacts) {
    assert.equal(text.includes(token), false, `AGENTS template embeds fixed fact: ${token}`);
  }
});

test('OpenAI bootstrap Skill wraps Devland semantics without owning repository APIs', async () => {
  const text = await readText('adapters/openai/skills/bootstrap-project/SKILL.md');
  const { metadata, body } = parseFrontmatter(text);
  assert.equal(metadata.name, 'devland-bootstrap-project');
  assert.equal(typeof metadata.description, 'string');
  assert.ok(metadata.description.length > 20);
  assert.match(body, /bootstrap-project/);
  assert.match(body, /repository (app|tool|capability)/i);
  assert.match(body, /\.devland\/project\.yaml/);
  assert.match(body, /\.devland\/state\.yaml/);
  assert.match(body, /not canonical|not canonical storage/i);
  for (const token of ['github.', 'GitHub.create_', 'api_tool.', 'mcp.call']) {
    assert.equal(body.includes(token), false, `OpenAI Skill hard-codes tool syntax: ${token}`);
  }
});

test('generic adapter contract preserves canonical/capability boundaries', async () => {
  const text = await readText('adapters/generic/README.md');
  assert.match(text, /resolved Devland context/i);
  assert.match(text, /runtime capabilities/i);
  assert.match(text, /must preserve/i);
  assert.match(text, /must not own/i);
  assert.match(text, /canonical product facts/i);
  assert.match(text, /repository auth/i);
});
