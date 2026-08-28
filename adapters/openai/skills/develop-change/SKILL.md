---
name: devland-develop-change
description: Use when implementing or reviewing a software change in a Devland-enabled repository so ChatGPT follows the same resolved engineering semantics as local AGENTS.md/CLI agents.
---
# Devland Develop Change Adapter

This Skill routes an OpenAI runtime through Devland's canonical `develop-change` semantics. It is an execution wrapper, not a second copy of Devland rules or project memory.

## Execution contract

1. Start from the user's explicit requested change; do not invent adjacent product scope.
2. Obtain `.devland/project.yaml` and `.devland/state.yaml` through an available repository capability. Repository access and authorization remain external to Devland.
3. Invoke the Devland `resolve_context` plugin tool with those canonical YAML documents, `workflow: develop-change`, and only change signals/context preferences supported by evidence.
4. Treat the returned `devland.context/v1` payload as the effective workflow, policies, profiles, execution lane, and canonical references for the change.
5. Inspect only repository evidence needed by that resolved context and the requested change. Use separate repository/runtime capabilities for reads, writes, tests, Git, CI, or release actions.
6. Re-resolve Devland context when a new change begins or canonical project/work state changed materially. Within one unchanged task, conversation context may cache the resolved payload.
7. Never promote conversation memory into canonical project truth implicitly. Durable project facts belong in `.devland/project.yaml`; lightweight current-work coordination belongs in `.devland/state.yaml`.
8. Never claim repository, test, CI, release, or deployment actions that the current runtime did not actually perform.

## Memory ownership

- Devland Core: reusable engineering rules, workflows, profiles, risk/context semantics.
- `.devland/project.yaml`: durable project-specific memory.
- `.devland/state.yaml`: lightweight current-work memory.
- conversation/session memory: transient working context only.
- repository source/configuration: evidence of current implementation reality.

Do not copy full Devland policy prose into this Skill. The resolver remains the source of effective engineering guidance.
