---
id: core.verification
scope: core
---
# Verification Policy

`Required` rules need explicit rationale and evidence to deviate. `Defaults` may be overridden when project evidence supports a better choice.

## Required

- Obtain fresh, relevant verification before claiming a change is complete or ready for integration.
- Re-run affected verification after a material change to the candidate being integrated.
- Report unavailable capabilities or checks explicitly instead of implying that they ran.
- Every material acceptance condition needs sufficient evidence before completion is claimed, but it does not require a dedicated acceptance test or acceptance-test artifact.

## Defaults

- Select verification in this order: identify the realistic failure mode, assess impact/criticality, find the narrowest representative boundary, choose the cheapest trustworthy deterministic proof, add broader checks only for distinct failure modes, then run repository-mandatory gates.
- Keep proof and gate semantics separate. A focused local proof may establish the changed behavior while a repository CI gate establishes integration readiness; do not force every useful proof into a permanent CI job.
- Use `critical`, `behavioral`, and `peripheral` only as compact reasoning labels. Use `static`, `function`, `component`, `integration`, `contract`, `process`, `journey`, and `release` only as boundary vocabulary. Neither vocabulary is a mandatory document or stage sequence.
- Treat `cheap`, `moderate`, and `expensive` as relative cost signals, not fixed timing thresholds. Expensive verification needs affected-boundary, material-risk, or release justification.
- Increase verification depth only when risk justifies the additional cost. Use stronger boundary, contract, integration, critical-journey, migration/data, security, concurrency, portability, or release checks when those risks are materially present.
- Treat integration verification as first-class when interaction between components is the realistic failure boundary. It may be the first or only automated proof when that is cheaper and more representative than isolated tests.
- Keep the default CI/integration gate fast, deterministic, and high-signal. A check belongs on every normal change only when its expected confidence gain justifies paying its runtime and maintenance cost on every normal change.
- Keep expensive checks targeted. Container stacks, cross-platform matrices, large data fixtures, remote dependencies, browser automation, and other high-cost verification should run only when affected scope, material risk, release semantics, or an explicit repository contract justifies the cost.
- End-to-end (E2E) verification is not a default gate. Use it when a critical journey needs unique confidence that cheaper boundaries cannot provide; otherwise prefer the lower-cost boundary and avoid duplicating the same confidence.
- Run focused checks first, then the broader affected suite, then repository-mandatory gates before integration. Do not escalate breadth solely because another test category exists.
- If a transient verification selection is supplied, use it to preserve the current failure/criticality/boundary/cost decision and reconcile obvious contradictions with observed change risk. Diagnostics are advisory evidence, not a planner, command list, or automatic new gate.
- Do not create a verification matrix, test-layer checklist, or acceptance-test mapping artifact for ordinary changes. Record only the decision information that materially changes execution.
- Prefer reproducible command or CI evidence over subjective confidence.
- Do not duplicate the same confidence across layers unless separate failure modes justify it.
