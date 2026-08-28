---
id: core.testing
scope: core
---
# Testing Policy

`Required` rules need explicit rationale and evidence to deviate. `Defaults` may be overridden when project evidence supports a better choice.

## Required

- Tests exist to reduce meaningful delivery risk, not to maximize coverage, test count, or testing ceremony.
- A deterministically reproducible behavior defect needs regression verification that demonstrates the failure before the fix where practical.
- Do not weaken, delete, or bypass a valid test merely to make a quality gate green.

## Defaults

- Start from the realistic regression or failure risk introduced by the change, then choose the cheapest high-signal verification that can detect it.
- Use RED -> GREEN -> REFACTOR when a deterministic automated test is the cheapest high-signal way to define or protect executable behavior. Do not require TDD for presentation-only changes, styling/layout, static markup, copy, trivial wiring, exploratory implementation, or work better verified at another boundary.
- Prioritize automated tests for domain invariants, persistence and data integrity, concurrency, migrations, security/privacy boundaries, provider contracts, and valuable deterministic regressions.
- Test public behavior, invariants, and meaningful boundaries at the lowest useful level rather than private implementation trivia.
- Use deterministic integration or end-to-end reproduction when isolated unit testing cannot prove the actual risk.
- Avoid duplicated confidence across layers. For every test, be able to name the realistic regression it prevents; if there is no strong answer, do not add the test.
