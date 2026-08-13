# Devland

Devland is a small, agent-agnostic engineering context system for software developed with AI. It standardizes the semantics that should remain consistent across projects—project facts, engineering policy, conditional profiles, current work, and development workflows—without forcing every repository to use the same architecture or the same agent-specific file layout.

## What Devland is

Devland v0 is a repository of machine-readable schemas, reusable engineering guidance, capability-aware workflows, adapter contracts, and evidence-backed evaluation fixtures. A runtime such as ChatGPT, Codex, or another coding assistant consumes the relevant Devland context alongside whatever repository tools it actually has.

```text
Devland Core + project canonical state
                  |
                  v
               adapter
                  |
                  v
             AI runtime
                  |
                  v
     available repository/tool capabilities
```

The AI runtime reasons and orchestrates. Devland defines reusable engineering semantics. Repository tools provide actions such as reading code, writing files, running commands, or interacting with version control when those capabilities are available.

## What Devland is not

Devland is not a SaaS product, IDE, coding agent runtime, repository provider, or autonomous orchestration platform. v0 has no web UI, API server, database, custom repository authentication layer, package registry, or user-facing CLI. Those remain deferred until evidence from v0 usage shows that a deterministic executable or service is actually needed.

## Core concepts

- **Project model** — stable or slowly changing project facts in `.devland/project.yaml`.
- **Work state** — concise current/recent work information in `.devland/state.yaml`; a work item is universal, while iterations or milestones are optional grouping.
- **Core policies** — reusable engineering rules such as scope discipline, verification, Git hygiene, dependency discipline, security, testing, and documentation.
- **Profiles** — conditional guidance activated by a project type, quality concern, stack, or delivery model.
- **Workflows** — vendor-neutral procedures that declare semantic capabilities instead of hard-coding provider APIs.
- **Adapters** — projections for a target runtime or instruction format. They route to canonical context and are never a second source of project truth.

## Minimal target repository

A small Devland-managed project may need only:

```text
repo/
├── AGENTS.md              # optional adapter/entry point
└── .devland/
    ├── project.yaml
    └── state.yaml
```

Architecture documents, decisions, change specs, plans, and evidence are optional. They should exist only when the project or change is complex enough that the artifact carries unique persistent value.

## How an AI runtime consumes Devland

A runtime loads `.devland/project.yaml` and `.devland/state.yaml`, follows any referenced project-local artifacts, then loads only the relevant Devland policies/profiles/workflow for the requested operation. An adapter can package or route that context in a runtime-native form—for example an `AGENTS.md` entry point or an OpenAI Skill—without moving canonical project truth into the adapter.

Devland currently includes an `AGENTS.md` adapter contract, a generic adapter contract, and an OpenAI bootstrap Skill example. The adapter is intentionally separate from repository connectivity.

## Repository capability separation

Devland workflows describe capabilities such as `repository.read`, `repository.write`, `vcs.branch`, `shell.execute`, or `ci.read`. They do not implement GitHub, GitLab, filesystem, or CI APIs.

If ChatGPT has repository read access only, `bootstrap-project` can inspect and propose canonical state but must not claim it wrote files. A coding environment with filesystem, shell, and version-control capabilities can execute more of the same workflow. The semantic workflow does not change because the vendor changes.

## v0 workflows

Devland v0 deliberately defines only three top-level workflows:

- `bootstrap-project` — normalize a product idea or existing repository into minimal canonical Devland context.
- `develop-change` — develop one logical change with scope, tests/reproduction, verification, state updates, and capability-aware integration behavior.
- `doctor-project` — diagnose drift between canonical context, repository evidence, work state, and adapters without automatically rewriting canonical truth.

## Evaluation philosophy

Devland is tested against six initial cases: ClipLingo, Podland, Wago, MyPaas, SOP Auto Fill, and an intentionally simple synthetic project. The fixtures test both consistency and restraint: preserve important project-specific constraints, keep universal policy reusable, omit irrelevant profiles, leave unknowns unknown, and avoid creating architecture/plan/evidence artifacts for a tiny project.

Seeded doctor scenarios additionally exercise stack/runtime drift, adapter divergence, and unsupported completion claims. Semantic runtime evaluation remains manual/agent-assisted in v0; the repository does not call an LLM API to grade itself.

Repository contract checks use `npm ci` and `npm test`. These dependencies are development/evaluation tooling for this repository, not part of the Devland product model.

## Current status

Devland v0 is in pull-request verification against the design specification in `docs/superpowers/specs/2026-08-13-devland-v0-design.md`. The canonical execution state and evidence references are recorded in `.devland/state.yaml`.
