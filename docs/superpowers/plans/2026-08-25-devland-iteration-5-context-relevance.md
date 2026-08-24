# Devland Iteration 5 Context Relevance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `devland context <workflow>` load only workflow-declared core policies instead of the entire core policy directory.

**Architecture:** Workflows declare baseline policy IDs in YAML frontmatter. The runtime reads the requested workflow first, resolves those IDs against core policy metadata, rejects missing declarations, and then resolves applicable project profiles as before.

**Tech Stack:** Node.js 22 ESM, existing YAML parser and Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-devland-feedback-loop-design.md`

## Global Constraints

- No semantic search or prompt classifier.
- No new dependency.
- Profiles remain independently resolved from canonical project state.
- Missing declared policies are hard resolution errors.
- Existing workflow capability metadata remains unchanged.

---

### Task 1: Relevant policy contract

**Files:**
- Create: `tests/cli/context-relevance.test.mjs`
- Modify: `core/workflows/bootstrap-project.md`
- Modify: `core/workflows/develop-change.md`
- Modify: `core/workflows/doctor-project.md`
- Modify: `src/runtime.mjs`

**Interfaces:**
- Workflow frontmatter produces `policies: [core.<id>, ...]`.
- `resolveContext(workflowId, projectRoot, devlandRoot)` returns only those resolved policies and throws when any declared ID is unavailable.

- [ ] Write a failing test asserting `develop-change` excludes unrelated `core.documentation` and `core.security` while retaining engineering, dependencies, git, testing, and verification.
- [ ] Write a failing test asserting an unresolved declared policy causes `resolveContext()` to reject explicitly.
- [ ] Verify RED in GitHub Actions.
- [ ] Add policy declarations to all three workflows.
- [ ] Refactor runtime markdown loading so workflow metadata can drive exact policy resolution without changing the public workflow content contract materially.
- [ ] Verify the full suite GREEN in GitHub Actions.
