import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { classifyChange } from '../../src/change.mjs';
import { resolveContext } from '../../src/runtime.mjs';

const cliPath = resolve('bin/devland.mjs');

test('localized reversible changes stay rapid without expanding profiles', async () => {
  const change = { signals: ['localized', 'reversible'] };
  const context = await resolveContext('develop-change', process.cwd(), process.cwd(), change);

  assert.deepEqual(context.execution, {
    lane: 'rapid',
    signals: ['localized', 'reversible'],
  });
  assert.equal(context.profiles.some((profile) => profile.id === 'qualities.security-sensitive'), false);
});

test('guided change signals raise ceremony without unrelated profile expansion', async () => {
  const result = classifyChange({ signals: ['schema-change', 'multi-module'] });
  assert.deepEqual(result, {
    lane: 'guided',
    signals: ['multi-module', 'schema-change'],
  });
});

test('security boundary changes are deliberate and activate reusable security guidance', async () => {
  const context = await resolveContext(
    'develop-change',
    process.cwd(),
    process.cwd(),
    { signals: ['security-boundary'] },
  );

  assert.equal(context.execution.lane, 'deliberate');
  assert.deepEqual(context.execution.signals, ['security-boundary']);
  assert.equal(context.profiles.some((profile) => profile.id === 'qualities.security-sensitive'), true);
});

test('the highest material risk wins when signals are mixed', () => {
  const result = classifyChange({ signals: ['localized', 'schema-change', 'data-loss-risk'] });
  assert.equal(result.lane, 'deliberate');
  assert.deepEqual(result.signals, ['data-loss-risk', 'localized', 'schema-change']);
});

test('unknown change signals fail explicitly rather than being ignored', () => {
  assert.throws(
    () => classifyChange({ signals: ['mystery-risk'] }),
    /unknown change signal.*mystery-risk/i,
  );
});

test('context CLI accepts transient change metadata without persisting it to canonical state', () => {
  const descriptor = JSON.stringify({ signals: ['security-boundary'] });
  const result = spawnSync(process.execPath, [cliPath, 'context', 'develop-change', descriptor], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.execution.lane, 'deliberate');
  assert.equal(output.profiles.some((profile) => profile.id === 'qualities.security-sensitive'), true);
  assert.equal(output.project.content.change, undefined);
});
