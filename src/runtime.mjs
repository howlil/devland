import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

const DEVLAND_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const PROJECT_PATH = '.devland/project.yaml';
const STATE_PATH = '.devland/state.yaml';
const PROJECT_SCHEMA_PATH = 'schemas/project.schema.json';
const STATE_SCHEMA_PATH = 'schemas/state.schema.json';
const SUPPORTED_CONTRACTS = new Set(['1']);

async function readText(root, relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function readYaml(root, relativePath) {
  return YAML.parse(await readText(root, relativePath));
}

async function readJson(root, relativePath) {
  return JSON.parse(await readText(root, relativePath));
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return { metadata: {}, body: text };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { metadata: {}, body: text };
  return {
    metadata: YAML.parse(text.slice(4, end)) ?? {},
    body: text.slice(end + 5),
  };
}

function formatAjvErrors(relativePath, errors = []) {
  return errors.map((error) => ({
    path: relativePath,
    instancePath: error.instancePath || '/',
    message: error.message ?? 'schema validation failed',
  }));
}

function semanticError(pathName, instancePath, message) {
  return { path: pathName, instancePath, message };
}

function validateProjectSemantics(project) {
  const contract = project.devland?.contract;
  if (SUPPORTED_CONTRACTS.has(contract)) return [];
  return [semanticError(
    PROJECT_PATH,
    '/devland/contract',
    `unsupported Devland contract ${contract ?? 'missing'}; supported: ${[...SUPPORTED_CONTRACTS].join(', ')}`,
  )];
}

function validateStateSemantics(state) {
  const errors = [];
  const buckets = [
    ['active_work', new Set(['proposed', 'planned', 'active', 'verifying'])],
    ['blocked', new Set(['blocked'])],
    ['recently_completed', new Set(['done', 'abandoned'])],
  ];
  const seenIds = new Map();

  for (const [bucket, allowedStatuses] of buckets) {
    for (const [index, item] of (state[bucket] ?? []).entries()) {
      if (!allowedStatuses.has(item.status)) {
        errors.push(semanticError(
          STATE_PATH,
          `/${bucket}/${index}/status`,
          `${bucket} does not allow status ${item.status}; allowed: ${[...allowedStatuses].join(', ')}`,
        ));
      }

      const previous = seenIds.get(item.id);
      if (previous) {
        errors.push(semanticError(
          STATE_PATH,
          `/${bucket}/${index}/id`,
          `duplicate work id ${item.id}; already declared at ${previous}`,
        ));
      } else {
        seenIds.set(item.id, `/${bucket}/${index}`);
      }
    }
  }

  return errors;
}

export async function validateCanonical(projectRoot = process.cwd(), devlandRoot = DEVLAND_ROOT) {
  const [project, state, projectSchema, stateSchema] = await Promise.all([
    readYaml(projectRoot, PROJECT_PATH),
    readYaml(projectRoot, STATE_PATH),
    readJson(devlandRoot, PROJECT_SCHEMA_PATH),
    readJson(devlandRoot, STATE_SCHEMA_PATH),
  ]);

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validateProject = ajv.compile(projectSchema);
  const validateState = ajv.compile(stateSchema);
  const projectValid = validateProject(project);
  const stateValid = validateState(state);

  const errors = [
    ...(!projectValid ? formatAjvErrors(PROJECT_PATH, validateProject.errors) : []),
    ...(!stateValid ? formatAjvErrors(STATE_PATH, validateState.errors) : []),
    ...(projectValid ? validateProjectSemantics(project) : []),
    ...(stateValid ? validateStateSemantics(state) : []),
  ];

  return {
    valid: errors.length === 0,
    validated: [PROJECT_PATH, STATE_PATH],
    errors,
    project,
    state,
  };
}

async function readMarkdownDocument(devlandRoot, relativePath) {
  const text = await readText(devlandRoot, relativePath);
  const { metadata, body } = parseFrontmatter(text);
  return {
    metadata,
    entry: {
      id: metadata.id ?? path.basename(relativePath, '.md'),
      path: relativePath,
      content: body.trim(),
    },
  };
}

async function readMarkdownEntry(devlandRoot, relativePath) {
  return (await readMarkdownDocument(devlandRoot, relativePath)).entry;
}

function corePolicyPath(id) {
  const match = /^core\.([a-z0-9][a-z0-9-]*)$/.exec(id ?? '');
  return match ? `core/policies/${match[1]}.md` : null;
}

async function resolveCorePolicies(devlandRoot, policyIds) {
  if (!Array.isArray(policyIds)) {
    throw new Error('Workflow does not declare core policies');
  }

  const resolved = [];
  for (const id of policyIds) {
    const relativePath = corePolicyPath(id);
    if (!relativePath || !(await exists(devlandRoot, relativePath))) {
      throw new Error(`Unknown declared core policy: ${id}`);
    }
    const entry = await readMarkdownEntry(devlandRoot, relativePath);
    if (entry.id !== id) {
      throw new Error(`Declared core policy id mismatch: ${id}`);
    }
    resolved.push(entry);
  }
  return resolved;
}

function inferredProfileCandidates(project) {
  const ids = new Set();

  for (const type of project.project?.types ?? []) ids.add(`project-types.${type}`);
  for (const quality of project.qualities ?? []) ids.add(`qualities.${quality}`);
  for (const value of [
    ...(project.stack?.languages ?? []),
    ...(project.stack?.frameworks ?? []),
    ...(project.stack?.runtimes ?? []),
    ...(project.stack?.data_stores ?? []),
  ]) {
    ids.add(`stacks.${String(value).toLowerCase()}`);
  }
  if (project.delivery?.model) ids.add(`delivery.${project.delivery.model}`);

  return [...ids].sort();
}

function profilePath(id) {
  const separator = id.indexOf('.');
  if (separator <= 0 || separator === id.length - 1) return null;
  return `profiles/${id.slice(0, separator)}/${id.slice(separator + 1)}.md`;
}

async function exists(root, relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readProfileIfPresent(devlandRoot, id) {
  const relativePath = profilePath(id);
  if (!relativePath || !(await exists(devlandRoot, relativePath))) return null;
  const entry = await readMarkdownEntry(devlandRoot, relativePath);
  return entry.id === id ? entry : null;
}

async function resolveProfiles(devlandRoot, project) {
  const resolved = new Map();

  for (const id of [...new Set(project.profiles ?? [])].sort()) {
    const entry = await readProfileIfPresent(devlandRoot, id);
    if (!entry) throw new Error(`Unknown explicit profile: ${id}`);
    resolved.set(id, entry);
  }

  for (const id of inferredProfileCandidates(project)) {
    if (resolved.has(id)) continue;
    const entry = await readProfileIfPresent(devlandRoot, id);
    if (entry) resolved.set(id, entry);
  }

  return [...resolved.values()];
}

export async function resolveContext(workflowId, projectRoot = process.cwd(), devlandRoot = DEVLAND_ROOT) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(workflowId ?? '')) {
    throw new Error(`Unknown workflow: ${workflowId ?? ''}`);
  }

  const validation = await validateCanonical(projectRoot, devlandRoot);
  if (!validation.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(validation.errors)}`);
  }

  const workflowPath = `core/workflows/${workflowId}.md`;
  if (!(await exists(devlandRoot, workflowPath))) throw new Error(`Unknown workflow: ${workflowId}`);

  const workflowDocument = await readMarkdownDocument(devlandRoot, workflowPath);
  const [policies, profiles] = await Promise.all([
    resolveCorePolicies(devlandRoot, workflowDocument.metadata.policies),
    resolveProfiles(devlandRoot, validation.project),
  ]);

  return {
    project: { path: PROJECT_PATH, content: validation.project },
    state: { path: STATE_PATH, content: validation.state },
    policies,
    profiles,
    workflow: workflowDocument.entry,
  };
}
