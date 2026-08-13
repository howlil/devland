---
id: develop-change
requires:
  - repository.read
optional:
  - repository.search
  - repository.write
  - filesystem.read
  - filesystem.write
  - shell.execute
  - vcs.status
  - vcs.branch
  - vcs.commit
  - vcs.pull_request
  - ci.read
  - ci.execute
---
# Develop Change

Develop one logical change against canonical project context and actual repository behavior while preserving scope, verification evidence, and capability honesty.

## Procedure

1. Load the canonical project model, current work state, relevant project decisions, and only the policies/profiles applicable to the requested change.
2. Inspect the affected repository behavior and configuration before deciding what must change.
3. When continuing an existing active branch, inspect branch ancestry or branch-point evidence before mutating canonical state. If the branch predates Devland bootstrap or a base change that introduced or changed canonical context, reconcile the current base/canonical context into that same branch first. Preserve the active implementation and avoid independent add/add creation of canonical files.
4. Define the smallest coherent scope and observable acceptance criteria; update or create the work item if state mutation is available and appropriate.
5. Create a change spec only when behavioral, architecture, security, UX, migration, or trade-off risk needs persistent design reasoning.
6. Create a detailed plan only when execution complexity, dependency ordering, or session handoff warrants it.
7. For behavior work, establish a failing test or deterministic reproduction when applicable and confirm the failure represents the missing behavior.
8. If write capability exists, implement the smallest coherent change, run focused verification, and refactor only while behavior remains verified. If write capability is absent, produce the supported patch/plan guidance without claiming application.
9. Run broader affected verification and repository-mandatory gates that the runtime can actually execute or observe.
10. Update canonical state and documentation only where their described contracts changed and only after required base reconciliation has succeeded.
11. Review the actual diff/state for scope leakage, missing tests, policy conflicts, sensitive data, unintended architecture changes, and canonical files accidentally diverging from the current base.
12. Integrate only when repository policy permits, required capabilities exist, acceptance is satisfied, mandatory gates are green, and known blockers are resolved.
13. Record durable evidence when useful and mark work complete only from fresh verification.

## Stop conditions

- Required repository evidence cannot be read.
- A required policy conflict has no explicit approved exception.
- The requested change exceeds the accepted work scope or depends on an unresolved material design decision.
- An active branch predates Devland bootstrap or canonical-context changes, reconciliation with the current base is required, and available capabilities cannot perform or verify that reconciliation safely.
- A required implementation, verification, or integration action needs a capability the runtime does not have.
- Verification exposes a blocker or regression that invalidates the completion claim.

## Outputs

- Updated implementation or a capability-limited implementation plan/patch description.
- Updated work state when appropriate and writable.
- Relevant test/verification evidence and unresolved blockers.
- An honest integration/cleanup status that distinguishes completed actions from remaining actions.
