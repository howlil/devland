import { correlateDeliveryEvents } from './correlation.mjs';
import { readEngineeringEvents } from './events.mjs';
import { validateCanonical } from './runtime.mjs';

const METRIC_SPECS = [
  { name: 'idea_to_production', start: 'work.accepted', end: 'deployment.succeeded', keys: ['work_id'], productionEnd: true, sourceScoped: false },
  { name: 'review_wait', start: 'review.opened', end: 'review.completed', keys: ['change_id'] },
  { name: 'ci_feedback_latency', start: 'ci.started', end: 'ci.completed', keys: ['change_id'] },
  { name: 'deployment_latency', start: 'deployment.started', end: 'deployment.succeeded', keys: ['deployment_id', 'environment'] },
  { name: 'failed_deployment_recovery', start: 'deployment.failed', end: 'recovery.succeeded', keys: ['deployment_id', 'environment'] },
];

const DELIVERY_METRIC_SPECS = [
  { name: 'accept_to_start', start: 'work.accepted', end: 'work.started', keys: ['work_id'], sourceScoped: false },
  { name: 'start_to_change', start: 'work.started', end: 'change.committed', keys: ['work_id'], sourceScoped: false },
  { name: 'change_to_merge', start: 'change.committed', end: 'change.merged', keys: ['change_id'], sourceScoped: false },
  { name: 'merge_to_production', start: 'change.merged', end: 'deployment.succeeded', keys: ['change_id'], productionEnd: true, sourceScoped: false },
];

const OUTCOME_METRIC_SPECS = [
  { name: 'production_to_outcome', start: 'deployment.succeeded', end: 'outcome.observed', keys: ['work_id'], productionStart: true, sourceScoped: false },
  { name: 'idea_to_outcome', start: 'work.accepted', end: 'outcome.observed', keys: ['work_id'], sourceScoped: false },
];

const ALL_METRIC_SPECS = [...METRIC_SPECS, ...DELIVERY_METRIC_SPECS, ...OUTCOME_METRIC_SPECS];
const FLOW_EVIDENCE_SPECS = [...METRIC_SPECS, ...DELIVERY_METRIC_SPECS];
const OUTCOME_METRIC_NAMES = new Set(OUTCOME_METRIC_SPECS.map((spec) => spec.name));

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

function evidenceSource(event) {
  return typeof event.source === 'string' && event.source.length > 0 ? event.source : '__unspecified__';
}

function correlationKey(event, spec) {
  const values = spec.keys.map((key) => event[key]);
  if (values.some((value) => !value)) return null;
  if (spec.sourceScoped === false) return JSON.stringify(values);
  return JSON.stringify([...values, evidenceSource(event)]);
}

function includeEvent(event, spec, productionEnvironments) {
  if (event.type !== spec.start && event.type !== spec.end) return false;
  if (spec.productionStart && event.type === spec.start) {
    return productionEnvironments.has(event.environment);
  }
  if (spec.productionEnd && event.type === spec.end) {
    return productionEnvironments.has(event.environment);
  }
  return true;
}

function hasObservedLifecycleEvidence(events, productionEnvironments) {
  return events.some((event) => FLOW_EVIDENCE_SPECS.some((spec) =>
    includeEvent(event, spec, productionEnvironments) && correlationKey(event, spec) !== null
  ));
}

function observationAccumulator(events, spec, productionEnvironments) {
  const groups = new Map();
  const observedSources = new Set();
  let observedEvents = 0;
  let firstObserved = null;
  let lastObserved = null;

  for (const event of events) {
    if (!includeEvent(event, spec, productionEnvironments)) continue;
    const correlation = correlationKey(event, spec);
    if (!correlation) continue;
    observedEvents += 1;
    if (typeof event.source === 'string' && event.source.length > 0) observedSources.add(event.source);

    const occurredAt = timestamp(event);
    if (!firstObserved || occurredAt < firstObserved.ms) {
      firstObserved = { ms: occurredAt, value: event.occurred_at };
    }
    if (!lastObserved || occurredAt > lastObserved.ms) {
      lastObserved = { ms: occurredAt, value: event.occurred_at };
    }

    const group = groups.get(correlation) ?? [];
    group.push(event);
    groups.set(correlation, group);
  }

  return {
    groups,
    observedEvents,
    observedSources: [...observedSources].sort(),
    observedWindow: firstObserved && lastObserved
      ? {
          first_occurred_at: firstObserved.value,
          last_occurred_at: lastObserved.value,
        }
      : null,
  };
}

