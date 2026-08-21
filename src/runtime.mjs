import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

const PROJECT_PATH = '.devland/project.yaml';
const STATE_PATH = '.devland/state.yaml';
const PROJECT_SCHEMA_PATH = 'schemas/project.schema.json';
const STATE_SCHEMA_PATH = 'schemas/state.schema.json';

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

export async function validateCanonical(root = process.cwd()) {
  const [project, state, projectSchema, stateSchema] = await Promise.all([
    readYaml(root, PROJECT_PATH),
    readYaml(root, STATE_PATH),
    readJson(root, PROJECT_SCHEMA_PATH),
    readJson(root, STATE_SCHEMA_PATH),
  ]);

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validateProject = ajv.compile(projectSchema);
  const validateState = ajv.compile(stateSchema);
  const projectValid = validateProject(project);
  const stateValid = validateState(state);

  const errors = [
    ...(!projectValid ? formatAjvErrors(PROJECT_PATH, validateProject.errors) : []),
    ...(!stateValid ? formatAjvErrors(STATE_PATH, validateState.errors) : []),
  ];

  return {
    valid: errors.length === 0,
    validated: [PROJECT_PATH, STATE_PATH],
    errors,
    project,
    state,
  };
}

async function readMarkdownEntry(root, relativePath) {
  const text = await readText(root, relativePath);
  const { metadata, body } = parseFrontmatter(text);
  return {
    id: metadata.id ?? path.basename(relativePath, '.md'),
    path: relativePath,
    content: body.trim(),
  };
}

async function listCorePolicies(root) {
  const directory = path.join(root, 'core/policies');
  const files = (await readdir(directory)).filter((name) => name.endsWith('.md')).sort();
  return Promise.all(files.map((file) => readMarkdownEntry(root, `core/policies/${file}`)));
}

function profileCandidates(project) {
  const ids = new Set(project.profiles ?? []);

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

async function resolveProfiles(root, project) {
  const resolved = [];
  for (const id of profileCandidates(project)) {
    const relativePath = profilePath(id);
    if (!relativePath || !(await exists(root, relativePath))) continue;
    const entry = await readMarkdownEntry(root, relativePath);
    if (entry.id === id) resolved.push(entry);
  }
  return resolved;
}

export async function resolveContext(workflowId, root = process.cwd()) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(workflowId ?? '')) {
    throw new Error(`Unknown workflow: ${workflowId ?? ''}`);
  }

  const validation = await validateCanonical(root);
  if (!validation.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(validation.errors)}`);
  }

  const workflowPath = `core/workflows/${workflowId}.md`;
  if (!(await exists(root, workflowPath))) throw new Error(`Unknown workflow: ${workflowId}`);

  const [policies, profiles, workflow] = await Promise.all([
    listCorePolicies(root),
    resolveProfiles(root, validation.project),
    readMarkdownEntry(root, workflowPath),
  ]);

  return {
    project: { path: PROJECT_PATH, content: validation.project },
    state: { path: STATE_PATH, content: validation.state },
    policies,
    profiles,
    workflow,
  };
}
