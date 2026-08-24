# Devland Iteration 10 Event Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure normalized events carry the linkage required by their type and prevent staging/test deployments from being reported as idea-to-production completion.

**Architecture:** JSON Schema owns event-type linkage requirements while runtime validation additionally verifies timestamps parse to real instants. Flow metrics receive canonical production environment names and use environment-aware deployment correlation; missing production configuration yields no idea-to-production sample rather than guessing.

**Tech Stack:** Node.js 22 ESM, JSON Schema 2020-12, AJV, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-devland-trust-hardening-design.md`

## Global Constraints

- No provider adapter in this slice.
- No database or telemetry service.
- Existing local NDJSON storage remains a local evidence spool.
- Production environments are explicit canonical project metadata; no hard-coded environment name in metrics.

---

### Task 1: Event semantic usability

**Files:**
- Modify: `schemas/engineering-event.schema.json`
- Modify: `src/events.mjs`
- Modify: `tests/cli/events.test.mjs`
- Modify: `tests/schemas/engineering-event.test.mjs`

**Interfaces:**
- Event type determines required linkage fields.
- `appendEngineeringEvent()` rejects timestamps that do not parse to a real instant.

- [ ] Add failing tests for deployment success without environment/work linkage.
- [ ] Add failing test for an impossible calendar timestamp.
- [ ] Verify RED.
- [ ] Add conditional schema requirements and timestamp semantic validation.
- [ ] Verify GREEN.

### Task 2: Production-aware flow metrics

**Files:**
- Modify: `schemas/project.schema.json`
- Modify: `src/metrics.mjs`
- Modify: `tests/cli/flow.test.mjs`
- Modify: `README.md`

**Interfaces:**
- `delivery.production_environments` is an optional unique string array; absence means production completion cannot be inferred.
- `calculateFlowMetrics(events, { productionEnvironments })` reports idea-to-production only from production deployment successes.
- Deployment and recovery pairing use both `deployment_id` and `environment`.

- [ ] Add failing flow tests proving staging success does not close idea-to-production.
- [ ] Add failing test proving same deployment ID across environments does not cross-pair.
- [ ] Verify RED.
- [ ] Add production environment schema and production-aware metric filtering/correlation.
- [ ] Verify full suite GREEN.
