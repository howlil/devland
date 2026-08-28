# ChatGPT Plugin Adapter

This adapter exposes Devland's resolved engineering context to ChatGPT as a tool-only MCP plugin. It does not own repository access, GitHub authentication, project facts, or work state.

## Ownership

- Devland Core owns global engineering rules, workflows, profiles, risk classification, and context resolution.
- `.devland/project.yaml` is canonical durable project memory.
- `.devland/state.yaml` is canonical lightweight current-work memory.
- ChatGPT conversation memory is transient context/cache and must not replace either canonical file.
- Repository source/configuration remains evidence of the current implementation.

## Tool

`resolve_context` accepts:

- `project_yaml`: the repository's `.devland/project.yaml` contents;
- `state_yaml`: the repository's `.devland/state.yaml` contents;
- `workflow`: defaults to `develop-change`;
- `change`: optional transient signals and context hydration preferences.

The tool returns the same Devland resolver semantics as the CLI, wrapped as `devland.context/v1`.

A surrounding ChatGPT runtime may obtain the two YAML files through a repository plugin/connector, but that repository access remains outside Devland. Do not duplicate GitHub or provider APIs inside this adapter.

## Local development

From the Devland repository root, install the normal Devland dependencies first:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Then install the adapter-local MCP dependencies and start the server:

```bash
npm install --prefix adapters/openai/chatgpt-plugin
npm start --prefix adapters/openai/chatgpt-plugin
```

The server exposes:

```text
http://localhost:8787/mcp
```

For ChatGPT development, expose that endpoint over HTTPS and connect the HTTPS `/mcp` URL in ChatGPT developer mode. The adapter intentionally has no widget/UI; the first useful increment is a read-only context tool.

## Expected ChatGPT flow

```text
user requirement
      ↓
repository connector/tool reads .devland/project.yaml + .devland/state.yaml
      ↓
Devland resolve_context
      ↓
devland.context/v1
      ↓
ChatGPT performs engineering work using separate repository capabilities
```

Re-resolve context for a new change or when canonical project/work state changed materially. Within one unchanged task, the resolved context may remain in the conversation as transient working context.
