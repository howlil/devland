# Devland Agent Instructions

Devland is in a stabilization and dogfooding phase. The default goal is to reduce delivery friction, not to expand Devland's feature surface.

## Start with repository reality

Use the smallest amount of context required for the task.

Read, in this order, only when relevant:

1. repository source, tests, schemas, and configuration;
2. `.devland/project.yaml` for stable project facts and constraints;
3. `.devland/state.yaml` only when the task depends on current/recent work context;
4. a referenced design or plan only when an active change actually depends on it.

Do not treat `.devland/state.yaml` as an append-only delivery ledger. Do not create a state-only maintenance change merely to record work that is already clear from Git history, unless another workflow concretely consumes that state.

Agent-specific files are projections. Canonical project facts belong in `.devland/`; repository behavior belongs in source and tests.

## Scope governor

A comprehensive audit is not an implementation backlog.

Before starting non-trivial work, ask whether at least one of these is true:

1. the primary user journey fails without the change;
2. the change prevents an unacceptable security, data-loss, compatibility, or external-side-effect risk;
3. real dogfood/usage evidence exposed the problem;
4. the decision is expensive to reverse after adoption.

If none apply, defer the work.

New Devland features are frozen until dogfooding demonstrates that the current tool reduces delivery friction on another repository. Correctness, security, compatibility, and reproducible bug fixes remain in scope.

Do not automatically implement every valid audit finding. Classify findings as `now`, `after-feedback`, `later`, or `not-now`, and keep active scope narrow.

## Delivery model

Prefer one coherent vertical slice, one branch, one PR, and one merge.

Do not split a small outcome into artificial iteration PRs just to keep changes microscopic. Do not stack speculative follow-up work while the current slice is still proving value.

Default loop:

```text
outcome
  -> acceptance criteria
  -> smallest coherent change
  -> focused verification
  -> PR / CI
  -> merge
  -> observe
```

Use RED -> GREEN -> REFACTOR where executable behavior benefits from TDD. Do not create tests for bookkeeping, prose wording, or documentation ordering unless they are part of a real machine-consumed contract.

Avoid new architecture documents, abstractions, adapters, schemas, or process artifacts without concrete pressure. Create durable design documentation only for non-obvious, expensive-to-reverse decisions.

## Risk-based verification

Verification depth must match change risk.

- **Level 0 — docs/copy/local metadata:** diff review and syntax/checks where relevant.
- **Level 1 — localized deterministic behavior:** focused unit test plus relevant static/build checks.
- **Level 2 — core user-flow behavior:** focused tests plus integration/smoke coverage and normal CI.
- **Level 3 — persistence/schema/migration/security/concurrency/external side effects:** broader affected suite and regression coverage.
- **Level 4 — packaging/runtime portability/release-sensitive behavior:** full suite plus explicit Linux/macOS/Windows verification.

Do not require cross-platform CI for every ordinary change. Use the dedicated cross-platform workflow when portability or release confidence is materially relevant.

A known failing required check blocks completion. Additional unrelated cleanup does not.

## Product boundary

Devland defines agent-agnostic engineering context and deterministic feedback semantics. It must not become:

- an autonomous coding agent;
- a repository/GitHub client;
- a CI/CD engine;
- a deployment or observability backend;
- a project-management system;
- a multi-agent orchestration framework;
- a telemetry database or dashboard-first product.

The AI runtime reasons and orchestrates. Repository, VCS, CI, deployment, and production systems remain external capabilities.

## Current product priority

Stable core value is concentrated in:

- `init` / `migrate` for safe canonical setup;
- `validate` for canonical contract correctness;
- `context` for relevant engineering context;
- `doctor` for deterministic drift/repository diagnostics.

Engineering-event ingestion, flow metrics, and adapter evaluation remain available, but should be treated as dogfood/experimental capabilities until real usage proves their ongoing value.

Never claim repository, CI, release, deployment, or cleanup actions that were not actually performed and verified.
