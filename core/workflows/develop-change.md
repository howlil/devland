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

Do not enumerate absent engineering-fact categories merely to prove they were considered. A lower-cost path is preferred whenever it provides the same confidence.

## Procedure

1. Load the canonical project model, current work state only when relevant, and only the policies/profiles applicable to the requested change.
2. Start from the explicit accepted requirement. Define observable acceptance criteria and do not silently broaden the requested product behavior.
3. Inspect only enough affected repository behavior, configuration, ownership, and boundaries to determine which existing component owns the behavior and identify the next safe change; deepen inspection only when uncertainty or risk requires it.
4. When continuing an existing active branch, inspect branch ancestry or branch-point evidence before mutating canonical state. If the branch predates Devland bootstrap or a base change that introduced or changed canonical context, reconcile the current base/canonical context into that same branch first. Preserve the active implementation and avoid independent add/add creation of canonical files.
5. Extract only engineering facts that materially affect implementation: required behavior, state, domain invariants, affected data, ownership, external boundaries, failure conditions, concurrency or consistency concerns, and compatibility constraints. For a rapid change, do not list categories that are not materially present.
6. Define the **smallest valuable slice** that satisfies the current acceptance criteria and can be independently verified. Choose the smallest implementation style justified by repository reality and the engineering facts. Prefer reuse or extension of the existing owner before a local abstraction; introduce an architectural change only when the current structure cannot reasonably satisfy the requirement. For non-trivial decisions, keep the reasoning concise and traceable as **requirement -> engineering fact -> implementation decision**. Obvious rapid-path reuse does not need a separate decision artifact.
7. Create a change spec, diagram, or formal model only when behavioral, architecture, security, UX, migration, compatibility, state-transition, concurrency, distributed-failure, or material trade-off risk needs persistent reasoning. A diagram is a reasoning tool, not a mandatory stage; skip it when concise repository-grounded reasoning is sufficient.
8. Create a detailed plan only when execution complexity, dependency ordering, coordination, or session handoff warrants it. A normal small change should proceed without plan ceremony.
9. Before or during implementation, identify what can realistically break and select the cheapest high-signal verification that can detect those failures. Increase verification depth only when impact, likelihood, change boundaries, or the lane budget justify it.
10. When a deterministic automated test is the cheapest high-signal way to define or protect executable behavior, repeat **RED -> GREEN -> REFACTOR**: establish the smallest meaningful failing test or deterministic reproduction, confirm it fails for the intended reason, implement the minimum behavior that makes it pass, then improve the design while verified behavior remains green. Do not force TDD where another verification method better matches the risk.
11. During the inner loop, run the fastest relevant focused verification after each material change. Keep the batch small enough to understand, review, diagnose, and reverse. Canonical state remains a concise current-work index and does not record TDD micro-steps or duplicate Git history.
12. Before integration, run broader affected verification and repository-mandatory gates, then review the actual diff for scope leakage, missing risk coverage, policy conflicts, sensitive data, unintended architecture changes, and canonical files accidentally diverging from the current base.
13. Integrate promptly as soon as the current slice satisfies acceptance, repository policy permits integration, mandatory gates are green, and known blockers are resolved. Keep same-scope CI or review fixes on the same logical task rather than starting replacement work.
14. When deployment or production evidence is available and relevant, distinguish integration success from production success. Never invent production or outcome evidence that cannot actually be observed.
15. Update canonical state and documentation only where their current contracts changed. Record durable design or verification evidence only when it has ongoing value; do not turn canonical state into a delivery, CI, reasoning, or telemetry ledger.
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
