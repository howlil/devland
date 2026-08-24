function required(record, field) {
  const value = record?.[field];
  if (value === undefined || value === null || value === '') {
    throw new Error(`GitHub evidence ${record?.kind ?? 'record'} requires ${field}`);
  }
  return value;
}

function repositoryName(payload) {
  const repository = payload?.repository;
  if (typeof repository !== 'string' || repository.trim() === '') {
    throw new Error('GitHub evidence requires repository');
  }
  return repository.trim();
}

function changeId(repository, record) {
  if (record.pull_request_number !== undefined && record.pull_request_number !== null) {
    return `github:${repository}:pr:${record.pull_request_number}`;
  }
  const sha = required(record, 'sha');
  return `github:${repository}:commit:${sha}`;
}

function eventBase(repository, record, suffix, type) {
  return {
    schema: 'devland.event/v1',
    id: `github:${repository}:${suffix}`,
    type,
    occurred_at: required(record, 'occurred_at'),
    source: 'github',
  };
}

function normalizeRecord(repository, record) {
  switch (record?.kind) {
    case 'commit': {
      const sha = String(required(record, 'sha'));
      return {
        ...eventBase(repository, record, `commit:${sha}`, 'change.committed'),
        change_id: changeId(repository, record),
        commit_sha: sha,
      };
    }
    case 'pull_request.opened': {
      const number = required(record, 'number');
      return {
        ...eventBase(repository, record, `pr:${number}:review-opened`, 'review.opened'),
        change_id: `github:${repository}:pr:${number}`,
      };
    }
    case 'pull_request.merged': {
      const number = required(record, 'number');
      return {
        ...eventBase(repository, record, `pr:${number}:review-completed`, 'review.completed'),
        change_id: `github:${repository}:pr:${number}`,
      };
    }
    case 'workflow_run.started': {
      const runId = required(record, 'run_id');
      const pullRequest = required(record, 'pull_request_number');
      return {
        ...eventBase(repository, record, `workflow-run:${runId}:ci-started`, 'ci.started'),
        change_id: `github:${repository}:pr:${pullRequest}`,
      };
    }
    case 'workflow_run.completed': {
      const runId = required(record, 'run_id');
      const pullRequest = required(record, 'pull_request_number');
      const event = {
        ...eventBase(repository, record, `workflow-run:${runId}:ci-completed`, 'ci.completed'),
        change_id: `github:${repository}:pr:${pullRequest}`,
      };
      if (record.conclusion !== undefined) event.data = { conclusion: record.conclusion };
      return event;
    }
    case 'deployment.started':
    case 'deployment.succeeded':
    case 'deployment.failed':
    case 'recovery.succeeded': {
      const deploymentId = required(record, 'deployment_id');
      const environment = String(required(record, 'environment'));
      const type = record.kind;
      const suffix = type === 'recovery.succeeded' ? 'recovered' : type.split('.')[1];
      const event = {
        ...eventBase(repository, record, `deployment:${deploymentId}:${environment}:${suffix}`, type),
        deployment_id: `github:${repository}:deployment:${deploymentId}`,
        environment,
      };
      if (record.work_id !== undefined && record.work_id !== null && record.work_id !== '') {
        event.work_id = String(record.work_id);
      }
      if (type === 'deployment.succeeded' && !event.work_id) {
        throw new Error('GitHub evidence deployment.succeeded requires work_id');
      }
      return event;
    }
    default:
      throw new Error(`Unsupported GitHub evidence kind: ${record?.kind ?? 'missing'}`);
  }
}

export function normalizeGitHubEvidence(payload) {
  const repository = repositoryName(payload);
  if (!Array.isArray(payload?.records)) throw new Error('GitHub evidence requires records array');
  return payload.records.map((record) => normalizeRecord(repository, record));
}
