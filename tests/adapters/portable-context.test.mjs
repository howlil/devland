import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resolvePortableContextFromYaml } from '../../adapters/openai/chatgpt-plugin/resolve-context.mjs';
import { toPortableContext } from '../../src/context-contract.mjs';
import { resolveContext } from '../../src/runtime.mjs';
import { createValidator } from '../helpers/schema.mjs';

async function canonicalYaml() {
  const [projectYaml, stateYaml] = await Promise.all([
    readFile('.devland/project.yaml', 'utf8'),
    readFile('.devland/state.yaml', 'utf8'),
  ]);
  return { projectYaml, stateYaml };
}

test('portable context conforms to devland.context/v1', async () => {
  const context = toPortableContext(await resolveContext(
    'develop-change',
    process.cwd(),
    process.cwd(),
    { signals: ['localized'] },
  ));
  const validate = await createValidator('schemas/context.schema.json');

  assert.equal(validate(context), true, JSON.stringify(validate.errors));
  assert.equal(context.schema, 'devland.context/v1');
  assert.equal(context.execution.lane, 'rapid');
  assert.equal(context.project.path, '.devland/project.yaml');
  assert.equal(context.state.path, '.devland/state.yaml');
  assert.equal(context.state.content, undefined);
});

test('ChatGPT canonical-YAML adapter resolves the same semantics as the local runtime', async () => {
  const { projectYaml, stateYaml } = await canonicalYaml();
  const change = {
    signals: ['localized', 'reversible'],
    context: { state: true },
  };

  const local = toPortableContext(await resolveContext(
    'develop-change',
    process.cwd(),
    process.cwd(),
    change,
  ));
  const chatgpt = await resolvePortableContextFromYaml({
    projectYaml,
    stateYaml,
    workflow: 'develop-change',
    change,
  });

  assert.deepEqual(chatgpt, local);
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
