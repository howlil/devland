import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resolvePortableContextFromYaml } from '../../adapters/openai/chatgpt-plugin/resolve-context.mjs';
import { toPortableContext } from '../../src/context-contract.mjs';
import { resolveContext } from '../../src/runtime.mjs';
import { createValidator } from '../helpers/schema.mjs';

const transientWork = {
  id: 'work-transient-context',
  intent: 'Keep requirement intent attached to the resolved agent context',
  acceptance: [
    'resolved context includes the supplied transient work envelope',
    'canonical state remains unchanged and independently hydrated',
  ],
  scope: {
    allowed: ['src/runtime.mjs', 'adapters/openai/chatgpt-plugin'],
    excluded: ['task management'],
  },
  expected_outcome: 'agents receive stable intent and acceptance boundaries without persistent task state',
};

const transientVerification = {
  criticality: 'behavioral',
  failure_modes: ['adapter drops transient verification intent'],
  boundary: 'integration',
  cost: 'moderate',
  reason: 'adapter parity is the affected interaction boundary',
};

async function canonicalYaml() {
  const [projectYaml, stateYaml] = await Promise.all([
    readFile('.devland/project.yaml', 'utf8'),
    readFile('.devland/state.yaml', 'utf8'),
  ]);
  return { projectYaml, stateYaml };
}

test('transient work schema accepts the minimal contract and rejects empty acceptance', async () => {
  const validate = await createValidator('schemas/work.schema.json');

  assert.equal(validate({
    id: 'work-123',
    intent: 'Fix session expiry handling',
    acceptance: ['expired sessions are rejected'],
  }), true, JSON.stringify(validate.errors));

  assert.equal(validate({
    id: 'work-123',
    intent: 'Fix session expiry handling',
    acceptance: [],
  }), false);
});

test('portable context conforms to devland.context/v1 with optional verification selection', async () => {
  const context = toPortableContext(await resolveContext(
    'develop-change',
    process.cwd(),
    process.cwd(),
    { signals: ['localized'], verification: transientVerification },
  ));
  const validate = await createValidator('schemas/context.schema.json');

  assert.equal(validate(context), true, JSON.stringify(validate.errors));
  assert.equal(context.schema, 'devland.context/v1');
  assert.equal(context.execution.lane, 'rapid');
  assert.equal(context.project.path, '.devland/project.yaml');
  assert.equal(context.state.path, '.devland/state.yaml');
  assert.equal(context.state.content, undefined);
  assert.equal(context.work, undefined);
  assert.deepEqual(context.verification, {
    ...transientVerification,
    diagnostics: [],
  });
});

test('portable context carries validated transient work without hydrating canonical state', async () => {
  const context = toPortableContext(await resolveContext(
    'develop-change',
    process.cwd(),
    process.cwd(),
    { signals: ['localized'] },
    transientWork,
  ));
  const validate = await createValidator('schemas/context.schema.json');

  assert.equal(validate(context), true, JSON.stringify(validate.errors));
  assert.deepEqual(context.work, transientWork);
  assert.equal(context.state.content, undefined);
});

test('runtime rejects an invalid transient work envelope', async () => {
  await assert.rejects(
    resolveContext(
      'develop-change',
      process.cwd(),
      process.cwd(),
      { signals: ['localized'] },
      { id: 'work-invalid', intent: 'Missing acceptance', acceptance: [] },
    ),
    /Transient work is invalid/,
  );
});

test('ChatGPT canonical-YAML adapter resolves the same semantics as the local runtime', async () => {
  const { projectYaml, stateYaml } = await canonicalYaml();
  const change = {
    signals: ['localized', 'reversible'],
    context: { state: true },
    verification: transientVerification,
  };

  const local = toPortableContext(await resolveContext(
    'develop-change',
    process.cwd(),
    process.cwd(),
    change,
    transientWork,
  ));
  const chatgpt = await resolvePortableContextFromYaml({
    projectYaml,
    stateYaml,
    workflow: 'develop-change',
    change,
    work: transientWork,
  });

  assert.deepEqual(chatgpt, local);
  assert.deepEqual(chatgpt.work, transientWork);
  assert.deepEqual(chatgpt.verification, {
    ...transientVerification,
    diagnostics: [],
  });
  assert.equal(chatgpt.state.content.schema, 'devland.state/v0');
});

test('ChatGPT adapter rejects invalid canonical state through the normal Devland validator', async () => {
  const { projectYaml } = await canonicalYaml();

  await assert.rejects(
    resolvePortableContextFromYaml({
      projectYaml,
      stateYaml: 'schema: devland.state/v0\nactive_work: invalid\n',
    }),
    /Canonical context is invalid/,
  );
});

test('tool-only ChatGPT MCP server is syntactically valid without loading adapter dependencies', () => {
  const result = spawnSync(process.execPath, [
    '--check',
    'adapters/openai/chatgpt-plugin/server.mjs',
  ], { encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('OpenAI develop-change Skill keeps canonical memory and repository capability boundaries explicit', async () => {
  const text = await readFile('adapters/openai/skills/develop-change/SKILL.md', 'utf8');

  assert.match(text, /devland\.context\/v1/);
  assert.match(text, /\.devland\/project\.yaml/);
  assert.match(text, /\.devland\/state\.yaml/);
  assert.match(text, /conversation.*transient|transient working context/is);
  assert.match(text, /repository access and authorization remain external/i);
});
