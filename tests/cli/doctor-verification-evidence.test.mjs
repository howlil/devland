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

test('doctor reports claimed-done work without verification evidence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-doctor-evidence-'));
  try {
    await mkdir(join(root, '.devland'), { recursive: true });
    await writeFile(join(root, '.devland/project.yaml'), `schema: devland.project/v0\ndevland:\n  contract: "1"\nproject:\n  name: fixture\n  types: []\nproduct:\n  purpose: test\n  priorities: []\n  non_goals: []\nplatforms: []\nstack:\n  languages: []\n  frameworks: []\n  runtimes: []\n  data_stores: []\narchitecture:\n  style: null\n  document: null\nqualities: []\nprofiles: []\ndelivery:\n  model: null\nconstraints: []\n`);
    await writeFile(join(root, '.devland/state.yaml'), `schema: devland.state/v0\nactive_work: []\nblocked: []\nrecently_completed:\n  - id: completed-without-evidence\n    kind: maintenance\n    status: done\n    goal: prove completion claims require evidence\n    scope:\n      allowed: []\n      excluded: []\n    acceptance:\n      - change is verified\n    artifacts:\n      spec: null\n      plan: null\n      evidence: []\n    branch: null\n    pull_request: null\nopen_decisions: []\n`);

    const result = run(['doctor'], root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    const check = output.checks.find((candidate) => candidate.category === 'missing verification evidence for claimed-done work');
    assert.equal(check?.status, 'findings');
    assert.ok(output.findings.some((finding) =>
      finding.category === 'missing verification evidence for claimed-done work' &&
      finding.canonical === 'completed-without-evidence'
    ));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
