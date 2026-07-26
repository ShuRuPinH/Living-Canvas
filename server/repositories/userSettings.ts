import { get, run } from '../db/index.js';
import type { UserSettingsRecord } from '../types.js';

export const userSettingsRepo = {
  get(userId: string): Record<string, unknown> {
    const row = get<UserSettingsRecord>(
      `SELECT * FROM user_settings WHERE user_id = ?`,
      [userId]
    );
    if (!row) return {};
    try {
      return JSON.parse(row.settings_json) as Record<string, unknown>;
    } catch {
      return {};
    }
  },

  upsert(userId: string, settings: Record<string, unknown>): Record<string, unknown> {
    const now = new Date().toISOString();
    const existing = this.get(userId);
    const merged = { ...existing, ...settings };
    const json = JSON.stringify(merged);

    const row = get<UserSettingsRecord>(
      `SELECT * FROM user_settings WHERE user_id = ?`,
      [userId]
    );

    if (row) {
      run(
        `UPDATE user_settings SET settings_json = ?, updated_at = ? WHERE user_id = ?`,
        [json, now, userId]
      );
    } else {
      run(
        `INSERT INTO user_settings (user_id, settings_json, updated_at) VALUES (?, ?, ?)`,
        [userId, json, now]
      );
    }

    return merged;
  },
};
