# Devland Iteration 9 Contract Versioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Devland behavioral compatibility explicit and independent from YAML schema versioning.

**Architecture:** Canonical project state gains a required `devland.contract` string. JSON Schema validates its shape; runtime semantic validation owns the supported contract set so unsupported behavioral contracts fail with an explicit compatibility message. Package metadata gains a real pre-1.0 version and Node engine floor without publishing the package yet.

**Tech Stack:** Node.js 22 ESM, JSON Schema 2020-12, YAML, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-devland-trust-hardening-design.md`

## Global Constraints

- Keep document schemas at `devland.project/v0` and `devland.state/v0`; contract version is a separate concern.
- Current supported behavioral contract is exactly `1`.
- Package remains private in this slice.
- No migration CLI yet; migrate repository-owned fixtures and canonical state in-place.

---

### Task 1: Compatibility contract

**Files:**
- Create: `tests/cli/compatibility.test.mjs`
- Modify: `schemas/project.schema.json`
- Modify: `src/runtime.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Canonical project contains `devland: { contract: "1" }`.
- Runtime semantic validation rejects any contract outside the supported set.
- Package version is `0.1.0`; Node engine is `>=22`.

- [ ] Add failing tests for missing/unsupported contract and package metadata.
- [ ] Verify RED.
- [ ] Add schema shape plus runtime supported-contract validation.
- [ ] Add package version/engine metadata and lockfile consistency.

### Task 2: Repository-wide canonical migration

**Files:**
- Modify: `.devland/project.yaml`
- Modify: `templates/project.yaml`
- Modify: `evals/cases/*/expected/project.yaml`
- Modify: `tests/fixtures/project-*.yaml`
- Modify: CLI tests with inline canonical project YAML.

- [ ] Add contract `1` to every current valid canonical project fixture and inline test project.
- [ ] Preserve each intentionally invalid fixture's original failure reason by also adding the contract when appropriate.
- [ ] Run the full test suite and fix only compatibility fallout.
- [ ] Verify final PR head GREEN.
