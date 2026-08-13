---
id: core.dependencies
scope: core
---
# Dependency Policy

`Required` rules need explicit rationale and evidence to deviate. `Defaults` may be overridden when project evidence supports a better choice.

## Required

- Add a dependency, service, or infrastructure component only for a current problem it materially solves.
- Consider material security, licensing, maintenance, runtime, and operational implications before adoption.

## Defaults

- Prefer standard facilities and dependencies the project already owns when they solve the problem adequately.
- Add an abstraction only when it creates a real ownership, test, or meaningful replacement boundary.
- Do not pre-install or scaffold infrastructure for hypothetical future work.
