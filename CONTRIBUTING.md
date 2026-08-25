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
- npm

```bash
git clone https://github.com/howlil/devland.git
cd devland
npm ci
npm test
```

For CLI development you can also run:

```bash
npm run devland -- validate
```

## Making a change

1. Keep one coherent outcome per pull request.
2. Inspect the existing behavior before changing it.
3. Add regression coverage for behavior changes when a deterministic test is meaningful.
4. Prefer the smallest implementation that solves the observed problem.
5. Do not add process artifacts solely to document that work happened; Git and the pull request already provide history.
6. Update public documentation when the user-facing contract changes.

## Verification

Verification should match risk:

- documentation or metadata: inspect the rendered/parsed result and run relevant checks;
- localized logic: focused tests plus normal CI;
- core workflows, schemas, migrations, persistence, security, or side effects: broader affected regression coverage;
- packaging or platform-sensitive behavior: explicit Linux/macOS/Windows verification.

The normal repository gate is:

```bash
npm test
```

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
