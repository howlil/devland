import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGitHubEvidence } from '../../src/providers/github.mjs';

const payload = {
  repository: 'howlil/devland',
  records: [
    { kind: 'commit', sha: 'abc123', occurred_at: '2026-08-25T00:00:00Z', pull_request_number: 22, work_id: 'w1' },
    { kind: 'pull_request.opened', number: 22, occurred_at: '2026-08-25T00:01:00Z', work_id: 'w1' },
    { kind: 'pull_request.merged', number: 22, occurred_at: '2026-08-25T00:05:00Z', work_id: 'w1', merge_commit_sha: 'merge123' },
    { kind: 'workflow_run.started', run_id: 1001, occurred_at: '2026-08-25T00:06:00Z', pull_request_number: 22, work_id: 'w1' },
    { kind: 'workflow_run.completed', run_id: 1001, occurred_at: '2026-08-25T00:08:00Z', pull_request_number: 22, conclusion: 'success', work_id: 'w1' },
    { kind: 'deployment.started', deployment_id: 2001, occurred_at: '2026-08-25T00:09:00Z', environment: 'production', work_id: 'w1', pull_request_number: 22, sha: 'merge123' },
    { kind: 'deployment.succeeded', deployment_id: 2001, occurred_at: '2026-08-25T00:12:00Z', environment: 'production', work_id: 'w1', pull_request_number: 22, sha: 'merge123' },
  ],
};

test('GitHub evidence normalization is deterministic and uses provider-derived stable ids', () => {
  const first = normalizeGitHubEvidence(payload);
  const second = normalizeGitHubEvidence(payload);

  assert.deepEqual(first, second);
  assert.equal(first.length, payload.records.length + 1);
  assert.deepEqual(first.map((event) => event.id), [
    'github:howlil/devland:commit:abc123',
    'github:howlil/devland:pr:22:review-opened',
    'github:howlil/devland:pr:22:review-completed',
    'github:howlil/devland:pr:22:change-merged',
    'github:howlil/devland:workflow-run:1001:ci-started',
    'github:howlil/devland:workflow-run:1001:ci-completed',
    'github:howlil/devland:deployment:2001:production:started',
    'github:howlil/devland:deployment:2001:production:succeeded',
  ]);
  assert.equal(first.every((event) => event.source === 'github'), true);
  assert.equal(first[0].change_id, 'github:howlil/devland:pr:22');
  assert.equal(first[0].work_id, 'w1');
  assert.equal(first[3].type, 'change.merged');
  assert.equal(first[3].change_id, 'github:howlil/devland:pr:22');
  assert.equal(first[3].commit_sha, 'merge123');
  assert.equal(first[4].change_id, 'github:howlil/devland:pr:22');
  assert.equal(first[6].deployment_id, 'github:howlil/devland:deployment:2001');
  assert.equal(first[6].change_id, 'github:howlil/devland:pr:22');
  assert.equal(first[6].commit_sha, 'merge123');
});

test('GitHub provider details stay inside event data rather than canonical identifiers', () => {
  const events = normalizeGitHubEvidence(payload);
  const completed = events.find((event) => event.type === 'ci.completed');

  assert.deepEqual(completed.data, { conclusion: 'success' });
  assert.equal(completed.schema, 'devland.event/v1');
});

test('GitHub merge evidence preserves review completion and emits a distinct merge fact', () => {
  const events = normalizeGitHubEvidence({
    repository: 'howlil/devland',
    records: [{
      kind: 'pull_request.merged',
      number: 44,
      occurred_at: '2026-09-04T00:00:00Z',
      merge_commit_sha: 'merged44',
    }],
  });

  assert.deepEqual(events.map((event) => event.type), ['review.completed', 'change.merged']);
  assert.equal(events[1].commit_sha, 'merged44');
});

test('GitHub evidence normalization rejects unsupported record kinds instead of guessing', () => {
  assert.throws(
    () => normalizeGitHubEvidence({ repository: 'howlil/devland', records: [{ kind: 'magic', occurred_at: '2026-08-25T00:00:00Z' }] }),
    /unsupported github evidence kind/i,
  );
});
