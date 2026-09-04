import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import YAML from 'yaml';
import {
  doctorFromSnapshot,
  flowReportFromEvidence,
} from '../../adapters/openai/chatgpt-plugin/portable-feedback.mjs';

async function canonicalYaml() {
  const [projectYaml, stateYaml] = await Promise.all([
    readFile('.devland/project.yaml', 'utf8'),
    readFile('.devland/state.yaml', 'utf8'),
  ]);
  return { projectYaml, stateYaml };
}

function event(id, type, occurredAt, extra = {}) {
  return JSON.stringify({
    schema: 'devland.event/v1',
    id,
    type,
    occurred_at: occurredAt,
    source: 'dogfood',
    ...extra,
  });
}

test('portable flow feedback preserves empty evidence as a valid report', async () => {
  const { projectYaml, stateYaml } = await canonicalYaml();
  const report = await flowReportFromEvidence({ projectYaml, stateYaml });

  assert.equal(report.event_count, 0);
  assert.equal(report.evidence_status, 'empty');
  assert.deepEqual(report.outcomes.coverage, { linked: 0, total: 0 });
});

test('portable flow feedback reuses production and outcome metric semantics', async () => {
  const { projectYaml, stateYaml } = await canonicalYaml();
  const project = YAML.parse(projectYaml);
  project.delivery.production_environments = ['production'];
  const eventsNdjson = [
    event('accepted', 'work.accepted', '2026-09-04T00:00:00Z', { work_id: 'work-1' }),
    event('deployed', 'deployment.succeeded', '2026-09-04T00:05:00Z', {
      work_id: 'work-1', deployment_id: 'deploy-1', environment: 'production',
    }),
    event('outcome', 'outcome.observed', '2026-09-04T00:06:00Z', {
      work_id: 'work-1', data: { status: 'positive' },
    }),
  ].join('\n');

  const report = await flowReportFromEvidence({
    projectYaml: YAML.stringify(project),
    stateYaml,
    eventsNdjson,
  });

  assert.deepEqual(report.metrics.idea_to_production, {
    samples: 1,
    average_ms: 300_000,
    max_ms: 300_000,
  });
  assert.deepEqual(report.metrics.production_to_outcome, {
    samples: 1,
    average_ms: 60_000,
    max_ms: 60_000,
  });
  assert.equal(report.outcomes.status.positive, 1);
});

test('portable doctor reuses deterministic doctor semantics from an external repository snapshot', async () => {
  const { projectYaml, stateYaml } = await canonicalYaml();
  const report = await doctorFromSnapshot({
    projectYaml,
    stateYaml,
    repositoryFiles: [
      { path: 'package.json', content: '{"type":"module"}' },
      { path: 'src/example.mjs', content: 'export const example = true;\n' },
      { path: 'docs/superpowers/specs/2026-08-25-devland-feedback-loop-design.md', content: '# architecture\n' },
    ],
  });

  assert.equal(report.status, 'clean');
  assert.deepEqual(report.findings, []);
});

test('portable doctor rejects path traversal and canonical overrides in repository snapshots', async () => {
  const { projectYaml, stateYaml } = await canonicalYaml();

  await assert.rejects(
    doctorFromSnapshot({
      projectYaml,
      stateYaml,
      repositoryFiles: [{ path: '../outside.txt', content: 'nope' }],
    }),
    /unsafe|relative/i,
  );

  await assert.rejects(
    doctorFromSnapshot({
      projectYaml,
      stateYaml,
      repositoryFiles: [{ path: '.devland/project.yaml', content: 'nope' }],
    }),
    /cannot override/i,
  );
});
