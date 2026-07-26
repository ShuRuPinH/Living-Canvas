/**
 * Thin HTTP client used by the MCP process.
 * Talks to the Living Canvas API so SQLite stays single-writer (the API server).
 */

export type ApiClientConfig = {
  baseUrl: string;
  token: string;
};

export class LivingCanvasApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'LivingCanvasApiError';
  }
}

export class LivingCanvasApi {
  constructor(private config: ApiClientConfig) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${this.config.token}`);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 204) return undefined as T;

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };

    if (!res.ok) {
      throw new LivingCanvasApiError(
        data.error || res.statusText,
        res.status,
        data.code
      );
    }
    return data as T;
  }

  listBoards() {
    return this.request<{
      boards: { id: string; name: string; createdAt: string; updatedAt: string }[];
    }>('/api/boards');
  }

  getBoard(boardId: string) {
    return this.request<{ board: unknown }>(`/api/boards/${boardId}`);
  }

  exportArchitecture(boardId: string) {
    return this.request<{ architecture: unknown }>(
      `/api/boards/${boardId}/architecture`
    );
  }

  upsertEntity(boardId: string, entity: Record<string, unknown>) {
    if (entity.id) {
      return this.request<{ entity: unknown; boardId: string }>(
        `/api/boards/${boardId}/entities/${entity.id}`,
        { method: 'PUT', body: JSON.stringify(entity) }
      );
    }
    return this.request<{ entity: unknown; boardId: string }>(
      `/api/boards/${boardId}/entities`,
      { method: 'POST', body: JSON.stringify(entity) }
    );
  }

  upsertConnection(boardId: string, connection: Record<string, unknown>) {
    if (connection.id) {
      return this.request<{ connection: unknown; boardId: string }>(
        `/api/boards/${boardId}/connections/${connection.id}`,
        { method: 'PUT', body: JSON.stringify(connection) }
      );
    }
    return this.request<{ connection: unknown; boardId: string }>(
      `/api/boards/${boardId}/connections`,
      { method: 'POST', body: JSON.stringify(connection) }
    );
  }

  createBoard(name: string) {
    return this.request<{ board: { id: string; name: string } }>('/api/boards', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
}

export async function resolveApiToken(baseUrl: string): Promise<string> {
  if (process.env.LIVING_CANVAS_TOKEN) {
    return process.env.LIVING_CANVAS_TOKEN;
  }

  const email = process.env.LIVING_CANVAS_EMAIL;
  const password = process.env.LIVING_CANVAS_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set LIVING_CANVAS_TOKEN or LIVING_CANVAS_EMAIL + LIVING_CANVAS_PASSWORD for MCP auth'
    );
  }

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as { token?: string; error?: string };
  if (!res.ok || !data.token) {
    throw new Error(data.error || 'MCP login failed');
  }
  return data.token;
}
