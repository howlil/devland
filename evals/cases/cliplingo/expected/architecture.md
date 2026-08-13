# ClipLingo Architecture Expectations

Project-specific architecture keeps the latency-sensitive Windows interaction path in the native application core, presentation behind a narrow UI boundary, and heavy inference in an isolated worker process. The core owns workflow/state; UI components do not own application behavior. Worker failure must not take down the shell, and translation remains local in the normal path.

Concrete implementation choices such as process protocol, capture fallback details, and model runtime remain project decisions rather than Devland core policy.
