import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendEngineeringEvent } from '../../src/events.mjs';

async function withTargetRepo(fn) {
  const root = await mkdtemp(join(tmpdir(), 'devland-event-identity-'));
  try {
    await mkdir(join(root, '.devland'));
    await copyFile('.devland/project.yaml', join(root, '.devland/project.yaml'));
    await copyFile('.devland/state.yaml', join(root, '.devland/state.yaml'));
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const cases = [
  ['id', {
    schema: 'devland.event/v1', id: ' evt-id ', type: 'work.started', occurred_at: '2026-08-25T00:00:00Z', source: 'test', work_id: 'work-1',
  }],
  ['work_id', {
    schema: 'devland.event/v1', id: 'evt-work', type: 'work.started', occurred_at: '2026-08-25T00:00:00Z', source: 'test', work_id: ' work-1 ',
  }],
  ['change_id', {
    schema: 'devland.event/v1', id: 'evt-review', type: 'review.opened', occurred_at: '2026-08-25T00:00:00Z', source: 'test', change_id: ' change-1 ',
  }],
  ['deployment_id', {
    schema: 'devland.event/v1', id: 'evt-deploy', type: 'deployment.started', occurred_at: '2026-08-25T00:00:00Z', source: 'test', deployment_id: ' deploy-1 ', environment: 'production',
  }],
  ['environment', {
    schema: 'devland.event/v1', id: 'evt-env', type: 'deployment.started', occurred_at: '2026-08-25T00:00:00Z', source: 'test', deployment_id: 'deploy-1', environment: ' production ',
  }],
  ['commit_sha', {
    schema: 'devland.event/v1', id: 'evt-commit', type: 'change.committed', occurred_at: '2026-08-25T00:00:00Z', source: 'test', change_id: 'change-1', commit_sha: ' abc123 ',
  }],
];

test('event ingestion rejects whitespace aliases in correlation and dedupe identities', async () => {
  for (const [field, event] of cases) {
    await withTargetRepo(async (root) => {
      await assert.rejects(
        appendEngineeringEvent(event, root),
        new RegExp(`${field}|canonical|whitespace|invalid engineering event`, 'i'),
        `${field} should reject whitespace aliases`,
      );
    });
  }
});
