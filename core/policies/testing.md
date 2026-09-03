---
id: core.testing
scope: core
---
# Testing Policy

`Required` rules need explicit rationale and evidence to deviate. `Defaults` may be overridden when project evidence supports a better choice.

## Required

- Tests exist to reduce meaningful delivery risk, not to maximize coverage, test count, or testing ceremony.
- Protect critical observable behavior first: core/domain invariants, critical functions, state transitions, authorization/security decisions, money/data integrity, compatibility contracts, concurrency semantics, and other behavior whose failure has material impact.
- A deterministically reproducible behavior defect needs regression verification that demonstrates the failure before the fix where practical.
- Do not weaken, delete, or bypass a valid test merely to make a quality gate green.

## Defaults

- Start from the realistic regression or failure risk introduced by the change, consider whether the behavior is critical, behavioral, or peripheral, then choose the cheapest high-signal verification that can detect it. The criticality label is a reasoning aid, not a required artifact.
- Strongly prefer **RED -> GREEN -> REFACTOR** for critical deterministic executable behavior when an automated test or deterministic reproduction can define the failure clearly. This includes critical domain logic and functions whose wrong result can materially affect security, money, state, data, compatibility, or other important behavior.
- TDD is not universal. Do not require test-first development for every code change. Presentation-only changes, styling/layout, static markup, copy, trivial configuration or wiring, exploratory spikes, generated code, and behavior better verified at another boundary may use a cheaper verification loop.
- Use RED -> GREEN -> REFACTOR for non-critical deterministic behavior when it remains the cheapest useful way to define or protect the behavior; otherwise use the fastest trustworthy alternative.
- Treat deterministic integration tests as first-class verification whenever component interaction is the realistic failure boundary. There is no requirement to create isolated unit tests first when an integration test proves the risk more directly and cheaply.
- Use end-to-end (E2E) tests only when a critical user journey or cross-system interaction needs unique confidence that a cheaper unit, component, contract, process, or integration boundary cannot provide. Do not add E2E coverage merely because the test category exists.
- Prioritize automated tests for domain invariants, persistence and data integrity, concurrency, migrations, security/privacy boundaries, provider contracts, and valuable deterministic regressions.
- Test public behavior, invariants, and meaningful boundaries at the lowest useful level rather than private implementation trivia.
- Avoid duplicated confidence across layers. For every test, be able to name the realistic regression it prevents; if there is no strong answer, do not add the test.
- Do not use blanket coverage targets as a substitute for protecting critical behavior. Coverage may be diagnostic evidence, but coverage percentage alone does not justify another test or gate.
