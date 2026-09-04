---
name: devland-develop-change
description: Use when implementing or reviewing a software change in a Devland-enabled repository so ChatGPT follows the same resolved engineering semantics as local AGENTS.md/CLI agents.
---
# Devland Develop Change Adapter

This Skill routes an OpenAI runtime through Devland's canonical `develop-change` semantics. It is an execution wrapper, not a second copy of Devland rules or project memory.

## Execution contract

1. Start from the user's explicit requested change; do not invent adjacent product scope.
2. Derive a minimal transient work envelope from the active request when intent and acceptance are known: `id`, outcome-oriented `intent`, observable `acceptance`, and only material `scope`/`expected_outcome`. Acceptance criteria describe the required behavior; they do not imply a mandatory acceptance-test suite.
3. When verification choice is materially useful, derive a compact transient `change.verification` selection from repository evidence: realistic `failure_modes`, `criticality`, the narrowest representative `boundary`, relative `cost`, and optional `reason`. Do not create a verification matrix, command list, or one-test-per-layer checklist.
4. Obtain `.devland/project.yaml` and `.devland/state.yaml` through an available repository capability. Repository access and authorization remain external to Devland.
5. Invoke the Devland `resolve_context` plugin tool with those canonical YAML documents, `workflow: develop-change`, the transient `work` envelope when available, supported change signals/context preferences, and the verification selection when useful.
6. Treat the returned `devland.context/v1` payload as the effective workflow, policies, profiles, execution lane, canonical references, current transient work contract, and verification diagnostics for the change. Reconcile any verification warning against repository evidence; warnings are advisory and do not create automatic new gates.
7. Inspect only repository evidence needed by that resolved context and the requested change. Use separate repository/runtime capabilities for reads, writes, tests, Git, CI, or release actions. Devland supplies verification semantics, not shell commands.
8. Re-resolve Devland context when a new change begins, the transient work or verification contract changes materially, or canonical project/work state changes materially. Within one unchanged task, conversation context may cache the resolved payload.
9. Never promote the transient work/verification envelope or conversation memory into canonical project truth implicitly. Durable project facts belong in `.devland/project.yaml`; lightweight cross-session coordination belongs in `.devland/state.yaml`.
10. Never claim repository, test, CI, release, or deployment actions that the current runtime did not actually perform.

## Memory ownership

- Devland Core: reusable engineering rules, workflows, profiles, risk/context/verification semantics.
- `.devland/project.yaml`: durable project-specific memory.
- `.devland/state.yaml`: lightweight current-work coordination when persistence is useful.
- `work` envelope: transient intent, acceptance boundaries, scope, and expected outcome for the active change.
- `change.verification`: transient failure/criticality/boundary/cost selection for the active change.
- conversation/session memory: transient working context/cache only.
- repository source/configuration: evidence of current implementation reality.

Do not copy full Devland policy prose into this Skill. The resolver remains the source of effective engineering guidance.
