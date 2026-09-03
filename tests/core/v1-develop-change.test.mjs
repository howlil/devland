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
  assert.match(body, /critical.*deterministic|deterministic.*critical/is);
  assert.match(body, /do not force TDD|not every change.*TDD|TDD.*not.*every change/is);
  assert.match(body, /integration.*first-class|integration.*whenever.*boundary|boundary.*integration/is);
  assert.match(body, /end-to-end|E2E/i);
  assert.match(body, /unique confidence|cheaper boundary|critical journey/is);
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

test('core engineering policy preserves product authority while keeping local agent autonomy', async () => {
  const policy = await readText(engineeringPath);

  assert.match(policy, /user owns product intent.*product scope.*observable product semantics.*material architecture/is);
  assert.match(policy, /surface a decision before implementation.*public contracts.*data ownership.*security boundaries.*service boundaries.*consistency models.*infrastructure architecture/is);
  assert.match(policy, /agent may make local implementation decisions autonomously.*accepted behavior.*approved scope.*existing system boundaries/is);
  assert.match(policy, /do not turn implementation convenience.*best-practice preference.*optimization.*framework preference.*hypothetical scale.*future flexibility.*new product scope/is);
});

test('testing policy protects critical behavior without universal TDD ceremony', async () => {
  const testing = await readText(testingPath);

  assert.match(testing, /realistic regression|failure risk/i);
  assert.match(testing, /critical.*behavior|critical.*function|domain.*invariant/is);
  assert.match(testing, /cheapest high-signal/i);
  assert.match(testing, /RED\s*(?:->|→)\s*GREEN\s*(?:->|→)\s*REFACTOR/i);
  assert.match(testing, /strongly prefer|strong default/i);
  assert.match(testing, /do not require TDD|not every.*TDD|TDD.*not.*universal/is);
  assert.match(testing, /integration.*first-class|integration.*whenever.*boundary/is);
  assert.match(testing, /end-to-end|E2E/i);
  assert.match(testing, /unique confidence|cheaper boundary/is);
  assert.match(testing, /avoid duplicated confidence/i);
});

test('verification policy keeps default integration gates fast and risk-triggered', async () => {
  const verification = await readText(verificationPath);

  assert.match(verification, /impact and likelihood/i);
  assert.match(verification, /cheapest high-signal/i);
  assert.match(verification, /increase verification depth only when risk/i);
  assert.match(verification, /integration.*first-class|integration.*realistic failure boundary/is);
  assert.match(verification, /default.*(?:CI|integration gate).*fast|fast.*default.*(?:CI|integration gate)/is);
  assert.match(verification, /expensive.*risk|risk.*expensive|affected scope.*expensive|release.*expensive/is);
  assert.match(verification, /end-to-end|E2E/i);
  assert.match(verification, /not.*default.*gate|default.*gate.*not/is);
  assert.match(verification, /do not duplicate the same confidence/i);
});

test('core git policy favors short-lived work and prompt integration', async () => {
  const policy = await readText(gitPath);

  assert.match(policy, /short-lived/i);
  assert.match(policy, /integrate.*promptly|integrate.*as soon|frequent integration/is);
});
