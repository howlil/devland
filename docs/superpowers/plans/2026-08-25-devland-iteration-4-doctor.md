# Devland Iteration 4 Doctor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic read-only `devland doctor` command that detects canonical drift against repository evidence and dogfood it on Devland itself.

**Architecture:** A new `src/doctor.mjs` reads validated canonical state and cheap repository evidence, returning structured findings without mutation. `bin/devland.mjs` exposes the result as JSON. Detection is intentionally limited to deterministic stack/runtime and missing-reference evidence.

**Tech Stack:** Node.js 22 ESM, `node:fs/promises`, existing YAML/Ajv runtime, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-devland-feedback-loop-design.md`

## Global Constraints

- Preserve existing dependencies and Node.js ESM architecture.
- Doctor is read-only and deterministic.
- Unknown facts remain unknown; do not infer architecture or delivery behavior without evidence.
- Existing `validate`, `context`, and `event append` CLI behavior must remain compatible.

---

### Task 1: Doctor behavior and CLI

**Files:**
- Create: `tests/cli/doctor.test.mjs`
- Create: `src/doctor.mjs`
- Modify: `bin/devland.mjs`

**Interfaces:**
- Consumes: `validateCanonical(projectRoot)` from `src/runtime.mjs`.
- Produces: `doctorProject(projectRoot = process.cwd()) -> { healthy, findings }` and CLI command `devland doctor`.

- [ ] **Step 1: Write failing tests**

Add tests that create minimal temporary Devland targets and assert:

```js
const result = run(['doctor'], root);
assert.equal(result.status, 0);
const output = JSON.parse(result.stdout);
assert.ok(output.findings.some((finding) =>
  finding.category === 'stack/runtime drift' && finding.observed.includes('node')
));
```

Also assert a canonical architecture document path that does not exist yields `invalid/missing referenced files`.

- [ ] **Step 2: Verify RED**

Run through GitHub Actions with only tests committed. Expected: `npm test` fails because `devland doctor` is not implemented.

- [ ] **Step 3: Implement minimal diagnosis**

Implement `doctorProject()` using repository evidence from `package.json`, source extensions, CI text, and canonical architecture document existence. Return findings shaped as:

```js
{
  category: 'stack/runtime drift',
  evidence: ['package.json'],
  canonical: [],
  observed: ['node'],
  recommendation: 'Add node to stack.runtimes.'
}
```

Add the `doctor` branch in `bin/devland.mjs` before the final usage failure.

- [ ] **Step 4: Verify GREEN**

Run the full GitHub Actions `npm test` suite. Expected: zero failures.

### Task 2: Self-host drift correction

**Files:**
- Modify: `.devland/project.yaml`
- Modify: `README.md`

**Interfaces:**
- Consumes: deterministic evidence demonstrated by Task 1.
- Produces: self-hosted canonical state and README aligned with current executable v1 reality.

- [ ] **Step 1: Update canonical stack/runtime**

Record JavaScript and Node.js in `.devland/project.yaml`, keep the existing product boundary, and point the architecture document at the approved v1 feedback-loop design while preserving the v0 design as historical documentation.

- [ ] **Step 2: Update README status**

Replace stale statements that Devland has no CLI and only a v0 semantic core. Document the current commands without claiming provider integration or metrics before those slices land.

- [ ] **Step 3: Re-run full verification**

Run GitHub Actions `npm test` after the self-host corrections. Expected: zero failures and `devland validate` remains valid.
