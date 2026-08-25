import { collectRepositoryFacts, classifyProbeError, probeRepositoryPath } from './facts/repository.mjs';
import { evaluateAdapterParity } from './evals/adapters.mjs';
import { resolveContext, validateCanonical } from './runtime.mjs';

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

const UNEVALUATED_REQUIREMENTS = {
  'project-model drift': {
    reason: 'No deterministic project-fact detector currently compares broader canonical product/project facts with repository evidence.',
    required_evidence: ['normalized repository facts beyond stack/runtime'],
  },
  'architecture-document drift': {
    reason: 'Doctor currently checks referenced architecture-document presence, not semantic agreement between the document and observable architecture.',
    required_evidence: ['architecture document semantics', 'normalized observable architecture facts'],
  },
  'stale work state': {
    reason: 'Canonical work state cannot be declared stale without deterministic work-lifecycle evidence from VCS or a provider.',
    required_evidence: ['VCS or provider work-lifecycle evidence'],
  },
  'policy conflict': {
    reason: 'Policy conflict requires deterministic policy-semantic comparison with applicable repository behavior or configuration.',
    required_evidence: ['resolved policy semantics', 'observable repository behavior or configuration'],
  },
  'over-generated context with no current applicability': {
    reason: 'Context over-generation requires evidence about which resolved context was projected for the current workflow/change.',
    required_evidence: ['resolved workflow/change context', 'adapter projection applicability evidence'],
  },
};

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

async function detectAdapterDivergenceCheck(projectRoot) {
  try {
    const context = await resolveContext('develop-change', projectRoot);
    const parity = evaluateAdapterParity(context, ['generic', 'agents-md']);
    const findings = parity.failures.map((failure) => ({
      category: 'adapter duplication/divergence',
      evidence: [failure.adapter],
      canonical: 'generic and agents-md projections preserve identical engineering semantics and capabilities',
      observed: [failure.invariant],
      recommendation: 'Make adapter projection logic preserve the same canonical semantics and capability set across adapter paths.',
    }));
    return {
      category: 'adapter duplication/divergence',
      status: findings.length > 0 ? 'findings' : 'clean',
      findings,
      uncertainty: [],
    };
  } catch (error) {
    return {
      category: 'adapter duplication/divergence',
      status: 'partial',
      findings: [],
      uncertainty: [{
        evidence: ['develop-change', 'generic', 'agents-md'],
        message: error instanceof Error ? error.message : String(error),
      }],
    };
  }
}

function detectVerificationEvidenceCheck(state) {
  const findings = [];
  for (const item of state.recently_completed ?? []) {
    if (item.status !== 'done') continue;
    const evidence = item.artifacts?.evidence ?? [];
    if (evidence.length > 0) continue;
    findings.push({
      category: 'missing verification evidence for claimed-done work',
      evidence: [],
      canonical: item.id,
      observed: ['status: done', 'artifacts.evidence: empty'],
      recommendation: 'Attach fresh verification evidence to the completed work item or move it out of claimed-done state.',
    });
  }

  return {
    category: 'missing verification evidence for claimed-done work',
    status: findings.length > 0 ? 'findings' : 'clean',
    findings,
    uncertainty: [],
  };
}

function notEvaluated(category) {
  const requirement = UNEVALUATED_REQUIREMENTS[category] ?? {
    reason: 'No deterministic evaluator is implemented for this doctor category.',
    required_evidence: ['category-specific deterministic evidence'],
  };
  return {
    category,
    status: 'not_evaluated',
    findings: [],
    uncertainty: [],
    reason: requirement.reason,
    required_evidence: requirement.required_evidence,
  };
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
  const adapterDivergenceCheck = await detectAdapterDivergenceCheck(projectRoot);
  const verificationEvidenceCheck = detectVerificationEvidenceCheck(validation.state);
  supported.set(stackCheck.category, stackCheck);
  supported.set(referenceCheck.category, referenceCheck);
  supported.set(adapterDivergenceCheck.category, adapterDivergenceCheck);
  supported.set(verificationEvidenceCheck.category, verificationEvidenceCheck);

  const checks = DOCTOR_CATEGORIES.map((category) => supported.get(category) ?? notEvaluated(category));
  const findings = checks.flatMap((check) => check.findings);

  return {
    status: aggregateStatus(checks, findings),
    findings,
    checks,
  };
}
