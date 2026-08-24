# Devland Iteration 6 Flow Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn normalized engineering events into deterministic flow timing through a new `devland flow` command.

**Architecture:** Reuse the local append-only event log as the evidence source. A new pure metrics module pairs start/end events by stable correlation IDs, reports aggregate timing only for complete pairs, and exposes a bottleneck based on the largest average duration. Missing linkage is skipped rather than inferred.

**Tech Stack:** Node.js 22 ESM, existing NDJSON event log, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-devland-feedback-loop-design.md`

## Global Constraints

- No provider adapter, database, dashboard, or telemetry collector.
- No new dependency.
- Missing event log returns an empty report.
- Malformed event evidence remains an error.
- Incomplete/unlinked events do not create fabricated samples.

---

### Task 1: Flow report contract

**Files:**
- Create: `tests/cli/flow.test.mjs`
- Create: `src/metrics.mjs`
- Modify: `src/events.mjs`
- Modify: `bin/devland.mjs`
- Modify: `README.md`

**Interfaces:**
- `readEngineeringEvents(projectRoot)` returns normalized events from `.devland/runtime/events.ndjson`, or `[]` when the log is absent.
- `calculateFlowMetrics(events)` returns aggregate metrics and a bottleneck.
- `flowReport(projectRoot)` validates canonical context, loads events, and returns `{ event_count, metrics, bottleneck }`.
- CLI command: `devland flow`.

- [ ] Write a failing CLI test with correlated events proving exact idea-to-production, review, CI, deployment, and recovery durations.
- [ ] Write a failing CLI test proving a missing event log returns zero samples and `bottleneck: null`.
- [ ] Verify RED in GitHub Actions.
- [ ] Export event-log reading from `src/events.mjs` without changing append semantics.
- [ ] Implement deterministic pair aggregation in `src/metrics.mjs`.
- [ ] Expose `devland flow` and document it in README.
- [ ] Verify the full suite GREEN in GitHub Actions.
