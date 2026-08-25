# Security Policy

## Supported versions

Devland is currently pre-1.0 and has no public package releases. Security fixes target the latest `master` revision. Historical prototypes and old commits are not maintained as separate supported release lines.

## Reporting a vulnerability

Please use GitHub Private Vulnerability Reporting / a private GitHub Security Advisory for vulnerabilities in Devland.

**Do not open a public issue** containing exploit details, credentials, secrets, private repository content, or other sensitive evidence before the report has been assessed.

A useful report includes:

- the affected commit or version;
- the security boundary involved;
- reproducible steps or a minimal proof of concept;
- expected versus observed behavior;
- the smallest known impact description;
- relevant environment details.

Remove unrelated secrets, credentials, personal data, and private repository content before attaching evidence.

## Security scope

Security reports are especially relevant when Devland could cause an AI runtime or operator to:

- expose or persist secrets through canonical state, generated context, events, logs, or adapters;
- misrepresent repository, CI, deployment, or production evidence;
- bypass an intended capability or permission boundary;
- treat hostile repository content as privileged instructions;
- corrupt canonical state or migration behavior;
- produce trust or completion claims that materially weaken another project's security posture.

## Disclosure

Please allow maintainers to assess and remediate a report before public disclosure. Once a fix or mitigation is available, disclosure can be coordinated through the corresponding GitHub Security Advisory when appropriate.
