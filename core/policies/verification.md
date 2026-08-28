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
- Run focused checks first, then the broader affected suite, then repository-mandatory gates before integration.
- Prefer reproducible command or CI evidence over subjective confidence.
- Do not duplicate the same confidence across layers unless separate failure modes justify it.
