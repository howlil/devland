# Devland Executable Feedback Loop Design

Status: approved implementation design  
Date: 2026-08-25

## Goal

Close the gap between Devland's semantic engineering contract and its executable behavior without turning Devland into an agent runtime, repository provider, CI system, deployment platform, database, or dashboard.

The next executable slices are:

1. `devland doctor` — deterministic drift diagnosis between canonical context and repository evidence.
2. relevant-context resolution — load only the core policies declared by the requested workflow plus applicable profiles.
3. `devland flow` — calculate deterministic flow timing from normalized engineering events.

Each slice must remain independently verifiable and integrable.

## Constraints

- Preserve the current Node.js ESM implementation and existing dependencies.
- Keep `.devland/state.yaml` concise; engineering events remain under `.devland/runtime/` and outside Git tracking.
- Do not introduce an LLM dependency, network dependency, database, dashboard, autonomous orchestration, or provider-specific core logic.
- Prefer deterministic evidence. Unknown or ambiguous repository facts remain unknown rather than guessed.
- Keep existing CLI behavior backward compatible.

## Slice 1: Executable doctor

Add `devland doctor` as a read-only deterministic diagnostic command.

The first implementation intentionally covers facts that can be established cheaply and reliably:

- canonical schema validity;
- JavaScript source evidence from tracked `.mjs`, `.js`, `.cjs`, or `.jsx` files;
- Node.js runtime evidence from `package.json` and Node-based CI configuration;
- missing referenced architecture documents.

The command returns structured findings. A finding contains a primary Devland doctor category, evidence paths, observed repository fact, conflicting canonical value, and the smallest recommended correction. The command does not rewrite canonical files.

Self-hosting is part of acceptance: the current Devland repository must expose its own stale stack/runtime canonical state before that state is corrected.

## Slice 2: Relevant context

Workflow frontmatter becomes the source of truth for baseline core-policy dependencies. A workflow declares the core policies required for that workflow. `devland context <workflow>` resolves those policies only, then adds applicable project profiles.

The resolver must fail clearly when a workflow declares a policy that cannot be resolved. It must not silently fall back to loading every core policy.

This is workflow-level relevance, not semantic search over user prompts. Change-specific escalation remains the responsibility of the runtime and future adaptive-delivery semantics.

## Slice 3: Flow metrics

Add `devland flow`, backed by normalized events already stored in `.devland/runtime/events.ndjson`.

The first metrics engine computes durations only when events contain sufficient correlation identifiers. Missing linkage is skipped rather than invented.

Initial metrics:

- idea-to-production: `work.accepted` -> `deployment.succeeded`, grouped by `work_id`;
- review wait: `review.opened` -> `review.completed`, grouped by `change_id`;
- CI feedback latency: `ci.started` -> `ci.completed`, grouped by `change_id`;
- deployment latency: `deployment.started` -> `deployment.succeeded`, grouped by `deployment_id`;
- failed deployment recovery: `deployment.failed` -> `recovery.succeeded`, grouped by `deployment_id`.

Each metric reports sample count, average duration, and maximum duration. Idea-to-production is an end-to-end cycle metric and is not treated as a bottleneck stage. The reported bottleneck is the actionable stage metric with the largest average duration among review wait, CI feedback latency, deployment latency, and failed-deployment recovery when samples exist.

No DORA rate metrics, provider adapters, production telemetry collection, or historical database are included in this slice.

## Data flow

```text
canonical project/state -----> validate / doctor
repository evidence ---------/

workflow frontmatter --------> relevant policy resolver ----> runtime context
canonical project -----------> applicable profiles ---------/

normalized event log --------> flow metrics ----------------> feedback report
```

## Failure behavior

- Invalid canonical context stops doctor/context/flow commands that depend on canonical identity.
- Missing architecture references produce doctor findings rather than destructive actions.
- Missing declared policies are explicit context-resolution errors.
- Missing event log yields an empty flow report, not a fabricated failure.
- Malformed event log remains an error because metrics from corrupted evidence are not trustworthy.

## Verification

Each slice follows RED -> GREEN with GitHub Actions as the executable verification harness. The feature test must fail for the intended missing behavior before production implementation is added, then the full `npm test` suite must pass before integration.
