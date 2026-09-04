import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { doctorProject } from '../../../src/doctor.mjs';
import { flowReport } from '../../../src/metrics.mjs';

function canonicalYaml(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty YAML string`);
  }
  return value;
}

function safeSnapshotPath(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('repository snapshot paths must be non-empty strings');
  }

  const candidate = value.replaceAll('\\', '/');
  if (path.posix.isAbsolute(candidate) || path.win32.isAbsolute(value)) {
    throw new Error(`repository snapshot path must be relative: ${value}`);
  }

  const segments = candidate.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`repository snapshot path is unsafe: ${value}`);
  }

  const normalized = path.posix.normalize(candidate);
  if (normalized === '.devland' || normalized.startsWith('.devland/')) {
    throw new Error('repository snapshot cannot override .devland canonical or runtime files');
  }
  return normalized;
}

async function withPortableProject({
  projectYaml,
  stateYaml,
  repositoryFiles = [],
  eventsNdjson = '',
}, callback) {
  const project = canonicalYaml(projectYaml, 'projectYaml');
  const state = canonicalYaml(stateYaml, 'stateYaml');
  if (typeof eventsNdjson !== 'string') throw new Error('eventsNdjson must be a string');
  if (!Array.isArray(repositoryFiles)) throw new Error('repositoryFiles must be an array');

  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'devland-feedback-'));
  try {
    await mkdir(path.join(projectRoot, '.devland', 'runtime'), { recursive: true });
    await Promise.all([
      writeFile(path.join(projectRoot, '.devland', 'project.yaml'), project, 'utf8'),
      writeFile(path.join(projectRoot, '.devland', 'state.yaml'), state, 'utf8'),
    ]);

    for (const file of repositoryFiles) {
      const relativePath = safeSnapshotPath(file?.path);
      const content = file?.content ?? '';
      if (typeof content !== 'string') throw new Error(`repository snapshot content must be text: ${relativePath}`);
      const destination = path.join(projectRoot, ...relativePath.split('/'));
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, content, 'utf8');
    }

    if (eventsNdjson.trim() !== '') {
      await writeFile(path.join(projectRoot, '.devland', 'runtime', 'events.ndjson'), eventsNdjson, 'utf8');
    }

    return await callback(projectRoot);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
}

export async function flowReportFromEvidence({ projectYaml, stateYaml, eventsNdjson = '' }) {
  return withPortableProject({ projectYaml, stateYaml, eventsNdjson }, (projectRoot) => flowReport(projectRoot));
}

export async function doctorFromSnapshot({ projectYaml, stateYaml, repositoryFiles = [] }) {
  return withPortableProject({ projectYaml, stateYaml, repositoryFiles }, (projectRoot) => doctorProject(projectRoot));
}
