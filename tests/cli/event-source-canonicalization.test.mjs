import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendEngineeringEvent } from '../../src/events.mjs';

async function withTargetRepo(fn) {
  const root = await mkdtemp(join(tmpdir(), 'devland-event-source-'));
  try {
    await mkdir(join(root, '.devland'));
    await copyFile('.devland/project.yaml', join(root, '.devland/project.yaml'));
    await copyFile('.devland/state.yaml', join(root, '.devland/state.yaml'));
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('event ingestion rejects whitespace-padded source identities', async () => {
  await withTargetRepo(async (root) => {
    await assert.rejects(
      appendEngineeringEvent({
        schema: 'devland.event/v1',
        id: 'evt-source-whitespace',
        type: 'work.started',
        occurred_at: '2026-08-25T00:00:00Z',
        source: ' github ',
        work_id: 'work-1',
      }, root),
      /source|canonical|whitespace|invalid engineering event/i,
    );
  });
});
