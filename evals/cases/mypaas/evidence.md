# MyPaas Evidence

MyPaas is a self-hosted personal deployment platform that connects repositories, detects container deployment definitions, builds/runs workloads, exposes applications through managed routing, redeploys from source changes, supports rollback, and presents logs/metrics through a dashboard.

The pinned agent context records a Go backend, SvelteKit/TypeScript frontend, PostgreSQL, container tooling, managed routing, and external tunnel integration. It contains many project-specific code conventions and explicit choices that should remain project/stack guidance rather than Devland core policy.

The repository also maintains overlapping persistent agent entry files for different runtimes plus runtime-specific configuration/skills. The duplicated product and stack truth across those entry files is the normalization problem Devland adapters are intended to remove.
