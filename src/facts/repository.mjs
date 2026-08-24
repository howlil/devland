import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export function classifyProbeError(error) {
  return error?.code === 'ENOENT' || error?.code === 'ENOTDIR' ? 'absent' : 'inaccessible';
}

export async function probeRepositoryPath(root, relativePath) {
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
  if (probe.status !== 'present') {
    return { value: null, issue: probe.status === 'inaccessible' ? probe : null };
  }
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

function addFact(target, kind, value, evidence) {
  if (evidence.length === 0) return;
  const key = `${kind}:${value}`;
  const existing = target.get(key) ?? { kind, value, evidence: [] };
  existing.evidence = [...new Set([...existing.evidence, ...evidence])].sort();
  target.set(key, existing);
}

async function detectJavaScriptAndNode(root, facts, uncertainty) {
  const packageEvidence = await readJsonEvidence(root, 'package.json');
  if (packageEvidence.issue) uncertainty.push(packageEvidence.issue);

  const sourceResults = await Promise.all([
    collectFiles(root, 'src'),
    collectFiles(root, 'bin'),
  ]);
  uncertainty.push(...sourceResults.flatMap((result) => result.issues));
  const sourceFiles = sourceResults.flatMap((result) => result.files);
  addFact(
    facts,
    'language',
    'javascript',
    sourceFiles.filter((file) => /\.(?:mjs|cjs|js|jsx)$/i.test(file)),
  );

  const nodeEvidence = [];
  if (packageEvidence.value?.bin || packageEvidence.value?.type === 'module') nodeEvidence.push('package.json');

  const workflows = await collectFiles(root, '.github/workflows');
  uncertainty.push(...workflows.issues);
  for (const file of workflows.files) {
    if (!/\.ya?ml$/i.test(file)) continue;
    try {
      const text = await readFile(path.join(root, file), 'utf8');
      if (/setup-node|node-version/i.test(text)) nodeEvidence.push(file);
    } catch (error) {
      uncertainty.push({ status: 'inaccessible', path: file, error_code: error?.code ?? null });
    }
  }
  addFact(facts, 'runtime', 'node', nodeEvidence);
}

async function detectGo(root, facts, uncertainty) {
  const probe = await probeRepositoryPath(root, 'go.mod');
  if (probe.status === 'inaccessible') {
    uncertainty.push(probe);
    return;
  }
  if (probe.status !== 'present') return;
  addFact(facts, 'language', 'go', ['go.mod']);
  addFact(facts, 'runtime', 'go', ['go.mod']);
}

export async function collectRepositoryFacts(root = process.cwd()) {
  const facts = new Map();
  const uncertainty = [];

  await detectJavaScriptAndNode(root, facts, uncertainty);
  await detectGo(root, facts, uncertainty);

  return {
    facts: [...facts.values()].sort((a, b) => `${a.kind}:${a.value}`.localeCompare(`${b.kind}:${b.value}`)),
    uncertainty,
  };
}
