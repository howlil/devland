import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import YAML from 'yaml';
import { ingestEngineeringEvents, readEngineeringEvents } from '../../src/events.mjs';

const cliPath = resolve('bin/devland.mjs');

async function createTarget() {
  const root = await mkdtemp(join(tmpdir(), 'devland-github-ingest-'));
  await mkdir(join(root, '.devland'), { recursive: true });
  const project = YAML.parse(await readFile('.devland/project.yaml', 'utf8'));
  project.delivery.production_environments = ['production'];
  await writeFile(join(root, '.devland/project.yaml'), YAML.stringify(project));
  await copyFile('.devland/state.yaml', join(root, '.devland/state.yaml'));
  return root;
}

function event(id, type, linkage = {}) {
  return {
    schema: 'devland.event/v1',
    id,
    type,
    occurred_at: '2026-08-25T00:00:00Z',
    source: 'github',
    ...linkage,
  };
}

test('batch ingestion replays provider history idempotently', async () => {
  const root = await createTarget();
  try {
    const batch = [
      event('github:r:pr:1:review-opened', 'review.opened', { change_id: 'github:r:pr:1' }),
      event('github:r:pr:1:review-completed', 'review.completed', { change_id: 'github:r:pr:1' }),
    ];

    const first = await ingestEngineeringEvents(batch, root);
    const second = await ingestEngineeringEvents(batch, root);

    assert.equal(first.appended, 2);
    assert.equal(second.appended, 0);
    assert.equal((await readEngineeringEvents(root)).length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('batch ingestion rejects stable-id conflicts', async () => {
  const root = await createTarget();
  try {
    const original = event('github:r:pr:1:review-opened', 'review.opened', { change_id: 'github:r:pr:1' });
    await ingestEngineeringEvents([original], root);

    await assert.rejects(
      () => ingestEngineeringEvents([{ ...original, occurred_at: '2026-08-25T00:01:00Z' }], root),
      /event id conflict/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('concurrent provider batches serialize without dropping evidence', async () => {
  const root = await createTarget();
  try {
    const left = event('github:r:pr:1:review-opened', 'review.opened', { change_id: 'github:r:pr:1' });
    const right = event('github:r:pr:2:review-opened', 'review.opened', { change_id: 'github:r:pr:2' });

    await Promise.all([
      ingestEngineeringEvents([left], root),
      ingestEngineeringEvents([right], root),
    ]);

    const ids = (await readEngineeringEvents(root)).map((value) => value.id).sort();
    assert.deepEqual(ids, [left.id, right.id].sort());
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('devland ingest github reconstructs review and merge facts from provider records', async () => {
  const root = await createTarget();
  try {
    const payload = {
      repository: 'howlil/devland',
      records: [
        { kind: 'pull_request.opened', number: 22, occurred_at: '2026-08-25T00:01:00Z' },
        { kind: 'pull_request.merged', number: 22, occurred_at: '2026-08-25T00:05:00Z', merge_commit_sha: 'merge22' },
      ],
    };

    const result = spawnSync(process.execPath, [cliPath, 'ingest', 'github', JSON.stringify(payload)], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.provider, 'github');
    assert.equal(output.normalized_events, 3);
    assert.equal(output.appended, 3);
    const events = await readEngineeringEvents(root);
    assert.equal(events.length, 3);
    assert.deepEqual(events.map((value) => value.type), ['review.opened', 'review.completed', 'change.merged']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
