# Devland OpenAI MCP adapter

This directory packages thin, read-only MCP-facing projections of Devland Core capabilities.

The adapter owns protocol translation only. Workflow, profile, policy, risk, verification, validation, and diagnostic semantics remain in Devland Core.

Current capabilities:

- `devland_context` -> Core `develop-change` context resolution;
- `devland_validate` -> Core canonical validation;
- `devland_doctor` -> Core deterministic repository diagnostics.

Each adapter path is required to preserve semantic parity with the corresponding Core operation. See `docs/openai-adapter-contract.md`.

Repository mutation, arbitrary shell execution, CI/deployment orchestration, provider authentication, and autonomous coding remain outside this adapter.
