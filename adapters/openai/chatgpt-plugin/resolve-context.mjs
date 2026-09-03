import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { toPortableContext } from '../../../src/context-contract.mjs';
import { resolveContext } from '../../../src/runtime.mjs';

function canonicalYaml(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty YAML string`);
  }
  return value;
}

export async function resolvePortableContextFromYaml({
  projectYaml,
  stateYaml,
  workflow = 'develop-change',
  change = null,
  work = null,
}) {
  const project = canonicalYaml(projectYaml, 'projectYaml');
  const state = canonicalYaml(stateYaml, 'stateYaml');
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'devland-plugin-'));
  const canonicalRoot = path.join(projectRoot, '.devland');

  try {
    await mkdir(canonicalRoot, { recursive: true });
    await Promise.all([
      writeFile(path.join(canonicalRoot, 'project.yaml'), project, 'utf8'),
      writeFile(path.join(canonicalRoot, 'state.yaml'), state, 'utf8'),
    ]);

    const resolved = await resolveContext(workflow, projectRoot, undefined, change, work);
    return toPortableContext(resolved);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
}
