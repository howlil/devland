# Devland Release and Compatibility Policy

## Current distribution status

Devland is currently an internal/private package candidate. `package.json` must keep `"private": true` until public distribution is explicitly approved.

Public package publishing is blocked until all of the following are explicit:

- a software license is selected and added to the repository;
- the public package name or scope is approved;
- publication intent is approved;
- repository governance required for the chosen release workflow is configured through an administration-capable GitHub settings surface.

Do not publish Devland while those decisions remain open.

## Package version and behavioral contract are separate

The package version describes a release of the Devland implementation. `devland.contract` describes the behavioral compatibility expected by a repository using Devland. Canonical schema identifiers such as `devland.project/v0` and `devland.state/v0` are a third compatibility dimension.

A package version may change without changing `devland.contract` when the implementation remains behaviorally compatible with the same engineering contract. Conversely, a breaking change to required Devland engineering semantics must not be hidden inside an implementation-only version change.

## Behavioral contract changes

For every breaking behavioral-contract change:

1. increment the supported `devland.contract` value;
2. document which package version introduces the new contract;
3. provide a deterministic migration or an explicit compatibility path when existing canonical repositories can be upgraded safely;
4. document any canonical schema impact separately;
5. make the runtime reject unsupported contracts instead of silently reinterpreting or downgrading them;
6. include the supported contract range and migration instructions in release notes.

A new contract must not be declared supported until its migration and compatibility behavior are covered by executable tests.

## Current compatibility boundary

The current executable supports behavioral contract `1`.

`devland migrate` currently provides one deterministic migration path:

```text
legacy devland.project/v0 without devland.contract
    -> devland.contract: "1"
```

Running migration on contract `1` is idempotent. Unknown or future contracts are rejected rather than downgraded or guessed.

The current package version is `0.1.0`; this version number does not itself redefine behavioral contract `1`.

## Release gate

Before a future public release, verify at minimum:

- Ubuntu, Windows, and macOS CI are green on the release candidate;
- canonical project/state validation is green;
- adapter semantic parity is green;
- migration tests cover every newly supported compatibility transition;
- runtime dependencies are shipped as package dependencies rather than development-only dependencies;
- a software license and publication intent are explicit;
- `"private": true` is removed only in the same deliberately approved publication change.

Until those conditions and governance decisions are satisfied, publishing remains blocked.
