# Devland Iteration 12 GitHub Evidence Implementation Plan

**Goal:** Reconstruct Devland's local evidence spool deterministically from concrete GitHub provider evidence without making Devland own GitHub authentication or provider APIs.

**Architecture:** Add one provider-specific normalizer (`src/providers/github.mjs`) and one batch ingestion primitive. The provider normalizer converts explicit GitHub records into `devland.event/v1` events with stable provider-derived IDs. Batch ingestion validates all events, acquires a repository-local lock, merges by stable ID, and atomically rewrites the local spool. Authentication/network collection remains an external runtime capability.

## Constraints

- No generic provider plugin framework.
- No GitHub authentication/network client in Devland core.
- No database/dashboard.
- Existing `event append` behavior remains supported.
- GitHub record replay must be deterministic and idempotent.
- Provider-specific fields do not enter canonical project/state.

## Slice

1. RED tests for deterministic GitHub normalization, replay, conflicts, and concurrent batch ingestion.
2. Implement provider normalizer and lock-protected batch ingestion.
3. Add CLI `devland ingest github <json>` for externally obtained GitHub evidence.
4. Verify fresh-checkout reconstruction and full cross-platform suite.
