import assert from 'node:assert/strict';
import test from 'node:test';
import { readText, readYaml } from '../helpers/files.mjs';
import { createValidator } from '../helpers/schema.mjs';
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

test('Devland consumes its own canonical project and state schemas', async () => {
  const projectValidate = await createValidator('schemas/project.schema.json');
  const stateValidate = await createValidator('schemas/state.schema.json');
  const project = await readYaml('.devland/project.yaml');
  const state = await readYaml('.devland/state.yaml');

  assert.equal(projectValidate(project), true, JSON.stringify(projectValidate.errors));
  assert.equal(stateValidate(state), true, JSON.stringify(stateValidate.errors));
  assert.deepEqual(project.stack, {
    languages: ['javascript'],
    frameworks: [],
    runtimes: ['node'],
    data_stores: [],
  });
  assert.equal(project.profiles.length, 0);
  assert.ok(Array.isArray(state.active_work));
  assert.ok(Array.isArray(state.blocked));
  assert.ok(Array.isArray(state.recently_completed));
  assert.ok(Array.isArray(state.open_decisions));
});

test('root AGENTS routes to canonical context without duplicating project truth', async () => {
  const agents = await readText('AGENTS.md');
  assert.match(agents, /\.devland\/project\.yaml/);
  assert.match(agents, /\.devland\/state\.yaml/);
  assert.match(agents, /repository (source|reality)/i);

  for (const duplicatedFact of ['developer-tool', 'content-first semantic core', 'agent-agnostic semantics']) {
    assert.equal(agents.includes(duplicatedFact), false, `root AGENTS duplicates canonical fact: ${duplicatedFact}`);
  }
});
