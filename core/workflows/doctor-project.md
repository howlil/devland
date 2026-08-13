---
id: doctor-project
requires:
  - repository.read
optional:
  - repository.search
  - ci.read
---
# Doctor Project

Audit canonical Devland context against observable repository evidence, active work state, and generated adapters. Doctor is diagnostic in v0 and never rewrites canonical truth automatically.

## Procedure

1. Read canonical project and state data plus referenced project-local artifacts that are relevant to the audit.
2. Inspect observable repository evidence such as manifests, configuration, source layout, tests, CI, public documentation, and agent adapters as available.
3. Compare canonical facts against repository reality and distinguish implemented behavior from intended active-change behavior.
4. Classify each supported finding into exactly one primary category:
   - project-model drift
   - stack/runtime drift
   - architecture-document drift
   - stale work state
   - adapter duplication/divergence
   - invalid/missing referenced files
   - policy conflict
   - missing verification evidence for claimed-done work
   - over-generated context with no current applicability
5. For each finding, cite the conflicting evidence, explain why the category applies, and recommend the smallest correction.
6. Report uncertainty when evidence cannot establish which side is stale. Do not silently choose canonical text or repository text merely because one is easier to edit.
7. Report a clean category only when the inspected evidence actually supports it; absence of access is not proof of absence of drift.

## Stop conditions

- Required repository evidence cannot be read at all.
- A referenced source is unavailable and the missing evidence prevents a material conclusion.
- Conflicting evidence cannot be ordered without a product or architecture decision; report the conflict rather than resolve it implicitly.

## Outputs

- Evidence-backed findings grouped by the nine v0 doctor categories.
- Recommended correction for each finding.
- Explicit uncertainty and capability limitations.
- No automatic canonical rewrite, migration, deletion, merge, or other mutation in v0.
