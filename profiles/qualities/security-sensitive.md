---
id: qualities.security-sensitive
kind: quality
---
# Security-Sensitive Profile

## Guidance

- Identify authentication, authorization, secret-bearing, persistence, and external-input trust boundaries before implementation.
- Add focused verification for redaction, credential lifecycle, authorization failures, and sensitive persistence behavior affected by the change.
- Keep retained secrets minimal and avoid returning stored plaintext through ordinary read paths.
- Require evidence for changes that materially alter access, identity binding, credential handling, or isolation boundaries.
