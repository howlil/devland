import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function read(path) {
  return readFile(path, 'utf8');
}

test('default CI is fast while explicit cross-platform verification remains available', async () => {
  const fastWorkflow = await read('.github/workflows/ci.yml');
  const crossPlatformWorkflow = await read('.github/workflows/cross-platform.yml');

  assert.match(fastWorkflow, /ubuntu-latest/);
  assert.equal(fastWorkflow.includes('windows-latest'), false, 'default CI should not pay Windows cost');
  assert.equal(fastWorkflow.includes('macos-latest'), false, 'default CI should not pay macOS cost');
  assert.match(fastWorkflow, /node-version:\s*22/);
  assert.match(fastWorkflow, /npm ci/);
  assert.match(fastWorkflow, /npm test/);

  for (const os of ['ubuntu-latest', 'windows-latest', 'macos-latest']) {
    assert.equal(crossPlatformWorkflow.includes(os), true, `cross-platform workflow missing ${os}`);
  }
  assert.match(crossPlatformWorkflow, /workflow_dispatch/);
  assert.match(crossPlatformWorkflow, /node-version:\s*22/);
  assert.match(crossPlatformWorkflow, /npm ci/);
  assert.match(crossPlatformWorkflow, /npm test/);
});

test('repository documents a private security reporting path', async () => {
  const security = await read('SECURITY.md');

  assert.match(security, /private vulnerability reporting|security advis/i);
  assert.match(security, /do not|don't|never/i);
  assert.match(security, /public issue|publicly|public disclosure/i);
  assert.match(security, /secret|credential|exploit/i);
});
