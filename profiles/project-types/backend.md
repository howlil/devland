---
id: project-types.backend
kind: project-type
---
# Backend Project Profile

## Guidance

- Make trust boundaries and transport-to-domain ownership explicit.
- When durable state exists, keep multi-write invariants inside an appropriate consistency boundary and test the real persistence behavior where semantics depend on it.
- Treat calls to external systems as fallible: define bounded cancellation/timeout behavior and map failures at the boundary that owns the protocol.
- Keep domain behavior independent from transport status codes and provider-specific payload shapes unless the project explicitly requires otherwise.
