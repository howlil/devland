# Devland v0 Evaluations

The v0 cases are evidence-backed semantic fixtures, not copies of source agent files. Each case records a source snapshot, distilled evidence, the expected canonical Devland representation, and assertions about what must be preserved or must not be inferred.

`source.yaml` records provenance only. `evidence.md` contains sanitized facts used by the eval. `expected/` is the canonical target representation. `assertions.yaml` defines semantic checks for human/agent evaluation.

A repository case pins the exact commit inspected. The synthetic `simple` case pins the Devland revision that defined its fixture so the input remains reproducible.

Expected runtime evaluation compares bootstrap/doctor output with these fixtures; it must not mutate source repositories merely to run an eval.

## Semantic evaluation protocol

Use this protocol when evaluating a ChatGPT, Codex, or other agent/runtime against a case:

1. Give the runtime only the case evidence plus the Devland core policy/profile/workflow context relevant to the requested operation.
2. Ask it to perform the `bootstrap-project` or `doctor-project` reasoning task for that case. Do not grant mutation capability merely to evaluate semantics.
3. Compare the result with `assertions.yaml`, the expected canonical files, and any seeded doctor scenario.
4. Mark each `must_preserve`, `must_not_infer`, expected/forbidden profile, work-model behavior, and expected doctor category as pass or fail with a short reason.
5. Record failures as evidence for changing the Devland semantic design, profile, workflow, adapter, or fixture expectation.
6. Do not change an expected fixture merely to make an incorrect runtime result pass. First determine whether the fixture expectation or the runtime reasoning is wrong from the pinned evidence.

The v0 evaluation process is intentionally manual/agent-assisted. It does not call an LLM API, run an evaluation service, or treat nondeterministic model output as a repository unit test.

## Doctor scenarios

Doctor fixtures seed known inconsistencies so a runtime can be evaluated on diagnosis rather than generation alone. A doctor result must cite both sides of the conflict when available, use one of the fixed v0 categories, recommend the smallest correction, and avoid automatic canonical rewrites when intent is not established.
