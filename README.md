# Devland

[![CI](https://github.com/howlil/devland/actions/workflows/ci.yml/badge.svg)](https://github.com/howlil/devland/actions/workflows/ci.yml)

Devland is a small, agent-agnostic engineering context tool for software developed with AI. It keeps stable project facts, engineering constraints, and deterministic repository feedback separate from any particular coding agent, repository provider, CI system, or deployment platform.

> **Project status:** experimental and in stabilization/dogfooding. New feature development is intentionally frozen while the current core is evaluated on real software delivery work.

## Why Devland

AI-assisted repositories often accumulate duplicated instructions, plans, state files, agent-specific rules, and process ceremony. Devland's goal is narrower: provide a small canonical engineering context that different AI runtimes can consume without turning project metadata into a second product.

The current design optimizes for:

- agent-agnostic project semantics;
- minimal relevant context;
- deterministic validation and diagnostics;
- explicit, risk-proportional engineering guidance;
- evidence-driven evolution rather than speculative feature growth.

Devland is **not** a coding agent, GitHub client, CI/CD engine, deployment service, observability backend, project-management system, multi-agent orchestrator, or telemetry platform.

## Core capabilities

The stable core is intentionally small:

| Command | Purpose |
| --- | --- |
| `devland init <project-name>` | Create minimal canonical project/work state without overwriting existing Devland files. |
| `devland migrate` | Upgrade the supported legacy project format to the current behavioral contract. |
| `devland validate` | Validate canonical state against schemas and deterministic domain invariants. |
| `devland context <workflow> [change-json]` | Resolve only the policies, profiles, workflow semantics, and change-risk context relevant to a task. |
| `devland doctor` | Compare canonical context with repository evidence and report deterministic drift/coverage findings. |

The repository also contains dogfood/experimental feedback capabilities:

| Command | Purpose |
| --- | --- |
| `devland eval adapters [change-json]` | Check deterministic semantic parity between supported adapter projections. |
| `devland event append '<json>'` | Append one validated engineering event to the local event spool. |
| `devland ingest github '<json>'` | Normalize already-obtained GitHub evidence into local Devland events. Devland does not authenticate to or call GitHub itself. |
| `devland flow` | Derive engineering-flow timing and evidence diagnostics from normalized local events. |

These feedback capabilities are not a reason to expand the product surface. They remain subject to simplification or removal if dogfooding does not demonstrate concrete value.

## Quick start

Devland currently requires **Node.js 22+** and is not published as a public npm package.

```bash
git clone https://github.com/howlil/devland.git
cd devland
npm ci
npm link
```

Then initialize another repository from that repository's root:

```bash
cd /path/to/your-project
devland init my-project
devland validate
devland doctor
```

Initialization refuses to overwrite an existing `.devland/project.yaml` or `.devland/state.yaml`; existing canonical state must be handled explicitly rather than silently replaced.

Resolve engineering context for a normal change:

```bash
devland context develop-change
```

Pass transient risk signals only when they apply to the current change:

```bash
devland context develop-change '{"signals":["security-boundary"]}'
```

Change risk is transient input. It is not written back into permanent project state.

## Canonical repository model

A Devland-enabled repository is deliberately small:

```text
repo/
├── AGENTS.md                # optional runtime/agent projection
└── .devland/
    ├── project.yaml         # stable project facts and constraints
    ├── state.yaml           # lightweight current/recent work context
    └── runtime/             # optional local evidence cache; not canonical truth
```

`project.yaml` is for facts that should remain useful across tasks. `state.yaml` is **not an append-only changelog** and should not require a maintenance PR merely to mirror Git history. Specs, plans, decision records, and evidence documents are conditional artifacts: create them only when they carry durable value that cannot be represented more simply.

A project explicitly pins the Devland behavioral contract:

```yaml
devland:
  contract: "1"
```

The current supported behavioral contract is contract 1. Package versions, YAML schema identifiers, and the behavioral contract are separate compatibility dimensions. See [`docs/release-policy.md`](docs/release-policy.md) before changing compatibility boundaries.

## Architecture

```text
            .devland/project.yaml
                     +
              repository facts
                     |
                     v
              context resolver
                     |
        +------------+------------+
        |                         |
        v                         v
 relevant engineering         repository
     constraints               doctor
        |
        v
   AI runtime / human
        |
        v
     repository
```

Optional dogfood feedback path:

```text
GitHub / CI / deployment evidence
              |
              v
      provider normalization
              |
              v
       local event spool
              |
              v
        flow analysis
```

The optional path must remain optional. External systems continue to own authentication, repository access, CI, deployment, and production telemetry.

## Delivery philosophy

Devland is now operated with a strict scope governor:

> A valid improvement is not automatically valid work.

A non-trivial change should be active only when at least one condition is true:

1. the primary user journey fails without it;
2. it prevents an unacceptable security, data-loss, compatibility, or external-side-effect risk;
3. real usage/dogfood evidence exposed the problem;
4. the decision is expensive to reverse after adoption.

Comprehensive audits may identify many valid improvements, but findings should be classified into `now`, `after-feedback`, `later`, or `not-now`. They do not automatically become an implementation queue.

The preferred delivery unit is one coherent vertical outcome, not the smallest possible commit or PR:

```text
outcome
  -> acceptance criteria
  -> smallest coherent change
  -> proportional verification
  -> PR
  -> merge
  -> observe
```

## Verification model

Verification is risk-based rather than ceremony-based.

| Level | Typical changes | Expected verification |
| --- | --- | --- |
| 0 | Docs, copy, local metadata | Diff/syntax checks where relevant |
| 1 | Localized deterministic behavior | Focused unit tests + relevant static checks |
| 2 | Core user-flow behavior | Focused tests + integration/smoke + normal CI |
| 3 | Persistence, schemas, migrations, security, concurrency, external side effects | Broader affected suite + regression coverage |
| 4 | Packaging, runtime portability, release-sensitive behavior | Full suite + explicit Linux/macOS/Windows verification |

Normal pull requests run the fast Ubuntu CI path. Cross-platform verification lives in a separate workflow and is run explicitly for portability/release-sensitive work or release tags. This preserves portability coverage without paying three-platform CI cost for every ordinary change.

Local development:

```bash
npm ci
npm test
```

## Current stabilization plan

Devland is feature-frozen until it proves that it reduces delivery friction in another repository.

The current evaluation loop is:

```text
use Devland on a real vertical slice
        |
        v
measure delivery friction
        |
        +--> useful capability -> keep
        |
        +--> unused ceremony -> simplify/remove
        |
        +--> observed defect -> focused fix
```

The intended dogfood target is a real product-building repository rather than Devland itself. Success is measured by faster delivery of usable product value, not by the number of Devland iterations, schemas, metrics, plans, or evidence artifacts created.

## Contributing

During stabilization, the highest-value contributions are:

- reproducible correctness bugs;
- security or data-integrity issues;
- compatibility/portability failures;
- documentation corrections;
- concrete dogfood evidence showing that a Devland behavior helps or obstructs delivery.

New feature proposals should include an observed use case and explain why the existing core cannot support it without the proposed change. Please avoid speculative abstractions, provider integrations without a current consumer, or process artifacts created only for hypothetical future scale.

Security-sensitive reports should follow [`SECURITY.md`](SECURITY.md).

## Distribution and license status

`package.json` intentionally remains `private: true`; public npm publication has not been approved. The repository also does not yet declare an explicit software license. Source being publicly visible does **not** grant open-source reuse rights by itself.

License selection, public package identity/publication, and repository governance are tracked in [issue #21](https://github.com/howlil/devland/issues/21).

Until those decisions are explicit, treat Devland as a public experimental source repository rather than a released OSS package.
