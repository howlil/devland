import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveContext } from '../../src/runtime.mjs';

function policy(context, id) {
  return context.policies.find((entry) => entry.id === id);
}

test('rapid context keeps state and secondary policies reference-only', async () => {
  const context = await resolveContext('develop-change', process.cwd(), process.cwd(), {
    signals: ['localized', 'reversible'],
  });

  assert.equal(context.state.path, '.devland/state.yaml');
  assert.equal(context.state.content, undefined);
  assert.equal(typeof policy(context, 'core.engineering').content, 'string');
  assert.equal(typeof policy(context, 'core.testing').content, 'string');
  assert.equal(typeof policy(context, 'core.verification').content, 'string');
  assert.equal(policy(context, 'core.dependencies').content, undefined);
  assert.equal(policy(context, 'core.git').content, undefined);
  assert.match(context.workflow.content, /^## Rapid path/m);
  assert.doesNotMatch(context.workflow.content, /^## Procedure/m);
});

test('state content is hydrated only when current-work context is explicitly requested', async () => {
  const context = await resolveContext('develop-change', process.cwd(), process.cwd(), {
    signals: ['localized'],
    context: { state: true },
  });

  assert.equal(context.state.content.schema, 'devland.state/v0');
  assert.match(context.workflow.content, /^## Rapid path/m);
});

test('full context preference restores complete state, policies, and workflow', async () => {
  const context = await resolveContext('develop-change', process.cwd(), process.cwd(), {
    signals: ['localized'],
    context: { full: true },
  });

  assert.equal(context.state.content.schema, 'devland.state/v0');
  assert.equal(context.policies.every((entry) => typeof entry.content === 'string'), true);
  assert.match(context.workflow.content, /^## Procedure/m);
  assert.match(context.workflow.content, /^## Rapid path/m);
});

test('guided and deliberate lanes retain full policy and workflow guidance', async () => {
  for (const signals of [['schema-change'], ['security-boundary']]) {
    const context = await resolveContext('develop-change', process.cwd(), process.cwd(), { signals });
    assert.equal(context.policies.every((entry) => typeof entry.content === 'string'), true);
    assert.match(context.workflow.content, /^## Procedure/m);
    assert.equal(context.state.content, undefined);
  }
});

test('rapid context is materially smaller than full context without dropping canonical references', async () => {
  const rapid = await resolveContext('develop-change', process.cwd(), process.cwd(), {
    signals: ['localized', 'reversible'],
  });
  const full = await resolveContext('develop-change', process.cwd(), process.cwd(), {
    signals: ['localized', 'reversible'],
    context: { full: true },
  });

  const rapidBytes = Buffer.byteLength(JSON.stringify(rapid));
  const fullBytes = Buffer.byteLength(JSON.stringify(full));

  assert.ok(rapidBytes < fullBytes * 0.7, `expected rapid ${rapidBytes}B to be <70% of full ${fullBytes}B`);
  assert.equal(rapid.project.path, full.project.path);
  assert.equal(rapid.state.path, full.state.path);
  assert.deepEqual(rapid.policies.map((entry) => entry.id), full.policies.map((entry) => entry.id));
});
