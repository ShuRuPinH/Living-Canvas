import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../errors.js';
import { boardsRepo } from '../repositories/boards.js';
import type { BoardStateDocument, BoardSummary } from '../types.js';

const OBJECT_TYPES = [
  '',
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
] as const;

const CONNECTION_TYPES = [
  '',
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
] as const;

const boardStateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  updatedAt: z.string().optional(),
  elements: z.record(z.string(), z.unknown()).default({}),
  connections: z.record(z.string(), z.unknown()).default({}),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .default({ x: 200, y: 150, zoom: 1 }),
  globalDisplayMode: z.enum(['minimal', 'compact', 'detailed']).default('compact'),
  snapToGrid: z.boolean().default(true),
  showGrid: z.boolean().default(true),
});

const createBoardSchema = z.object({
  name: z.string().min(1).max(200).default('Untitled Canvas'),
  state: boardStateSchema.optional(),
});

const renameSchema = z.object({
  name: z.string().min(1).max(200),
});

const propertySchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(['text', 'number', 'status', 'date', 'link']).optional(),
});

const upsertEntitySchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  objectType: z.enum(OBJECT_TYPES).optional(),
  tags: z.array(z.string()).optional(),
  properties: z.array(propertySchema).optional(),
  frameId: z.string().nullable().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  type: z
    .enum([
      'text',
      'rectangle',
      'rounded-rectangle',
      'circle',
      'ellipse',
      'diamond',
      'sticky-note',
      'frame',
    ])
    .optional(),
});

const upsertConnectionSchema = z.object({
  id: z.string().min(1).optional(),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  label: z.string().max(200).optional(),
  connectionType: z.enum(CONNECTION_TYPES).optional(),
  description: z.string().max(5000).optional(),
  isBiDirectional: z.boolean().optional(),
  properties: z.array(propertySchema).optional(),
});

type EntityDoc = Record<string, unknown> & {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  type: string;
  tags: string[];
  style: Record<string, unknown>;
  properties: unknown[];
  notes: unknown[];
  comments: unknown[];
  attachments: unknown[];
  history: unknown[];
};

type ConnectionDoc = Record<string, unknown> & {
  id: string;
  sourceId: string;
  targetId: string;
  style: Record<string, unknown>;
  properties: unknown[];
  comments: unknown[];
};

function defaultStyleForType(objectType?: string): Record<string, unknown> {
  switch (objectType) {
    case 'Database':
      return {
        fillColor: '#ecfdf5',
        strokeColor: '#10b981',
        strokeWidth: 2,
        textColor: '#064e3b',
        fontSize: 14,
        fontWeight: 'bold',
        cornerRadius: 80,
        shadow: 'md',
      };
    case 'Microservice':
      return {
        fillColor: '#f0fdf4',
        strokeColor: '#22c55e',
        strokeWidth: 2,
        textColor: '#14532d',
        fontSize: 15,
        fontWeight: 'bold',
        cornerRadius: 12,
        shadow: 'md',
      };
    case 'Idea':
      return {
        stickyColor: '#fef08a',
        textColor: '#713f12',
        fontSize: 13,
        shadow: 'md',
      };
    default:
      return {
        fillColor: '#eff6ff',
        strokeColor: '#3b82f6',
        strokeWidth: 2,
        textColor: '#1e3a8a',
        fontSize: 15,
        fontWeight: 'bold',
        cornerRadius: 12,
        shadow: 'md',
      };
  }
}

function nextEntityPosition(board: BoardStateDocument): { x: number; y: number } {
  const count = Object.keys(board.elements).length;
  const col = count % 4;
  const row = Math.floor(count / 4);
  return { x: 80 + col * 240, y: 120 + row * 160 };
}

function normalizeProperties(
  props: z.infer<typeof propertySchema>[] | undefined,
  existing: unknown[]
): unknown[] {
  if (!props) return existing;
  return props.map((p, i) => ({
    id: p.id || `p-${i}-${randomUUID().slice(0, 8)}`,
    key: p.key,
    value: p.value,
    type: p.type || 'text',
  }));
}

/**
 * Board domain service — shared by HTTP routes and MCP tools.
 */
