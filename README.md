# Devland

Devland is a small, agent-agnostic engineering context and feedback tool for software developed with AI. It standardizes project facts, engineering policy, conditional profiles, current work, development workflows, and normalized engineering evidence without forcing every repository to use the same architecture or agent-specific file layout.

## Architecture

```text
Devland Core + project canonical state
                  |
                  v
          deterministic runtime
                  |
                  v
               adapter
                  |
                  v
             AI runtime
                  |
                  v
     repository / CI / production
                  |
                  v
          normalized evidence
                  |
                  v
             flow feedback
```

The AI runtime reasons and orchestrates. Devland defines reusable engineering semantics and deterministic checks. Repository, CI/CD, deployment, and observability systems remain external capabilities.

Devland is not an IDE, coding-agent runtime, repository provider, CI engine, deployment platform, analytics database, or autonomous multi-agent system.

## Core concepts

- **Project model** — stable or slowly changing project facts in `.devland/project.yaml`.
- **Work state** — concise current/recent work information in `.devland/state.yaml`.
- **Core policies** — reusable engineering rules for scope, verification, Git hygiene, dependencies, security, testing, and documentation.
- **Profiles** — conditional guidance activated by project type, quality concern, stack, or delivery model.
- **Workflows** — vendor-neutral procedures that declare semantic capabilities instead of provider APIs.
- **Adapters** — projections for a target runtime or instruction format; they are never a second source of project truth.
- **Engineering events** — normalized provider-agnostic evidence stored locally outside canonical state.
- **Flow metrics** — deterministic timing derived from correlated engineering events.

## Minimal target repository

```text
repo/
├── AGENTS.md              # optional adapter/entry point
└── .devland/
    ├── project.yaml
    └── state.yaml
```

Specs, plans, architecture documents, decisions, and evidence artifacts are conditional. They should exist only when they carry durable value that cannot be represented by the minimal canonical state.

## Current executable

Devland includes a small deterministic Node.js CLI:

```bash
devland validate
devland doctor
devland context <workflow>
devland event append '<json>'
devland flow
```

- `validate` checks canonical project and work state against their schemas.
- `doctor` compares canonical state with deterministic repository evidence and reports drift without rewriting canonical truth.
- `context` resolves canonical state, only the baseline core policies declared by the requested workflow, and applicable profiles for an AI runtime.
- `event append` validates and idempotently stores normalized engineering evidence in `.devland/runtime/events.ndjson`.
- `flow` calculates idea-to-production plus actionable stage timing for review, CI feedback, deployment, and failed-deployment recovery; the reported bottleneck is the actionable stage with the largest average duration from complete correlated event pairs.

The executable does not own repository authentication or execute provider-specific repository, CI, deployment, or production actions.

## Workflows

Devland keeps three top-level semantic workflows:

- `bootstrap-project` — normalize a product idea or existing repository into minimal canonical Devland context.
- `develop-change` — move one logical change through smallest valuable slices, RED -> GREEN -> REFACTOR, focused verification, prompt integration, and production feedback when observable.
- `doctor-project` — diagnose drift between canonical context, repository evidence, work state, and adapters.

## v1 feedback loop

```text
valuable intent
    -> smallest valuable slice
    -> observable acceptance
    -> RED -> GREEN -> REFACTOR
    -> small verified change
    -> integration
    -> production
    -> normalized events
    -> flow metrics
    -> learn
```

Flow metrics only use evidence with sufficient correlation IDs. Missing linkage is skipped rather than inferred. Provider adapters, automated telemetry collection, dashboards, databases, and autonomous agent orchestration remain outside the current executable scope.

## Development and verification

Repository contract checks use:

```bash
npm ci
npm test
```

Devland is dogfooded against its own canonical state and tested against representative project/evaluation fixtures. Completion claims are expected to be backed by fresh verification evidence rather than inferred from code changes alone.
