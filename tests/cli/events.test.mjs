import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cliPath = resolve('bin/devland.mjs');

function run(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

async function withTargetRepo(fn) {
  const root = await mkdtemp(join(tmpdir(), 'devland-events-'));
  try {
    await mkdir(join(root, '.devland'));
    await copyFile('.devland/project.yaml', join(root, '.devland/project.yaml'));
    await copyFile('.devland/state.yaml', join(root, '.devland/state.yaml'));
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const event = {
  schema: 'devland.event/v1',
  id: 'evt-work-started-1',
  type: 'work.started',
  occurred_at: '2026-08-22T05:57:00Z',
  source: 'manual',
  work_id: 'devland-v1-iteration-3-events',
};

test('event append validates and stores normalized evidence outside canonical state', async () => {
  await withTargetRepo(async (root) => {
    const result = run(['event', 'append', JSON.stringify(event)], root);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.appended, true);
    assert.equal(output.path, '.devland/runtime/events.ndjson');
    assert.deepEqual(output.event, event);

    const lines = (await readFile(join(root, '.devland/runtime/events.ndjson'), 'utf8')).trim().split('\n');
    assert.equal(lines.length, 1);
    assert.deepEqual(JSON.parse(lines[0]), event);

    const canonical = await readFile(join(root, '.devland/state.yaml'), 'utf8');
    assert.equal(canonical.includes('evt-work-started-1'), false);
  });
});

test('event append is idempotent for the same normalized event id and payload', async () => {
  await withTargetRepo(async (root) => {
    const first = run(['event', 'append', JSON.stringify(event)], root);
    const second = run(['event', 'append', JSON.stringify(event)], root);

    assert.equal(first.status, 0, first.stderr || first.stdout);
    assert.equal(second.status, 0, second.stderr || second.stdout);
    assert.equal(JSON.parse(second.stdout).appended, false);

    const lines = (await readFile(join(root, '.devland/runtime/events.ndjson'), 'utf8')).trim().split('\n');
    assert.equal(lines.length, 1);
  });
});

test('event append rejects invalid normalized evidence without writing the runtime log', async () => {
  await withTargetRepo(async (root) => {
    const invalid = { ...event, id: 'evt-invalid-1', type: 'provider.magic' };
    const result = run(['event', 'append', JSON.stringify(invalid)], root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid engineering event/i);
  });
});

test('event append rejects deployment success without production-usable linkage', async () => {
  await withTargetRepo(async (root) => {
    const invalid = {
      schema: 'devland.event/v1',
      id: 'evt-deploy-success-missing-linkage',
      type: 'deployment.succeeded',
      occurred_at: '2026-08-25T01:00:00Z',
      source: 'test',
      deployment_id: 'deploy-1',
    };
    const result = run(['event', 'append', JSON.stringify(invalid)], root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid engineering event/i);
    assert.match(result.stderr, /environment|work_id|required/i);
  });
});

test('event append rejects timestamps that match the shape but are not real instants', async () => {
  await withTargetRepo(async (root) => {
    const invalid = {
      ...event,
      id: 'evt-impossible-time',
      occurred_at: '2026-99-99T25:61:61Z',
    };
    const result = run(['event', 'append', JSON.stringify(invalid)], root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /timestamp|occurred_at|invalid engineering event/i);
  });
});
