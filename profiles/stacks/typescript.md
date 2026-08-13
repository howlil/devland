---
id: stacks.typescript
kind: stack
---
# TypeScript Stack Profile

## Guidance

- Keep compiler strictness enabled unless the repository has a documented reason otherwise.
- Treat compile-time types as insufficient for untrusted runtime input; validate at external boundaries.
- Avoid `any` or unchecked casts as an escape hatch unless the boundary cannot be typed more safely and the reason is explicit.
- Prefer narrow domain/feature types over large shared catch-all models that couple unrelated code.
