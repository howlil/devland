# Devland v0 Evaluations

The v0 cases are evidence-backed semantic fixtures, not copies of source agent files. Each case records a source snapshot, distilled evidence, the expected canonical Devland representation, and assertions about what must be preserved or must not be inferred.

`source.yaml` records provenance only. `evidence.md` contains sanitized facts used by the eval. `expected/` is the canonical target representation. `assertions.yaml` defines semantic checks for human/agent evaluation.

A repository case pins the exact commit inspected. The synthetic `simple` case pins the Devland revision that defined its fixture so the input remains reproducible.

Expected runtime evaluation compares bootstrap/doctor output with these fixtures; it must not mutate source repositories merely to run an eval.
