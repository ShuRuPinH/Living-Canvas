import { randomUUID } from 'node:crypto';
import { all, get, run } from '../db/index.js';
import type { UserRecord } from '../types.js';

export const usersRepo = {
  create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): UserRecord {
    const now = new Date().toISOString();
    const id = randomUUID();
    run(
      `INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.email.toLowerCase(), input.passwordHash, input.displayName, now, now]
    );
    const user = this.findById(id);
    if (!user) throw new Error('Failed to create user');
    return user;
  },

  findById(id: string): UserRecord | undefined {
    return get<UserRecord>(`SELECT * FROM users WHERE id = ?`, [id]);
  },

  findByEmail(email: string): UserRecord | undefined {
    return get<UserRecord>(`SELECT * FROM users WHERE email = ?`, [
      email.toLowerCase(),
    ]);
  },

  updateDisplayName(id: string, displayName: string): UserRecord | undefined {
    const now = new Date().toISOString();
    run(`UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?`, [
      displayName,
      now,
      id,
    ]);
    return this.findById(id);
  },

  list(limit = 50): UserRecord[] {
    return all<UserRecord>(
      `SELECT * FROM users ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  },
};
