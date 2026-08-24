import { isDeepStrictEqual } from 'node:util';
import { projectAdapterContext } from '../adapters/projection.mjs';

function serializedBytes(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

export function evaluateAdapterParity(context, adapterIds, capabilities = []) {
  if (!Array.isArray(adapterIds) || adapterIds.length < 2) {
    throw new Error('Adapter parity evaluation requires at least two adapter paths');
  }

  const projections = adapterIds.map((adapterId) => projectAdapterContext(adapterId, context, capabilities));
  const baseline = projections[0];
  const failures = [];

  for (const projection of projections.slice(1)) {
    if (!isDeepStrictEqual(projection.semantic, baseline.semantic)) {
      failures.push({ adapter: projection.adapter, invariant: 'semantic-parity' });
    }
    if (!isDeepStrictEqual(projection.capabilities, baseline.capabilities)) {
      failures.push({ adapter: projection.adapter, invariant: 'capability-parity' });
    }
  }

  return {
    status: failures.length === 0 ? 'pass' : 'fail',
    semantic: baseline.semantic,
    adapters: projections.map((projection) => ({
      id: projection.adapter,
      route: projection.route,
      context_bytes: serializedBytes(projection),
    })),
    failures,
  };
}
