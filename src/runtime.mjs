import { access, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

const DEVLAND_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
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
  ];

  return {
    valid: errors.length === 0,
    validated: [PROJECT_PATH, STATE_PATH],
    errors,
    project,
    state,
  };
}

async function readMarkdownEntry(devlandRoot, relativePath) {
  const text = await readText(devlandRoot, relativePath);
  const { metadata, body } = parseFrontmatter(text);
  return {
    id: metadata.id ?? path.basename(relativePath, '.md'),
    path: relativePath,
    content: body.trim(),
  };
}

async function listCorePolicies(devlandRoot) {
  const directory = path.join(devlandRoot, 'core/policies');
  const files = (await readdir(directory)).filter((name) => name.endsWith('.md')).sort();
  return Promise.all(files.map((file) => readMarkdownEntry(devlandRoot, `core/policies/${file}`)));
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

async function resolveProfiles(devlandRoot, project) {
  const resolved = [];
  for (const id of profileCandidates(project)) {
    const relativePath = profilePath(id);
    if (!relativePath || !(await exists(devlandRoot, relativePath))) continue;
    const entry = await readMarkdownEntry(devlandRoot, relativePath);
    if (entry.id === id) resolved.push(entry);
  }
  return resolved;
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

  const [policies, profiles, workflow] = await Promise.all([
    listCorePolicies(devlandRoot),
    resolveProfiles(devlandRoot, validation.project),
    readMarkdownEntry(devlandRoot, workflowPath),
  ]);

  return {
    project: { path: PROJECT_PATH, content: validation.project },
    state: { path: STATE_PATH, content: validation.state },
    policies,
    profiles,
    workflow,
  };
}
