import { randomUUID } from 'node:crypto';
import { all, get, run } from '../db/index.js';
import type { BoardRecord, BoardStateDocument } from '../types.js';
import { emptyBoardState } from '../types.js';

function parseState(row: BoardRecord): BoardStateDocument {
  const state = JSON.parse(row.state_json) as BoardStateDocument;
  return {
    ...state,
    id: row.id,
    name: row.name,
    updatedAt: row.updated_at,
  };
}

export const boardsRepo = {
  create(input: {
    userId: string;
    name: string;
    state?: BoardStateDocument;
  }): BoardRecord {
    const id = randomUUID();
    const now = new Date().toISOString();
    const state = input.state
      ? { ...input.state, id, name: input.name, updatedAt: now }
      : emptyBoardState(id, input.name);

    run(
      `INSERT INTO boards (id, user_id, name, state_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.userId, input.name, JSON.stringify(state), now, now]
    );

    const board = this.findById(id);
    if (!board) throw new Error('Failed to create board');
    return board;
  },

  findById(id: string): BoardRecord | undefined {
    return get<BoardRecord>(`SELECT * FROM boards WHERE id = ?`, [id]);
  },

  findOwned(id: string, userId: string): BoardRecord | undefined {
    return get<BoardRecord>(
      `SELECT * FROM boards WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  },

  listByUser(userId: string): BoardRecord[] {
    return all<BoardRecord>(
      `SELECT * FROM boards WHERE user_id = ? ORDER BY updated_at DESC`,
      [userId]
    );
  },

  updateState(
    id: string,
    userId: string,
    state: BoardStateDocument
  ): BoardRecord | undefined {
    const now = new Date().toISOString();
    const name = state.name || 'Untitled Canvas';
    const nextState = { ...state, id, name, updatedAt: now };
    run(
      `UPDATE boards
       SET name = ?, state_json = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [name, JSON.stringify(nextState), now, id, userId]
    );
    return this.findOwned(id, userId);
  },

  rename(id: string, userId: string, name: string): BoardRecord | undefined {
    const now = new Date().toISOString();
    const existing = this.findOwned(id, userId);
    if (!existing) return undefined;
    const state = parseState(existing);
    state.name = name;
    state.updatedAt = now;
    run(
      `UPDATE boards
       SET name = ?, state_json = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [name, JSON.stringify(state), now, id, userId]
    );
    return this.findOwned(id, userId);
  },

  delete(id: string, userId: string): boolean {
    const existing = this.findOwned(id, userId);
    if (!existing) return false;
    run(`DELETE FROM boards WHERE id = ? AND user_id = ?`, [id, userId]);
    return true;
  },

  toDocument(row: BoardRecord): BoardStateDocument {
    return parseState(row);
  },
};
