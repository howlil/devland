# Devland v1 Rapid Delivery Contract

Status: **Iteration 0 candidate contract**  
Date: 2026-08-22

## 1. Purpose

Devland v1 evolves the v0 semantic engineering-context system toward a small executable engineering feedback tool without turning Devland into an AI coding agent, repository provider, CI system, deployment platform, or SaaS product.

The v1 objective is to help a human plus an AI runtime move the **smallest valuable slice** from accepted intent to production quickly, safely, and with enough evidence to learn whether the change created value.

Devland remains **agent-agnostic**. It defines reusable semantics, normalized evidence, workflow expectations, and deterministic checks. Agent runtimes reason and implement. Repository, CI/CD, deployment, and observability providers perform actions through their own systems and are connected through provider adapters when needed.

## 2. Core thesis

Devland v1 optimizes a feedback system rather than coding speed in isolation:

```text
valuable intent
    -> smallest valuable slice
    -> observable acceptance
    -> RED -> GREEN -> REFACTOR
    -> small verified change
    -> continuous integration
    -> production
    -> observe
    -> learn
    -> next smallest valuable slice
```

The system should maximize validated production value while reducing time-to-feedback, batch size, avoidable waiting, instability, and rework.

AI acceleration should normally be converted into **smaller batches and faster feedback**, not larger generated patches. Faster code generation is useful only when the resulting changes remain easy to test, review, integrate, deploy, diagnose, and reverse.

## 3. Optimization model

Devland v1 treats four dimensions separately because improving one does not prove the others are healthy.

### 3.1 Value

Build the smallest change that can validate or deliver a meaningful user, operator, or engineering outcome. Scope should be sliced vertically where practical so feedback can reach the real environment without waiting for a large feature batch.

### 3.2 Flow

Reduce elapsed time from accepted work to production. Optimize the whole value stream rather than local coding speed. Waiting for review, CI, integration, or deployment is part of cycle time even when no developer is actively typing code.

### 3.3 Stability

Ship frequently without accepting uncontrolled failure. Automated verification, small batches, observable production behavior, and fast recovery allow speed and stability to reinforce each other.

### 3.4 Learning

Production is not the end of the loop when a change is intended to create an observable outcome. Production evidence should inform whether to continue, revise, or remove the change.

## 4. Development model

### 4.1 Outer delivery loop

The default outer loop is:

```text
choose smallest valuable slice
    -> define observable acceptance
    -> implement through the TDD inner loop
    -> integrate a small verified change
    -> deploy when the repository delivery model permits
    -> observe relevant production evidence
    -> learn and select the next slice
```

A work item may contain several independently verifiable increments. Devland does not require each TDD cycle, commit, or micro-step to be stored in canonical state.

### 4.2 TDD inner loop

For behavior changes, the default development loop is repeated **RED -> GREEN -> REFACTOR**:

1. **RED** — write the smallest meaningful failing test or deterministic reproduction for the next observable behavior.
2. Confirm the failure represents missing or incorrect behavior rather than a broken test harness.
3. **GREEN** — implement the minimum change that satisfies the behavior.
4. Run the fastest relevant verification.
5. **REFACTOR** — improve design while verified behavior remains green.
6. Repeat for the next independently useful increment.

The inner loop should prefer the fastest trustworthy feedback level. Full repository gates are not required after every edit; focused checks run first, broader affected verification follows before integration, and repository-mandatory gates remain required where policy defines them.

### 4.3 Simple and evolutionary design

Default to the simplest design that supports current requirements and a known near-term boundary. Do not build speculative abstractions merely because AI can generate them quickly. Tests and frequent integration make safe refactoring the primary mechanism for evolving design.

### 4.4 Small batches

Batch size should stay small enough that a change is easy to understand, test, review, integrate, diagnose, and reverse. Large generated diffs are a warning signal, not a productivity success metric.

A larger batch is justified only when the behavior cannot be separated safely or when splitting would create greater migration, consistency, or operational risk.

### 4.5 Specifications and plans

A normal small change should not require a persistent spec or detailed plan. Create those artifacts only when architecture, security, migration, compatibility, product ambiguity, execution ordering, or handoff complexity carries durable reasoning that would otherwise be lost.

## 5. Continuous integration and production feedback

Continuous integration is a feedback loop, not merely a final merge gate. Short-lived work should be integrated as soon as its acceptance criteria and required verification are satisfied.

The target shape is:

```text
focused local feedback
    -> commit / candidate change
    -> CI feedback
    -> review when required
    -> integration
    -> production
```

Repositories may use pull requests, trunk-based development, release branches, staged deployment, or other delivery models. Devland does not impose one provider-specific branching or deployment mechanism; profiles and project policy refine the generic workflow.

For production-relevant changes, the workflow should distinguish:

- verification that the software behaves correctly before integration;
- evidence that deployment succeeded;
- production observation that the service or product remains healthy;
- outcome evidence when the change has a measurable value hypothesis.

