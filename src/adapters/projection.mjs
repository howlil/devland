const ADAPTER_ROUTES = new Map([
  ['generic', 'adapters/generic/README.md'],
  ['agents-md', 'adapters/agents-md/AGENTS.template.md'],
]);

function ids(entries = []) {
  return entries.map((entry) => entry.id).sort();
}

function normalizedCapabilities(capabilities = []) {
  if (!Array.isArray(capabilities)) throw new Error('Adapter capabilities must be an array');
  return [...new Set(capabilities.map((capability) => {
    if (typeof capability !== 'string' || capability.trim() === '') {
      throw new Error('Adapter capabilities must be non-empty strings');
    }
    return capability.trim();
  }))].sort();
}

export function projectAdapterContext(adapterId, context, capabilities = []) {
  const route = ADAPTER_ROUTES.get(adapterId);
  if (!route) throw new Error(`Unknown Devland adapter: ${adapterId}`);

  return {
    adapter: adapterId,
    route,
    semantic: {
      canonical: {
        project: context.project.path,
        state: context.state.path,
      },
      workflow: {
        id: context.workflow.id,
        path: context.workflow.path,
      },
      policies: ids(context.policies),
      profiles: ids(context.profiles),
      execution: context.execution ?? { lane: 'rapid', signals: [] },
    },
    capabilities: normalizedCapabilities(capabilities),
  };
}
