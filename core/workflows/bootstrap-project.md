---
id: bootstrap-project
requires: []
optional:
  - repository.read
  - repository.write
  - repository.search
  - network.public-read
---
# Bootstrap Project

Create or refresh a minimal canonical Devland representation from either a product idea or an existing repository. Evidence outranks the desire to fill every field.

## Procedure

1. Identify input mode: idea-only or existing repository.
2. For idea-only input, establish purpose, users, scope, priorities, non-goals, material constraints, and delivery expectations. Leave technology unknown when it has not been chosen.
3. For an existing repository, inspect available manifests, configuration, tests, CI configuration, source layout, public documentation, and existing agent/work artifacts. Separate observable implementation facts from stale or merely advisory prose.
4. Identify duplicated facts, conflicting instructions, unsupported assumptions, and product-specific decisions that must not become universal policy.
5. Classify only evidenced project types, qualities, stack facts, platforms, and delivery model; select the smallest applicable profile set.
6. Produce candidate `project.yaml` and `state.yaml` data. Add architecture/change artifacts only when their complexity or persistence value is justified.
7. If repository write capability exists and application was requested, write only the supported canonical/adaptor artifacts. Otherwise return the candidate representation without claiming it was applied.
8. Preserve useful legacy artifacts until canonical equivalents have been reviewed; bootstrap is not permission for destructive cleanup.

## Stop conditions

- A material project fact cannot be supported by conversation or repository evidence.
- Product decisions materially contradict one another and resolving them changes the architecture or scope.
- Applying files was requested but no write capability is available.
- Repository evidence appears incomplete enough that a confident migration would discard important constraints.

Stopping means return the supported candidate, identify the uncertainty or missing capability, and avoid inventing completion.

## Outputs

- Candidate or applied `.devland/project.yaml`.
- Candidate or applied `.devland/state.yaml`.
- Minimal selected profile IDs and any justified project-local architecture references.
- A concise list of unresolved conflicts, unknowns, legacy duplication, and capability limitations.
