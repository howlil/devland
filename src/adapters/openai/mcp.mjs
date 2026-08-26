import { doctorProject } from '../../doctor.mjs';
import { resolveContext, validateCanonical } from '../../runtime.mjs';

function projectRootInputSchema() {
  return Object.freeze({
    type: 'object',
    additionalProperties: false,
    properties: {
      projectRoot: { type: 'string', minLength: 1 },
    },
  });
}

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

export const DEVLAND_VALIDATE_TOOL = Object.freeze({
  name: 'devland_validate',
  description: 'Validate canonical Devland project and work-state files.',
  inputSchema: projectRootInputSchema(),
});

export const DEVLAND_DOCTOR_TOOL = Object.freeze({
  name: 'devland_doctor',
  description: 'Detect deterministic repository drift supported by Devland Core.',
  inputSchema: projectRootInputSchema(),
});

/**
 * Thin MCP-facing projection over Devland Core context resolution.
 *
 * This adapter intentionally owns no workflow, policy, profile, risk, or
 * verification semantics. Those remain in resolveContext/Core.
 */
export async function invokeDevlandContextTool(
  input = {},
  { devlandRoot, resolve = resolveContext } = {},
) {
  const projectRoot = input.projectRoot ?? process.cwd();
  const change = input.change ?? null;

  return resolve('develop-change', projectRoot, devlandRoot, change);
}

/** Thin projection over canonical validation; schema and semantic rules stay in Core. */
export async function invokeDevlandValidateTool(
  input = {},
  { devlandRoot, validate = validateCanonical } = {},
) {
  const projectRoot = input.projectRoot ?? process.cwd();
  return validate(projectRoot, devlandRoot);
}

/** Thin projection over deterministic repository diagnostics implemented by Core. */
export async function invokeDevlandDoctorTool(
  input = {},
  { doctor = doctorProject } = {},
) {
  const projectRoot = input.projectRoot ?? process.cwd();
  return doctor(projectRoot);
}
