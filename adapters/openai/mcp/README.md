# Devland OpenAI MCP adapter

This directory packages thin MCP-facing projections of Devland Core capabilities.

The adapter owns protocol translation only. Workflow, profile, policy, risk, and verification semantics remain in Devland Core.

The first vertical slice is `context` for the `develop-change` workflow. Its parity requirement is defined in `docs/openai-adapter-contract.md`.
