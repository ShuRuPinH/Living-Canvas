import { z } from 'zod';
import { AppError } from '../errors.js';
import { boardsRepo } from '../repositories/boards.js';
import type { BoardStateDocument, BoardSummary } from '../types.js';

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

/**
 * Board domain service — stable surface for HTTP routes and future MCP tools
 * (get_board, list_boards, upsert_board, export_architecture).
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

  /**
   * Agent-friendly projection for future MCP `export_architecture`.
   * Strips viewport/style noise; keeps knowledge graph shape.
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
