# Devland Release and Compatibility Policy

## Distribution status

Devland source is published under the **MIT License**. Tagged GitHub Releases are the supported downloadable distribution channel during pre-1.0 stabilization. The npm package is not published yet and `package.json` intentionally remains `"private": true` until package identity and publication intent are explicitly approved.

An explicit `release/v<package-version>` branch starts the release workflow. The workflow verifies the release candidate before creating the corresponding `v<package-version>` tag and GitHub Release containing the packed package archive. Versions with a prerelease identifier, such as `0.3.0-rc.1`, are published as GitHub prereleases. Users with Node.js 22+ and pnpm may also install that pinned tag directly from GitHub.

Open-source licensing, GitHub Release distribution, and npm registry publication are separate decisions. Publishing downloadable release artifacts does not imply that an official npm package name has been approved.

Public npm publishing remains blocked until all of the following are explicit:

- the public package name or scope is approved;
- publication intent is approved;
- repository rules required for the chosen release workflow are configured through an administration-capable GitHub settings surface.

Do not publish the npm package while those decisions remain open.

## Package manager contract

Devland uses pnpm as its canonical package manager. The exact pnpm version is pinned through `packageManager` in `package.json`, and `pnpm-lock.yaml` is the committed dependency lock.

Release and CI installs must use:

```text
corepack enable
pnpm install --frozen-lockfile
```

Do not maintain a second npm lockfile in parallel because competing lockfiles create ambiguous dependency state.

## Package version and behavioral contract are separate

The package version describes a release of the Devland implementation. `devland.contract` describes the behavioral compatibility expected by a repository using Devland. Canonical schema identifiers such as `devland.project/v0` and `devland.state/v0` are a third compatibility dimension.

A package version may change without changing `devland.contract` when the implementation remains behaviorally compatible with the same engineering contract. Conversely, a breaking change to required Devland engineering semantics must not be hidden inside an implementation-only version change.

Canonical `.devland/state.yaml` remains a concise work index. Release history belongs in Git tags, release notes, and pull requests rather than an ever-growing canonical work ledger.

## Behavioral contract changes

For every breaking behavioral-contract change:

1. increment the supported `devland.contract` value;
2. document which package version introduces the new contract;
3. provide a deterministic migration or explicit compatibility path when existing repositories can be upgraded safely;
4. document canonical schema impact separately;
5. reject unsupported contracts instead of silently reinterpreting or downgrading them;
6. include the supported contract range and migration instructions in release notes.

A new contract must not be declared supported until migration and compatibility behavior are covered by executable tests.

## Current compatibility boundary

The current executable supports behavioral contract `1`.

`devland migrate` currently provides one deterministic migration path:

```text
legacy devland.project/v0 without devland.contract
    -> devland.contract: "1"
```

Migration on contract `1` is idempotent. Unknown or future contracts are rejected rather than downgraded or guessed.

The current package version is `0.3.0-rc.1`; this version number does not itself redefine behavioral contract `1`.

## GitHub release gate

A release starts from an explicit branch named `release/v<package-version>`. The branch name must exactly match the version declared in `package.json`; a mismatched release branch fails preflight.

Before the workflow creates the corresponding version tag or publishes a GitHub Release, it must verify all of the following:

- `pnpm install --frozen-lockfile` succeeds;
- the full test suite is green on Ubuntu, Windows, and macOS;
- the package can be packed successfully;
- the packed archive can be installed into a clean consumer project;
- the installed `devland` executable can run `init`, `validate`, `context develop-change`, `doctor`, and `flow` successfully;
- the MCP container release path separately builds and smoke-tests the exact three-tool read-only registry before a version-tagged image is published.

Only after those checks pass may the workflow create the annotated `v<package-version>` tag and attach the packed archive to the GitHub Release. If that tag already exists, it must point to the same verified commit or the release fails. Re-running a partially completed release may update the release asset for the same verified tag, but must never move an existing version tag.

A version containing `-` is a prerelease and must be marked as such in GitHub Releases. Stable aliases such as the MCP `latest` image remain owned by verified `master` pushes rather than prerelease tags.

## Public npm release gate

Before a future public npm package release, verify at minimum:

- normal CI is green on the release candidate;
- explicit Ubuntu, Windows, and macOS verification is green for the release candidate;
- canonical project/state validation is green;
- migration tests cover every newly supported compatibility transition;
- runtime dependencies are shipped as package dependencies;
- package identity and publication intent are explicit;
- `"private": true` is removed only in the deliberately approved publication change.

Experimental adapter/flow capabilities should not become release blockers unless they are explicitly promoted into the supported public contract.

## Windows Package Manager

WinGet distribution requires a stable Windows installer or portable executable with a versioned download URL and integrity hash. A JavaScript package archive alone is not sufficient as a production-quality WinGet package.

Therefore WinGet publication is intentionally deferred until Devland has a verified Windows executable artifact. Once that artifact exists, its manifest should be submitted to `microsoft/winget-pkgs` and validated through the normal WinGet submission process.
