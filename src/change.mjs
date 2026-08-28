const SIGNAL_LANES = new Map([
  ['localized', 'rapid'],
  ['reversible', 'rapid'],
  ['multi-module', 'guided'],
  ['schema-change', 'guided'],
  ['new-api-flow', 'guided'],
  ['dependency-change', 'guided'],
  ['security-boundary', 'deliberate'],
  ['irreversible-migration', 'deliberate'],
  ['data-loss-risk', 'deliberate'],
  ['concurrency-semantics', 'deliberate'],
  ['compatibility-break', 'deliberate'],
  ['large-blast-radius', 'deliberate'],
]);

const LANE_WEIGHT = new Map([
  ['rapid', 0],
  ['guided', 1],
  ['deliberate', 2],
]);

const LANE_BUDGETS = Object.freeze({
  rapid: Object.freeze({
    analysis: 'minimal',
    context: 'affected-only',
    verification: 'focused',
  }),
  guided: Object.freeze({
    analysis: 'targeted',
    context: 'affected-plus-risk',
    verification: 'affected',
  }),
  deliberate: Object.freeze({
    analysis: 'deliberate',
    context: 'risk-expanded',
    verification: 'strong',
  }),
});

const PROFILE_BY_SIGNAL = new Map([
  ['security-boundary', 'qualities.security-sensitive'],
]);

function normalizeSignals(change) {
  if (change === undefined || change === null) return [];
  if (typeof change !== 'object' || Array.isArray(change)) {
    throw new Error('Change descriptor must be an object');
  }
  if (change.signals === undefined) return [];
  if (!Array.isArray(change.signals)) throw new Error('Change signals must be an array');

  const signals = [...new Set(change.signals.map((signal) => {
    if (typeof signal !== 'string' || signal.trim() === '') {
      throw new Error('Change signals must be non-empty strings');
    }
    return signal.trim();
  }))].sort();

  for (const signal of signals) {
    if (!SIGNAL_LANES.has(signal)) throw new Error(`Unknown change signal: ${signal}`);
  }
  return signals;
}

export function contextPreferences(change = null) {
  if (change === undefined || change === null || change.context === undefined) {
    return { full: false, state: false };
  }
  if (typeof change.context !== 'object' || change.context === null || Array.isArray(change.context)) {
    throw new Error('Change context preferences must be an object');
  }

  const allowed = new Set(['full', 'state']);
  for (const key of Object.keys(change.context)) {
    if (!allowed.has(key)) throw new Error(`Unknown change context preference: ${key}`);
  }
  for (const key of allowed) {
    if (change.context[key] !== undefined && typeof change.context[key] !== 'boolean') {
      throw new Error(`Change context preference ${key} must be boolean`);
    }
  }

  const full = change.context.full === true;
  return {
    full,
    state: full || change.context.state === true,
  };
}

export function classifyChange(change = null) {
  const signals = normalizeSignals(change);
  let lane = 'rapid';
  for (const signal of signals) {
    const candidate = SIGNAL_LANES.get(signal);
    if (LANE_WEIGHT.get(candidate) > LANE_WEIGHT.get(lane)) lane = candidate;
  }
  return { lane, signals, budget: LANE_BUDGETS[lane] };
}

export function changeProfileIds(change = null) {
  const { signals } = classifyChange(change);
  return [...new Set(signals.map((signal) => PROFILE_BY_SIGNAL.get(signal)).filter(Boolean))].sort();
}
