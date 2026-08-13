# Devland v0 Design Specification

Status: **Approved candidate design for v0 implementation planning**  
Date: 2026-08-13

## 1. Purpose

Devland is an agent-agnostic engineering context system for software projects developed with AI.

It exists to solve a recurring problem: different repositories encode the same engineering concerns in different files, with different names, duplicated rules, missing constraints, and agent-specific copies. Devland standardizes the **semantics** of that engineering context without forcing every software product to share the same architecture, technology, lifecycle cadence, or documentation volume.

Devland v0 is deliberately **not an application**. It has no web UI, dashboard, backend service, database, agent runtime, or custom repository connector. It is a repository of schemas, reusable policies, profiles, workflows, adapters, and evaluation fixtures that an AI runtime such as ChatGPT or Codex can consume alongside an existing repository tool such as GitHub.

The v0 design must work for:

- a new project described only through conversation;
- an existing repository with no AI instructions;
- an existing repository with large or inconsistent `.agents`, `.agent`, `AGENTS.md`, `CLAUDE.md`, or similar structures;
- iteration-driven projects;
- task/change-driven projects;
- different software types such as backend, frontend, desktop, CLI, library, infrastructure, and full-stack applications.

## 2. Core design thesis

Devland standardizes five things and keeps one thing explicitly outside the core:

1. **Project model** — what the project is and what constraints define it.
2. **Engineering policy** — how software changes should be developed and verified.
3. **Profiles** — conditional guidance selected because of project type, technology, risk, or delivery model.
4. **Work state** — what change is active, what is allowed, and what evidence is required.
5. **Workflows** — how an AI/human moves from discovery to implementation to verification.
6. **Adapters** — how the same Devland semantics are expressed to a specific agent/runtime. Adapters are outside the semantic core.

The governing separation is:

```text
Devland defines WHAT the project means and HOW engineering should proceed.
Adapters define HOW those semantics are expressed to a particular agent.
Tools define WHAT ACTIONS that runtime can actually perform.
```

A Devland workflow may require repository access, but Devland does not implement GitHub, GitLab, filesystem, CI, or pull-request APIs in v0.

## 3. Design principles

### 3.1 Semantics over file templates

Devland does not define one universal `.agents` folder. It defines semantic concepts that may render to different artifacts.

### 3.2 Structured facts, prose guidance

Use machine-readable YAML instances validated by JSON Schema for facts and state that need deterministic interpretation.

Use Markdown for policies, rationale, design guidance, and work artifacts where prose is the natural representation.

```text
structured project/work facts -> YAML
schema definitions              -> JSON Schema
procedural/engineering guidance -> Markdown
agent-specific packaging        -> adapters
```

### 3.3 Project-specific decisions remain project-specific

Devland must never move product-specific architecture into universal policy merely because the same AI generated both.

Examples:

- `bug fixes require regression verification` can be universal;
- `Rust owns application state` is project/stack-specific;
- `use Windows Named Pipe` is project-specific;
- `use real PostgreSQL for transaction integration tests` is conditional on PostgreSQL persistence;
- `one task uses at most one working branch` is a reusable engineering policy.

### 3.4 Progressive context

Agents should load only the context needed for the current task. Devland must not require every policy, profile, architecture document, skill, and historical plan to be placed into every prompt/session.

### 3.5 Evidence over speculative maturity

Devland does not generate infrastructure, documentation, abstractions, profiles, or work artifacts merely because mature projects often have them.

### 3.6 Capability-based execution

Devland workflows describe required and optional capabilities rather than vendor APIs.

Example:

```yaml
requires:
  - repository.read
optional:
  - repository.write
  - vcs.branch
  - vcs.pull_request
  - ci.read
```

A ChatGPT runtime may have only repository read access. A coding agent may additionally have filesystem, shell, git, and CI capabilities. The workflow semantics remain the same; execution adapts to available capabilities.

### 3.7 Code is behavioral evidence, not an instruction renderer

For an existing repository, actual source/configuration/runtime manifests are evidence of current implementation. A stale agent document must not override observable repository reality.

## 4. Non-goals for v0

Devland v0 does not provide:

- a SaaS product;
- a web or desktop interface;
- an API server or database;
- background workers or a vector database;
- its own LLM invocation layer;
- its own GitHub OAuth/GitHub API abstraction;
- autonomous multi-agent orchestration;
- a plugin marketplace;
- a universal source-code architecture;
- a mandatory iteration methodology;
- automatic code implementation or PR integration;
- policy distribution over a network;
- a package registry;
- a CLI unless later evidence shows deterministic execution cannot be tested adequately without one.

