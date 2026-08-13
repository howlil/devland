# Devland Normalization Study

Status: candidate model, not yet a frozen Devland specification.

## Goal

Devland should standardize the semantic contract used to develop software with AI without forcing every repository to use the same product-specific documentation.

This study compares the current agent/engineering systems used by:

- `howlil/cliplingo`
- `howlil/podland`
- `howlil/wago`
- `howlil/MyPaas`

`howlil/sop-auto-fill` is used as a minimal counterexample for iteration-state handling.

The question is not "which repository has the best `.agents` folder?" The question is: which semantics are invariant, which are conditional, and which belong only to one product?

## 1. Observed repository patterns

### ClipLingo

ClipLingo separates product context, architecture, engineering rules, SDLC, release strategy, documentation policy, current iteration, implementation plans, and focused skills.

Strengths:

- clear product scope/non-goals and measurable quality targets;
- architecture boundaries are explicit;
- current iteration is separated from the detailed implementation plan;
- skills are selectively scoped by technology/quality/domain.

Normalization issue:

`RULES.md` mixes universal engineering policy with project-specific architecture. Examples of universal semantics include YAGNI, dependency discipline, regression testing, branch hygiene, and documentation discipline. Examples of project-specific semantics include Rust owning application state, Svelte being presentation-only, CTranslate2 isolation, and Windows Named Pipe IPC.

### Podland

Podland has a large engineering constitution plus separate product/architecture specification, design, development/release contract, current iteration execution lock, roadmap, code patterns, and role-specific skills.

Strengths:

- very strong scope gates;
- explicit document precedence;
- detailed development, CI, staging, release, security, reliability, and dependency-adoption contracts;
- current iteration protects the repository from implementing later product scope.

Normalization issue:

Several semantics repeat across `AGENTS.md`, `PROJECT.md`, `DEVELOPMENT.md`, and `CURRENT_ITERATION.md`. Universal policy, product architecture, delivery profile, and transient iteration constraints are partially duplicated instead of being different semantic layers.

### Wago

Wago keeps the repository-wide engineering contract in root `AGENTS.md`, while `.agent/` is an internal workspace containing approved design specs, detailed plans, and verification checkpoints. Public documentation remains under `docs/`.

Strengths:

- strong distinction between current product truth and internal change artifacts;
- spec -> plan -> verification is explicit;
- public docs and internal agent artifacts have separate audiences;
- actual code is explicitly treated as the final behavioral truth.

Normalization issue:

`AGENTS.md` still combines product identity, architecture, durable-state rules, WhatsApp/Baileys specifics, backend/frontend conventions, testing, Git policy, operations, and documentation policy. The change workspace is cleaner than the global context.

### MyPaas

MyPaas uses root `AGENTS.md`, root `CLAUDE.md`, `.codex/`, `.agents/skills/`, and `.agents/mcp/`. Its agent files contain a detailed project overview, locked stack, repository shape, coding standards, security rules, deployment constraints, and project-specific skills.

Strengths:

- concrete implementation conventions;
- useful language/framework-specific guidance;
- clear operational and security constraints.

Normalization issue:

Agent-specific entry files duplicate the same canonical project knowledge. `AGENTS.md` and `CLAUDE.md` contain substantially overlapping product and stack context, while tool-specific configuration lives elsewhere. This is exactly the kind of adapter drift Devland should prevent.

### SOP Auto Fill as a minimal counterexample

`sop-auto-fill` currently stores only a compact `CURRENT_ITERATION.md` containing the completed vertical slice, integration evidence, preserved constraints, completion evidence, and transition state.

This proves that a repository does not always require a large static agent knowledge base if most product/architecture truth is already represented elsewhere. Devland must therefore be capability- and evidence-driven rather than generating a fixed document set.

## 2. Normalized semantic layers

The evidence supports six semantic layers.

### Layer A — Project model

Stable facts about what is being built.

Typical semantics:

- identity/name;
- project/product kind;
- purpose;
- users and primary use cases;
- priorities;
- in-scope and non-goals;
- target platforms/runtime/deployment shape;
- selected stack;
- high-level quality targets;
- maturity/lifecycle stage.

