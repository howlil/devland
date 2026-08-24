import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { validateCanonical } from './runtime.mjs';

async function exists(root, relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(root, relativePath) {
  if (!(await exists(root, relativePath))) return null;
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

async function collectFiles(root, relativePath) {
  if (!(await exists(root, relativePath))) return [];
  const entries = await readdir(path.join(root, relativePath), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.posix.join(relativePath, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(root, child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function normalized(values = []) {
  return new Set(values.map((value) => String(value).toLowerCase()));
}

function stackFinding(kind, canonical, observed, evidence) {
  return {
    category: 'stack/runtime drift',
    evidence,
    canonical,
    observed: [observed],
    recommendation: `Add ${observed} to stack.${kind}.`,
  };
}

async function detectStackFindings(projectRoot, project) {
  const findings = [];
  const packageJson = await readJsonIfPresent(projectRoot, 'package.json');
  const sourceFiles = [
    ...await collectFiles(projectRoot, 'src'),
    ...await collectFiles(projectRoot, 'bin'),
  ];
  const javascriptEvidence = sourceFiles.filter((file) => /\.(?:mjs|cjs|js|jsx)$/i.test(file));
  const canonicalLanguages = normalized(project.stack?.languages);
  const canonicalRuntimes = normalized(project.stack?.runtimes);

  if (javascriptEvidence.length > 0 && !canonicalLanguages.has('javascript')) {
    findings.push(stackFinding('languages', project.stack?.languages ?? [], 'javascript', javascriptEvidence));
  }

  const nodeEvidence = [];
  if (packageJson?.bin || packageJson?.type === 'module') nodeEvidence.push('package.json');

  for (const directory of ['.github/workflows']) {
    for (const file of await collectFiles(projectRoot, directory)) {
      if (!/\.ya?ml$/i.test(file)) continue;
      const text = await readFile(path.join(projectRoot, file), 'utf8');
      if (/setup-node|node-version/i.test(text)) nodeEvidence.push(file);
    }
  }

  if (nodeEvidence.length > 0 && !canonicalRuntimes.has('node')) {
    findings.push(stackFinding('runtimes', project.stack?.runtimes ?? [], 'node', [...new Set(nodeEvidence)]));
  }

  return findings;
}

async function detectReferenceFindings(projectRoot, project) {
  const document = project.architecture?.document;
  if (!document || await exists(projectRoot, document)) return [];
  return [{
    category: 'invalid/missing referenced files',
    evidence: [document],
    canonical: document,
    observed: ['missing'],
    recommendation: 'Restore the referenced architecture document or update architecture.document to an existing canonical document.',
  }];
}

export async function doctorProject(projectRoot = process.cwd()) {
  const validation = await validateCanonical(projectRoot);
  if (!validation.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(validation.errors)}`);
  }

  const findings = [
    ...await detectStackFindings(projectRoot, validation.project),
    ...await detectReferenceFindings(projectRoot, validation.project),
  ];

  return {
    healthy: findings.length === 0,
    findings,
  };
}
