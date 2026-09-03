# ChatGPT Plugin Adapter

This adapter exposes Devland's resolved engineering context to ChatGPT as a tool-only MCP plugin. It does not own repository access, GitHub authentication, project facts, or persistent work state.

## Ownership

- Devland Core owns global engineering rules, workflows, profiles, risk classification, and context resolution.
- `.devland/project.yaml` is canonical durable project memory.
- `.devland/state.yaml` is canonical lightweight current-work coordination when persistence is useful.
- `work` is a transient envelope for the active request: intent, observable acceptance boundaries, optional scope, and optional expected outcome.
- ChatGPT conversation memory is transient context/cache and must not replace either canonical file.
- Repository source/configuration remains evidence of the current implementation.

The transient `work` envelope is never written to `.devland/state.yaml` by this adapter or the resolver.

## Tool

`resolve_context` accepts:

- `project_yaml`: the repository's `.devland/project.yaml` contents;
- `state_yaml`: the repository's `.devland/state.yaml` contents;
- `workflow`: defaults to `develop-change`;
- `change`: optional transient signals and context hydration preferences;
- `work`: optional transient work envelope containing `id`, `intent`, non-empty `acceptance`, optional `scope`, and optional `expected_outcome`.

Acceptance entries describe observable conditions for the requested behavior. They do not require a separate acceptance-test suite; the resolved engineering policy still selects the cheapest high-signal verification for the actual failure mode.

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

## Production deployment

The repository root `Dockerfile` packages Devland Core and this adapter together because the adapter resolves context through the root `src/` runtime.

Every qualifying push to `master` builds that image, exercises the root HTTP response plus MCP `initialize`, `tools/list`, and `resolve_context`, and only then publishes the same tested image as:

```text
ghcr.io/howlil/devland:latest
ghcr.io/howlil/devland:sha-<git-sha>
```

GitHub Container Registry packages are private on first publication. For anonymous pulls from MyPaaS, make the `devland` container package public once after its first successful publish, or configure registry authentication on the host.

For MyPaaS, use the repository `compose.yml` rather than Dockerfile/image deployment so the platform uses its Compose readiness path:

```text
repository: https://github.com/howlil/devland
branch: master
deploy mode: compose
compose file: compose.yml
main service: devland
app port: 8787
database: none
persistent storage: none
```

The Compose service pulls `ghcr.io/howlil/devland:latest`, listens on container port `8787`, and declares an HTTP healthcheck. MyPaaS owns the host-port allocation and public reverse-proxy route; do not add a fixed host port to `compose.yml`.

After MyPaaS exposes the project over HTTPS, verify:

```bash
curl https://<devland-mcp-host>/
```

The expected response is `Devland context plugin`. Configure ChatGPT with:

```text
https://<devland-mcp-host>/mcp
```

Keep repository access outside this service. The deployed MCP remains a stateless, read-only Devland context resolver.

## Expected ChatGPT flow

```text
user requirement
      ↓
transient work envelope (intent + acceptance + scope)
      ↓
repository connector/tool reads .devland/project.yaml + .devland/state.yaml
      ↓
Devland resolve_context
      ↓
devland.context/v1
      ↓
ChatGPT performs engineering work using separate repository capabilities
```

Re-resolve context for a new change, a material change to the transient work contract, or when canonical project/work state changed materially. Within one unchanged task, the resolved context may remain in the conversation as transient working context.
