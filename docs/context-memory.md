# Context and Memory Ownership

Devland keeps engineering semantics portable by separating reusable rules from project memory and transient agent context.

## Ownership layers

| Layer | Canonical owner | Purpose | Durable |
| --- | --- | --- | --- |
| Global engineering semantics | Devland Core | Policies, workflows, profiles, risk/context behavior | Yes |
| Project memory | `.devland/project.yaml` | Durable project facts, constraints, stack, architecture references, explicit profiles | Yes |
| Current-work memory | `.devland/state.yaml` | Lightweight active/blocked work and open decisions that matter across sessions | Yes, but intentionally small |
| Conversation/session context | Agent runtime | Temporary resolved context, user discussion, local reasoning | No |
| Implementation reality | Repository source/configuration | Evidence of what currently exists | Source-controlled reality |

Conversation or model memory must never silently become canonical project truth. Persist a fact only by changing the project-owned canonical source when the user/request and evidence justify it.

## Resolution lifecycle

```text
user requirement
      ↓
project.yaml + state.yaml
      ↓
Devland resolver
      ↓
devland.context/v1
      ↓
agent session / conversation
      ↓
repository capabilities
```

`devland.context/v1` is a resolved working view, not a new database. It may remain in a conversation for the same unchanged task. Re-resolve when a new change begins or canonical project/work state changed materially.

## Adapter rule

Adapters may change transport and packaging, but not ownership or semantics:

- `AGENTS.md` routes local agents to the Devland resolver and canonical repository files.
- the ChatGPT plugin accepts canonical project/state YAML and returns `devland.context/v1`.
- neither adapter owns repository credentials, source code, project facts, or work state.

This boundary prevents agent-specific memories and generated instruction files from drifting into competing sources of truth.
