import assert from 'node:assert/strict';
import test from 'node:test';
import { invokeDevlandContextTool, DEVLAND_CONTEXT_TOOL } from '../../src/adapters/openai/mcp.mjs';
import { resolveContext } from '../../src/runtime.mjs';

const change = { signals: ['security-boundary'] };

test('OpenAI MCP context tool delegates develop-change semantics to Devland Core', async () => {
  const expected = await resolveContext(
    'develop-change',
    process.cwd(),
    process.cwd(),
    change,
  );

  const actual = await invokeDevlandContextTool(
    { projectRoot: process.cwd(), change },
    { devlandRoot: process.cwd() },
  );

  assert.deepEqual(actual, expected);
  assert.equal(actual.execution.lane, 'deliberate');
  assert.equal(actual.profiles.some((profile) => profile.id === 'qualities.security-sensitive'), true);
});

test('OpenAI MCP context tool fixes the workflow boundary to develop-change', async () => {
  const calls = [];
  const resolve = async (...args) => {
    calls.push(args);
    return { ok: true };
  };

  const result = await invokeDevlandContextTool(
    { projectRoot: '/repo', change },
    { devlandRoot: '/devland', resolve },
  );

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls, [[
    'develop-change',
    '/repo',
    '/devland',
    change,
  ]]);
});

test('OpenAI MCP descriptor exposes one narrow read-only context capability', () => {
  assert.equal(DEVLAND_CONTEXT_TOOL.name, 'devland_context');
  assert.equal(DEVLAND_CONTEXT_TOOL.inputSchema.additionalProperties, false);
  assert.deepEqual(Object.keys(DEVLAND_CONTEXT_TOOL.inputSchema.properties).sort(), ['change', 'projectRoot']);
});
