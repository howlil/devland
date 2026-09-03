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

## Defaults

- Identify what can realistically break, consider impact and likelihood, then choose the cheapest high-signal verification that can detect that failure.
- Increase verification depth only when risk justifies the additional cost. Use stronger boundary, contract, integration, critical-journey, migration/data, security, concurrency, portability, or release checks when those risks are materially present.
- Treat integration verification as first-class when interaction between components is the realistic failure boundary. It may be the first or only automated proof when that is cheaper and more representative than isolated tests.
- Keep the default CI/integration gate fast, deterministic, and high-signal. A check belongs on every normal change only when its expected confidence gain justifies paying its runtime and maintenance cost on every normal change.
- Keep expensive checks targeted. Container stacks, cross-platform matrices, large data fixtures, remote dependencies, browser automation, and other high-cost verification should run only when affected scope, material risk, release semantics, or an explicit repository contract justifies the cost.
- End-to-end (E2E) verification is not a default gate. Use it when a critical journey needs unique confidence that cheaper boundaries cannot provide; otherwise prefer the lower-cost boundary and avoid duplicating the same confidence.
- Run focused checks first, then the broader affected suite, then repository-mandatory gates before integration. Do not escalate breadth solely because another test category exists.
- Prefer reproducible command or CI evidence over subjective confidence.
- Do not duplicate the same confidence across layers unless separate failure modes justify it.