These are project-specific facts, not universal policy.

### Layer B — Architecture model

Current technical truth and important invariants.

Typical semantics:

- architectural style;
- components/modules;
- ownership boundaries;
- data/control flow;
- external systems;
- durable/transient state boundaries;
- trust boundaries;
- important runtime invariants;
- adopted provider/driver decisions;
- project-specific performance/security constraints.

Architecture is current project truth. It should not be confused with generic engineering guidance.

### Layer C — Engineering policy

Reusable rules about how software should be changed.

Candidate universal policies:

1. **Scope discipline**
   - implement current requirements only;
   - avoid speculative infrastructure and abstractions;
   - avoid unrelated repository-wide cleanup.

2. **Architecture discipline**
   - maintain explicit ownership boundaries;
   - add interfaces/adapters at real volatile/external boundaries, not everywhere;
   - keep transport/framework/vendor details out of core behavior when a meaningful boundary exists.

3. **Dependency discipline**
   - prefer existing/standard capabilities first;
   - add dependencies only for a current problem;
   - evaluate maintenance, security, license, runtime/binary, and replacement cost.

4. **Change/testing discipline**
   - behavior changes use RED -> GREEN -> REFACTOR when technically meaningful;
   - bug fixes require regression coverage at the lowest useful level;
   - test observable behavior and invariants instead of private implementation trivia;
   - use deterministic integration/reproduction when unit testing is not meaningful.

5. **Verification discipline**
   - do not claim completion without fresh evidence;
   - run scope-relevant tests/checks/build/security gates;
   - re-verify if the verified head materially changes.

6. **Git hygiene**
   - one logical task uses at most one working branch;
   - same-task fixes stay on the same branch/PR;
   - avoid permanent `develop`/iteration/retry branches;
   - squash merge normal logical tasks;
   - remove abandoned/merged temporary Git state when tooling permits.

7. **Security baseline**
   - validate untrusted input at trust boundaries;
   - secrets/credentials must not enter source, fixtures, logs, or public errors;
   - use least privilege for external credentials/capabilities;
   - security-sensitive state should not be exposed merely for debugging convenience.

8. **Reliability baseline**
   - external/process/network operations need bounded failure behavior where hangs/retries affect correctness;
   - do not silently swallow meaningful failures;
   - retries must be bounded and safe;
   - repeated side effects require idempotency/reconciliation where applicable.

9. **Performance discipline**
   - measure before performance-driven complexity;
   - optimize user/system budgets that matter to the product rather than synthetic metrics.

10. **Documentation discipline**
    - update affected contracts/docs in the same logical change;
    - do not maintain speculative documentation for code that does not exist;
    - keep public product documentation distinct from internal agent/change artifacts when both audiences exist.

These policies are candidates for Devland Core. Exact wording is not frozen yet.

### Layer D — Profiles

Conditional policy activated only when evidence says it applies.

Candidate profile dimensions:

#### Project type

- backend/service
- frontend/web
- desktop
- CLI
- library
- infrastructure/control-plane

#### Technology/stack

Examples:

- Go
- TypeScript
- Rust
- React
- Svelte
- Tauri
- PostgreSQL
- SQLite
- Docker

Technology profiles should contain language/framework conventions and relevant verification guidance, not restate product architecture.

#### Quality/risk

- security-sensitive
- privacy-sensitive
- performance-sensitive
- durable-state
- external-side-effects
- OSS/public-distribution

#### Delivery

- desktop release channels
- self-hosted server deployment
- OCI/container release
- library/package release

Release/staging semantics differ materially between a Windows desktop utility and a self-hosted server, so they must not be one universal release policy.

### Layer E — Work/change state

Transient development truth.

The comparison shows that **iteration is not universal**:

- ClipLingo and Podland are iteration-driven;
- Wago uses multiple independent specs/plans/checkpoints;
- SOP Auto Fill can preserve only a completed vertical-slice state.

Therefore Devland should model a generic **work item/change**, while allowing an optional iteration/milestone grouping.

Minimum work semantics:

