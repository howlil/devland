import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveContext } from '../../src/runtime.mjs';
import { createValidator } from '../helpers/schema.mjs';

const root = process.cwd();

function change(verification, signals = ['localized']) {
  return { signals, verification };
}

test('verification descriptor accepts the compact supported contract', async () => {
  const validate = await createValidator('schemas/verification.schema.json');
  const selection = {
    criticality: 'critical',
    failure_modes: ['expired session remains authorized'],
    boundary: 'function',
    cost: 'cheap',
    reason: 'focused deterministic auth regression is the cheapest trustworthy proof',
  };

  assert.equal(validate(selection), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...selection, failure_modes: [] }), false);
  assert.equal(validate({ ...selection, boundary: 'unit-first' }), false);
});

test('resolved context keeps a sufficient focused selection compact', async () => {
  const context = await resolveContext('develop-change', root, root, change({
    criticality: 'critical',
    failure_modes: ['critical calculation returns the wrong result'],
    boundary: 'function',
    cost: 'cheap',
  }));

  assert.deepEqual(context.verification, {
    criticality: 'critical',
    failure_modes: ['critical calculation returns the wrong result'],
    boundary: 'function',
    cost: 'cheap',
    diagnostics: [],
  });
});

test('integration verification is accepted as the first proof without a unit-test requirement', async () => {
  const context = await resolveContext('develop-change', root, root, change({
    criticality: 'behavioral',
    failure_modes: ['filesystem and resolver interaction loses the supplied work contract'],
    boundary: 'integration',
    cost: 'moderate',
  }, ['multi-module']));

  assert.equal(context.verification.boundary, 'integration');
  assert.deepEqual(context.verification.diagnostics, []);
});

test('material risk reconciles understated criticality and static-only proof as warnings', async () => {
  const context = await resolveContext('develop-change', root, root, change({
    criticality: 'peripheral',
    failure_modes: ['authorization boundary accepts an invalid decision'],
    boundary: 'static',
    cost: 'cheap',
  }, ['security-boundary']));

  assert.deepEqual(
    context.verification.diagnostics.map((entry) => entry.code),
    ['criticality-understates-risk', 'insufficient-verification-boundary'],
  );
  assert.equal(context.execution.lane, 'deliberate');
});

test('unjustified peripheral journey verification is surfaced without becoming a hard gate', async () => {
  const context = await resolveContext('develop-change', root, root, change({
    criticality: 'peripheral',
    failure_modes: ['minor presentation behavior differs'],
    boundary: 'journey',
    cost: 'expensive',
  }));

  assert.deepEqual(
    context.verification.diagnostics.map((entry) => entry.code),
    ['over-verification', 'expensive-rapid-verification'],
  );
});

test('existing context resolution remains unchanged when verification is omitted', async () => {
  const context = await resolveContext('develop-change', root, root, { signals: ['localized'] });

  assert.equal(context.verification, undefined);
});

test('invalid verification selection is rejected before a completion claim can rely on it', async () => {
  await assert.rejects(
    () => resolveContext('develop-change', root, root, change({
      criticality: 'critical',
      failure_modes: [],
      boundary: 'function',
      cost: 'cheap',
    })),
    /Verification selection is invalid/,
  );
});
