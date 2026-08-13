# Wago Architecture Expectations

Wago remains a single-instance modular monolith with explicit ownership boundaries between HTTP transport, application use cases, business policy, durable persistence, protocol adaptation/lifecycle, and top-level process wiring. Provider-specific socket state stays contained inside its owning integration module.

Durable state semantics, lifecycle transitions, sanitized observability, and rollback-compatible persistence are project constraints. These are not universal Devland technology choices.
