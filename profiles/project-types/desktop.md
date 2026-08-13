---
id: project-types.desktop
kind: project-type
---
# Desktop Project Profile

## Guidance

- Treat operating-system lifecycle, focus, windowing, filesystem, and integration behavior as real product boundaries that need representative testing.
- Keep long-running or blocking work off latency-sensitive UI/event paths.
- Model packaging, updates, signing, and platform compatibility as delivery concerns rather than server-environment concerns.
- Prefer excellent behavior on the currently supported platform over speculative portability abstractions before another platform is planned.
