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
- **Behavioral contract** — `devland.contract` pins the Devland engineering semantics expected by a target repository independently from YAML schema versions.
- **Work state** — concise current/recent work information in `.devland/state.yaml`; semantic validation rejects duplicate work IDs and bucket/status contradictions.
- **Core policies** — reusable engineering rules for scope, verification, Git hygiene, dependencies, security, testing, and documentation.
- **Profiles** — conditional guidance activated by project type, quality concern, stack, delivery model, or material per-change risk. Explicit profile IDs must resolve; inferred candidates remain optional.
- **Change context** — transient deterministic risk signals select a proportional execution lane without turning one risky change into permanent project-wide ceremony.
- **Workflows** — vendor-neutral procedures that declare semantic capabilities instead of provider APIs.
- **Adapters** — projections for a target runtime or instruction format; they are never a second source of project truth.
- **Engineering events** — normalized provider-agnostic evidence stored locally outside canonical state. Event types require the linkage necessary to interpret them.
- **Provider normalizers** — deterministic translators from concrete provider evidence into Devland events. They do not own provider authentication or network access.
- **Flow metrics** — deterministic timing derived from correlated engineering events and explicit production-environment semantics.

## Minimal target repository

```text
repo/
├── AGENTS.md              # optional adapter/entry point
└── .devland/
    ├── project.yaml
    └── state.yaml
```

A project model declares its Devland behavioral contract explicitly:

```yaml
devland:
  contract: "1"
```

When production cycle metrics are desired, production environments are also explicit rather than inferred from names:

```yaml
delivery:
  model: container-image
  production_environments:
    - production
```

Specs, plans, architecture documents, decisions, and evidence artifacts are conditional. They should exist only when they carry durable value that cannot be represented by the minimal canonical state.

## Current executable

Devland includes a small deterministic Node.js CLI:

```bash
devland validate
devland doctor
devland context <workflow> [change-json]
devland event append '<json>'
devland ingest github '<json>'
devland flow
```

- `validate` checks canonical project/work state against their schemas and deterministic domain invariants, including the supported Devland behavioral contract.
- `doctor` compares canonical state with deterministic repository evidence without rewriting canonical truth. Its report exposes per-category coverage and returns `partial` when known diagnostic categories have not been evaluated instead of claiming global health.
- `context` resolves canonical state, workflow baseline policies, applicable project profiles, and optional transient change-risk expansion for an AI runtime.
- `event append` validates event shape, type-specific linkage, real timestamps, and stable event identity before writing normalized evidence to `.devland/runtime/events.ndjson`.
- `ingest github` accepts already-obtained GitHub commit, pull-request, workflow-run, and deployment evidence; converts it to stable `devland.event/v1` events; and merges it idempotently into the local spool under a repository-local ingestion lock.
- `flow` calculates idea-to-production plus actionable stage timing for review, CI feedback, deployment, and failed-deployment recovery. Idea-to-production closes only on a deployment success whose environment is declared production; deployment/recovery pairing includes environment as part of correlation.

### Proportional change context

Per-change risk is passed as transient input rather than persisted as a project fact:

```bash
devland context develop-change '{"signals":["security-boundary"]}'
```

Current deterministic lanes are:

- **rapid** — localized/reversible work or no material signal;
- **guided** — multi-module, schema-change, or new-api-flow work;
- **deliberate** — security-boundary, irreversible-migration, data-loss-risk, concurrency-semantics, compatibility-break, or large-blast-radius work.

The highest-risk declared signal wins. Unknown signals fail explicitly rather than silently reducing ceremony. A security-boundary signal also activates the existing `qualities.security-sensitive` guidance even when the entire project is not permanently marked security-sensitive. Change descriptors are never written into canonical project state by context resolution.

A runtime or provider integration remains responsible for reading GitHub. Devland does not store GitHub tokens or make authenticated GitHub API calls. The same provider history can be replayed into a fresh checkout because normalized event IDs are derived deterministically from repository and provider identities.

`.devland/runtime/events.ndjson` is a local evidence spool/cache, not the authoritative provider history. Batch ingestion validates the complete incoming batch, detects stable-ID conflicts, serializes concurrent local writers, and replays exact duplicate evidence without duplication.

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

Flow metrics use only complete, semantically valid evidence with sufficient correlation. Missing linkage, unknown production environments, or corrupted event evidence are not converted into invented metrics. Provider authentication/collection, dashboards, databases, and autonomous agent orchestration remain outside the current executable scope.

## Development and verification

Devland currently targets Node.js 22 or newer. Repository contract checks use:

```bash
npm ci
npm test
```

Devland is dogfooded against its own canonical state and tested against representative project/evaluation fixtures. Completion claims are expected to be backed by fresh verification evidence rather than inferred from code changes alone.
