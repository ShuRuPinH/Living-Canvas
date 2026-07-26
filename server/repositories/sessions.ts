import { createHash, randomUUID } from 'node:crypto';
import { get, run } from '../db/index.js';
import type { SessionRecord } from '../types.js';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const sessionsRepo = {
  create(input: {
    id?: string;
    userId: string;
    token: string;
    expiresAt: string;
  }): SessionRecord {
    const id = input.id ?? randomUUID();
    const createdAt = new Date().toISOString();
    const tokenHash = hashToken(input.token);
    run(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, NULL)`,
      [id, input.userId, tokenHash, input.expiresAt, createdAt]
    );
    const session = this.findById(id);
    if (!session) throw new Error('Failed to create session');
    return session;
  },

  findById(id: string): SessionRecord | undefined {
    return get<SessionRecord>(`SELECT * FROM sessions WHERE id = ?`, [id]);
  },

  findValidByToken(token: string): SessionRecord | undefined {
    const tokenHash = hashToken(token);
    const now = new Date().toISOString();
    return get<SessionRecord>(
      `SELECT * FROM sessions
       WHERE token_hash = ?
         AND revoked_at IS NULL
         AND expires_at > ?`,
      [tokenHash, now]
    );
  },

  findValidById(id: string): SessionRecord | undefined {
    const now = new Date().toISOString();
    return get<SessionRecord>(
      `SELECT * FROM sessions
       WHERE id = ?
         AND revoked_at IS NULL
         AND expires_at > ?`,
      [id, now]
    );
  },

  revoke(id: string): void {
    const now = new Date().toISOString();
    run(`UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`, [
      now,
      id,
    ]);
  },

  revokeAllForUser(userId: string): void {
    const now = new Date().toISOString();
    run(
      `UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`,
      [now, userId]
    );
  },
};
