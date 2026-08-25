import { readEngineeringEvents } from './events.mjs';
import { validateCanonical } from './runtime.mjs';

const METRIC_SPECS = [
  { name: 'idea_to_production', start: 'work.accepted', end: 'deployment.succeeded', keys: ['work_id'], productionEnd: true },
  { name: 'review_wait', start: 'review.opened', end: 'review.completed', keys: ['change_id'] },
  { name: 'ci_feedback_latency', start: 'ci.started', end: 'ci.completed', keys: ['change_id'] },
  { name: 'deployment_latency', start: 'deployment.started', end: 'deployment.succeeded', keys: ['deployment_id', 'environment'] },
  { name: 'failed_deployment_recovery', start: 'deployment.failed', end: 'recovery.succeeded', keys: ['deployment_id', 'environment'] },
];

const BOTTLENECK_METRICS = new Set([
  'review_wait',
  'ci_feedback_latency',
  'deployment_latency',
  'failed_deployment_recovery',
]);

function timestamp(event) {
  const value = Date.parse(event.occurred_at);
  if (!Number.isFinite(value)) throw new Error(`Invalid engineering event timestamp: ${event.id ?? 'unknown'}`);
  return value;
}

function correlationKey(event, keys) {
  const values = keys.map((key) => event[key]);
  if (values.some((value) => !value)) return null;
  return JSON.stringify(values);
}

function includeEvent(event, spec, productionEnvironments) {
  if (event.type !== spec.start && event.type !== spec.end) return false;
  if (spec.productionEnd && event.type === spec.end) {
    return productionEnvironments.has(event.environment);
  }
  return true;
}

function pairDurations(events, spec, productionEnvironments) {
  const groups = new Map();

  for (const event of events) {
    if (!includeEvent(event, spec, productionEnvironments)) continue;
    const correlation = correlationKey(event, spec.keys);
    if (!correlation) continue;
    const group = groups.get(correlation) ?? [];
    group.push(event);
    groups.set(correlation, group);
  }

  const durations = [];
  let unmatchedStarts = 0;
  let unmatchedEnds = 0;

  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => timestamp(a) - timestamp(b));
    const pendingStarts = [];

    for (const event of ordered) {
      if (event.type === spec.start) {
        pendingStarts.push(event);
        continue;
      }
      if (event.type !== spec.end) continue;
      if (pendingStarts.length === 0) {
        unmatchedEnds += 1;
        continue;
      }

      const started = pendingStarts.shift();
      const duration = timestamp(event) - timestamp(started);
      if (duration >= 0) durations.push(duration);
    }

    unmatchedStarts += pendingStarts.length;
  }

  return { durations, unmatchedStarts, unmatchedEnds };
}

function aggregate(durations) {
  if (durations.length === 0) return { samples: 0, average_ms: 0, max_ms: 0 };
  const total = durations.reduce((sum, value) => sum + value, 0);
  return {
    samples: durations.length,
    average_ms: Math.round(total / durations.length),
    max_ms: Math.max(...durations),
  };
}

function evidenceStatus(incomplete) {
  const hasIncompleteLifecycle = Object.values(incomplete).some(
    (value) => value.unmatched_starts > 0 || value.unmatched_ends > 0,
  );
  return hasIncompleteLifecycle ? 'partial' : 'complete';
}

export function calculateFlowMetrics(events, { productionEnvironments = [] } = {}) {
  const production = new Set(productionEnvironments);
  const metrics = {};
  const incomplete = {};
  for (const spec of METRIC_SPECS) {
    const paired = pairDurations(events, spec, production);
    metrics[spec.name] = aggregate(paired.durations);
    incomplete[spec.name] = {
      unmatched_starts: paired.unmatchedStarts,
      unmatched_ends: paired.unmatchedEnds,
    };
  }

  let bottleneck = null;
  for (const [metric, value] of Object.entries(metrics)) {
    if (!BOTTLENECK_METRICS.has(metric) || value.samples === 0) continue;
    if (!bottleneck || value.average_ms > bottleneck.average_ms) {
      bottleneck = { metric, average_ms: value.average_ms };
    }
  }

  return {
    metrics,
    bottleneck,
    incomplete,
    evidence_status: evidenceStatus(incomplete),
  };
}

export async function flowReport(projectRoot = process.cwd()) {
  const canonical = await validateCanonical(projectRoot);
  if (!canonical.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(canonical.errors)}`);
  }

  const events = await readEngineeringEvents(projectRoot);
  const { metrics, bottleneck, incomplete, evidence_status } = calculateFlowMetrics(events, {
    productionEnvironments: canonical.project.delivery?.production_environments ?? [],
  });
  return {
    event_count: events.length,
    evidence_status,
    metrics,
    bottleneck,
    incomplete,
  };
}
