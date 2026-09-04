# Delivery correlation

Devland correlates normalized engineering evidence in memory so `devland flow` can trace delivery timing without becoming a task tracker, GitHub client, deployment engine, or telemetry database.

The useful linkage chain is:

```text
work_id
  -> change_id
  -> commit_sha
  -> review / CI
  -> change.merged
  -> deployment_id
```

`change.merged` is an explicit fact. It is separate from `review.completed`: a review can complete without a merge, while GitHub pull-request merge evidence may legitimately normalize into both facts.

Correlation is additive. Providers and runtimes should include `work_id`, `change_id`, and `commit_sha` when that evidence is actually known, but Devland does not rewrite `.devland/state.yaml` or require a lifecycle state machine. Existing events with weaker linkage remain readable; `flow` reports missing or conflicting relationships as evidence diagnostics instead of inventing them.

The flow report adds four first-milestone metrics:

```text
accept_to_start       work.accepted -> work.started
start_to_change       work.started -> first change.committed
change_to_merge       first change.committed -> change.merged
merge_to_production   change.merged -> deployment.succeeded in a configured production environment
```

Repeated commits do not create duplicate `start_to_change` or `change_to_merge` samples. Event append order also does not define lifecycle order; timestamps and identities do, so out-of-order ingestion is supported.

Correlation quality is reported separately from metric timing:

```json
{
  "correlation": {
    "coverage": {
      "work_to_change": { "linked": 1, "total": 1 },
      "change_to_merge": { "linked": 1, "total": 1 },
      "merge_to_deploy": { "linked": 1, "total": 1 }
    },
    "diagnostics": []
  }
}
```

Typical diagnostics include `unlinked_change`, `conflicting_work_link`, and `unlinked_deployment`. These describe evidence quality; they are not workflow gates.

GitHub access remains external to Devland. `devland ingest github` only normalizes records that another runtime already obtained. Re-ingesting the same stable provider evidence remains idempotent through the existing event spool contract.
