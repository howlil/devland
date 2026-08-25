# OpenAI Adapter Contract

Devland's OpenAI integration is an adapter over Devland Core, not a second implementation of Devland engineering semantics.

## Boundary

The OpenAI adapter may:

- translate OpenAI runtime/tool inputs into Devland Core inputs;
- invoke existing Devland Core behavior;
- translate Core results into runtime-friendly structured output;
- package Skills or MCP tools that expose those capabilities.

The OpenAI adapter must not:

- redefine workflow, policy, profile, risk, or verification semantics;
- persist canonical project facts outside `.devland` canonical state;
- own repository authentication, provider authorization, CI execution, deployment, or production telemetry;
- add OpenAI-specific behavior to Devland Core unless that behavior is independently justified as agent-agnostic product semantics.

## Parity invariant

For the same repository state, workflow, and change input, an OpenAI adapter projection must preserve the observable semantic result of the corresponding Devland Core operation.

Adapter tests should therefore compare the adapter result with Core behavior rather than duplicating expected policy logic inside adapter-specific fixtures.

## First vertical slice

The first supported MCP-facing capability is context resolution for `develop-change`.

Conceptually:

```text
OpenAI runtime
    -> MCP tool input
    -> thin OpenAI adapter
    -> Devland Core context resolver
    -> structured result
```

This slice intentionally excludes repository mutation, shell execution, CI orchestration, deployment, and autonomous coding behavior.
