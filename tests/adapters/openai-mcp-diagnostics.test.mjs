import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEVLAND_DOCTOR_TOOL,
  DEVLAND_VALIDATE_TOOL,
  invokeDevlandDoctorTool,
  invokeDevlandValidateTool,
} from '../../src/adapters/openai/mcp.mjs';
import { doctorProject } from '../../src/doctor.mjs';
import { validateCanonical } from '../../src/runtime.mjs';

test('OpenAI MCP validate tool preserves Devland Core validation semantics', async () => {
  const expected = await validateCanonical(process.cwd(), process.cwd());
  const actual = await invokeDevlandValidateTool(
    { projectRoot: process.cwd() },
    { devlandRoot: process.cwd() },
  );

  assert.deepEqual(actual, expected);
  assert.equal(actual.valid, true);
});

test('OpenAI MCP validate tool delegates without inventing validation behavior', async () => {
  const calls = [];
  const validate = async (...args) => {
    calls.push(args);
    return { valid: false, errors: [{ message: 'fixture' }] };
  };

  const result = await invokeDevlandValidateTool(
    { projectRoot: '/repo' },
    { devlandRoot: '/devland', validate },
  );

  assert.deepEqual(result, { valid: false, errors: [{ message: 'fixture' }] });
  assert.deepEqual(calls, [['/repo', '/devland']]);
});

test('OpenAI MCP validate tool preserves the Core package root default', async () => {
  const calls = [];
  const validate = async (...args) => {
    calls.push(args);
    return { valid: true };
  };

  await invokeDevlandValidateTool({ projectRoot: '/consumer-repo' }, { validate });

  assert.deepEqual(calls, [['/consumer-repo', undefined]]);
});

test('OpenAI MCP doctor tool preserves Devland Core diagnostic semantics', async () => {
  const expected = await doctorProject(process.cwd());
  const actual = await invokeDevlandDoctorTool({ projectRoot: process.cwd() });

  assert.deepEqual(actual, expected);
});

test('OpenAI MCP doctor tool delegates repository diagnostics to Core', async () => {
  const calls = [];
  const doctor = async (...args) => {
    calls.push(args);
    return { status: 'partial', findings: [], checks: [] };
  };

  const result = await invokeDevlandDoctorTool({ projectRoot: '/repo' }, { doctor });

  assert.deepEqual(result, { status: 'partial', findings: [], checks: [] });
  assert.deepEqual(calls, [['/repo']]);
});

test('diagnostic MCP descriptors expose only a project root input', () => {
  for (const descriptor of [DEVLAND_VALIDATE_TOOL, DEVLAND_DOCTOR_TOOL]) {
    assert.equal(descriptor.inputSchema.additionalProperties, false);
    assert.deepEqual(Object.keys(descriptor.inputSchema.properties), ['projectRoot']);
  }

  assert.equal(DEVLAND_VALIDATE_TOOL.name, 'devland_validate');
  assert.equal(DEVLAND_DOCTOR_TOOL.name, 'devland_doctor');
});
