---
id: core.engineering
scope: core
---
# Engineering Policy

`Required` rules need explicit rationale and evidence to deviate. `Defaults` may be overridden when project evidence supports a better choice.

## Required

- Stay inside the approved current scope and do not implement unrelated future work opportunistically.
- Do not claim work, checks, repository actions, or outcomes that were not actually performed.
- Preserve observable behavior outside the intended change unless the approved scope explicitly changes it.
- Record an explicit exception when a required Devland policy must be violated.

## Defaults

- Choose the simplest design that satisfies current requirements without closing a known, near-term boundary unnecessarily.
- Refactor only what enables a clean current change or removes a direct blocker.
- Prefer narrow ownership boundaries and clear responsibilities over speculative layers or internal frameworks.