function pairDurations(events, spec, productionEnvironments) {
  const observed = observationAccumulator(events, spec, productionEnvironments);
  const durations = [];
  let unmatchedStarts = 0;
  let unmatchedEnds = 0;

  for (const group of observed.groups.values()) {
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

  return {
    durations,
    unmatchedStarts,
    unmatchedEnds,
    observedEvents: observed.observedEvents,
    observedSources: observed.observedSources,
    observedWindow: observed.observedWindow,
  };
}

function pairMilestoneDurations(events, spec, productionEnvironments) {
  const observed = observationAccumulator(events, spec, productionEnvironments);
  const durations = [];
  let unmatchedStarts = 0;
  let unmatchedEnds = 0;

  for (const group of observed.groups.values()) {
    const ordered = [...group].sort((a, b) => timestamp(a) - timestamp(b));
    const starts = ordered.filter((event) => event.type === spec.start);
    const ends = ordered.filter((event) => event.type === spec.end);

    if (starts.length === 0) {
      if (ends.length > 0) unmatchedEnds += 1;
      continue;
    }
    if (ends.length === 0) {
      unmatchedStarts += 1;
      continue;
    }

    const startedAt = timestamp(starts[0]);
    const ended = ends.find((event) => timestamp(event) >= startedAt);
    if (!ended) {
      unmatchedStarts += 1;
      unmatchedEnds += 1;
      continue;
    }
    durations.push(timestamp(ended) - startedAt);
  }

  return {
    durations,
    unmatchedStarts,
    unmatchedEnds,
    observedEvents: observed.observedEvents,
    observedSources: observed.observedSources,
    observedWindow: observed.observedWindow,
  };
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

function metricEvidenceStatus(paired) {
  if (paired.observedEvents === 0) return 'empty';
  if (paired.unmatchedStarts > 0 || paired.unmatchedEnds > 0) return 'partial';
  return 'complete';
}

function coverageStatus(metricEvidence) {
  const statuses = Object.values(metricEvidence);
  if (statuses.every((status) => status === 'empty')) return 'empty';
  if (statuses.every((status) => status === 'complete')) return 'complete';
  return 'partial';
}

function evidenceStatus(incomplete, observedLifecycleEvidence) {
  if (!observedLifecycleEvidence) return 'empty';
  const hasIncompleteLifecycle = Object.entries(incomplete).some(
    ([metric, value]) => !OUTCOME_METRIC_NAMES.has(metric)
      && (value.unmatched_starts > 0 || value.unmatched_ends > 0),
  );
  return hasIncompleteLifecycle ? 'partial' : 'complete';
}

function recordMetric(report, spec, paired) {
  report.metrics[spec.name] = aggregate(paired.durations);
  report.incomplete[spec.name] = {
    unmatched_starts: paired.unmatchedStarts,
    unmatched_ends: paired.unmatchedEnds,
  };
  report.metricEvidence[spec.name] = metricEvidenceStatus(paired);
  report.metricSources[spec.name] = paired.observedSources;
  report.metricWindows[spec.name] = paired.observedWindow;
}

export function calculateFlowMetrics(events, { productionEnvironments = [] } = {}) {
  const production = new Set(productionEnvironments);
  const correlation = correlateDeliveryEvents(events, { productionEnvironments });
  const resolvedEvents = correlation.events;
  const report = {
    metrics: {},
    incomplete: {},
    metricEvidence: {},
    metricSources: {},
    metricWindows: {},
  };

  for (const spec of METRIC_SPECS) {
    recordMetric(report, spec, pairDurations(resolvedEvents, spec, production));
  }

  for (const spec of [...DELIVERY_METRIC_SPECS, ...OUTCOME_METRIC_SPECS]) {
    recordMetric(report, spec, pairMilestoneDurations(resolvedEvents, spec, production));
  }

  let bottleneck = null;
  for (const [metric, value] of Object.entries(report.metrics)) {
    if (!BOTTLENECK_METRICS.has(metric) || value.samples === 0) continue;
    if (!bottleneck || value.average_ms > bottleneck.average_ms) {
      bottleneck = { metric, average_ms: value.average_ms };
    }
  }

  return {
    metrics: report.metrics,
    bottleneck,
    incomplete: report.incomplete,
    metric_evidence: report.metricEvidence,
    metric_sources: report.metricSources,
    metric_windows: report.metricWindows,
    coverage_status: coverageStatus(report.metricEvidence),
    evidence_status: evidenceStatus(
      report.incomplete,
      hasObservedLifecycleEvidence(resolvedEvents, production),
    ),
    correlation: {
      coverage: correlation.coverage,
      diagnostics: correlation.diagnostics,
    },
    outcomes: correlation.outcomes,
  };
}

export async function flowReport(projectRoot = process.cwd()) {
  const canonical = await validateCanonical(projectRoot);
  if (!canonical.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(canonical.errors)}`);
  }

  const events = await readEngineeringEvents(projectRoot);
  const {
    metrics,
    bottleneck,
    incomplete,
    metric_evidence,
    metric_sources,
    metric_windows,
    coverage_status,
    evidence_status,
    correlation,
    outcomes,
  } = calculateFlowMetrics(events, {
    productionEnvironments: canonical.project.delivery?.production_environments ?? [],
  });
  return {
    event_count: events.length,
    evidence_status,
    coverage_status,
    metric_evidence,
    metric_sources,
    metric_windows,
    metrics,
    correlation,
    outcomes,
    bottleneck,
    incomplete,
  };
}
