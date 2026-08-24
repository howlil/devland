# Devland Iteration 11 Repository Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the repository's own delivery/governance contract with the reliability semantics Devland expects from projects it guides.

**Architecture:** Keep governance intentionally small: run the deterministic test suite on the three major desktop CI environments, provide a private vulnerability reporting policy, reconcile canonical work history, and track remaining architectural work as explicit GitHub issues. Repository-level branch protection is configured only if the connected GitHub capability exposes a safe settings mutation.

**Tech Stack:** GitHub Actions, Node.js 22, repository Markdown/YAML contracts.

**Spec:** `docs/superpowers/specs/2026-08-25-devland-trust-hardening-design.md`

## Global Constraints

- No mandatory human reviewer for this solo-maintained repository.
- No release/publish automation yet; package remains private.
- Do not choose a legal software license implicitly; record license selection as an explicit pre-publication decision if one is not already present.
- Do not fake branch protection when the connected GitHub capability cannot mutate repository rules.

---

### Task 1: Cross-platform repository gate

**Files:**
- Create: `tests/core/repository-governance.test.mjs`
- Modify: `.github/workflows/ci.yml`

- [ ] Add a failing repository contract requiring Ubuntu, Windows, and macOS CI with Node 22, `npm ci`, and `npm test`.
- [ ] Verify RED.
- [ ] Add the small OS matrix to the existing CI workflow.
- [ ] Verify every matrix job GREEN.

### Task 2: Security reporting contract

**Files:**
- Modify: `tests/core/repository-governance.test.mjs`
- Create: `SECURITY.md`

- [ ] Add a failing contract requiring a private vulnerability reporting path and explicit prohibition on public secret/exploit disclosure.
- [ ] Verify RED.
- [ ] Add a concise `SECURITY.md` using GitHub Private Vulnerability Reporting / Security Advisories as the reporting path.
- [ ] Verify full matrix GREEN.

### Task 3: Canonical reconciliation and visible backlog

**Files:**
- Modify: `.devland/state.yaml`

- [ ] Record Iterations 7-11 with durable RED/GREEN evidence only, not micro-step telemetry.
- [ ] Create focused GitHub issues for provider-backed evidence durability, adaptive change-aware context, doctor detector generalization, runtime behavior evals, branch protection (if not mutable), and license selection.
- [ ] Verify canonical state remains valid on the final PR head.