## 5. Semantic architecture

```text
                         DEVLAND CORE
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
 Project Model          Engineering Policy        Work Model
       │                      │                      │
       └──────────────┬───────┴──────────────┬──────┘
                      │                      │
                      ▼                      ▼
                  Profiles               Workflows
                      │                      │
                      └──────────┬───────────┘
                                 ▼
                          Resolved Context
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
          AGENTS.md        OpenAI Skill       future adapter
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 ▼
                         available runtime
                                 │
                                 ▼
                              repo
```

No adapter is the source of truth.

## 6. Canonical project model

Every Devland-managed repository may contain:

```text
.devland/project.yaml
```

`project.yaml` stores stable or slowly-changing structured facts. It must not become a prose dump.

### 6.1 Required top-level shape

```yaml
schema: devland.project/v0

project:
  name: example
  types: []

product:
  purpose: ""
  priorities: []
  non_goals: []

platforms: []

stack:
  languages: []
  frameworks: []
  runtimes: []
  data_stores: []

architecture:
  style: null
  document: null

qualities: []
profiles: []

delivery:
  model: null

constraints: []
```

### 6.2 Field semantics

- `project.name`: repository/product identifier.
- `project.types`: broad classifications such as `backend`, `frontend`, `fullstack`, `desktop`, `cli`, `library`, `infrastructure`, or `developer-tool`.
- `product.purpose`: concise value statement.
- `product.priorities`: ordered concerns used to resolve trade-offs.
- `product.non_goals`: explicitly excluded scope likely to tempt speculative implementation.
- `platforms`: product/runtime targets where the distinction materially affects engineering.
- `stack.*`: observed or explicitly selected technology facts, not a full package inventory.
- `architecture.style`: high-level style only when useful.
- `architecture.document`: optional path to human-readable architecture guidance.
- `qualities`: quality/risk classifications that activate profiles.
- `profiles`: accepted resolved profile IDs.
- `delivery.model`: release/deployment model where relevant.
- `constraints`: short, high-value constraints that do not naturally belong elsewhere.

## 7. Architecture documentation

A separate architecture document is optional. Default path when justified:

```text
.devland/architecture.md
```

It should contain only project-specific architecture: thesis, components, ownership, boundaries, state ownership, external systems, data/control flow, invariants, failure isolation, and intentional replacement boundaries.

It must not repeat generic Git/TDD/documentation policy. Small projects should omit it when source structure plus `project.yaml` are sufficient.

## 8. Engineering policy model

Devland policies live in Devland Core, not copied wholesale into every target repository.

Each policy has two conceptual attributes.

### 8.1 Scope

- `core` — broadly applicable engineering behavior;
- `project-type` — applies to backend/desktop/library/etc.;
- `quality` — applies because of security/privacy/performance/OSS concerns;
- `stack` — technology-specific guidance;
- `delivery` — release/deployment model guidance.

### 8.2 Strength

- `required` — violation requires an explicit project/work decision and evidence;
- `default` — recommended unless project evidence justifies another choice.

V0 deliberately avoids a more complex policy language.

Candidate reusable semantics include:

- validate external input at trust boundaries;
- do not expose secrets in source/logs/artifacts;
- bug fixes require regression verification when deterministically reproducible;
- verify before claiming completion;
- one logical task uses at most one working branch by default;
- failed CI/review follow-up stays on the same logical task;
- normal integration uses squash merge when repository policy permits;
- do not add dependencies/infrastructure without a current problem;
- do not implement future scope opportunistically;
- update relevant documentation when contracts change;
- do not claim actions were performed when runtime capabilities were absent;
- performance optimization requires measurement when performance is the motivation.

Exact framework, process topology, database ownership, IPC mechanism, or API conventions do not belong in core policy.

## 9. Profile model

Profiles are composable conditional guidance.

```text
profiles/
├── project-types/
├── qualities/
├── stacks/
└── delivery/
```

Examples:

```text
project-types/backend
project-types/desktop
project-types/library
qualities/security-sensitive
qualities/performance-sensitive
stacks/go
stacks/rust
stacks/typescript
delivery/container-image
delivery/desktop-release
```

