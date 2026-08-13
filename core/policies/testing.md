---
id: core.testing
scope: core
---
# Testing Policy

`Required` rules need explicit rationale and evidence to deviate. `Defaults` may be overridden when project evidence supports a better choice.

## Required

- A deterministically reproducible behavior defect needs regression verification that demonstrates the failure before the fix where practical.
- Do not weaken, delete, or bypass a valid test merely to make a quality gate green.

## Defaults

- Use RED -> GREEN -> REFACTOR for behavior changes.
- Test public behavior, invariants, and meaningful boundaries at the lowest useful level rather than private implementation trivia.
- Use deterministic integration or end-to-end reproduction when isolated unit testing is not meaningful.
