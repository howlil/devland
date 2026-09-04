function addToSetMap(map, key, value) {
  if (!key || !value) return;
  const values = map.get(key) ?? new Set();
  values.add(value);
  map.set(key, values);
}

function sorted(values) {
  return [...values].sort();
}

function diagnosticKey(diagnostic) {
  return JSON.stringify([
    diagnostic.code,
    diagnostic.change_id ?? '',
    diagnostic.deployment_id ?? '',
    diagnostic.work_ids ?? [],
  ]);
}

export function correlateDeliveryEvents(events) {
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

  const tracesByWork = new Map();
  for (const [changeId, workId] of workByChange) {
    const trace = tracesByWork.get(workId) ?? {
      work_id: workId,
      change_ids: new Set(),
      commit_shas: new Set(),
      deployment_ids: new Set(),
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
  }

  const traces = [...tracesByWork.values()]
    .map((trace) => ({
      work_id: trace.work_id,
      change_ids: sorted(trace.change_ids),
      commit_shas: sorted(trace.commit_shas),
      deployment_ids: sorted(trace.deployment_ids),
    }))
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
  };
}
