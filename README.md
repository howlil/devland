# Devland

[![CI](https://github.com/howlil/devland/actions/workflows/ci.yml/badge.svg)](https://github.com/howlil/devland/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Agent-agnostic engineering context and deterministic repository diagnostics for AI-assisted software development.**

Devland gives AI coding tools and humans a small, shared engineering context without turning repository metadata into another project-management system. It keeps durable project facts, reusable engineering guidance, and deterministic repository checks separate from any specific agent, Git provider, CI system, or deployment platform.

> **Status:** pre-1.0 and actively dogfooded. The core CLI is usable today, but interfaces may still change as real-world usage exposes better boundaries.

## Why Devland

AI-assisted repositories tend to accumulate duplicated instructions, stale plans, agent-specific files, and process artifacts that drift away from the code. Devland takes a narrower approach:

- keep canonical project context small;
- resolve only guidance relevant to the current change;
- validate facts deterministically where possible;
- scale verification with actual risk;
- prefer repository evidence over speculative metadata;
- evolve from observed use, not hypothetical feature demand.

Devland is **not** a coding agent, CI/CD engine, deployment platform, project-management tool, observability backend, or multi-agent orchestrator.

## Installation

Devland requires **Node.js 22 or newer**. pnpm is the canonical package manager and is pinned through `package.json`.

For active development or dogfooding, install from source:

```bash
git clone https://github.com/howlil/devland.git
cd devland
corepack enable
pnpm install --frozen-lockfile
pnpm link --global
```

For a pinned release, install a tagged GitHub version:

```bash
corepack enable
pnpm add --global github:howlil/devland#v0.2.0
```

Tagged GitHub Releases also contain a `.tgz` package that can be installed with `pnpm add --global ./devland-<version>.tgz`.

Devland is not currently published as a public npm package. WinGet publication is deferred until Devland has a verified Windows executable artifact.

For prerequisites, Windows notes, updating a source checkout, local MCP development, Docker testing, and troubleshooting the global link, see [`docs/local-usage.md`](docs/local-usage.md).

## Quick start

Use Devland from the repository that should consume its engineering context:

```bash
cd /path/to/project

devland init my-project
devland validate
devland doctor
devland context develop-change
```

`devland init <project-name>` creates `.devland/project.yaml` and `.devland/state.yaml` and refuses to overwrite existing canonical files.

For a change with material risk, pass transient signals without permanently inflating project state:

```bash
devland context develop-change '{"signals":["security-boundary"]}'
```

For an active request that must keep intent and acceptance boundaries attached to the resolved agent context, create a transient JSON envelope:

```json
{
  "id": "work-123",
  "intent": "Fix session expiry handling",
  "acceptance": [
    "expired sessions are rejected",
    "valid sessions continue to work"
  ],
  "scope": {
    "allowed": ["src/auth"],
    "excluded": ["oauth redesign"]
  },
  "expected_outcome": "session expiry behaves consistently"
}
```

Then resolve it without persisting the work envelope into canonical state:

```bash
devland context --work ./work.json
```

`develop-change` is the default workflow for this flag-first form. Existing calls such as `devland context develop-change` and `devland context develop-change '<change-json>'` remain valid.

Request current work state only when the task depends on it:

```bash
devland context develop-change '{"signals":["localized"],"context":{"state":true}}'
```

Request the complete context payload only for debugging or broader reasoning:

```bash
devland context develop-change '{"context":{"full":true}}'
```

The detailed local workflow, including Command Prompt quoting on Windows and running the MCP server on `localhost:8787`, is documented in [`docs/local-usage.md`](docs/local-usage.md).

## Commands

### Core

| Command | Purpose |
| --- | --- |
| `devland init <project-name>` | Create minimal canonical project and work-state files. |
| `devland migrate` | Migrate supported legacy canonical state to behavioral contract `1`. |
| `devland validate` | Validate canonical files against schemas and deterministic invariants. |
| `devland context <workflow> [change-json] [--work <work-json-file>]` | Resolve risk-budgeted policies, profiles, workflow guidance, canonical references, and an optional transient work contract relevant to a change. |
| `devland doctor` | Detect supported repository drift from observable evidence. |

`doctor` currently checks deterministic stack/runtime drift and missing referenced architecture files. Unsupported future diagnostics are not reported as fake partial coverage.

### Experimental

These commands are available for dogfooding but are not considered stable product surface yet:

| Command | Purpose |
| --- | --- |
| `devland eval adapters [change-json]` | Compare semantic parity across supported adapter projections. |
| `devland event append '<json>'` | Append a validated engineering event to the local event spool. |
| `devland ingest github '<json>'` | Normalize already-obtained GitHub evidence into Devland events. |
| `devland flow` | Derive flow timing and evidence diagnostics from normalized events. |

Experimental capabilities may be simplified or removed if real usage does not justify their maintenance cost.

## Canonical project model

A Devland-enabled repository needs only a small canonical surface:

```text
repo/
├── AGENTS.md                # optional agent-facing projection
└── .devland/
    ├── project.yaml         # durable project facts and constraints
    ├── state.yaml           # lightweight current work context
    └── runtime/             # optional local evidence; not canonical truth
```

`project.yaml` stores facts that should remain useful across tasks. `state.yaml` is intentionally lightweight: it is not a changelog, CI evidence ledger, or replacement for Git history. The resolver validates it on every context resolution but hydrates its content only when requested.

The optional `work` envelope is deliberately outside that canonical surface. It describes what the current agent invocation is trying to accomplish: `id`, outcome-oriented `intent`, observable `acceptance`, optional `scope`, and optional `expected_outcome`. Devland validates and returns it in `devland.context/v1` but does not persist it to `.devland/state.yaml`.

In short:

```text
project.yaml -> durable repository semantics
state.yaml   -> lightweight coordination when persistence is useful
work         -> transient intent and acceptance boundaries for the active change
```

Repositories explicitly pin the Devland behavioral contract:

```yaml
devland:
  contract: "1"
```

Package versions, schema identifiers, and `devland.contract` are separate compatibility dimensions. See [`docs/release-policy.md`](docs/release-policy.md).

## How it works

```text
transient work + .devland/project.yaml + optional current state
                         |
                         v
                  context resolver
                    /         \
                   v           v
          relevant guidance   doctor
                   |
                   v
             AI runtime / human
                   |
                   v
               repository
```

Devland owns engineering semantics, not external-system access. Authentication, repository mutation, CI execution, deployment, and production telemetry remain the responsibility of the surrounding runtime or platform.

## Engineering model

Devland follows a simple admission rule for non-trivial work. A change belongs in the active scope when at least one is true:

1. the primary user journey fails without it;
2. it prevents material security, data-loss, compatibility, or side-effect risk;
3. real usage exposed the problem;
4. the decision is expensive to reverse after adoption.

The preferred delivery loop is:

```text
outcome
  -> smallest coherent change
  -> proportional verification
  -> pull request
  -> merge
  -> observe
```

Acceptance criteria describe observable behavior; they are not a requirement to create a separate acceptance-test suite. Verification should match the realistic failure mode and use the cheapest trustworthy boundary that supplies the needed confidence. Ordinary pull requests use the fast Ubuntu CI path. Explicit cross-platform verification is reserved for packaging, portability, and release-sensitive changes.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
```

The codebase intentionally avoids speculative abstractions and unnecessary dependencies. For behavior changes, add the smallest useful regression coverage at the level that protects observable behavior.

For local CLI and MCP development procedures, use [`docs/local-usage.md`](docs/local-usage.md).

## Contributing

Contributions are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md) for scope, development, verification, and pull-request expectations.

The most useful contributions during pre-1.0 stabilization are:

- reproducible correctness bugs;
- compatibility or portability failures;
- security and data-integrity improvements;
- documentation corrections;
- real dogfood evidence showing where Devland helps or obstructs delivery.

For feature proposals, describe the observed problem before proposing a new subsystem or abstraction.

By participating in this project, you agree to follow the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Security

Do **not** report vulnerabilities through a public issue. Follow [`SECURITY.md`](SECURITY.md) and use GitHub Private Vulnerability Reporting / Security Advisories for sensitive reports.

## Releases and compatibility

Devland uses semantic package versions independently from the behavioral `devland.contract`. Tagged releases are verified on Ubuntu, Windows, and macOS before the package archive is attached to GitHub Releases.

The repository remains `private: true` for npm publication until public package identity and publication intent are explicitly approved. See [`docs/release-policy.md`](docs/release-policy.md).

## License

Devland is licensed under the [MIT License](LICENSE).
