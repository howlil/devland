import { resolveContext } from '../../runtime.mjs';

export const DEVLAND_CONTEXT_TOOL = Object.freeze({
  name: 'devland_context',
  description: 'Resolve Devland engineering context for a develop-change workflow.',
  inputSchema: Object.freeze({
    type: 'object',
    additionalProperties: false,
    properties: {
      projectRoot: { type: 'string', minLength: 1 },
      change: { type: ['object', 'null'] },
    },
  }),
});

/**
 * Thin MCP-facing projection over Devland Core context resolution.
 *
 * This adapter intentionally owns no workflow, policy, profile, risk, or
 * verification semantics. Those remain in resolveContext/Core.
 */
export async function invokeDevlandContextTool(
  input = {},
  { devlandRoot = process.cwd(), resolve = resolveContext } = {},
) {
  const projectRoot = input.projectRoot ?? process.cwd();
  const change = input.change ?? null;

  return resolve('develop-change', projectRoot, devlandRoot, change);
}
