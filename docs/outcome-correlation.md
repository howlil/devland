# Outcome correlation

Devland can associate normalized production delivery evidence with later outcome observations for the same `work_id`. This closes the feedback loop from accepted work through production without turning Devland into an analytics platform or causal-attribution engine.

## Outcome evidence

Use the existing engineering-event ingestion surface. `outcome.observed` requires `work_id` and may include a compact status:

```json
{
  "schema": "devland.event/v1",
  "id": "outcome:work-123:2026-09-04",
  "type": "outcome.observed",
  "occurred_at": "2026-09-04T12:00:00Z",
  "source": "product-observation",
  "work_id": "work-123",
  "data": {
    "status": "positive",
    "observation": "expired sessions are rejected consistently in production"
  }
}
```

Supported status values are `positive`, `neutral`, `negative`, and `unknown`. Status remains optional during the pre-1.0 dogfood period so older evidence can still be read; an observation without status is summarized as `unknown`.

The observation is evidence associated with the work. Devland does not claim that the work caused the observed product result.

## Flow semantics

`devland flow` adds two first-milestone metrics:

- `production_to_outcome`: first successful production deployment to first outcome observation for the same work;
- `idea_to_outcome`: accepted work to first outcome observation.

Timing uses the first qualifying observation. Current status summaries use the latest observation by timestamp. Multiple events are retained rather than collapsed into a workflow state machine.

Outcome reporting is separate from delivery-integrity reporting:

```json
{
  "outcomes": {
    "coverage": {
      "linked": 8,
      "total": 12
    },
    "status": {
      "positive": 5,
      "neutral": 1,
      "negative": 2,
      "unknown": 4
    }
  }
}
```

A production work item with no outcome observation counts as `unknown`; absence of evidence is never treated as a positive result.

Diagnostics remain advisory. For example, an observation timestamp before the first production deployment is reported as `outcome_precedes_production`, and materially different known statuses for the same work are reported as `conflicting_outcome_status` while the latest status still drives the current summary.

## Boundaries

Devland stores normalized events in the existing local NDJSON spool and correlates them in memory. External runtimes remain responsible for obtaining evidence from product analytics, monitoring, support, experiments, or manual observation. M5 adds no database, dashboard, telemetry collector, product-analytics connector, or new CLI command.