## 6. Measurement model

Metrics are used to improve the delivery system, not to rank individual developers or reward raw activity. Commit count, lines of code, story points, and AI-generated token volume are not Devland success metrics.

### 6.1 Software delivery metrics

Devland v1 should be able to represent the current DORA delivery dimensions when provider evidence is available:

- **change lead time** — elapsed time from a production change being committed or otherwise ready for delivery until it reaches production;
- **deployment frequency** — how often successful production deployments occur;
- **change fail rate** — the proportion of production changes that cause degraded service and require remediation;
- **failed deployment recovery time** — elapsed time from a failed production change until service is restored;
- **deployment rework rate** — the proportion of deployments primarily spent correcting or remediating recent delivery problems.

These metrics describe delivery throughput and instability. They do not prove that the shipped change created product value.

### 6.2 Devland flow metrics

Devland additionally needs end-to-end flow evidence because commit-to-production can look fast while accepted work waits elsewhere.

Primary flow metric:

- **idea-to-production cycle time** — elapsed time from accepted/started work to a successful production deployment.

Useful decompositions may include:

- work start to first verified change;
- review wait time;
- CI feedback latency;
- merge/integration wait time;
- merge-to-production deployment latency;
- batch size for an integration candidate.

Flow reports should expose waiting and handoff time so optimization targets the actual bottleneck rather than assuming coding is the slowest stage.

### 6.3 Value and guardrails

Acceptance, outcome, and guardrails have different jobs:

- **Acceptance criteria answer whether the software change is correct** for the requested behavior.
- An **outcome metric** answers whether the deployed change created the intended value.
- A **guardrail metric** detects unacceptable degradation elsewhere while pursuing that value.

Example:

```yaml
value:
  hypothesis: Shorter onboarding should increase completed first-time setup.
  outcome_metric:
    signal: onboarding_completion_rate
    expected_direction: increase
  guardrail_metrics:
    - onboarding_error_rate
    - p95_onboarding_latency
```

Value fields are conditional. Internal refactors, documentation changes, and low-risk maintenance should not be forced to invent product metrics when behavior preservation plus engineering verification is sufficient.

## 7. Evidence and event direction

Iteration 0 defines semantics only; it does not implement telemetry storage. Future executable work may normalize provider evidence into events such as:

```text
work.accepted
work.started
change.committed
review.opened
review.completed
ci.started
ci.completed
deployment.started
deployment.succeeded
deployment.failed
recovery.succeeded
outcome.observed
```

Provider-specific GitHub, GitLab, CI, deployment, or observability concepts belong behind a **provider adapter**. The semantic core should consume normalized evidence rather than hard-code one provider API.

Canonical `.devland/state.yaml` remains a concise work index and must not become an analytics event database.

## 8. Capability and responsibility boundaries

The v0 separation remains valid:

```text
Devland semantics / deterministic checks
                |
                v
          runtime adapter
                |
                v
        AI runtime / human
                |
                v
 repository + CI/CD + production systems
```

Devland may later provide a thin deterministic executable for validation, context resolution, state inspection, flow calculation, and diagnostics. It must not claim repository, CI, deployment, or production actions that the current runtime/provider did not actually perform and verify.

## 9. Iteration 0 scope

Iteration 0 establishes only this contract and executable repository tests that protect its central semantics.

Included:

- smallest-valuable-slice optimization;
- repeated TDD inner loop;
- continuous-integration and production-feedback outer loop;
- explicit separation of value, flow, stability, and learning;
- delivery, flow, outcome metric, and guardrail metric semantics;
- provider-adapter boundary;
- preservation of concise canonical state;
- non-goals for the first implementation steps.

Excluded from Iteration 0:

- changing `develop-change` behavior;
- changing project/state schemas;
- implementing a CLI;
- implementing the metrics engine;
- implementing provider adapters;
- collecting production telemetry;
- adding a web dashboard;
- adding a database;
- building an agent runtime;
- building a SaaS backend;
- multi-agent orchestration.

## 10. Non-goals

Devland v1 is not justified by feature count. Until evidence requires otherwise, the following remain non-goals:

- a **web dashboard** or desktop UI;
- a persistent analytics **database** owned by Devland;
- a custom repository or deployment provider;
- an autonomous **agent runtime**;
- a proprietary CI/CD engine;
- individual engineer scoring;
- story-point or lines-of-code productivity scoring;
- automatic creation of specs/plans for every change;
- a large workflow DSL;
- multi-agent orchestration.

## 11. Success criteria for later iterations

Later v1 implementation should be evaluated by whether Devland can reduce delivery friction while preserving or improving safety. Dogfooding Devland on its own development should provide evidence such as smaller integration batches, faster feedback, lower idea-to-production cycle time, reduced waiting/rework, and honest production/value evidence where applicable.

If Devland adds ceremony without improving feedback, delivery flow, stability, or learning, the added mechanism should be simplified or removed.
