# Local usage

This guide covers the two supported ways to use Devland locally:

1. use the Devland CLI from another repository;
2. run the Devland MCP adapter locally for development or protocol testing.

Devland does not require a database, background daemon, GitHub token, or deployment platform for normal local CLI use.

## Prerequisites

Required for the CLI:

- Git;
- Node.js 22 or newer;
- Corepack;
- pnpm 11.21.0, resolved from the repository `packageManager` field.

Optional:

- Docker, only when testing the production container locally;
- curl or another HTTP client, only when testing the MCP endpoint.

Check the runtime first:

```bash
node --version
corepack --version
```

Node must report version 22 or newer.

## Install from source

For active development and dogfooding, clone the repository and install the locked dependencies:

```bash
git clone https://github.com/howlil/devland.git
cd devland
corepack enable
pnpm install --frozen-lockfile
```

Run the CLI directly from the checkout:

```bash
node bin/devland.mjs validate
```

To make `devland` available globally while keeping it linked to this checkout:

```bash
pnpm link --global
```

You can then run `devland` from another repository. If pnpm reports that no global binary directory exists, run `pnpm setup`, reopen the shell, and repeat `pnpm link --global`.

The global link points to the local checkout. Pulling new source does not require reinstalling Devland globally, but dependency changes require another locked install:

```bash
git pull --ff-only
pnpm install --frozen-lockfile
```

## Install a tagged release

Use a tagged release when you want a stable, pinned local installation instead of a development checkout:

```bash
corepack enable
pnpm add --global github:howlil/devland#v0.2.0
```

A GitHub Release `.tgz` asset can also be installed directly:

```bash
pnpm add --global ./devland-0.2.0.tgz
```

Devland is not currently published as a public npm package.

## Enable Devland in a repository

Move to the repository that should consume Devland, not the Devland source repository:

```bash
cd /path/to/your-project
devland init my-project
```

`init` creates the canonical local project surface:

```text
.devland/
├── project.yaml
└── state.yaml
```

`project.yaml` contains durable project facts and constraints. `state.yaml` contains lightweight current-work context. `.devland/runtime/`, when produced by local diagnostics, is runtime evidence and is ignored by Git.

Review the generated YAML before relying on it. Repository source and configuration remain the implementation truth; Devland context must not invent missing project facts.

## Normal local workflow

Run deterministic validation first:

```bash
devland validate
```

Inspect supported repository drift:

```bash
devland doctor
```

Resolve the default engineering workflow for a change:

```bash
devland context develop-change
```

The output is the portable Devland context consumed by a human or an AI runtime. It includes the resolved workflow, applicable policies and profiles, and the execution lane for the current change.

Pass transient change signals when the task has material characteristics that should affect the execution lane:

```bash
devland context develop-change '{"signals":["dependency-change"]}'
```

On Windows Command Prompt, escape the JSON with double quotes:

```cmd
devland context develop-change "{\"signals\":[\"dependency-change\"]}"
```

Hydrate current work state only when the task actually depends on it:

```bash
devland context develop-change '{"signals":["localized"],"context":{"state":true}}'
```

Request the full context payload only for debugging or broader reasoning:

```bash
devland context develop-change '{"context":{"full":true}}'
```

## Core commands

| Command | Use |
| --- | --- |
| `devland init <project-name>` | Create canonical `.devland` project and state files. |
| `devland migrate` | Migrate supported legacy canonical state to the current behavioral contract. |
| `devland validate` | Validate canonical files and deterministic invariants. |
| `devland doctor` | Detect supported repository drift from observable evidence. |
| `devland context <workflow> [change-json]` | Resolve the portable engineering context for a change. |

Experimental event, flow, provider-ingestion, and adapter-evaluation commands exist for dogfooding but are not required for normal local use.

## Run the MCP server locally

The MCP adapter is separate from normal CLI use. Run it when developing the ChatGPT integration or testing the remote-MCP protocol locally.

Install the root Devland dependencies first:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Then install the adapter-local MCP dependencies:

```bash
npm install --prefix adapters/openai/chatgpt-plugin
```

Start the server from the repository root:

```bash
npm start --prefix adapters/openai/chatgpt-plugin
```

By default it listens on:

```text
http://localhost:8787/mcp
```

Override the runtime port through the environment when needed:

```bash
PORT=8787 npm start --prefix adapters/openai/chatgpt-plugin
```

PowerShell equivalent:

```powershell
$env:PORT = "8787"
npm start --prefix adapters/openai/chatgpt-plugin
```

Verify the HTTP process:

```bash
curl http://127.0.0.1:8787/
```

Expected body:

```text
Devland context plugin
```

The `/mcp` path is a protocol endpoint, not a human-facing web page. Opening it in a browser is not a valid MCP health check.

## Test MCP locally

Send an MCP `initialize` request:

```bash
curl -i -X POST http://127.0.0.1:8787/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-03-26' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"local-test","version":"1.0.0"}}}'
```

A healthy server returns a JSON-RPC result whose `serverInfo.name` is `devland-context`.

The adapter currently exposes the read-only `resolve_context` tool. It does not provide repository access itself; another runtime or connector must supply `.devland/project.yaml` and `.devland/state.yaml` contents when invoking that tool.

## Test the production container locally

Docker is optional for normal Devland CLI use. Use it when verifying the same container contract used in production:

```bash
docker build -t devland-local .
docker run --rm -p 8787:8787 -e PORT=8787 devland-local
```

In another shell:

```bash
curl http://127.0.0.1:8787/
```

Expected body:

```text
Devland context plugin
```

Stop the foreground container with `Ctrl+C`.

## Development checks

When changing Devland itself:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` currently runs the Node test suite. Use broader container or cross-platform verification only when the change affects packaging, runtime portability, or release-sensitive behavior.

## What should be committed

Commit durable Devland project context when it is intentionally part of the repository:

```text
.devland/project.yaml
.devland/state.yaml
```

Do not commit `.devland/runtime/`; it is local runtime evidence and is already ignored by this repository's Git configuration.

Keep secrets out of canonical Devland files. Authentication and provider credentials belong to the external tool or platform that owns those capabilities.
