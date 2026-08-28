import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { resolvePortableContextFromYaml } from './resolve-context.mjs';

const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = '/mcp';

const changeSchema = z.object({
  signals: z.array(z.string().min(1)).optional(),
  context: z.object({
    full: z.boolean().optional(),
    state: z.boolean().optional(),
  }).optional(),
}).optional();

function createDevlandServer() {
  const server = new McpServer(
    { name: 'devland-context', version: '0.1.0' },
    {
      instructions: 'Resolve Devland engineering context from canonical project/state YAML. Treat ChatGPT conversation context as transient; project.yaml and state.yaml remain canonical project memory.',
    },
  );

  server.registerTool(
    'resolve_context',
    {
      title: 'Resolve Devland context',
      description: 'Use this when engineering work needs the effective Devland workflow, policies, profiles, and risk budget for a repository. Supply the repository canonical .devland project and state YAML; do not invent missing project facts.',
      inputSchema: {
        project_yaml: z.string().min(1),
        state_yaml: z.string().min(1),
        workflow: z.string().min(1).default('develop-change'),
        change: changeSchema,
      },
      outputSchema: {
        context: z.record(z.unknown()),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
    },
    async ({ project_yaml: projectYaml, state_yaml: stateYaml, workflow, change }) => {
      const context = await resolvePortableContextFromYaml({
        projectYaml,
        stateYaml,
        workflow,
        change: change ?? null,
      });

      return {
        structuredContent: { context },
        content: [{
          type: 'text',
          text: `Resolved ${context.workflow.id} as ${context.execution.lane} using ${context.schema}.`,
        }],
      };
    },
  );

  return server;
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end('Missing URL');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'OPTIONS' && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, mcp-session-id',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('Devland context plugin');
    return;
  }

  const mcpMethods = new Set(['POST', 'GET', 'DELETE']);
  if (url.pathname === MCP_PATH && req.method && mcpMethods.has(req.method)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    const server = createDevlandServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('Error handling Devland MCP request:', error);
      if (!res.headersSent) res.writeHead(500).end('Internal server error');
    }
    return;
  }

  res.writeHead(404).end('Not Found');
});

httpServer.listen(PORT, () => {
  console.log(`Devland context plugin listening on http://localhost:${PORT}${MCP_PATH}`);
});
