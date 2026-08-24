import { readEngineeringEvents } from './events.mjs';
import { validateCanonical } from './runtime.mjs';

const METRIC_SPECS = [
  { name: 'idea_to_production', start: 'work.accepted', end: 'deployment.succeeded', key: 'work_id' },
  { name: 'review_wait', start: 'review.opened', end: 'review.completed', key: 'change_id' },
  { name: 'ci_feedback_latency', start: 'ci.started', end: 'ci.completed', key: 'change_id' },
  { name: 'deployment_latency', start: 'deployment.started', end: 'deployment.succeeded', key: 'deployment_id' },
  { name: 'failed_deployment_recovery', start: 'deployment.failed', end: 'recovery.succeeded', key: 'deployment_id' },
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

function pairDurations(events, { start, end, key }) {
  const groups = new Map();

  for (const event of events) {
    if (event.type !== start && event.type !== end) continue;
    const correlation = event[key];
    if (!correlation) continue;
    const group = groups.get(correlation) ?? [];
    group.push(event);
    groups.set(correlation, group);
  }

  const durations = [];
  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => timestamp(a) - timestamp(b));
    const pendingStarts = [];

    for (const event of ordered) {
      if (event.type === start) {
        pendingStarts.push(event);
        continue;
      }
      if (event.type !== end || pendingStarts.length === 0) continue;

      const started = pendingStarts.shift();
      const duration = timestamp(event) - timestamp(started);
      if (duration >= 0) durations.push(duration);
    }
  }

  return durations;
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

export function calculateFlowMetrics(events) {
  const metrics = {};
  for (const spec of METRIC_SPECS) metrics[spec.name] = aggregate(pairDurations(events, spec));

  let bottleneck = null;
  for (const [metric, value] of Object.entries(metrics)) {
    if (!BOTTLENECK_METRICS.has(metric) || value.samples === 0) continue;
    if (!bottleneck || value.average_ms > bottleneck.average_ms) {
      bottleneck = { metric, average_ms: value.average_ms };
    }
  }

  return { metrics, bottleneck };
}

export async function flowReport(projectRoot = process.cwd()) {
  const canonical = await validateCanonical(projectRoot);
  if (!canonical.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(canonical.errors)}`);
  }

  const events = await readEngineeringEvents(projectRoot);
  const { metrics, bottleneck } = calculateFlowMetrics(events);
  return {
    event_count: events.length,
    metrics,
    bottleneck,
  };
}
