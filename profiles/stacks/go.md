---
id: stacks.go
kind: stack
---
# Go Stack Profile

## Guidance

- Prefer idiomatic language and standard-library facilities before adopting framework-shaped abstractions.
- Propagate `context.Context` through blocking or external I/O paths where cancellation/deadlines are meaningful.
- Keep package boundaries aligned with cohesive capabilities and avoid generic internal layers with no concrete ownership purpose.
- Return errors with useful context while preserving error identity needed by callers.