A profile should exist only when it contains reusable guidance materially different from core policy. It must not merely restate official framework documentation.

Project-local decisions override a generic profile where they conflict, provided the override does not silently weaken a `required` policy.

## 10. Work model

Devland does not require iterations. The universal primitive is a **work item/change**. Iterations, milestones, epics, or phases are optional grouping metadata.

Canonical transient state:

```text
.devland/state.yaml
```

### 10.1 Required shape

```yaml
schema: devland.state/v0

active_work: []
blocked: []
recently_completed: []
open_decisions: []
```

### 10.2 Work item shape

```yaml
- id: browser-session-auth
  kind: feature
  status: planned
  goal: "Separate browser sessions from machine API credentials."

  group:
    type: iteration
    id: 2

  scope:
    allowed: []
    excluded: []

  acceptance: []

  artifacts:
    spec: null
    plan: null
    evidence: []

  branch: null
  pull_request: null
```

`group` is optional.

### 10.3 Statuses

```text
proposed
planned
active
blocked
verifying
done
abandoned
```

### 10.4 Work state rules

- `state.yaml` is a concise index, not a detailed implementation ledger.
- Detailed design belongs in a spec artifact.
- Detailed execution sequence belongs in a plan artifact.
- Verification output/evidence belongs in evidence artifacts or external CI references.
- Completed history must not grow without bound in `state.yaml`.
- The active work item defines current scope more specifically than the general project model.

## 11. Change artifacts

Default optional structure:

```text
.devland/changes/<change-id>/
├── spec.md
├── plan.md
└── evidence.md
```

Not every task requires every file.

- `spec.md`: non-trivial behavior, architecture, security, UX, migration, or trade-off decisions.
- `plan.md`: multiple meaningful implementation steps or handoff/restart continuity.
- `evidence.md`: substantial verification evidence that should survive beyond CI logs.

A trivial documentation correction should not receive three artifact files.

## 12. Decision records

Long-lived, non-obvious architecture decisions may be stored under:

```text
.devland/decisions/
```

Create one only when the decision is expensive to rediscover or reverse, materially constrains future work, or has important trade-offs.

## 13. Source-of-truth hierarchy

For existing repositories, v0 uses:

```text
1. observable repository/runtime configuration for current implemented behavior
2. accepted project-specific Devland model and architecture decisions
3. active work scope/spec for intended change
4. resolved Devland policies/profiles
5. generated agent adapters
6. historical plans/checkpoints
```

Source code/config is evidence of what exists; an approved active spec may define what should change; an adapter file never wins against canonical Devland state.

If canonical state and repository reality disagree, `doctor` reports drift rather than silently choosing whichever text is convenient.

## 14. Resolution precedence

From least to most specific:

```text
core policy
  < project-type profile
  < quality profile
  < delivery profile
  < stack profile
  < project-specific model/decision
  < active work scope/spec
```

More-specific guidance may refine generic guidance. A more-specific layer may not silently weaken a `required` policy. A deliberate exception must be recorded with rationale/evidence.

V0 does not implement automatic semantic conflict solving beyond this precedence and explicit exception rule.

## 15. Adapter model

Adapters consume resolved Devland context and express it to a target AI/runtime.

V0 adapter candidates:

```text
adapters/
├── agents-md/
├── openai/
└── generic/
```

The initial implementation does not require every adapter to be an executable generator. Static/reference renderings are acceptable during semantic evaluation.

### 15.1 AGENTS.md adapter

`AGENTS.md` is an entry/router, not an encyclopedia. It should point an agent to canonical project/work state and relevant active change artifacts without duplicating full context.

### 15.2 OpenAI adapter

OpenAI Skills/plugin packaging may wrap Devland workflows, but OpenAI Skill format is not canonical Devland storage.

### 15.3 Agent-specific duplication rule

Files such as `AGENTS.md`, `CLAUDE.md`, tool rules, or skill packages are projections. Canonical product/stack facts must not be maintained independently in each projection.

## 16. Capability model

Workflows declare semantic capabilities.

Initial vocabulary:

```text
repository.read
repository.write
repository.search
filesystem.read
filesystem.write
shell.execute
vcs.status
vcs.branch
vcs.commit
vcs.pull_request
ci.read
ci.execute
network.public-read
```

This vocabulary is descriptive, not a permission framework. Adapters/runtimes map available tools to these capabilities.

A workflow must never claim completion of an action requiring a missing capability.

