#!/usr/bin/env node
/**
 * Living Canvas MCP server (stdio).
 *
 * Tools: list_boards, get_board, upsert_entity, upsert_connection, export_architecture
 *
 * Auth via env (or project .env):
 *   LIVING_CANVAS_API_URL  (default http://localhost:4000)
 *   LIVING_CANVAS_TOKEN    OR LIVING_CANVAS_EMAIL + LIVING_CANVAS_PASSWORD
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LivingCanvasApi, resolveApiToken } from './apiClient.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(rootDir, '.env') });

function textResult(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

async function main() {
  const baseUrl = (process.env.LIVING_CANVAS_API_URL || 'http://localhost:4000').replace(
    /\/$/,
    ''
  );
  const token = await resolveApiToken(baseUrl);
  const api = new LivingCanvasApi({ baseUrl, token });

  const server = new McpServer({
    name: 'living-canvas',
    version: '0.1.0',
  });

  server.registerTool(
    'list_boards',
    {
      title: 'List boards',
      description: 'List architecture boards owned by the authenticated user.',
    },
    async () => {
      try {
        const data = await api.listBoards();
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'get_board',
    {
      title: 'Get board',
      description:
        'Fetch full board state (elements + connections). Prefer export_architecture for agent reasoning.',
      inputSchema: {
        board_id: z.string().describe('Board UUID'),
      },
    },
    async ({ board_id }) => {
      try {
        const data = await api.getBoard(board_id);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'export_architecture',
    {
      title: 'Export architecture',
      description:
        'Return a compact knowledge graph (nodes/edges) without canvas styling. Use this before proposing a repo structure.',
      inputSchema: {
        board_id: z.string().describe('Board UUID'),
      },
    },
    async ({ board_id }) => {
      try {
        const data = await api.exportArchitecture(board_id);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'upsert_entity',
    {
      title: 'Upsert entity',
      description:
        'Create or update a knowledge entity on a board (Microservice, Database, Function, Task, …).',
      inputSchema: {
        board_id: z.string().describe('Board UUID'),
        id: z.string().optional().describe('Existing entity id to update'),
        title: z.string().describe('Entity title'),
        description: z.string().optional(),
        objectType: z
          .enum([
            'Generic',
            'Microservice',
            'Database',
            'Function',
            'Person',
            'Project',
            'Task',
            'Event',
            'Document',
            'Idea',
            'Device',
            'Custom',
          ])
          .optional(),
        tags: z.array(z.string()).optional(),
        properties: z
          .array(
            z.object({
              key: z.string(),
              value: z.string(),
              type: z.enum(['text', 'number', 'status', 'date', 'link']).optional(),
            })
          )
          .optional(),
        frameId: z.string().nullable().optional(),
        x: z.number().optional(),
        y: z.number().optional(),
      },
    },
    async (args) => {
      try {
        const { board_id, ...entity } = args;
        const data = await api.upsertEntity(board_id, entity as Record<string, unknown>);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'upsert_connection',
    {
      title: 'Upsert connection',
      description:
        'Create or update a typed connection between two entities (HTTP, gRPC, Dependency, Event, …).',
      inputSchema: {
        board_id: z.string().describe('Board UUID'),
        id: z.string().optional().describe('Existing connection id to update'),
        sourceId: z.string().describe('Source entity id'),
        targetId: z.string().describe('Target entity id'),
        label: z.string().optional(),
        connectionType: z
          .enum([
            'default',
            'HTTP',
            'REST API',
            'GraphQL',
            'gRPC',
            'WebSocket',
            'Data Flow',
            'Database Link',
            'Dependency',
            'Parent-Child',
            'Event',
            'Custom',
          ])
          .optional(),
        description: z.string().optional(),
        isBiDirectional: z.boolean().optional(),
        properties: z
          .array(
            z.object({
              key: z.string(),
              value: z.string(),
              type: z.enum(['text', 'number', 'status', 'date', 'link']).optional(),
            })
          )
          .optional(),
      },
    },
    async (args) => {
      try {
        const { board_id, ...connection } = args;
        const data = await api.upsertConnection(
          board_id,
          connection as Record<string, unknown>
        );
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'create_board',
    {
      title: 'Create board',
      description: 'Create a new empty architecture board.',
      inputSchema: {
        name: z.string().describe('Board name'),
      },
    },
    async ({ name }) => {
      try {
        const data = await api.createBoard(name);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerPrompt(
    'update_board_from_requirements',
    {
      title: 'Update board from requirements',
      description:
        'Workflow: read ТЗ → update Living Canvas board → propose repository structure.',
      argsSchema: {
        board_id: z.string().describe('Target board UUID'),
        requirements: z.string().describe('Product/tech requirements text (ТЗ)'),
      },
    },
    async ({ board_id, requirements }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Ты работаешь с Living Canvas MCP.

Задача:
1. Вызови export_architecture для board_id=${board_id} (если board пустой — начни с нуля).
2. По ТЗ ниже обнови схему: upsert_entity / upsert_connection (не выдумывай лишних сервисов).
3. Снова вызови export_architecture и кратко опиши итоговый граф.
4. Предложи структуру репозитория (папки/сервисы/модули), опираясь на nodes/edges.

ТЗ:
${requirements}`,
          },
        },
      ],
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('[living-canvas-mcp]', err);
  process.exit(1);
});
