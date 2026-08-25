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

test('doctor explains why each unevaluated category is not covered', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devland-doctor-coverage-reason-'));
  try {
    await mkdir(join(root, '.devland'), { recursive: true });
    await writeFile(join(root, '.devland/project.yaml'), `schema: devland.project/v0\ndevland:\n  contract: "1"\nproject:\n  name: fixture\n  types: []\nproduct:\n  purpose: test\n  priorities: []\n  non_goals: []\nplatforms: []\nstack:\n  languages: []\n  frameworks: []\n  runtimes: []\n  data_stores: []\narchitecture:\n  style: null\n  document: null\nqualities: []\nprofiles: []\ndelivery:\n  model: null\nconstraints: []\n`);
    await writeFile(join(root, '.devland/state.yaml'), `schema: devland.state/v0\nactive_work: []\nblocked: []\nrecently_completed: []\nopen_decisions: []\n`);

    const result = run(['doctor'], root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    const unevaluated = output.checks.filter((check) => check.status === 'not_evaluated');
    assert.ok(unevaluated.length > 0);
    for (const check of unevaluated) {
      assert.equal(typeof check.reason, 'string');
      assert.ok(check.reason.length > 0);
      assert.ok(Array.isArray(check.required_evidence));
      assert.ok(check.required_evidence.length > 0);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