## 17. Core workflows

V0 defines exactly three top-level workflows.

### 17.1 `bootstrap-project`

```text
identify input mode: idea | existing repository
    -> understand product purpose and constraints
    -> inspect repository evidence when available
    -> classify project types / qualities / stack / delivery
    -> detect existing agent/workflow artifacts
    -> identify conflicts and unsupported assumptions
    -> produce candidate project model
    -> select minimal profiles
    -> create/refresh canonical project state
    -> render only necessary adapter entry points
```

Rules: never invent complexity to fill schema fields; represent unknowns as absent/null; migrate conservatively; do not delete old agent files until canonical equivalents are validated; do not generate optional artifacts without a reason.

### 17.2 `develop-change`

```text
load project + work state
    -> inspect relevant repository reality
    -> understand requested behavior
    -> establish acceptance/scope
    -> create spec when design risk warrants it
    -> create plan when execution complexity warrants it
    -> test/reproduce failure before behavior implementation when applicable
    -> minimal implementation
    -> refactor with tests green
    -> broader verification
    -> update docs/canonical state when contracts changed
    -> review current diff/state
    -> integrate only when capabilities and repository policy permit
    -> record evidence / mark work done
```

Universal behavior-change default is RED -> GREEN -> REFACTOR, with deterministic integration/E2E reproduction allowed where isolated unit testing is not meaningful.

### 17.3 `doctor-project`

Doctor compares:

```text
canonical project model
vs actual repository evidence
vs active work state
vs generated adapters
```

V0 categories:

- project-model drift;
- stack/runtime drift;
- architecture-document drift;
- stale work state;
- adapter duplication/divergence;
- invalid/missing referenced files;
- policy conflict;
- missing verification evidence for a claimed-done active item;
- over-generated context with no current applicability.

Doctor reports evidence and recommended correction. It does not rewrite canonical truth automatically in v0.

## 18. Minimal target repository shape

Simple project:

```text
repo/
├── AGENTS.md                 # optional adapter/entry point
└── .devland/
    ├── project.yaml
    └── state.yaml
```

Complex projects may add:

```text
.devland/
├── architecture.md
├── decisions/
└── changes/
```

Devland must not force empty directories or placeholder files.

## 19. Devland repository structure for v0

```text
devland/
├── README.md
├── NORMALIZATION_STUDY.md
├── schemas/
│   ├── project.schema.json
│   └── state.schema.json
├── core/
│   ├── policies/
│   │   ├── engineering.md
│   │   ├── git.md
│   │   ├── testing.md
│   │   ├── verification.md
│   │   ├── dependencies.md
│   │   ├── security.md
│   │   └── documentation.md
│   └── workflows/
│       ├── bootstrap-project.md
│       ├── develop-change.md
│       └── doctor-project.md
├── profiles/
│   ├── project-types/
│   ├── qualities/
│   ├── stacks/
│   └── delivery/
├── adapters/
│   ├── agents-md/
│   ├── openai/
│   └── generic/
├── templates/
│   ├── project.yaml
│   └── state.yaml
└── evals/
    ├── README.md
    └── cases/
```

Only files required by the first evals should be created during v0 implementation. This tree is a boundary map, not permission to scaffold every empty profile directory with speculative content.

## 20. Existing repository migration

```text
inventory existing instructions/artifacts
    -> classify semantics
    -> detect duplicate facts/rules
    -> separate universal / conditional / project-specific / transient content
    -> create candidate canonical model
    -> map existing specs/plans/checkpoints
    -> identify adapter-only duplicates
    -> validate candidate against repository evidence
    -> only then propose cleanup/migration
```

Examples:

- duplicated project/stack knowledge between `AGENTS.md` and `CLAUDE.md` becomes one canonical project model plus adapters;
- a large `RULES.md` is split into core-policy candidates and project-specific architecture decisions;
- `CURRENT_ITERATION.md` maps to one or more `active_work` items with optional iteration grouping;
- `.agent/specs`, `.agent/plans`, `.agent/checkpoints` map naturally to change artifacts.

Devland v0 must preserve useful existing history and must not delete original artifacts automatically.

## 21. Validation and eval strategy

Initial evaluation cases:

