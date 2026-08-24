import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveContext } from '../../src/runtime.mjs';

test('develop-change resolves only its declared baseline core policies', async () => {
  const context = await resolveContext('develop-change');
  const policyIds = context.policies.map((policy) => policy.id).sort();

  assert.deepEqual(policyIds, [
    'core.dependencies',
    'core.engineering',
    'core.git',
    'core.testing',
    'core.verification',
  ]);
  assert.equal(policyIds.includes('core.documentation'), false);
  assert.equal(policyIds.includes('core.security'), false);
});

test('context resolution rejects workflow policy declarations that cannot be resolved', async () => {
  const devlandRoot = await mkdtemp(join(tmpdir(), 'devland-core-'));
  try {
    await mkdir(join(devlandRoot, 'schemas'), { recursive: true });
    await mkdir(join(devlandRoot, 'core/workflows'), { recursive: true });
    await mkdir(join(devlandRoot, 'core/policies'), { recursive: true });
    await copyFile('schemas/project.schema.json', join(devlandRoot, 'schemas/project.schema.json'));
    await copyFile('schemas/state.schema.json', join(devlandRoot, 'schemas/state.schema.json'));
    await writeFile(join(devlandRoot, 'core/workflows/missing-policy.md'), `---
id: missing-policy
policies:
  - core.missing
---
# Missing Policy Workflow
`);

    await assert.rejects(
      () => resolveContext('missing-policy', process.cwd(), devlandRoot),
      /core\.missing|declared policy|unknown policy/i,
    );
  } finally {
    await rm(devlandRoot, { recursive: true, force: true });
  }
});