export const boardsService = {
  list(userId: string): BoardSummary[] {
    return boardsRepo.listByUser(userId).map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  get(userId: string, boardId: string): BoardStateDocument {
    const row = boardsRepo.findOwned(boardId, userId);
    if (!row) {
      throw new AppError(404, 'Board not found', 'BOARD_NOT_FOUND');
    }
    return boardsRepo.toDocument(row);
  },

  create(userId: string, input: unknown): BoardStateDocument {
    const data = createBoardSchema.parse(input ?? {});
    const row = boardsRepo.create({
      userId,
      name: data.name,
      state: data.state as BoardStateDocument | undefined,
    });
    return boardsRepo.toDocument(row);
  },

  save(userId: string, boardId: string, input: unknown): BoardStateDocument {
    const data = boardStateSchema.parse(input);
    const existing = boardsRepo.findOwned(boardId, userId);
    if (!existing) {
      throw new AppError(404, 'Board not found', 'BOARD_NOT_FOUND');
    }

    const state: BoardStateDocument = {
      ...(data as BoardStateDocument),
      id: boardId,
      name: data.name,
      updatedAt: new Date().toISOString(),
    };

    const row = boardsRepo.updateState(boardId, userId, state);
    if (!row) {
      throw new AppError(404, 'Board not found', 'BOARD_NOT_FOUND');
    }
    return boardsRepo.toDocument(row);
  },

  rename(userId: string, boardId: string, input: unknown): BoardSummary {
    const data = renameSchema.parse(input);
    const row = boardsRepo.rename(boardId, userId, data.name);
    if (!row) {
      throw new AppError(404, 'Board not found', 'BOARD_NOT_FOUND');
    }
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  remove(userId: string, boardId: string): void {
    const ok = boardsRepo.delete(boardId, userId);
    if (!ok) {
      throw new AppError(404, 'Board not found', 'BOARD_NOT_FOUND');
    }
  },

  upsertEntity(userId: string, boardId: string, input: unknown) {
    const data = upsertEntitySchema.parse(input);
    const board = this.get(userId, boardId);
    const id = data.id || `elem-${randomUUID()}`;
    const existing = board.elements[id] as EntityDoc | undefined;
    const pos = nextEntityPosition(board);
    const objectType = data.objectType ?? existing?.objectType ?? 'Generic';
    const shapeType =
      data.type ||
      existing?.type ||
      (objectType === 'Database'
        ? 'circle'
        : objectType === 'Idea'
          ? 'sticky-note'
          : 'rounded-rectangle');

    const entity: EntityDoc = {
      id,
      type: shapeType as string,
      x: data.x ?? existing?.x ?? pos.x,
      y: data.y ?? existing?.y ?? pos.y,
      width: data.width ?? existing?.width ?? (shapeType === 'circle' ? 150 : 180),
      height: data.height ?? existing?.height ?? (shapeType === 'circle' ? 150 : 110),
      zIndex: (existing?.zIndex as number) ?? 10,
      title: data.title,
      description: data.description ?? existing?.description ?? '',
      objectType,
      tags: data.tags ?? (existing?.tags as string[]) ?? [],
      frameId:
        data.frameId === undefined
          ? existing?.frameId
          : data.frameId === null
            ? undefined
            : data.frameId,
      style: (existing?.style as Record<string, unknown>) || defaultStyleForType(String(objectType)),
      properties: normalizeProperties(
        data.properties,
        (existing?.properties as unknown[]) || []
      ),
      notes: (existing?.notes as unknown[]) || [],
      comments: (existing?.comments as unknown[]) || [],
      attachments: (existing?.attachments as unknown[]) || [],
      history: [
        ...((existing?.history as unknown[]) || []),
        {
          id: `h-${randomUUID().slice(0, 8)}`,
          action: existing ? 'Updated' : 'Created',
          details: existing ? `Updated via API/MCP` : `Created via API/MCP`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        },
      ],
    };

    board.elements[id] = entity;
    const saved = this.save(userId, boardId, board);
    return { entity: saved.elements[id], boardId };
  },

  upsertConnection(userId: string, boardId: string, input: unknown) {
    const data = upsertConnectionSchema.parse(input);
    const board = this.get(userId, boardId);

    if (!board.elements[data.sourceId]) {
      throw new AppError(400, `Source entity not found: ${data.sourceId}`, 'SOURCE_MISSING');
    }
    if (!board.elements[data.targetId]) {
      throw new AppError(400, `Target entity not found: ${data.targetId}`, 'TARGET_MISSING');
    }

    const id = data.id || `conn-${randomUUID()}`;
    const existing = board.connections[id] as ConnectionDoc | undefined;

    const connection: ConnectionDoc = {
      id,
      sourceId: data.sourceId,
      targetId: data.targetId,
      sourceAnchor: existing?.sourceAnchor || 'auto',
      targetAnchor: existing?.targetAnchor || 'auto',
      label: data.label ?? existing?.label ?? '',
      connectionType: data.connectionType ?? existing?.connectionType ?? 'Dependency',
      description: data.description ?? existing?.description ?? '',
      isBiDirectional: data.isBiDirectional ?? existing?.isBiDirectional ?? false,
      style: (existing?.style as Record<string, unknown>) || {
        strokeColor: '#64748b',
        strokeWidth: 2,
        strokeStyle: 'solid',
        lineCurve: 'curved',
        textColor: '#334155',
      },
      properties: normalizeProperties(
        data.properties,
        (existing?.properties as unknown[]) || []
      ),
      comments: (existing?.comments as unknown[]) || [],
    };

    board.connections[id] = connection;
    const saved = this.save(userId, boardId, board);
    return { connection: saved.connections[id], boardId };
  },

  /**
   * Agent-friendly projection — strips viewport/style noise.
   */
  exportArchitecture(userId: string, boardId: string) {
    const board = this.get(userId, boardId);
    const nodes = Object.values(board.elements).map((raw) => {
      const el = raw as Record<string, unknown>;
      return {
        id: el.id,
        title: el.title,
        objectType: el.objectType ?? null,
        description: el.description ?? null,
        tags: el.tags ?? [],
        properties: el.properties ?? [],
        frameId: el.frameId ?? null,
      };
    });
    const edges = Object.values(board.connections).map((raw) => {
      const c = raw as Record<string, unknown>;
      return {
        id: c.id,
        sourceId: c.sourceId,
        targetId: c.targetId,
        label: c.label ?? null,
        connectionType: c.connectionType ?? null,
        description: c.description ?? null,
        properties: c.properties ?? [],
      };
    });
    return {
      boardId: board.id,
      name: board.name,
      updatedAt: board.updatedAt,
      nodes,
      edges,
    };
  },
};
