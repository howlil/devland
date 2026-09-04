import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { doctorFromSnapshot, flowReportFromEvidence } from './portable-feedback.mjs';
import { resolvePortableContextFromYaml } from './resolve-context.mjs';

const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = '/mcp';

const verificationSchema = z.object({
  criticality: z.enum(['critical', 'behavioral', 'peripheral']),
  failure_modes: z.array(z.string().min(1)).min(1),
  boundary: z.enum(['static', 'function', 'component', 'integration', 'contract', 'process', 'journey', 'release']),
  cost: z.enum(['cheap', 'moderate', 'expensive']),
  reason: z.string().min(1).optional(),
}).strict().optional();

const changeSchema = z.object({
  signals: z.array(z.string().min(1)).optional(),
  context: z.object({
    full: z.boolean().optional(),
    state: z.boolean().optional(),
  }).optional(),
  verification: verificationSchema,
}).optional();

const workSchema = z.object({
  id: z.string().min(1),
  intent: z.string().min(1),
  acceptance: z.array(z.string().min(1)).min(1),
  scope: z.object({
    allowed: z.array(z.string().min(1)).optional(),
    excluded: z.array(z.string().min(1)).optional(),
  }).strict().optional(),
  expected_outcome: z.string().min(1).optional(),
}).strict().optional();

const repositoryFileSchema = z.object({
  path: z.string().min(1),
  content: z.string().optional(),
}).strict();

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
};

function createDevlandServer() {
  const server = new McpServer(
    { name: 'devland-context', version: '0.1.0' },
    {
      instructions: 'Read Devland engineering context, deterministic repository diagnostics, and delivery/outcome feedback. Repository access, mutation, Git, CI, deployment, and telemetry collection remain external capabilities. All Devland MCP tools are read-only.',
    },
  );

  server.registerTool(
    'resolve_context',
    {
      title: 'Resolve Devland context',
      description: 'Read-only. Resolve effective Devland workflow, policies, profiles, risk budget, transient work intent, and optional verification selection. Supply canonical YAML obtained through an external repository capability.',
      inputSchema: {
        project_yaml: z.string().min(1),
        state_yaml: z.string().min(1),
        workflow: z.string().min(1).default('develop-change'),
        change: changeSchema,
        work: workSchema,
      },
      outputSchema: {
        context: z.record(z.unknown()),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ project_yaml: projectYaml, state_yaml: stateYaml, workflow, change, work }) => {
      const context = await resolvePortableContextFromYaml({
        projectYaml,
        stateYaml,
        workflow,
        change: change ?? null,
        work: work ?? null,
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

  server.registerTool(
    'doctor',
    {
      title: 'Read Devland repository diagnostics',
      description: 'Read-only. Run Devland deterministic doctor semantics against canonical YAML plus a repository snapshot already obtained by the surrounding runtime. Devland does not fetch repository files itself.',
      inputSchema: {
        project_yaml: z.string().min(1),
        state_yaml: z.string().min(1),
        repository_files: z.array(repositoryFileSchema).default([]),
      },
      outputSchema: {
        doctor: z.record(z.unknown()),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ project_yaml: projectYaml, state_yaml: stateYaml, repository_files: repositoryFiles }) => {
      const doctor = await doctorFromSnapshot({
        projectYaml,
        stateYaml,
        repositoryFiles,
      });
      return {
        structuredContent: { doctor },
        content: [{ type: 'text', text: `Devland doctor status: ${doctor.status}.` }],
      };
    },
  );

  server.registerTool(
    'flow_report',
    {
      title: 'Read Devland flow feedback',
      description: 'Read-only. Derive delivery, correlation, evidence-confidence, and outcome feedback from canonical YAML plus normalized engineering events already obtained by the surrounding runtime.',
      inputSchema: {
        project_yaml: z.string().min(1),
        state_yaml: z.string().min(1),
        events_ndjson: z.string().default(''),
      },
      outputSchema: {
        report: z.record(z.unknown()),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ project_yaml: projectYaml, state_yaml: stateYaml, events_ndjson: eventsNdjson }) => {
      const report = await flowReportFromEvidence({ projectYaml, stateYaml, eventsNdjson });
      return {
        structuredContent: { report },
        content: [{
          type: 'text',
          text: `Read ${report.event_count} engineering events with ${report.evidence_status} lifecycle evidence.`,
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
