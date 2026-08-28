import assert from 'node:assert/strict';
import test from 'node:test';
import { readText } from '../helpers/files.mjs';
import { parseFrontmatter } from '../helpers/frontmatter.mjs';

const workflowPath = 'core/workflows/develop-change.md';
const engineeringPath = 'core/policies/engineering.md';
const gitPath = 'core/policies/git.md';
const testingPath = 'core/policies/testing.md';
const verificationPath = 'core/policies/verification.md';

test('develop-change executes the v1 rapid feedback loop', async () => {
  const { body } = parseFrontmatter(await readText(workflowPath));

  assert.match(body, /smallest valuable slice/i);
  assert.match(body, /RED\s*(?:->|→)\s*GREEN\s*(?:->|→)\s*REFACTOR/i);
  assert.match(body, /repeat|next independently useful increment|next smallest valuable slice/i);
  assert.match(body, /fastest relevant|focused verification|fast feedback/i);
  assert.match(body, /integrate.*as soon|integrate.*promptly|frequent integration/is);
  assert.match(body, /production.*observe|observe.*production|production evidence/is);
  assert.match(body, /outcome.*when applicable|when.*outcome|outcome evidence/is);
});

test('develop-change operationalizes execution lanes as cost ceilings', async () => {
  const { body } = parseFrontmatter(await readText(workflowPath));

  assert.match(body, /execution\.lane/i);
  assert.match(body, /ceiling on analysis|ceiling.*reasoning/i);
  assert.match(body, /rapid.*affected code only/is);
  assert.match(body, /once requirement.*owner.*implementation path.*risk.*clear.*implement/is);
  assert.match(body, /guided.*targeted analysis/is);
  assert.match(body, /deliberate.*expand context/is);
  assert.match(body, /do not enumerate absent engineering-fact categories/i);
});

test('develop-change derives implementation from requirement and engineering facts', async () => {
  const { body } = parseFrontmatter(await readText(workflowPath));

  assert.match(body, /explicit accepted requirement/i);
  assert.match(body, /existing component owns|existing owner/i);
  assert.match(body, /engineering facts/i);
  assert.match(body, /state.*invariants.*data/is);
  assert.match(body, /failure conditions/i);
  assert.match(body, /concurrency or consistency/i);
  assert.match(body, /requirement\s*(?:->|→)\s*engineering fact\s*(?:->|→)\s*implementation decision/i);
  assert.match(body, /reuse|extension of the existing owner|current owner/i);
});

test('develop-change keeps modeling and planning conditional rather than default ceremony', async () => {
  const { body } = parseFrontmatter(await readText(workflowPath));

  assert.match(body, /spec.*only when|create a change spec.*only when/is);
  assert.match(body, /diagram.*not a mandatory|diagram.*reasoning tool/is);
  assert.match(body, /plan.*only when|create a detailed plan only when/is);
  assert.match(body, /canonical state.*not.*(?:TDD|micro|every)/is);
});

test('core engineering policy prefers evidence-driven smallest implementation decisions', async () => {
  const policy = await readText(engineeringPath);

  assert.match(policy, /execution lane.*ceiling/i);
  assert.match(policy, /do not enumerate categories that are absent or irrelevant/i);
  assert.match(policy, /smallest valuable|smallest independently verifiable/i);
  assert.match(policy, /small batch|batch size/i);
  assert.match(policy, /engineering facts/i);
  assert.match(policy, /requirement\s*(?:->|→)\s*engineering fact\s*(?:->|→)\s*implementation decision/i);
  assert.match(policy, /existing component owns/i);
  assert.match(policy, /functional transformation/i);
  assert.match(policy, /state machine/i);
  assert.match(policy, /event-driven/i);
  assert.match(policy, /diagrams.*optional|optional reasoning tools/is);
});

test('testing and verification choose confidence from realistic delivery risk', async () => {
  const testing = await readText(testingPath);
  const verification = await readText(verificationPath);

  assert.match(testing, /realistic regression|failure risk/i);
  assert.match(testing, /cheapest high-signal/i);
  assert.match(testing, /RED\s*(?:->|→)\s*GREEN\s*(?:->|→)\s*REFACTOR/i);
  assert.match(testing, /do not require TDD/i);
  assert.match(testing, /avoid duplicated confidence/i);

  assert.match(verification, /impact and likelihood/i);
  assert.match(verification, /cheapest high-signal/i);
  assert.match(verification, /increase verification depth only when risk/i);
  assert.match(verification, /do not duplicate the same confidence/i);
});

test('core git policy favors short-lived work and prompt integration', async () => {
  const policy = await readText(gitPath);

  assert.match(policy, /short-lived/i);
  assert.match(policy, /integrate.*promptly|integrate.*as soon|frequent integration/is);
});
