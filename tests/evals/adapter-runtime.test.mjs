import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { projectAdapterContext } from '../../src/adapters/projection.mjs';
import { evaluateAdapterParity } from '../../src/evals/adapters.mjs';
import { resolveContext } from '../../src/runtime.mjs';

const cliPath = resolve('bin/devland.mjs');

async function deliberateContext() {
  return resolveContext(
    'develop-change',
    process.cwd(),
    process.cwd(),
    { signals: ['security-boundary'] },
  );
}

test('generic and AGENTS adapter paths preserve the same resolved engineering semantics', async () => {
  const context = await deliberateContext();
  const capabilities = ['repository.read', 'ci.read'];
  const generic = projectAdapterContext('generic', context, capabilities);
  const agents = projectAdapterContext('agents-md', context, capabilities);

  assert.deepEqual(generic.semantic, agents.semantic);
  assert.deepEqual(generic.capabilities, agents.capabilities);
  assert.equal(generic.semantic.execution.lane, 'deliberate');
  assert.equal(generic.semantic.execution.budget.analysis, 'deliberate');
  assert.equal(generic.semantic.execution.budget.verification, 'strong');
  assert.equal(generic.semantic.profiles.includes('qualities.security-sensitive'), true);
  assert.equal(generic.semantic.canonical.project, '.devland/project.yaml');
  assert.equal(generic.semantic.canonical.state, '.devland/state.yaml');
  assert.equal(generic.route, 'adapters/generic/README.md');
  assert.equal(agents.route, 'adapters/agents-md/AGENTS.template.md');
});

test('adapter projections keep canonical contents out of duplicated adapter payloads', async () => {
  const context = await deliberateContext();
  const projection = projectAdapterContext('agents-md', context, []);
  const serialized = JSON.stringify(projection);

  assert.equal(serialized.includes(context.project.content.product.purpose), false);
  assert.equal(serialized.includes(context.workflow.content), false);
  assert.equal(Object.hasOwn(projection.semantic, 'project_content'), false);
});

test('adapter parity eval reports reproducible context size and semantic parity', async () => {
  const context = await deliberateContext();
  const report = evaluateAdapterParity(context, ['generic', 'agents-md'], ['repository.read']);

  assert.equal(report.status, 'pass');
  assert.equal(report.adapters.length, 2);
  assert.equal(report.failures.length, 0);
  assert.equal(report.adapters.every((adapter) => Number.isInteger(adapter.context_bytes) && adapter.context_bytes > 0), true);
  assert.deepEqual(report.semantic.execution, {
    lane: 'deliberate',
    signals: ['security-boundary'],
    budget: {
      analysis: 'deliberate',
      context: 'risk-expanded',
      verification: 'strong',
    },
  });
});

test('unknown adapter paths fail instead of silently changing semantics', async () => {
  const context = await deliberateContext();
  assert.throws(() => projectAdapterContext('mystery-runtime', context, []), /unknown devland adapter/i);
});

test('devland eval adapters executes the same representative change across two adapter paths', () => {
  const descriptor = JSON.stringify({ signals: ['security-boundary'] });
  const result = spawnSync(process.execPath, [cliPath, 'eval', 'adapters', descriptor], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, 'pass');
  assert.deepEqual(output.adapters.map((adapter) => adapter.id).sort(), ['agents-md', 'generic']);
  assert.equal(output.semantic.execution.lane, 'deliberate');
  assert.equal(output.semantic.execution.budget.context, 'risk-expanded');
});
