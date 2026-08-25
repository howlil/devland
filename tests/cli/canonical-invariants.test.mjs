import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { resolveContext, validateCanonical } from '../../src/runtime.mjs';

async function withCanonical(mutator, fn) {
  const root = await mkdtemp(join(tmpdir(), 'devland-invariants-'));
  try {
    await mkdir(join(root, '.devland'), { recursive: true });
    const project = YAML.parse(await readFile('.devland/project.yaml', 'utf8'));
    const state = YAML.parse(await readFile('.devland/state.yaml', 'utf8'));
    await mutator(project, state);
    await writeFile(join(root, '.devland/project.yaml'), YAML.stringify(project));
    await writeFile(join(root, '.devland/state.yaml'), YAML.stringify(state));
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('validate rejects duplicate work ids across canonical state buckets', async () => {
  await withCanonical(async (_project, state) => {
    state.active_work.push({ id: 'duplicate-work', status: 'active', goal: 'Exercise duplicate detection.' });
    state.blocked.push({ id: 'duplicate-work', status: 'blocked', goal: 'Exercise duplicate detection.' });
  }, async (root) => {
    const result = await validateCanonical(root);
    assert.equal(result.valid, false);
    assert.equal(result.errors.some((error) => /duplicate work id/i.test(error.message)), true, JSON.stringify(result.errors));
  });
});

test('validate rejects work status that contradicts its state bucket', async () => {
  await withCanonical(async (_project, state) => {
    state.active_work.push({ id: 'contradictory-active-work', status: 'done', goal: 'Exercise bucket status validation.' });
  }, async (root) => {
    const result = await validateCanonical(root);
    assert.equal(result.valid, false);
    assert.equal(result.errors.some((error) => /active_work.*status|status.*active_work/i.test(error.message)), true, JSON.stringify(result.errors));
  });
});

test('context rejects an explicit profile id that is not installed', async () => {
  await withCanonical(async (project) => {
    project.profiles.push('qualities.missing-profile');
  }, async (root) => {
    await assert.rejects(
      () => resolveContext('develop-change', root),
      /explicit profile|missing-profile|unknown profile/i,
    );
  });
});
