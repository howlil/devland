const OUTCOME_STATUSES = new Set(['positive', 'neutral', 'negative', 'unknown']);

function addToSetMap(map, key, value) {
  if (!key || !value) return;
  const values = map.get(key) ?? new Set();
  values.add(value);
  map.set(key, values);
}

function addToArrayMap(map, key, value) {
  if (!key) return;
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function sorted(values) {
  return [...values].sort();
}

function timestamp(event) {
  const value = Date.parse(event.occurred_at);
  if (!Number.isFinite(value)) throw new Error(`Invalid engineering event timestamp: ${event.id ?? 'unknown'}`);
  return value;
}

function outcomeStatus(event) {
  const value = event?.data?.status;
  return OUTCOME_STATUSES.has(value) ? value : 'unknown';
}

function byTimestampThenId(left, right) {
  const delta = timestamp(left) - timestamp(right);
  if (delta !== 0) return delta;
  return String(left.id ?? '').localeCompare(String(right.id ?? ''));
}

function diagnosticKey(diagnostic) {
  return JSON.stringify([
    diagnostic.code,
    diagnostic.change_id ?? '',
    diagnostic.deployment_id ?? '',
    diagnostic.work_id ?? '',
    diagnostic.work_ids ?? [],
    diagnostic.statuses ?? [],
  ]);
}

export function correlateDeliveryEvents(events, { productionEnvironments = [] } = {}) {
  const production = new Set(productionEnvironments);
  const commitChanges = new Map();
  const workIdsByChange = new Map();
  const committedChanges = new Set();
  const mergedChanges = new Set();
  const diagnostics = [];

  for (const event of events) {
    if (event.change_id && event.commit_sha) {
      addToSetMap(commitChanges, event.commit_sha, event.change_id);
    }
    if (event.change_id && event.work_id) {
      addToSetMap(workIdsByChange, event.change_id, event.work_id);
    }
    if (event.type === 'change.committed' && event.change_id) committedChanges.add(event.change_id);
    if (event.type === 'change.merged' && event.change_id) mergedChanges.add(event.change_id);
  }

  for (const event of events) {
    if (!event.work_id || event.change_id || !event.commit_sha) continue;
    const candidates = commitChanges.get(event.commit_sha);
    if (candidates?.size === 1) addToSetMap(workIdsByChange, [...candidates][0], event.work_id);
  }

  const workByChange = new Map();
  for (const changeId of new Set([...committedChanges, ...workIdsByChange.keys(), ...mergedChanges])) {
    const workIds = workIdsByChange.get(changeId) ?? new Set();
    if (workIds.size === 1) {
      workByChange.set(changeId, [...workIds][0]);
    } else if (workIds.size > 1) {
      diagnostics.push({
        code: 'conflicting_work_link',
        change_id: changeId,
        work_ids: sorted(workIds),
      });
    } else if (committedChanges.has(changeId)) {
      diagnostics.push({ code: 'unlinked_change', change_id: changeId });
    }
  }

  const changesByWork = new Map();
  for (const [changeId, workId] of workByChange) addToSetMap(changesByWork, workId, changeId);

  const resolvedEvents = events.map((event) => {
    const resolved = { ...event };

    if (!resolved.change_id && resolved.commit_sha) {
      const candidates = commitChanges.get(resolved.commit_sha);
      if (candidates?.size === 1) resolved.change_id = [...candidates][0];
    }

    if (!resolved.change_id && resolved.work_id) {
      const candidates = changesByWork.get(resolved.work_id);
      if (candidates?.size === 1) resolved.change_id = [...candidates][0];
    }

    if (!resolved.work_id && resolved.change_id) {
      const workId = workByChange.get(resolved.change_id);
      if (workId) resolved.work_id = workId;
    }

    return resolved;
  });

  for (const event of resolvedEvents) {
    if (event.type === 'deployment.succeeded' && !event.change_id) {
      diagnostics.push({
        code: 'unlinked_deployment',
        deployment_id: event.deployment_id,
        ...(event.work_id ? { work_id: event.work_id } : {}),
      });
    }
  }

  const deployedChanges = new Set(
    resolvedEvents
      .filter((event) => event.type === 'deployment.succeeded' && event.change_id)
      .map((event) => event.change_id),
  );

  const productionDeploymentsByWork = new Map();
  const outcomesByWork = new Map();
  for (const event of resolvedEvents) {
    if (event.type === 'deployment.succeeded' && event.work_id && production.has(event.environment)) {
      addToArrayMap(productionDeploymentsByWork, event.work_id, event);
    }
    if (event.type === 'outcome.observed' && event.work_id) {
      addToArrayMap(outcomesByWork, event.work_id, event);
    }
  }

  const outcomeCoverage = {
    linked: 0,
    total: productionDeploymentsByWork.size,
  };
  const outcomeStatusSummary = {
    positive: 0,
    neutral: 0,
    negative: 0,
    unknown: 0,
  };

  for (const [workId, deployments] of productionDeploymentsByWork) {
    const orderedDeployments = [...deployments].sort(byTimestampThenId);
    const orderedOutcomes = [...(outcomesByWork.get(workId) ?? [])].sort(byTimestampThenId);

    if (orderedOutcomes.length === 0) {
      outcomeStatusSummary.unknown += 1;
      continue;
    }

    outcomeCoverage.linked += 1;
    const latestStatus = outcomeStatus(orderedOutcomes.at(-1));
    outcomeStatusSummary[latestStatus] += 1;

    const knownStatuses = new Set(
      orderedOutcomes
        .map((event) => outcomeStatus(event))
        .filter((status) => status !== 'unknown'),
    );
    if (knownStatuses.size > 1) {
      diagnostics.push({
        code: 'conflicting_outcome_status',
        work_id: workId,
        statuses: sorted(knownStatuses),
      });
    }

    if (timestamp(orderedOutcomes[0]) < timestamp(orderedDeployments[0])) {
      diagnostics.push({
        code: 'outcome_precedes_production',
        work_id: workId,
      });
    }
  }

  const tracesByWork = new Map();
  for (const [changeId, workId] of workByChange) {
    const trace = tracesByWork.get(workId) ?? {
      work_id: workId,
      change_ids: new Set(),
      commit_shas: new Set(),
      deployment_ids: new Set(),
      outcomes: [],
    };
    trace.change_ids.add(changeId);
    tracesByWork.set(workId, trace);
  }

  for (const event of resolvedEvents) {
    if (!event.work_id || !tracesByWork.has(event.work_id)) continue;
    const trace = tracesByWork.get(event.work_id);
    if (event.change_id) trace.change_ids.add(event.change_id);
    if (event.commit_sha) trace.commit_shas.add(event.commit_sha);
    if (event.deployment_id) trace.deployment_ids.add(event.deployment_id);
    if (event.type === 'outcome.observed') {
      trace.outcomes.push({
        id: event.id,
        status: outcomeStatus(event),
        occurred_at: event.occurred_at,
        source: event.source,
      });
    }
  }

  const traces = [...tracesByWork.values()]
    .map((trace) => {
      const outcomeEvidence = [...trace.outcomes].sort((left, right) => {
        const delta = Date.parse(left.occurred_at) - Date.parse(right.occurred_at);
        if (delta !== 0) return delta;
        return String(left.id).localeCompare(String(right.id));
      });
      return {
        work_id: trace.work_id,
        change_ids: sorted(trace.change_ids),
        commit_shas: sorted(trace.commit_shas),
        deployment_ids: sorted(trace.deployment_ids),
        ...(outcomeEvidence.length > 0 ? { outcomes: outcomeEvidence } : {}),
      };
    })
    .sort((a, b) => a.work_id.localeCompare(b.work_id));

  const uniqueDiagnostics = [...new Map(diagnostics.map((diagnostic) => [diagnosticKey(diagnostic), diagnostic])).values()]
    .sort((a, b) => diagnosticKey(a).localeCompare(diagnosticKey(b)));

  return {
    events: resolvedEvents,
    traces,
    diagnostics: uniqueDiagnostics,
    coverage: {
      work_to_change: {
        linked: [...committedChanges].filter((changeId) => workByChange.has(changeId)).length,
        total: committedChanges.size,
      },
      change_to_merge: {
        linked: [...committedChanges].filter((changeId) => mergedChanges.has(changeId)).length,
        total: committedChanges.size,
      },
      merge_to_deploy: {
        linked: [...mergedChanges].filter((changeId) => deployedChanges.has(changeId)).length,
        total: mergedChanges.size,
      },
    },
    outcomes: {
      coverage: outcomeCoverage,
      status: outcomeStatusSummary,
    },
  };
}
