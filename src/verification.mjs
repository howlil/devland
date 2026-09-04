const MATERIAL_RISK_SIGNALS = new Set([
  'security-boundary',
  'irreversible-migration',
  'data-loss-risk',
  'concurrency-semantics',
  'compatibility-break',
]);

const STATIC_INSUFFICIENT_SIGNALS = new Set([
  'security-boundary',
  'irreversible-migration',
  'data-loss-risk',
  'concurrency-semantics',
]);

function warning(code, message) {
  return { code, severity: 'warning', message };
}

function matchingSignals(signals, set) {
  return signals.filter((signal) => set.has(signal));
}

export function verificationDiagnostics(verification, execution) {
  if (!verification) return [];

  const diagnostics = [];
  const signals = execution?.signals ?? [];
  const materialSignals = matchingSignals(signals, MATERIAL_RISK_SIGNALS);
  const staticInsufficientSignals = matchingSignals(signals, STATIC_INSUFFICIENT_SIGNALS);

  if (materialSignals.length > 0 && verification.criticality !== 'critical') {
    diagnostics.push(warning(
      'criticality-understates-risk',
      `Verification criticality ${verification.criticality} understates material change risk from: ${materialSignals.join(', ')}.`,
    ));
  }

  if (verification.boundary === 'static' && staticInsufficientSignals.length > 0) {
    diagnostics.push(warning(
      'insufficient-verification-boundary',
      `Static-only verification does not directly exercise material runtime risk from: ${staticInsufficientSignals.join(', ')}.`,
    ));
  }

  if (verification.criticality === 'peripheral' && verification.boundary === 'journey') {
    diagnostics.push(warning(
      'over-verification',
      'Journey/E2E verification is unusually broad for peripheral behavior; prefer a cheaper boundary unless it provides unique confidence.',
    ));
  }

  if (verification.cost === 'expensive' && execution?.lane === 'rapid') {
    diagnostics.push(warning(
      'expensive-rapid-verification',
      'Expensive verification exceeds the normal rapid-lane feedback budget; keep it only when affected scope or a distinct material risk justifies the cost.',
    ));
  }

  return diagnostics;
}
