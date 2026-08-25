import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { validateCanonical } from './runtime.mjs';

const PROJECT_PATH = '.devland/project.yaml';
const STATE_PATH = '.devland/state.yaml';
const CURRENT_CONTRACT = '1';

async function exists(root, relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return false;
    throw error;
  }
}

function minimalProject(projectName) {
  if (typeof projectName !== 'string' || projectName.trim() === '') {
    throw new Error('Devland init requires a project name');
  }
  return {
    schema: 'devland.project/v0',
    devland: { contract: CURRENT_CONTRACT },
    project: { name: projectName.trim(), types: [] },
    product: { purpose: '', priorities: [], non_goals: [] },
    platforms: [],
    stack: { languages: [], frameworks: [], runtimes: [], data_stores: [] },
    architecture: { style: null, document: null },
    qualities: [],
    profiles: [],
    delivery: { model: null },
    constraints: [],
  };
}

function minimalState() {
  return {
    schema: 'devland.state/v0',
    active_work: [],
    blocked: [],
    recently_completed: [],
    open_decisions: [],
  };
}

export async function initializeProject(projectName, projectRoot = process.cwd()) {
  const existing = [];
  for (const relativePath of [PROJECT_PATH, STATE_PATH]) {
    if (await exists(projectRoot, relativePath)) existing.push(relativePath);
  }
  if (existing.length > 0) {
    throw new Error(`Devland canonical state already exists; refusing to overwrite: ${existing.join(', ')}`);
  }

  const directory = path.join(projectRoot, '.devland');
  const projectPath = path.join(projectRoot, PROJECT_PATH);
  const statePath = path.join(projectRoot, STATE_PATH);
  await mkdir(directory, { recursive: true });

  try {
    await writeFile(projectPath, YAML.stringify(minimalProject(projectName)), { encoding: 'utf8', flag: 'wx' });
    await writeFile(statePath, YAML.stringify(minimalState()), { encoding: 'utf8', flag: 'wx' });
    const validation = await validateCanonical(projectRoot);
    if (!validation.valid) throw new Error(`Initialized canonical context is invalid: ${JSON.stringify(validation.errors)}`);
  } catch (error) {
    await rm(projectPath, { force: true });
    await rm(statePath, { force: true });
    throw error;
  }

  return {
    initialized: true,
    contract: CURRENT_CONTRACT,
    files: [PROJECT_PATH, STATE_PATH],
  };
}

export async function migrateProject(projectRoot = process.cwd()) {
  const projectPath = path.join(projectRoot, PROJECT_PATH);
  const original = await readFile(projectPath, 'utf8');
  const project = YAML.parse(original);

  if (project?.schema !== 'devland.project/v0') {
    throw new Error(`Unsupported Devland project schema for migration: ${project?.schema ?? 'missing'}`);
  }

  const contract = project?.devland?.contract;
  if (contract === CURRENT_CONTRACT) {
    const validation = await validateCanonical(projectRoot);
    if (!validation.valid) throw new Error(`Canonical context is invalid: ${JSON.stringify(validation.errors)}`);
    return { changed: false, from: CURRENT_CONTRACT, to: CURRENT_CONTRACT, path: PROJECT_PATH };
  }
  if (contract !== undefined && contract !== null) {
    throw new Error(`Unsupported Devland contract ${contract}; refusing to downgrade or rewrite it`);
  }

  const { schema, ...rest } = project;
  const migrated = { schema, devland: { contract: CURRENT_CONTRACT }, ...rest };
  await writeFile(projectPath, YAML.stringify(migrated), 'utf8');

  const validation = await validateCanonical(projectRoot);
  if (!validation.valid) {
    await writeFile(projectPath, original, 'utf8');
    throw new Error(`Migrated canonical context is invalid; original restored: ${JSON.stringify(validation.errors)}`);
  }

  return {
    changed: true,
    from: 'legacy-v0-without-contract',
    to: CURRENT_CONTRACT,
    path: PROJECT_PATH,
  };
}
