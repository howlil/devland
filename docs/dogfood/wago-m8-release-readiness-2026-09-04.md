# M8 release-readiness evidence — Wago and Devland v0.3.0-rc.1

## Decision

**Milestone state: release-candidate ready; stable release blocked only by repository governance enforcement.**

M8 closed the two evidence/release gaps that remained after M7:

1. a real external work → change → merge → production → outcome chain was captured from Wago and verified through Devland `flow_report`;
2. Devland `v0.3.0-rc.1` was released through the real package workflow and its exact versioned MCP image was published and pulled back from GHCR successfully.

The milestone does **not** claim `ready` or publish stable `v0.3.0` because Devland `master` still has no enforced GitHub branch protection/ruleset. The available automation connection can inspect that state but cannot mutate repository administration settings, so this remains an explicit manual governance blocker rather than being replaced with a weaker CI convention.

## Real external FAST + VALUE chain

Repository: `howlil/wago`

Work item: issue #125, `M8: emit verifiable release evidence for Devland flow`.

Change: PR #126, `ci: emit verifiable release evidence`.

The change added a small release evidence artifact to Wago's existing production container workflow. Devland did not collect from GitHub, deploy Wago, or query production. The surrounding runtime supplied normalized evidence after observing the real external systems.

### Observed boundaries

| Boundary | Real evidence |
| --- | --- |
| work accepted | issue #125 created at `2026-09-04T22:10:11Z` |
| work started | first meaningful implementation commit at `2026-09-04T22:10:49Z` |
| change committed | `63ad0451e55bd3fffea897ba6b2c544de280d897` at `2026-09-04T22:10:49Z` |
| change merged | PR #126 squash merge at `2026-09-04T22:13:47Z` |
| deployment started | Release Container run `33924612129` started at `2026-09-04T22:13:50Z` |
| deployment succeeded | release artifact reported publish at `2026-09-04T22:15:46.286Z` |
| outcome observed | artifact was opened and positively observed at `2026-09-04T22:16:25Z` |

Production evidence bound merge commit `beddeb4a96459a96525c71f2a90c28b98c38f1d8` to:

- image: `ghcr.io/howlil/wago-simple:latest`;
- manifest digest: `sha256:694721433f5422630880ef14353073beb836e4f633f71e113656c2b8a615d2d6`.

## Trusted Devland flow proof

A temporary Wago PR (#127) ran Devland `master` in trusted Wago Actions. The PR was intentionally closed without merge after evidence was collected, so Wago carries no permanent dogfood CI ceremony.

The final seven-event proof returned:

- `event_count: 7`;
- `evidence_status: complete`;
- correlation diagnostics: none;
- work → change coverage: `1/1`;
- change → merge coverage: `1/1`;
- merge → deploy coverage: `1/1`;
- outcome coverage: `1/1`;
- latest outcome: `positive`.

Real metric samples:

| Metric | Value |
| --- | ---: |
| accept → start | `38.000s` |
| start → change | `0s` |
| change → merge | `178.000s` |
| deployment latency | `116.286s` |
| merge → production | `119.286s` |
| production → outcome | `38.714s` |
| idea → outcome | `374.000s` |

`coverage_status` correctly remained `partial` because this focused proof did not collect review or CI evidence. That is evidence scope, not evidence corruption.

### Decision usefulness

The first proof pass omitted `deployment.started`. Devland therefore reported partial evidence and an unmatched deployment end. The surrounding runtime then added the actual Release Container `run_started_at` boundary, after which evidence integrity became complete.

That changed a real engineering decision: preserve the missing start boundary in future evidence rather than treating deployment success alone as a complete lifecycle.

The single sample also reported deployment latency as the largest measured target duration. M8 deliberately does **not** optimize Wago's deployment architecture from one sample. More real samples are required before treating that as a product or delivery bottleneck.

## Devland v0.3.0-rc.1 package release

Release-preparation PR #73 moved the package to `0.3.0-rc.1` without changing behavioral contract `1`.

The release branch `release/v0.3.0-rc.1` ran the actual release workflow and passed:

- release branch/package version preflight;
- Ubuntu full tests;
- Windows full tests;
- macOS full tests;
- package archive build;
- clean consumer installation;
- installed CLI smoke for `init`, `validate`, `context develop-change`, `doctor`, and `flow`;
- GitHub prerelease creation.

Published GitHub prerelease:

- tag: `v0.3.0-rc.1`;
- source commit: `cab22b5b92c91e9ba352ce4ad74b6655a5a37d17`;
- asset: `devland-0.3.0-rc.1.tgz`;
- asset digest: `sha256:0659bf312fecd8cf19b497db55124ae65852f861585935e99f39c18413441619`.

## Versioned MCP image release finding

The first RC release exposed a release-path defect: the Release workflow created the version tag using `GITHUB_TOKEN`, so GitHub did not recursively start the separate tag-triggered MCP workflow. The GitHub package release was valid, but the expected versioned MCP image had not been produced.

PR #74 removed that assumption permanently. Future release workflows build, smoke, and publish the versioned MCP image directly and require that job before GitHub release publication succeeds.

Because `v0.3.0-rc.1` already existed and must never be moved, a one-shot recovery workflow checked out the exact immutable tag and verified that it resolved to `cab22b5b92c91e9ba352ce4ad74b6655a5a37d17` before building.

Recovery result:

- exact tag identity: passed;
- Docker build: passed;
- Compose contract: passed;
- MCP health and exact three-tool registry: passed;
- `resolve_context`, `doctor`, `flow_report`: passed before publish;
- GHCR publish: passed;
- published tag: `ghcr.io/howlil/devland:v0.3.0-rc.1`;
- image digest: `sha256:332d9b211856df9c9c6a14285d3b84d58ed06f8ee8b433aeb8298a997bfaca13`;
- immutable SHA alias: `ghcr.io/howlil/devland:sha-cab22b5b92c91e9ba352ce4ad74b6655a5a37d17` with the same digest;
- registry pull-back: passed;
- pulled image health + exact three-tool registry smoke: passed.

The one-shot recovery workflow was removed after success. Only the permanent release-path fix remains.

## Remaining blocker — GitHub governance

Live repository inspection during M8 showed:

- `master` is not protected;
- required status checks are not enforced by branch protection;
- repository rulesets are empty.

The normal development process already uses short-lived PRs and green relevant CI, but GitHub does not hard-enforce that contract. The connected GitHub automation surface available to this milestone has no administration mutation for creating branch protection or rulesets.

Stable promotion therefore remains blocked until an administration-capable repository settings surface enforces at minimum:

```text
master
→ pull request required
→ required CI green
→ force push blocked
→ branch deletion blocked
```

No extra reviewer ceremony is required solely for this single-maintainer repository unless later evidence justifies it.

## Exit state

M8 proved the previously missing external FAST + VALUE chain and produced a verified release candidate across both supported distribution surfaces:

```text
GitHub Release .tgz
+
versioned GHCR MCP image
```

Current classification:

```text
semantic/runtime readiness     ready
external FAST + VALUE proof   passed
packaged CLI RC               passed
versioned MCP RC              passed
release pipeline              corrected
hard branch governance        blocked on admin setting
stable v0.3.0                 not published
```

Do not open a feature milestone to compensate for the governance blocker. Once repository enforcement is configured, re-check the gates and decide whether to promote the already-proven RC line to stable `v0.3.0`.
