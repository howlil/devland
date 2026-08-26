# OpenAI Adapter Contract

Devland's OpenAI integration is an adapter over Devland Core, not a second implementation of Devland engineering semantics.

## Boundary

The OpenAI adapter may:

- translate OpenAI runtime/tool inputs into Devland Core inputs;
- invoke existing Devland Core behavior;
- translate Core results into runtime-friendly structured output;
- package Skills or MCP tools that expose those capabilities.

The OpenAI adapter must not:

- redefine workflow, policy, profile, risk, verification, validation, or diagnostic semantics;
- persist canonical project facts outside `.devland` canonical state;
- own repository authentication, provider authorization, CI execution, deployment, or production telemetry;
- add OpenAI-specific behavior to Devland Core unless that behavior is independently justified as agent-agnostic product semantics.

## Parity invariant

For the same repository state, workflow, and change input, an OpenAI adapter projection must preserve the observable semantic result of the corresponding Devland Core operation.

Adapter tests should therefore compare adapter results with Core behavior rather than duplicating expected policy, validation, or diagnostic logic inside adapter-specific fixtures.

## Read-only MCP foundation

The supported MCP-facing capabilities in this slice are:

- `devland_context`: resolve `develop-change` engineering context;
- `devland_validate`: validate canonical project and work-state files;
- `devland_doctor`: run deterministic repository diagnostics supported by Core.

Conceptually:

```text
OpenAI runtime
    -> MCP tool input
    -> thin OpenAI adapter
    -> Devland Core operation
    -> structured result
```

The adapter must preserve Devland Core's own package-root defaults. A consumer repository path is project input; it must not become the Devland implementation root merely because it is the current working directory.

This slice intentionally excludes repository mutation, shell execution, CI orchestration, deployment, provider SDK ownership, and autonomous coding behavior.
