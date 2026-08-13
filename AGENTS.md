# Devland Agent Instructions

Devland uses its own canonical project and work state.

Read first:

- `.devland/project.yaml` — accepted project facts and constraints.
- `.devland/state.yaml` — current work scope, status, and referenced artifacts.
- `docs/superpowers/specs/2026-08-13-devland-v0-design.md` — v0 semantic contract.

For active work, follow the spec/plan referenced by `.devland/state.yaml` and load only the core policies, profiles, workflows, adapters, or eval fixtures relevant to the task.

Repository source, tests, schemas, and configuration are evidence of what currently exists. Active approved work artifacts may describe what should change. If repository reality and canonical context disagree, report the drift instead of silently choosing a convenient source.

Keep agent-specific files as projections. Do not copy canonical project facts into this file, and do not make this file an independent source of truth.

Use only capabilities the current runtime actually provides. Never claim repository, CI, version-control, release, or cleanup actions that were not performed and verified.
