import assert from 'node:assert/strict';
import test from 'node:test';
import { readText } from '../helpers/files.mjs';
import { parseFrontmatter } from '../helpers/frontmatter.mjs';

const workflowPath = 'core/workflows/develop-change.md';
const engineeringPath = 'core/policies/engineering.md';
const gitPath = 'core/policies/git.md';

test('develop-change executes the v1 rapid XP feedback loop', async () => {
  const { body } = parseFrontmatter(await readText(workflowPath));

  assert.match(body, /smallest valuable slice/i);
  assert.match(body, /RED\s*(?:->|→)\s*GREEN\s*(?:->|→)\s*REFACTOR/i);
  assert.match(body, /repeat|next independently useful increment/i);
  assert.match(body, /fastest relevant|focused verification|fast feedback/i);
  assert.match(body, /integrate.*as soon|integrate.*promptly|frequent integration/is);
  assert.match(body, /production.*observe|observe.*production/is);
  assert.match(body, /outcome.*when applicable|when.*outcome/is);
});

test('develop-change keeps planning artifacts conditional rather than default ceremony', async () => {
  const { body } = parseFrontmatter(await readText(workflowPath));

  assert.match(body, /spec.*only when|create a change spec only when/is);
  assert.match(body, /plan.*only when|create a detailed plan only when/is);
  assert.match(body, /canonical state.*not.*(?:TDD|micro|every)/is);
});

test('core engineering policy prefers smallest valuable independently verifiable changes', async () => {
  const policy = await readText(engineeringPath);

  assert.match(policy, /smallest valuable|smallest independently verifiable/i);
  assert.match(policy, /small batch|batch size/i);
});

test('core git policy favors short-lived work and prompt integration', async () => {
  const policy = await readText(gitPath);

  assert.match(policy, /short-lived/i);
  assert.match(policy, /integrate.*promptly|integrate.*as soon|frequent integration/is);
});
