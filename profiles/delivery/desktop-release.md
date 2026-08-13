---
id: delivery.desktop-release
kind: delivery
---
# Desktop Release Profile

## Guidance

- Distinguish local development builds, prereleases, and stable releases as channels with different verification expectations.
- Treat installer/package creation, signing, checksums, update metadata, and compatibility as release-engineering concerns when the product reaches those channels.
- Promote verified release artifacts rather than silently rebuilding equivalent binaries for each distribution channel.
- Do not scaffold every package-manager or installer target before the product has a supported distribution requirement.
