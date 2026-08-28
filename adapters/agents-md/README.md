# AGENTS.md Adapter

This adapter provides a small repository entry point for runtimes that understand `AGENTS.md`-style instructions.

The entry point routes engineering work through `devland context <workflow> [change-json]`. The CLI returns the portable `devland.context/v1` payload, so local agents consume the same resolved workflow, policies, profiles, risk lane, and canonical references as other Devland adapters.

The generated entry point must route the runtime to `.devland/project.yaml`, `.devland/state.yaml`, and only relevant referenced artifacts. It must not duplicate stack summaries, architecture decisions, active-work details, or universal policy prose that already has a canonical Devland source.

Memory ownership remains outside the adapter: `.devland/project.yaml` owns durable project memory, `.devland/state.yaml` owns lightweight current-work memory, and conversation/session memory is transient. See `docs/context-memory.md`.

When target-specific nesting or scoping is needed, preserve the same rule: generated instruction files are projections, never a second source of project truth.
