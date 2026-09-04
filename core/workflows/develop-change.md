---
id: develop-change
policies:
  - core.engineering
  - core.dependencies
  - core.git
  - core.testing
  - core.verification
---
# Develop Change

Develop one logical change as a sequence of small, valuable, independently verifiable increments against canonical project context and actual repository behavior. Optimize for fast trustworthy feedback while preserving scope, reasoning traceability, and evidence honesty.

## Execution budget

Treat `execution.lane` and its budget as a ceiling on analysis, context expansion, and verification cost, not as ceremony to consume.

- **rapid** — inspect affected code only, extract only facts that are materially present, follow an obvious existing owner/pattern without producing a separate design record, skip specs/plans/models by default, and use focused verification. Once requirement, owner, implementation path, and realistic risk are clear, implement.
- **guided** — use targeted analysis for affected modules and material risks, record concise decision evidence for non-obvious choices, and run affected verification appropriate to the boundary.
- **deliberate** — expand context only around the material high-risk boundary, compare alternatives or trade-offs when needed, persist design reasoning only when it will remain valuable, and use stronger risk-specific verification.

Do not enumerate absent engineering-fact categories merely to prove they were considered. A lower-cost path is preferred whenever it provides the same confidence. Test taxonomy is not a delivery stage sequence: unit, integration, contract, process, and E2E verification are selected only when their boundary matches a realistic failure.

## Rapid path

For a `rapid` change, use this compact loop instead of expanding the full procedure unless new evidence raises the lane:

1. Start from the explicit accepted requirement and observable acceptance criteria.
2. Inspect only the affected repository code, tests, schema, or configuration needed to identify the existing behavior owner and implementation path.
3. Extract only engineering facts that are materially present. Do not list absent fact categories, create a plan, spec, diagram, verification matrix, or separate decision artifact for obvious existing-pattern reuse.
4. Implement the **smallest valuable slice** by reusing or extending the existing owner before introducing a local abstraction.
5. Identify the realistic failure, criticality, and narrowest representative verification boundary. If a transient verification selection is supplied, use its `failure_modes`, `criticality`, `boundary`, and `cost` as compact execution context and resolve any Devland warning against repository evidence; do not turn the descriptor into a test plan or command list. For critical deterministic behavior, strongly prefer **RED -> GREEN -> REFACTOR** with the smallest meaningful regression proof. Integration verification is first-class whenever component interaction is the real boundary. Use E2E only for a critical journey needing unique confidence that a cheaper boundary cannot provide.
6. Run the cheapest trustworthy focused proof first, then only broader affected verification that protects a distinct failure mode, review the actual diff, and finally run repository-mandatory gates. Keep proof and gate semantics separate, and keep optional expensive suites out of the rapid path unless affected scope or material risk justifies them. Keep one logical task on one short-lived branch/PR and keep same-scope fixes on that task.
7. Integrate promptly when material acceptance conditions have sufficient evidence and required gates are satisfied. Acceptance evidence does not imply a dedicated acceptance-test suite. Observe production/outcome evidence only when it is actually available.

Current work state is reference-only unless the task depends on current/recent work coordination. Escalate out of the rapid path when ownership is unclear or security, data-loss, compatibility, schema/migration, concurrency, external side-effect, or large-blast-radius risk becomes material.

## Procedure

