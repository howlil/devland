# ChatGPT Plugin Adapter

This adapter exposes Devland's read-only engineering context and feedback surface to ChatGPT through MCP. It does not own repository access, GitHub authentication, project facts, event collection, or persistent work state.

## Ownership

- Devland Core owns global engineering rules, workflows, profiles, risk classification, verification semantics, deterministic repository diagnostics, delivery/outcome correlation, and flow reporting.
- `.devland/project.yaml` is canonical durable project memory.
- `.devland/state.yaml` is canonical lightweight current-work coordination when persistence is useful.
- `work` is a transient envelope for the active request: intent, observable acceptance boundaries, optional scope, and optional expected outcome.
- `change.verification` is an optional transient selection describing realistic failure modes, criticality, chosen verification boundary, relative cost, and optional rationale.
- normalized engineering events remain externally collected evidence; `flow_report` only consumes supplied NDJSON.
- repository files remain external evidence; `doctor` only consumes a supplied transient snapshot.
- ChatGPT conversation memory is transient context/cache and must not replace canonical files.

The transient work envelope, verification selection, repository snapshot, and event evidence are never written to `.devland/state.yaml` by this adapter.

## MCP tools

The server intentionally exposes exactly three read-only tools:

```text
resolve_context
doctor
flow_report
```

It does not expose repository mutation, Git, shell, test execution, CI, deployment, issue-management, telemetry collection, or agent-orchestration tools.

### `resolve_context`

Accepts:

- `project_yaml`: the repository's `.devland/project.yaml` contents;
- `state_yaml`: the repository's `.devland/state.yaml` contents;
- `workflow`: defaults to `develop-change`;
- `change`: optional transient signals, context hydration preferences, and `verification` selection;
- `work`: optional transient work envelope containing `id`, `intent`, non-empty `acceptance`, optional `scope`, and optional `expected_outcome`.

A verification selection uses compact semantics only:

```json
{
  "criticality": "behavioral",
  "failure_modes": ["CLI and filesystem interaction drops supplied work"],
  "boundary": "integration",
  "cost": "moderate",
  "reason": "the interaction boundary is the realistic failure"
}
```

The resolver validates that descriptor and may attach non-blocking diagnostics when it obviously conflicts with change risk. Devland does not return test commands or create a verification matrix.

Acceptance entries describe observable conditions for the requested behavior. They need sufficient evidence before completion is claimed, but they do not require a separate acceptance-test suite or one dedicated test per criterion.

### `doctor`

Accepts canonical YAML plus `repository_files`, a transient list of repository-relative text files already obtained through an external repository capability. Devland stages that snapshot in an isolated temporary project, runs the same `doctorProject` semantics as the CLI, returns the structured diagnostics, and removes the temporary data.

Snapshot paths must be repository-relative, cannot contain traversal segments, and cannot override `.devland` canonical/runtime files. The tool does not fetch repository files itself.

### `flow_report`

Accepts canonical YAML plus optional `events_ndjson` containing normalized `devland.event/v1` records already obtained externally. It runs the same flow/correlation/outcome semantics as `devland flow`. Empty event evidence returns a valid empty report rather than a tool error.

A surrounding runtime owns event collection and repository access. Devland only interprets supplied evidence.

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

For ChatGPT development, expose that endpoint over HTTPS and connect the HTTPS `/mcp` URL in ChatGPT developer mode. The adapter intentionally has no widget/UI.

## Production deployment

The repository root `Dockerfile` packages Devland Core and this adapter together because all three MCP tools delegate to root `src/` semantics.

Every qualifying push to `master` builds that image, exercises the root HTTP response plus MCP `initialize`, exact `tools/list`, and calls `resolve_context`, `doctor`, and `flow_report`. The same tested image is then published as:

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

Keep repository and event-source access outside this service. The deployed MCP remains stateless and read-only.

## Expected ChatGPT flow

```text
user requirement
      ↓
external repository capability reads canonical/relevant evidence
      ↓
resolve_context when change guidance is needed
      ↓
doctor when deterministic repository drift matters
      ↓
flow_report when delivery/outcome feedback matters
      ↓
ChatGPT performs engineering actions through separate repository/runtime capabilities
```

The three tools are used by need, not as a mandatory ceremony sequence. Re-resolve context for a new change, a material change to the transient work/verification contract, or when canonical project/work state changed materially.
