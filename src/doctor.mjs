import { collectRepositoryFacts, classifyProbeError, probeRepositoryPath } from './facts/repository.mjs';
import { validateCanonical } from './runtime.mjs';

export { classifyProbeError };

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

const STACK_FIELD_BY_FACT_KIND = new Map([
  ['language', 'languages'],
  ['runtime', 'runtimes'],
]);

function normalized(values = []) {
  return new Set(values.map((value) => String(value).toLowerCase()));
}

function stackFinding(field, canonical, fact) {
  return {
    category: 'stack/runtime drift',
    evidence: fact.evidence,
    canonical,
    observed: [fact.value],
    recommendation: `Add ${fact.value} to stack.${field}.`,
  };
}

async function detectStackCheck(projectRoot, project) {
  const evidence = await collectRepositoryFacts(projectRoot);
  const findings = [];

  for (const fact of evidence.facts) {
    const field = STACK_FIELD_BY_FACT_KIND.get(fact.kind);
    if (!field) continue;
    const canonical = project.stack?.[field] ?? [];
    if (!normalized(canonical).has(String(fact.value).toLowerCase())) {
      findings.push(stackFinding(field, canonical, fact));
    }
  }

  return {
    category: 'stack/runtime drift',
    status: findings.length > 0 ? 'findings' : evidence.uncertainty.length > 0 ? 'partial' : 'clean',
    findings,
    uncertainty: evidence.uncertainty,
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
