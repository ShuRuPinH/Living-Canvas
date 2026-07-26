export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
}

export interface BoardRecord {
  id: string;
  user_id: string;
  name: string;
  state_json: string;
  created_at: string;
  updated_at: string;
}

export interface BoardSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsRecord {
  user_id: string;
  settings_json: string;
  updated_at: string;
}

/** Shared board document shape (mirrors frontend CanvasBoardState). */
export interface BoardStateDocument {
  id: string;
  name: string;
  updatedAt: string;
  elements: Record<string, unknown>;
  connections: Record<string, unknown>;
  viewport: { x: number; y: number; zoom: number };
  globalDisplayMode: 'minimal' | 'compact' | 'detailed';
  snapToGrid: boolean;
  showGrid: boolean;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    createdAt: user.created_at,
  };
}

export function emptyBoardState(id: string, name: string): BoardStateDocument {
  const now = new Date().toISOString();
  return {
    id,
    name,
    updatedAt: now,
    elements: {},
    connections: {},
    viewport: { x: 200, y: 150, zoom: 1 },
    globalDisplayMode: 'compact',
    snapToGrid: true,
    showGrid: true,
  };
}
