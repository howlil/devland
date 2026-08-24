# Devland Trust Hardening Design

Status: approved implementation design
Date: 2026-08-25

## Goal

Raise Devland from a useful executable engineering framework to a trustworthy cross-repository contract by removing false confidence, enforcing domain invariants beyond JSON shape, making semantic compatibility explicit, and ensuring flow metrics only claim what their evidence proves.

## Non-goals

- No dashboard, database service, autonomous coding agent, multi-agent orchestrator, vector search, or custom CI/deployment engine.
- No broad provider abstraction framework before one concrete provider integration exists.
- No automatic canonical rewrites by doctor.
- No speculative runtime/plugin system.

## Slice 1: Canonical semantic invariants

JSON Schema validation remains the structural boundary, followed by deterministic semantic validation.

State invariants:
- Work IDs are unique across `active_work`, `blocked`, and `recently_completed`.
- `active_work` accepts statuses `proposed`, `planned`, `active`, and `verifying`.
- `blocked` accepts only `blocked`.
- `recently_completed` accepts `done` and `abandoned`.

Profile invariants:
- Explicit IDs listed in `project.profiles` must resolve to an installed Devland profile or context resolution fails.
- Profiles inferred from project type, quality, stack, and delivery remain optional candidates and may be absent without invalidating canonical state.

## Slice 2: Doctor confidence semantics

Executable doctor must not equate "no findings from implemented checks" with global repository health.

Doctor returns:
- `status: clean` only when every declared supported check ran and found no issue;
- `status: findings` when an evaluated check found drift;
- `status: partial` when known doctor categories remain unevaluated or evidence is inaccessible;
- `status: error` is represented by command failure for invalid canonical state or fatal diagnostic failure.

The report includes `checks` with per-check status and evidence. Filesystem probes distinguish `present`, `absent`, and `inaccessible`; permission or I/O failures are never converted into missing-file claims.

The initial executable supports stack/runtime and referenced-file checks and explicitly marks the remaining semantic doctor categories as not evaluated.

## Slice 3: Compatibility contract

Separate document schema compatibility from Devland behavioral compatibility.

- Package metadata receives a real package version and Node engine contract.
- Canonical project state carries a Devland contract version independent from `devland.project/v0`.
- Runtime rejects unsupported contract versions explicitly.
- Version `1` is the first behavioral contract for the current v1 workflow semantics.
- No package publication is included in this slice.

## Slice 4: Event and production metric integrity

Normalized events must be semantically usable for the claims Devland derives from them.

Event invariants:
- `work.accepted` and `work.started` require `work_id`.
- `change.committed` requires `change_id` and `commit_sha`.
- `review.opened`, `review.completed`, `ci.started`, and `ci.completed` require `change_id`.
- deployment events require `deployment_id` and `environment`.
- `deployment.succeeded` additionally requires `work_id` when it is intended to close idea-to-production.
- `recovery.succeeded` requires `deployment_id` and `environment`.
- timestamps must parse to a real instant; matching the string pattern alone is insufficient.

Production semantics:
- Project delivery state declares one or more production environment names when production flow metrics are desired.
- `idea_to_production` pairs `work.accepted` only with `deployment.succeeded` events whose environment is declared production.
- Deployment latency and recovery metrics retain environment correlation and never silently call staging production.

## Slice 5: Minimum repository governance and adoption contract

Before public distribution:
- CI declares supported Node through `package.json#engines` and tests supported OS behavior with a small matrix.
- Add `LICENSE` and `SECURITY.md` as minimal public-project governance.
- Configure repository branch protection where connector capabilities permit: require pull requests and CI for `master` without inventing a mandatory second reviewer for a solo-maintained repository.
- Record remaining architectural backlog as GitHub issues rather than leaving it only in chat or canonical completed history.

## Verification strategy

Every behavior slice follows RED -> GREEN in GitHub Actions. Contract/documentation-only governance changes are verified through the repository's normal full test suite. Completion is claimed only from a fresh successful run on each final PR head.
