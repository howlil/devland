---
id: delivery.container-image
kind: delivery
---
# Container Image Delivery Profile

## Guidance

- Build one immutable artifact for a revision and promote the same tested artifact when environments differ only by configuration.
- Keep environment-specific secrets and configuration outside the image.
- Verify production-shaped startup and health behavior; include persistence and rollback compatibility when a release changes durable state.
- Bound image/build-cache growth and avoid delivery steps that require rebuilding an already-tested revision without a concrete reason.
