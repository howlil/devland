# Contributing to Devland

Thanks for contributing. Devland is intentionally small, so contribution quality is judged as much by **scope discipline** as by implementation quality.

## Before opening a change

Use an issue when the change is non-trivial, user-visible, or needs design discussion. Small documentation corrections and obvious bug fixes can go directly to a pull request.

For feature proposals, start from an observed problem. A useful proposal explains:

- what currently fails or creates measurable friction;
- who is affected;
- the smallest useful outcome;
- why the existing core cannot support that outcome;
- what is explicitly out of scope.

Please avoid speculative abstractions, provider integrations without a current consumer, and repository-wide cleanup unrelated to the reported problem.

## Development setup

Requirements:

- Node.js 22+
- Corepack
- pnpm 11.21.0, pinned by `packageManager` in `package.json`

```bash
git clone https://github.com/howlil/devland.git
cd devland
corepack enable
pnpm install --frozen-lockfile
pnpm test
```

For CLI development you can also run:

```bash
pnpm devland -- validate
```

## Making a change

1. Keep one coherent outcome per pull request.
2. Inspect the existing behavior before changing it.
3. Protect critical deterministic behavior first. Strongly prefer RED -> GREEN -> REFACTOR for core/domain behavior and critical functions when a focused automated regression is the cheapest trustworthy proof; do not force TDD on every change.
4. Choose the verification boundary from the realistic failure mode. Integration tests are first-class when component interaction is the risk; there is no unit-test-first requirement.
5. Add E2E coverage only when a critical journey needs confidence that cheaper unit, component, contract, process, or integration checks cannot provide.
6. Prefer the smallest implementation that solves the observed problem.
7. Do not add process artifacts solely to document that work happened; Git and the pull request already provide history.
8. Update public documentation when the user-facing contract changes.

## Verification

Verification should match risk and cost:

- documentation, copy, styling, or low-risk metadata: inspect the relevant result and run only useful checks;
- localized deterministic behavior: focused regression verification, using TDD when it is the cheapest strong proof;
- component interaction: deterministic integration verification may be the primary or only automated proof;
- core workflows, schemas, migrations, persistence, security, data integrity, concurrency, or side effects: broader affected risk-specific verification;
- packaging or platform-sensitive behavior: explicit package or Linux/macOS/Windows verification;
- critical cross-system journeys: targeted E2E only when lower-cost boundaries cannot supply the required confidence.

The normal repository gate is:

```bash
pnpm test
```

Keep the default CI path fast and deterministic. Package-install smoke, container verification, cross-platform matrices, browser E2E, remote dependencies, large fixtures, and similar expensive checks should be triggered only by the affected boundary, material risk, or release semantics rather than paid on every pull request.

Do not add duplicated tests merely to fill unit/integration/E2E layers or satisfy a blanket coverage percentage. Each added check should protect a distinct realistic failure mode.

## Pull requests

A good pull request states:

- **what changed**;
- **why it is needed**;
- **how it was verified**;
- **what is intentionally not included**.

Keep follow-up fixes for the same scope in the same pull request. Do not split work into artificial iteration PRs only to create process evidence.

## Security

Do not report vulnerabilities, credentials, exploit details, or private repository content in a public issue. Follow [`SECURITY.md`](SECURITY.md).

## Community conduct

All participation is expected to follow [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

By contributing to Devland, you agree that your contributions will be licensed under the repository's [MIT License](LICENSE).