- ID/title/type;
- status;
- goal;
- allowed scope;
- explicitly excluded scope;
- acceptance criteria;
- spec reference when required;
- plan reference when required;
- branch/PR reference when known;
- verification/evidence references;
- blockers;
- open decisions;
- next candidates.

Recommended status vocabulary for v0:

`discovered -> defined -> planned -> active -> verifying -> done`

Exceptional states:

- `blocked`
- `abandoned`

Do not require every repository to use every state.

### Layer F — Agent/tool adapters

Devland Core should not be OpenAI-, Claude-, Codex-, Cursor-, or GitHub-specific.

Adapters transform canonical Devland semantics into the format a runtime understands.

Examples:

- `AGENTS.md` entry point;
- OpenAI Agent Skill package;
- Claude-specific project instruction file;
- Codex-specific hooks/configuration;
- future agent formats.

Repository/provider tools are capabilities, not Devland semantics. A workflow should request semantic capabilities such as:

- `repository.read`
- `repository.write`
- `vcs.branch`
- `vcs.pull_request`
- `ci.read`
- `ci.retry`
- `shell.execute`

The runtime/adapter decides which concrete tool provides those capabilities.

## 3. Candidate Devland v0 project model

This is intentionally smaller than the union of all repository documents.

```yaml
schema: devland/v0

project:
  name: example
  kinds: []
  maturity: experimental

product:
  purpose: ""
  users: []
  primary_use_cases: []
  priorities: []
  scope:
    includes: []
    excludes: []

runtime:
  platforms: []
  deployment_shape: null
  distribution: []

stack:
  languages: []
  frameworks: []
  data_stores: []
  infrastructure: []

architecture:
  style: null
  document: .devland/architecture.md

qualities:
  profiles: []
  targets: []

profiles: []

repository:
  default_branch: null
  commands:
    bootstrap: null
    test: null
    check: null
    build: null
    e2e: null

policy_overrides: {}
```

Principles:

- structured facts live in YAML/JSON-compatible data;
- long architectural reasoning stays human-readable in Markdown;
- absent data remains absent rather than being invented;
- detected repository facts can populate the model but must be distinguishable from user/project decisions when provenance becomes necessary;
- v0 does not model every possible CI, deployment, domain entity, or technology detail.

## 4. Candidate work-state model

```yaml
schema: devland/state-v0

updated_at: null

milestone:
  id: null
  title: null

active_work:
  - id: null
    type: feature
    title: null
    status: planned
    goal: null

    scope:
      allowed: []
      excluded: []

    acceptance: []

    artifacts:
      spec: null
      plan: null
      evidence: []

    vcs:
      branch: null
      pull_request: null

    blockers: []
    open_decisions: []

next_candidates: []
```

`active_work` is an array because independent work can exist concurrently. A simple project may keep exactly one entry.

## 5. Candidate Devland Core taxonomy

```text
core/
  policies/
    scope.md
    architecture.md
    dependencies.md
    testing.md
    verification.md
    git.md
    security.md
    reliability.md
    performance.md
    documentation.md

  workflows/
    bootstrap-project.md
    develop-change.md
    doctor-project.md

profiles/
  project-types/
  stacks/
  qualities/
  delivery/

adapters/
  agents-md/
  openai/
  generic/

schemas/
  project.schema.json
  state.schema.json

 evals/
  fixtures/
```

Only three workflows are proposed initially:

### `bootstrap-project`

Idea or existing repository -> gather evidence -> build project model -> identify architecture context -> resolve relevant profiles -> create initial Devland state.

### `develop-change`

Load project/state -> inspect repository -> define behavior/acceptance -> smallest design -> test/reproduce -> implement -> refactor -> verify -> update relevant project/change state -> integrate when capability and policy allow it.

### `doctor-project`

Compare canonical project model, current repository, generated adapter files, and work state -> report semantic drift, stale references, missing evidence, and invalid policy/profile assumptions.

Do not split plan/test/review/release into separate Devland workflows until real usage proves they need independent lifecycle/routing.

## 6. Proposed precedence model

Policy composition should be explicit and deterministic.

```text
Devland Core
  < project-type profile
  < quality/risk profile
  < stack profile
  < project-specific decisions/overrides
  < active work-item constraints
```

