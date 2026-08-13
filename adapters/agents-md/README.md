# AGENTS.md Adapter

This adapter provides a small repository entry point for runtimes that understand `AGENTS.md`-style instructions.

The generated entry point must route the runtime to `.devland/project.yaml`, `.devland/state.yaml`, and only relevant referenced artifacts. It must not duplicate stack summaries, architecture decisions, active-work details, or universal policy prose that already has a canonical Devland source.

When target-specific nesting or scoping is needed, preserve the same rule: generated instruction files are projections, never a second source of project truth.
