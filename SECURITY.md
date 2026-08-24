# Security Policy

## Reporting a vulnerability

Please use GitHub Private Vulnerability Reporting or a private GitHub Security Advisory for security vulnerabilities in Devland.

Do not open a public issue or post a public disclosure containing exploit details, secrets, credentials, private repository content, or other sensitive evidence before the issue has been assessed and a coordinated disclosure is appropriate.

A useful private report should include the affected Devland version or commit, the security boundary involved, reproducible evidence, expected versus observed behavior, and the smallest known impact description. Remove unrelated secrets and personal data from evidence before submitting it.

## Scope

Security reports are especially relevant when Devland could cause an AI runtime or operator to:

- expose or persist secrets through canonical state, generated context, events, logs, or adapters;
- misrepresent repository, CI, deployment, or production evidence;
- bypass an intended capability or permission boundary;
- accept hostile repository content as privileged instructions;
- produce incorrect trust or completion claims that materially weaken a software project's security posture.

## Supported code

Until Devland has public releases, the current `master` branch and the latest repository version are the supported security target. Historical prototypes are not maintained as separate supported release lines.
