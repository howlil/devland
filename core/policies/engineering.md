---
id: core.engineering
scope: core
---
# Engineering Policy

`Required` rules need explicit rationale and evidence to deviate. `Defaults` may be overridden when project evidence supports a better choice.

## Required

- Stay inside the approved current scope and do not implement unrelated future work opportunistically.
- Start implementation from the explicit accepted requirement. Do not silently replace it with an inferred feature, broader redesign, or preferred framework pattern.
- Determine which existing component owns the affected behavior before introducing a new owner, boundary, abstraction, or subsystem.
- For non-trivial design decisions, preserve a concise reasoning chain: **requirement -> engineering fact -> implementation decision**.
- Do not claim work, checks, repository actions, or outcomes that were not actually performed.
- Preserve observable behavior outside the intended change unless the approved scope explicitly changes it.
- Record an explicit exception when a required Devland policy must be violated.

## Defaults

- Extract only engineering facts that materially affect implementation: required behavior, state, domain invariants, affected data, ownership, external boundaries, failure conditions, concurrency or consistency concerns, and compatibility constraints.
- Decompose accepted work into the **smallest valuable, independently verifiable change** that can provide trustworthy feedback without creating unsafe partial behavior.
- Keep **small batch** size: changes should remain easy to understand, test, review, integrate, diagnose, and reverse unless the behavior cannot be separated safely.
- Choose the simplest implementation style justified by the problem shape and repository reality. Prefer an existing architectural pattern when it fits; otherwise use simple procedural logic, functional transformation, object/domain behavior, an explicit state machine, event-driven handling, or a hybrid only where the engineering facts justify it.
- Map the decision directly into the existing codebase. Prefer, in order: reuse an existing component or pattern, extend the current owner, add a local function or type, introduce a small local abstraction, and change architecture only when the current structure cannot reasonably satisfy the requirement.
- Choose the simplest design that satisfies current requirements without closing a known, near-term boundary unnecessarily.
- Refactor only what enables a clean current change or removes a direct blocker.
- Prefer narrow ownership boundaries and clear responsibilities over speculative layers or internal frameworks.
- Diagrams and formal models are optional reasoning tools, not mandatory delivery artifacts. Create one only when it materially reduces ambiguity, design risk, or implementation complexity; skip it when repository structure and concise reasoning already make the implementation path clear.
