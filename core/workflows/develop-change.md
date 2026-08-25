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

Develop one logical change as a sequence of small, valuable, independently verifiable increments against canonical project context and actual repository behavior. Optimize for fast trustworthy feedback while preserving scope and evidence honesty.

## Procedure

1. Load the canonical project model, current work state only when relevant, and only the policies/profiles applicable to the requested change.
2. Inspect only enough affected repository behavior, configuration, ownership, and boundaries to identify the next safe change; deepen inspection when uncertainty or risk requires it.
3. When continuing an existing active branch, inspect branch ancestry or branch-point evidence before mutating canonical state. If the branch predates Devland bootstrap or a base change that introduced or changed canonical context, reconcile the current base/canonical context into that same branch first. Preserve the active implementation and avoid independent add/add creation of canonical files.
4. Define the **smallest valuable slice** with observable acceptance criteria. Prefer a vertical slice that can be independently verified and, when the delivery model permits, integrated without waiting for unrelated future scope. Update or create a work item only when state adds current coordination value.
5. Create a change spec only when behavioral, architecture, security, UX, migration, compatibility, or material trade-off risk needs persistent design reasoning.
6. Create a detailed plan only when execution complexity, dependency ordering, coordination, or session handoff warrants it. A normal small change should proceed without plan ceremony.
7. For behavior work, repeat **RED -> GREEN -> REFACTOR** when technically meaningful: establish the smallest meaningful failing test or deterministic reproduction, confirm it fails for the intended reason, implement the minimum behavior that makes it pass, then improve the design while verified behavior remains green.
8. During the inner loop, run the fastest relevant focused verification after each material change. Keep the batch small enough to understand, review, diagnose, and reverse. Canonical state remains a concise current-work index and does not record TDD micro-steps or duplicate Git history.
9. Before integration, run broader affected verification and repository-mandatory gates, then review the actual diff for scope leakage, missing tests, policy conflicts, sensitive data, unintended architecture changes, and canonical files accidentally diverging from the current base.
10. Integrate promptly as soon as the current slice satisfies acceptance, repository policy permits integration, mandatory gates are green, and known blockers are resolved. Keep same-scope CI or review fixes on the same logical task rather than starting replacement work.
11. When deployment or production evidence is available and relevant, distinguish integration success from production success. Never invent production or outcome evidence that cannot actually be observed.
12. Update canonical state and documentation only where their current contracts changed. Record durable evidence only when it has ongoing value; do not turn canonical state into a delivery, CI, or telemetry ledger.
13. If more accepted behavior remains, select the next smallest valuable slice and repeat instead of accumulating a large implementation batch.

## Stop conditions

- Required repository evidence cannot be read.
- A required policy conflict has no explicit approved exception.
- The requested change exceeds the accepted work scope or depends on an unresolved material design decision.
- An active branch predates Devland bootstrap or canonical-context changes and safe reconciliation cannot be performed or verified.
- A required implementation or verification action cannot be performed safely with available tooling.
- Verification exposes a blocker or regression that invalidates the current integration or completion claim.
- Observed deployment or production evidence shows the change is unhealthy and remediation is outside the current safe scope.

## Outputs

- The smallest verified implementation increment or a precise patch description when mutation is unavailable.
- Updated work state only when it carries current coordination value.
- Relevant verification and observable production/outcome evidence without duplicating durable external history.
- An honest integration and production status that distinguishes performed actions from unavailable or remaining actions.