1. Load the canonical project model, current work state only when relevant, and only the policies/profiles applicable to the requested change.
2. Start from the explicit accepted requirement. Define observable acceptance criteria and do not silently broaden the requested product behavior.
3. Inspect only enough affected repository behavior, configuration, ownership, and boundaries to determine which existing component owns the behavior and identify the next safe change; deepen inspection only when uncertainty or risk requires it.
4. When continuing an existing active branch, inspect branch ancestry or branch-point evidence before mutating canonical state. If the branch predates Devland bootstrap or a base change that introduced or changed canonical context, reconcile the current base/canonical context into that same branch first. Preserve the active implementation and avoid independent add/add creation of canonical files.
5. Extract only engineering facts that materially affect implementation: required behavior, state, domain invariants, affected data, ownership, external boundaries, failure conditions, concurrency or consistency concerns, and compatibility constraints. For a rapid change, do not list categories that are not materially present.
6. Define the **smallest valuable slice** that satisfies the current acceptance criteria and can be independently verified. Choose the smallest implementation style justified by repository reality and the engineering facts. Prefer reuse or extension of the existing owner before a local abstraction; introduce an architectural change only when the current structure cannot reasonably satisfy the requirement. For non-trivial decisions, keep the reasoning concise and traceable as **requirement -> engineering fact -> implementation decision**. Obvious rapid-path reuse does not need a separate decision artifact.
7. Create a change spec, diagram, or formal model only when behavioral, architecture, security, UX, migration, compatibility, state-transition, concurrency, distributed-failure, or material trade-off risk needs persistent reasoning. A diagram is a reasoning tool, not a mandatory stage; skip it when concise repository-grounded reasoning is sufficient.
8. Create a detailed plan only when execution complexity, dependency ordering, coordination, or session handoff warrants it. A normal small change should proceed without plan ceremony.
9. Before or during implementation, select verification in this order: realistic failure mode -> impact/criticality -> narrowest representative boundary -> cheapest trustworthy deterministic proof -> broader checks only for distinct failure modes -> repository-mandatory gates. If a transient verification selection exists, reconcile its diagnostics with observed change risk rather than blindly accepting or expanding it. Do not create a verification matrix, acceptance-test mapping, or mandatory test-layer sequence.
10. For critical deterministic executable behavior, strongly prefer **RED -> GREEN -> REFACTOR**: establish the smallest meaningful failing test or deterministic reproduction, confirm it fails for the intended reason, implement the minimum behavior that makes it pass, then improve the design while verified behavior remains green. For non-critical deterministic behavior, use the same loop when it remains the cheapest useful proof. Do not force TDD where another verification method better matches the risk or where the change has no meaningful executable behavior.
11. Treat deterministic integration verification as first-class whenever interaction between components is the realistic failure boundary; it may replace lower-level mocked tests rather than duplicate them. Use E2E only when a critical user journey or cross-system path needs unique confidence unavailable from a cheaper boundary. During the inner loop, run the fastest relevant focused verification after each material change and keep the batch small enough to understand, review, diagnose, and reverse. Canonical state remains a concise current-work index and does not record TDD micro-steps or duplicate Git history.
12. Before integration, ensure every material acceptance condition has sufficient evidence, then run broader affected verification and repository-mandatory gates and review the actual diff for scope leakage, missing risk coverage, policy conflicts, sensitive data, unintended architecture changes, and canonical files accidentally diverging from the current base. A focused proof and a repository gate may be different checks. Optional expensive checks such as browser E2E, container stacks, cross-platform matrices, remote dependencies, or large fixtures should run only when affected scope, material risk, release semantics, or repository contract justifies their cost.
13. Integrate promptly as soon as the current slice satisfies acceptance, repository policy permits integration, mandatory gates are green, and known blockers are resolved. Keep same-scope CI or review fixes on the same logical task rather than starting replacement work.
14. When deployment or production evidence is available and relevant, distinguish integration success from production success. Never invent production or outcome evidence that cannot actually be observed.
15. Update canonical state and documentation only where their current contracts changed. Record durable design or verification evidence only when it has ongoing value; do not turn canonical state into a delivery, CI, reasoning, verification, or telemetry ledger.
16. If more accepted behavior remains, select the next smallest valuable slice and repeat instead of accumulating a large implementation batch.

## Stop conditions

- Required repository evidence cannot be read.
- A required policy conflict has no explicit approved exception.
- The requested change exceeds the accepted work scope or depends on an unresolved material design decision.
- The existing owner or required behavior boundary cannot be determined safely enough to avoid an unjustified architecture change.
- An active branch predates Devland bootstrap or canonical-context changes and safe reconciliation cannot be performed or verified.
- A required implementation or verification action cannot be performed safely with available tooling.
- Verification exposes a blocker or regression that invalidates the current integration or completion claim.
- Observed deployment or production evidence shows the change is unhealthy and remediation is outside the current safe scope.

## Outputs

- The smallest verified implementation increment or a precise patch description when mutation is unavailable.
- Concise decision evidence for non-trivial implementation choices without mandatory design paperwork.
- Updated work state only when it carries current coordination value.
- Relevant verification and observable production/outcome evidence without duplicating durable external history.
- An honest integration and production status that distinguishes performed actions from unavailable or remaining actions.
