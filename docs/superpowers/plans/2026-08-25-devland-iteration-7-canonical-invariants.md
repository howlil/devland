# Devland Iteration 7 Canonical Invariants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce domain invariants that JSON Schema cannot express and fail explicitly when a project requests an installed profile that does not exist.

**Architecture:** Keep JSON Schema as structural validation, then run a deterministic semantic validation pass over canonical project/state. Context resolution distinguishes explicit project profiles from inferred optional candidates so missing explicit policy guidance cannot disappear silently.

**Tech Stack:** Node.js 22 ESM, AJV, YAML, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-devland-trust-hardening-design.md`

## Global Constraints

- No schema format migration in this slice.
- No new dependency.
- No state auto-rewrite.
- Preserve current CLI JSON output shape except additional semantic validation errors.
- Derived profile candidates remain optional.

---

### Task 1: Canonical work-state invariants

**Files:**
- Create: `tests/cli/canonical-invariants.test.mjs`
- Modify: `src/runtime.mjs`

**Interfaces:**
- `validateCanonical(projectRoot, devlandRoot)` continues returning `{ valid, validated, errors, project, state }`.
- Semantic errors use the existing `{ path, instancePath, message }` error shape.

- [ ] Write failing tests proving a duplicate work ID across buckets is rejected.
- [ ] Write failing tests proving bucket/status contradictions are rejected.
- [ ] Verify RED in GitHub Actions.
- [ ] Add a pure semantic validation pass after successful YAML/schema parsing.
- [ ] Verify focused and full suites GREEN.

### Task 2: Explicit profile integrity

**Files:**
- Modify: `tests/cli/canonical-invariants.test.mjs`
- Modify: `src/runtime.mjs`

**Interfaces:**
- Explicit `project.profiles` entries must resolve to exact installed profile IDs.
- Inferred project type/quality/stack/delivery candidates may remain unresolved.

- [ ] Add a failing context test for an explicit missing profile.
- [ ] Verify RED.
- [ ] Split explicit and inferred profile resolution and reject unresolved explicit IDs.
- [ ] Verify the full suite GREEN.
