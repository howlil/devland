import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { validateCanonical } from './runtime.mjs';

const DOCTOR_CATEGORIES = [
  'project-model drift',
  'stack/runtime drift',
  'architecture-document drift',
  'stale work state',
  'adapter duplication/divergence',
  'invalid/missing referenced files',
  'policy conflict',
  'missing verification evidence for claimed-done work',
  'over-generated context with no current applicability',
];

export function classifyProbeError(error) {
  return error?.code === 'ENOENT' || error?.code === 'ENOTDIR' ? 'absent' : 'inaccessible';
}

async function probeRepositoryPath(root, relativePath) {
  try {
    await access(path.join(root, relativePath));
    return { status: 'present', path: relativePath };
  } catch (error) {
    return {
      status: classifyProbeError(error),
      path: relativePath,
      error_code: error?.code ?? null,
    };
  }
}

async function readJsonEvidence(root, relativePath) {
  const probe = await probeRepositoryPath(root, relativePath);
  if (probe.status !== 'present') return { value: null, issue: probe.status === 'inaccessible' ? probe : null };
  try {
    return { value: JSON.parse(await readFile(path.join(root, relativePath), 'utf8')), issue: null };
  } catch (error) {
    return {
      value: null,
      issue: { status: 'inaccessible', path: relativePath, error_code: error?.code ?? 'INVALID_JSON' },
    };
  }
}

async function collectFiles(root, relativePath) {
  const probe = await probeRepositoryPath(root, relativePath);
  if (probe.status === 'absent') return { files: [], issues: [] };
  if (probe.status === 'inaccessible') return { files: [], issues: [probe] };

  let entries;
  try {
    entries = await readdir(path.join(root, relativePath), { withFileTypes: true });
  } catch (error) {
    return {
      files: [],
      issues: [{ status: 'inaccessible', path: relativePath, error_code: error?.code ?? null }],
    };
  }

  const files = [];
  const issues = [];
  for (const entry of entries) {
    const child = path.posix.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(root, child);
      files.push(...nested.files);
      issues.push(...nested.issues);
    } else if (entry.isFile()) {
      files.push(child);
    }
  }
  return { files, issues };
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

async function detectStackCheck(projectRoot, project) {
  const findings = [];
  const issues = [];
  const packageEvidence = await readJsonEvidence(projectRoot, 'package.json');
  if (packageEvidence.issue) issues.push(packageEvidence.issue);

  const sourceResults = await Promise.all([
    collectFiles(projectRoot, 'src'),
    collectFiles(projectRoot, 'bin'),
  ]);
  const sourceFiles = sourceResults.flatMap((result) => result.files);
  issues.push(...sourceResults.flatMap((result) => result.issues));

  const javascriptEvidence = sourceFiles.filter((file) => /\.(?:mjs|cjs|js|jsx)$/i.test(file));
  const canonicalLanguages = normalized(project.stack?.languages);
  const canonicalRuntimes = normalized(project.stack?.runtimes);

  if (javascriptEvidence.length > 0 && !canonicalLanguages.has('javascript')) {
    findings.push(stackFinding('languages', project.stack?.languages ?? [], 'javascript', javascriptEvidence));
  }

  const nodeEvidence = [];
  if (packageEvidence.value?.bin || packageEvidence.value?.type === 'module') nodeEvidence.push('package.json');

  const workflows = await collectFiles(projectRoot, '.github/workflows');
  issues.push(...workflows.issues);
  for (const file of workflows.files) {
    if (!/\.ya?ml$/i.test(file)) continue;
    try {
      const text = await readFile(path.join(projectRoot, file), 'utf8');
      if (/setup-node|node-version/i.test(text)) nodeEvidence.push(file);
    } catch (error) {
      issues.push({ status: 'inaccessible', path: file, error_code: error?.code ?? null });
    }
  }

  if (nodeEvidence.length > 0 && !canonicalRuntimes.has('node')) {
    findings.push(stackFinding('runtimes', project.stack?.runtimes ?? [], 'node', [...new Set(nodeEvidence)]));
  }

  return {
    category: 'stack/runtime drift',
    status: findings.length > 0 ? 'findings' : issues.length > 0 ? 'partial' : 'clean',
    findings,
    uncertainty: issues,
  };
}

async function detectReferenceCheck(projectRoot, project) {
  const document = project.architecture?.document;
  if (!document) {
    return { category: 'invalid/missing referenced files', status: 'clean', findings: [], uncertainty: [] };
  }

  const probe = await probeRepositoryPath(projectRoot, document);
  if (probe.status === 'present') {
    return { category: 'invalid/missing referenced files', status: 'clean', findings: [], uncertainty: [] };
  }
  if (probe.status === 'inaccessible') {
    return { category: 'invalid/missing referenced files', status: 'partial', findings: [], uncertainty: [probe] };
  }

  const finding = {
    category: 'invalid/missing referenced files',
    evidence: [document],
    canonical: document,
    observed: ['missing'],
    recommendation: 'Restore the referenced architecture document or update architecture.document to an existing canonical document.',
  };
  return {
    category: 'invalid/missing referenced files',
    status: 'findings',
    findings: [finding],
    uncertainty: [],
  };
}

function notEvaluated(category) {
  return { category, status: 'not_evaluated', findings: [], uncertainty: [] };
}

function aggregateStatus(checks, findings) {
  if (findings.length > 0) return 'findings';
  if (checks.some((check) => check.status !== 'clean')) return 'partial';
  return 'clean';
}

export async function doctorProject(projectRoot = process.cwd()) {
  const validation = await validateCanonical(projectRoot);
  if (!validation.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(validation.errors)}`);
  }

  const supported = new Map();
  const stackCheck = await detectStackCheck(projectRoot, validation.project);
  const referenceCheck = await detectReferenceCheck(projectRoot, validation.project);
  supported.set(stackCheck.category, stackCheck);
  supported.set(referenceCheck.category, referenceCheck);

  const checks = DOCTOR_CATEGORIES.map((category) => supported.get(category) ?? notEvaluated(category));
  const findings = checks.flatMap((check) => check.findings);

  return {
    status: aggregateStatus(checks, findings),
    findings,
    checks,
  };
}
