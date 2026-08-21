---
id: core.git
scope: core
---
# Git Policy

`Required` rules need explicit rationale and evidence to deviate. `Defaults` may be overridden when project evidence supports a better choice.

## Required

- Keep one logical task as one task when tests, CI, or review reveal same-scope follow-up work; do not create replacement branches to narrate retries.
- Do not rewrite protected or default-branch history.
- Do not claim merge, branch cleanup, or other repository mutations without evidence that the action succeeded.

## Defaults

- Use at most one working branch for one logical task and keep it **short-lived**.
- Use one pull request for normal task integration and keep review fixes on it.
- **Integrate promptly** once the current independently verifiable slice satisfies acceptance and required gates; avoid accumulating unrelated or already-green work into a larger branch merely to reduce merge frequency.
- Squash-merge normal work so the integration branch receives one coherent task commit.
- Remove merged or abandoned temporary branches when available capabilities permit safe cleanup.