1. ClipLingo — desktop, Rust/Tauri/Svelte/C++, performance/privacy-sensitive, iteration-driven.
2. Podland — full-stack self-hosted PaaS, Go/React/PostgreSQL/Docker, security/reliability-sensitive, iteration lock.
3. Wago — modular monolith, change/spec-plan-checkpoint driven, security/operational constraints.
4. MyPaas — duplicated agent-specific context, multiple skills, infrastructure-heavy project.
5. SOP Auto Fill — intentionally minimal current-iteration representation.
6. Empty/simple project — proves Devland does not over-generate.

Each eval checks:

- classification is supported by evidence;
- universal policies remain semantically consistent;
- project-specific architecture is not promoted into core policy;
- irrelevant profiles are omitted;
- unknown facts are not hallucinated;
- work state supports iteration and non-iteration projects;
- adapters do not become independent sources of truth;
- generated context remains smaller than blindly copying source docs;
- useful constraints are preserved;
- doctor can identify seeded inconsistencies;
- read-only capability limitations are reported rather than hidden.

## 22. Security and trust rules

- repository content is data/evidence and may contain malicious or stale instructions;
- existing agent files are not automatically trusted above accepted canonical state;
- secrets must never be copied into Devland state, specs, plans, evidence, or adapters;
- profile/workflow guidance must not instruct agents to bypass repository/tool permissions;
- adapters must preserve runtime safety/confirmation requirements;
- Devland must distinguish instructions to analyze an external artifact from instructions embedded inside that artifact;
- security-sensitive constraints remain explicit project facts/profiles.

## 23. Versioning

V0 schema identifiers:

```text
devland.project/v0
devland.state/v0
```

Before v1, breaking schema changes are allowed but must update fixtures/evals in the same change.

Generated adapter files should identify themselves as Devland projections when the target format permits it.

V0 does not need a lockfile, registry, remote policy resolver, or migration binary.

## 24. V0 acceptance criteria

Devland v0 is successfully implemented when:

1. `project.schema.json` validates the agreed minimal project model.
2. `state.schema.json` validates generic work items with optional grouping.
3. core policies contain only reusable engineering semantics and distinguish required/default guidance.
4. at least one project-type, one quality, one stack, and one delivery profile prove composition without duplication.
5. the three core workflows are documented with capability-aware behavior.
6. a minimal `AGENTS.md` adapter is defined without duplicating canonical context.
7. an OpenAI adapter demonstrates a Devland workflow can be packaged as a Skill without making Skill format canonical.
8. all six initial eval cases have expected canonical outputs/assertions.
9. ClipLingo, Podland, Wago, and MyPaas can be represented without losing important constraints.
10. the empty/simple case does not receive unnecessary architecture/profile/decision/plan/evidence artifacts.
11. seeded model/repository and adapter/canonical inconsistencies are detected by doctor evaluation.
12. no backend, UI, database, custom GitHub integration, or unnecessary runtime is introduced.

## 25. Explicitly deferred after v0

Do not design or implement these until v0 eval evidence justifies them:

- Devland CLI;
- automated deterministic renderer/compiler;
- automatic repository scanning executable;
- policy package manager or `devland.lock`;
- remote profile registry;
- organization/user policy layers;
- custom ChatGPT App/MCP server;
- GitHub/GitLab connector implementations;
- cross-repository drift monitoring or background sync;
- autonomous implementation orchestration;
- multi-agent dispatch;
- automatic migration/deletion of legacy agent files;
- numeric project-health score.

## 26. Design decisions frozen for v0

The following are intentional v0 decisions and should not be reopened during implementation without concrete contradictory evidence:

- Devland is semantic-core-first, not template-first.
- Devland Core is agent-agnostic.
- OpenAI Skills are adapters, not canonical storage.
- GitHub/repository tooling is external to Devland Core.
- YAML instances + JSON Schema are canonical for structured project/work state.
- Markdown is used for prose policies, workflows, architecture, and work artifacts.
- `work item/change` is universal; `iteration` is optional grouping.
- `.devland/project.yaml` and `.devland/state.yaml` are the minimal project-local canonical state.
- architecture/change/decision artifacts are optional and evidence-driven.
- `AGENTS.md` is an adapter/entry point, not source of truth.
- policy precedence is core -> profiles -> project -> active work.
- required-policy exceptions must be explicit; default policy may be overridden by evidence.
- v0 has exactly three top-level workflows: bootstrap, develop change, doctor.
- v0 contains no standalone app/runtime unless evaluation demonstrates a deterministic capability that cannot reasonably be tested otherwise.
