import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectRepositoryFacts } from '../../src/facts/repository.mjs';

function factValues(result, kind) {
  return result.facts.filter((fact) => fact.kind === kind).map((fact) => fact.value).sort();
}

test('repository facts normalize Node JavaScript and Go evidence independently from doctor categories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-facts-'));
  try {
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'src/index.mjs'), 'export const value = 1;\n');
    await writeFile(join(root, 'package.json'), JSON.stringify({ type: 'module' }));
    await writeFile(join(root, 'go.mod'), 'module example.com/service\n\ngo 1.24\n');

    const result = await collectRepositoryFacts(root);

    assert.deepEqual(factValues(result, 'language'), ['go', 'javascript']);
    assert.deepEqual(factValues(result, 'runtime'), ['go', 'node']);
    assert.equal(result.facts.find((fact) => fact.value === 'go').evidence.includes('go.mod'), true);
    assert.deepEqual(result.uncertainty, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
