---
id: doctor-project
policies:
  - core.engineering
  - core.documentation
  - core.verification
---
# Doctor Project

Audit the canonical Devland project model against repository facts that Devland can evaluate deterministically. Doctor reports only implemented checks; experimental adapter evaluation and delivery-flow evidence remain explicit commands rather than implicit health requirements.

## Procedure

1. Validate canonical project and state data.
2. Inspect the repository facts required by supported checks.
3. Compare declared language/runtime facts with deterministic repository evidence.
4. Verify that an explicitly referenced architecture document exists when one is configured.
5. For each finding, cite the conflicting evidence and recommend the smallest correction.
6. Preserve uncertainty when repository evidence is inaccessible. Absence of access is not proof of a clean repository.

Supported finding categories:

- `stack/runtime drift`
- `invalid/missing referenced files`

## Stop conditions

- Canonical Devland data is invalid.
- Required repository evidence cannot be read at all.
- A referenced source is inaccessible and prevents a material conclusion.

## Outputs

- Evidence-backed findings for checks Devland actually evaluated.
- Explicit uncertainty for partial checks.
- `clean` only when every supported check is clean.
- No automatic canonical rewrite, migration, deletion, merge, or other mutation.