Tool capability is orthogonal to precedence. A workflow may require or optionally use capabilities, but lack of a write/PR/shell capability must not alter project truth.

Conflicts should be surfaced rather than silently resolved when two rules have equal specificity.

## 7. Proposed target-repository shape

Devland should not copy its whole library into every project.

Candidate minimal project payload:

```text
repo/
  AGENTS.md                 # generated/adapter entry point, optional per runtime

  .devland/
    project.yaml            # canonical structured project facts
    state.yaml              # transient work state
    architecture.md         # detailed current architecture when useful

    decisions/              # durable non-obvious project decisions

    changes/                # only when the project needs persisted change artifacts
      <change-id>/
        spec.md
        plan.md
        evidence.md
```

The `changes/` directory is optional. Wago demonstrates its value for complex/higher-risk work; small projects should not be forced to persist a spec/plan/evidence triplet for trivial changes.

## 8. Anti-patterns Devland should prevent

1. **One giant agent file** containing product, architecture, coding style, workflow, release, state, and tool-specific instructions.
2. **Duplicate canonical knowledge per agent**, such as maintaining equivalent project facts separately in `AGENTS.md`, `CLAUDE.md`, and another runtime file.
3. **Universalizing project decisions**, such as treating Windows Named Pipe, SSE, SQLite, PostgreSQL, or a specific framework as general engineering policy.
4. **Forcing one lifecycle shape**, especially mandatory iterations for repositories that naturally work change-by-change.
5. **Generating every possible document/profile** regardless of current project complexity.
6. **Treating Markdown as authoritative structured state** when validation/drift detection needs typed data.
7. **Treating generated adapter files as source of truth** instead of projections of canonical Devland state.
8. **Assuming tool capabilities**, such as assuming every ChatGPT/GitHub environment can write branches, run tests, or merge PRs.
9. **Speculative profile explosion** before repeated evidence proves a profile is reusable.
10. **Completion without evidence** or stale evidence after the relevant code/head changed.

## 9. Evaluation plan before freezing v0

Devland v0 should not be considered valid because the schema looks clean. It must reproduce the useful semantics of the studied repositories without carrying their accidental structure.

Initial eval fixtures:

1. ClipLingo — desktop/native, privacy/performance-sensitive, multi-language stack.
2. Podland — self-hosted infrastructure/control-plane, durable state, external providers, staging/release lifecycle.
3. Wago — existing production application with independent change specs/plans/checkpoints.
4. MyPaas — existing project with duplicated cross-agent context and project-specific language/framework skills.
5. SOP Auto Fill — minimal state-only counterexample.
6. Empty/simple project — verifies that Devland does not over-generate context.

For each fixture evaluate:

- correct project classification;
- relevant profile selection;
- preservation of product-specific constraints;
- stable universal engineering policy;
- omission of irrelevant profiles/rules;
- no invented requirements/architecture;
- correct distinction between current truth and proposed change;
- no duplicate canonical agent-specific knowledge;
- appropriate work-state shape;
- context size remains proportional to the task/project.

## 10. Candidate conclusions

The strongest common denominator is not a standard folder layout. It is a semantic system with four independent axes:

1. **Project truth** — what this software is.
2. **Engineering policy** — how changes should be made.
3. **Work state** — what is changing now and what evidence exists.
4. **Runtime adapter/capabilities** — how a specific AI/tool consumes and executes those semantics.

Devland should standardize those semantics, not standardize the accidental Markdown filenames currently used by individual repositories.

## 11. Decisions intentionally not frozen yet

The following should remain open until fixture evaluation:

- whether `architecture.md` is mandatory or generated only above a complexity threshold;
- whether work artifacts use `.devland/changes/<id>/` or integrate with an existing project-native spec system;
- exact v0 profile names and granularity;
- whether policy provenance/version locking is needed in the first usable version;
- whether `AGENTS.md` should always be generated or only when the active runtime consumes it;
- whether active work allows multiple simultaneous entries by default or requires an explicit concurrency mode;
- how much repository-detected information is persisted versus recomputed during `doctor`.

Do not implement a CLI, backend, registry, UI, database, or custom GitHub integration until this semantic model survives the fixture evaluation.
