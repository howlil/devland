import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cliPath = resolve('bin/devland.mjs');

function run(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd, encoding: 'utf8' });
}

async function writeCanonical(root, architectureDocument = null) {
  await mkdir(join(root, '.devland'), { recursive: true });
  await writeFile(join(root, '.devland/project.yaml'), `schema: devland.project/v0
project:
  name: fixture
  types: []
product:
  purpose: test
  priorities: []
  non_goals: []
platforms: []
stack:
  languages: []
  frameworks: []
  runtimes: []
  data_stores: []
architecture:
  style: null
  document: ${architectureDocument === null ? 'null' : architectureDocument}
qualities: []
profiles: []
delivery:
  model: null
constraints: []
`);
  await writeFile(join(root, '.devland/state.yaml'), `schema: devland.state/v0
active_work: []
blocked: []
recently_completed: []
open_decisions: []
`);
}

test('doctor reports deterministic Node and JavaScript stack drift', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-doctor-stack-'));
  try {
    await writeCanonical(root);
    await mkdir(join(root, 'src'));
    await writeFile(join(root, 'src/index.mjs'), 'export const value = 1;\n');
    await writeFile(join(root, 'package.json'), JSON.stringify({ type: 'module', bin: { fixture: './src/index.mjs' } }));

    const result = run(['doctor'], root);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.ok(output.findings.some((finding) =>
      finding.category === 'stack/runtime drift' &&
      finding.observed.includes('node') &&
      finding.evidence.includes('package.json')
    ));
    assert.ok(output.findings.some((finding) =>
      finding.category === 'stack/runtime drift' && finding.observed.includes('javascript')
    ));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('doctor reports missing referenced architecture documents', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-doctor-doc-'));
  try {
    await writeCanonical(root, 'docs/architecture.md');

    const result = run(['doctor'], root);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.ok(output.findings.some((finding) =>
      finding.category === 'invalid/missing referenced files' &&
      finding.evidence.includes('docs/architecture.md')
    ));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
