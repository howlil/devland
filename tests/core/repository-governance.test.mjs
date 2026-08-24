import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function read(path) {
  return readFile(path, 'utf8');
}

test('CI verifies Devland on Linux Windows and macOS with Node 22', async () => {
  const workflow = await read('.github/workflows/ci.yml');

  for (const os of ['ubuntu-latest', 'windows-latest', 'macos-latest']) {
    assert.equal(workflow.includes(os), true, `CI missing ${os}`);
  }
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /matrix\.os|\$\{\{\s*matrix\.os\s*\}\}/);
});

test('repository documents a private security reporting path', async () => {
  const security = await read('SECURITY.md');

  assert.match(security, /private vulnerability reporting|security advis/i);
  assert.match(security, /do not|don't|never/i);
  assert.match(security, /public issue|publicly|public disclosure/i);
  assert.match(security, /secret|credential|exploit/i);
});
