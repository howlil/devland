# Devland Iteration 8 Doctor Confidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent `devland doctor` from claiming global health beyond its actual diagnostic coverage and distinguish missing evidence from inaccessible evidence.

**Architecture:** Replace the global `healthy` boolean with an explicit report status plus per-check status. Repository path probing becomes tri-state (`present`, `absent`, `inaccessible`) so permission/I/O failures become uncertainty rather than false missing-file findings. The current executable declares all nine doctor categories, marking unsupported ones `not_evaluated`.

**Tech Stack:** Node.js 22 ESM, Node filesystem APIs, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-devland-trust-hardening-design.md`

## Global Constraints

- Doctor remains read-only.
- No LLM inference.
- Do not implement all nine diagnostic categories in this slice.
- Existing stack/runtime and referenced-file findings remain supported.

---

### Task 1: Honest report coverage

**Files:**
- Modify: `tests/cli/doctor.test.mjs`
- Modify: `src/doctor.mjs`

**Interfaces:**
- `doctorProject()` returns `{ status, findings, checks }`.
- Per-check states are `clean`, `findings`, `partial`, or `not_evaluated`.
- Global status is `findings` when any finding exists; otherwise `partial` while any category is partial/not evaluated; `clean` only when every declared category is clean.

- [ ] Add failing tests proving a no-finding repository is `partial`, not globally healthy.
- [ ] Add failing tests proving all nine categories are represented by checks.
- [ ] Verify RED.
- [ ] Implement structured check coverage and aggregate status.
- [ ] Verify GREEN.

### Task 2: Missing versus inaccessible evidence

**Files:**
- Modify: `tests/cli/doctor.test.mjs`
- Modify: `src/doctor.mjs`

**Interfaces:**
- `classifyProbeError(error)` returns `absent` only for `ENOENT`/`ENOTDIR`, otherwise `inaccessible`.
- Missing referenced documents create findings.
- Inaccessible evidence marks the check `partial` and does not fabricate a missing-file finding.

- [ ] Add failing unit contracts for error classification.
- [ ] Verify RED.
- [ ] Implement tri-state probing and propagate inaccessible evidence through checks.
- [ ] Verify full suite GREEN.
