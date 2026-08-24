import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import YAML from 'yaml';

const cliPath = resolve('bin/devland.mjs');

function run(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd, encoding: 'utf8' });
}

async function createTarget(productionEnvironments = ['production']) {
  const root = await mkdtemp(join(tmpdir(), 'devland-flow-'));
  await mkdir(join(root, '.devland/runtime'), { recursive: true });
  const project = YAML.parse(await readFile('.devland/project.yaml', 'utf8'));
  project.delivery.production_environments = productionEnvironments;
  await writeFile(join(root, '.devland/project.yaml'), YAML.stringify(project));
  await copyFile('.devland/state.yaml', join(root, '.devland/state.yaml'));
  return root;
}

function event(id, type, occurredAt, linkage = {}) {
  return {
    schema: 'devland.event/v1',
    id,
    type,
    occurred_at: occurredAt,
    source: 'test',
    ...linkage,
  };
}

test('flow calculates correlated engineering feedback durations and actionable bottleneck', async () => {
  const root = await createTarget();
  try {
    const events = [
      event('e1', 'work.accepted', '2026-08-25T00:00:00Z', { work_id: 'w1' }),
      event('e2', 'review.opened', '2026-08-25T00:10:00Z', { change_id: 'c1' }),
      event('e3', 'review.completed', '2026-08-25T00:25:00Z', { change_id: 'c1' }),
      event('e4', 'ci.started', '2026-08-25T00:26:00Z', { change_id: 'c1' }),
      event('e5', 'ci.completed', '2026-08-25T00:31:00Z', { change_id: 'c1' }),
      event('e6', 'deployment.started', '2026-08-25T00:40:00Z', { deployment_id: 'd1', environment: 'production' }),
      event('e7', 'deployment.succeeded', '2026-08-25T00:50:00Z', { work_id: 'w1', deployment_id: 'd1', environment: 'production' }),
      event('e8', 'deployment.failed', '2026-08-25T01:00:00Z', { deployment_id: 'd2', environment: 'production' }),
      event('e9', 'recovery.succeeded', '2026-08-25T01:20:00Z', { deployment_id: 'd2', environment: 'production' }),
    ];
    await writeFile(
      join(root, '.devland/runtime/events.ndjson'),
      `${events.map((value) => JSON.stringify(value)).join('\n')}\n`,
    );

    const result = run(['flow'], root);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.event_count, 9);
    assert.deepEqual(output.metrics.idea_to_production, { samples: 1, average_ms: 3_000_000, max_ms: 3_000_000 });
    assert.deepEqual(output.metrics.review_wait, { samples: 1, average_ms: 900_000, max_ms: 900_000 });
    assert.deepEqual(output.metrics.ci_feedback_latency, { samples: 1, average_ms: 300_000, max_ms: 300_000 });
    assert.deepEqual(output.metrics.deployment_latency, { samples: 1, average_ms: 600_000, max_ms: 600_000 });
    assert.deepEqual(output.metrics.failed_deployment_recovery, { samples: 1, average_ms: 1_200_000, max_ms: 1_200_000 });
    assert.deepEqual(output.bottleneck, { metric: 'failed_deployment_recovery', average_ms: 1_200_000 });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('staging deployment success does not close idea-to-production', async () => {
  const root = await createTarget(['prod']);
  try {
    const events = [
      event('p1', 'work.accepted', '2026-08-25T00:00:00Z', { work_id: 'w1' }),
      event('p2', 'deployment.started', '2026-08-25T00:10:00Z', { deployment_id: 'stage-1', environment: 'staging' }),
      event('p3', 'deployment.succeeded', '2026-08-25T00:20:00Z', { work_id: 'w1', deployment_id: 'stage-1', environment: 'staging' }),
      event('p4', 'deployment.started', '2026-08-25T00:30:00Z', { deployment_id: 'prod-1', environment: 'prod' }),
      event('p5', 'deployment.succeeded', '2026-08-25T00:50:00Z', { work_id: 'w1', deployment_id: 'prod-1', environment: 'prod' }),
    ];
    await writeFile(join(root, '.devland/runtime/events.ndjson'), `${events.map(JSON.stringify).join('\n')}\n`);

    const result = run(['flow'], root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.deepEqual(output.metrics.idea_to_production, { samples: 1, average_ms: 3_000_000, max_ms: 3_000_000 });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deployment pairing includes environment so identical deployment ids cannot cross-pair', async () => {
  const root = await createTarget();
  try {
    const events = [
      event('d1', 'deployment.started', '2026-08-25T00:00:00Z', { deployment_id: 'same', environment: 'staging' }),
      event('d2', 'deployment.started', '2026-08-25T00:05:00Z', { deployment_id: 'same', environment: 'production' }),
      event('d3', 'deployment.succeeded', '2026-08-25T00:15:00Z', { work_id: 'wp', deployment_id: 'same', environment: 'production' }),
      event('d4', 'deployment.succeeded', '2026-08-25T00:20:00Z', { work_id: 'ws', deployment_id: 'same', environment: 'staging' }),
    ];
    await writeFile(join(root, '.devland/runtime/events.ndjson'), `${events.map(JSON.stringify).join('\n')}\n`);

    const result = run(['flow'], root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.deepEqual(output.metrics.deployment_latency, { samples: 2, average_ms: 900_000, max_ms: 1_200_000 });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('flow returns an empty report when no event log exists', async () => {
  const root = await createTarget();
  try {
    await rm(join(root, '.devland/runtime/events.ndjson'), { force: true });

    const result = run(['flow'], root);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.event_count, 0);
    for (const metric of Object.values(output.metrics)) assert.equal(metric.samples, 0);
    assert.equal(output.bottleneck, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
