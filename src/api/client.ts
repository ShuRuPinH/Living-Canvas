const TOKEN_KEY = 'living_canvas_auth_token';
const USER_KEY = 'living_canvas_auth_user';

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type AuthResponse = {
  user: ApiUser;
  token: string;
  expiresAt: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): ApiUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function storeAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, { ...options, headers });
  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error || res.statusText,
      res.status,
      (data as { code?: string }).code
    );
  }
  return data as T;
}

export const authApi = {
  register(body: {
    email: string;
    password: string;
    displayName?: string;
  }) {
    return apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  login(body: { email: string; password: string }) {
    return apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async logout() {
    try {
      await apiFetch<void>('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuth();
    }
  },

  me() {
    return apiFetch<{ user: ApiUser }>('/api/auth/me');
  },
};

export const boardsApi = {
  list() {
    return apiFetch<{
      boards: { id: string; name: string; createdAt: string; updatedAt: string }[];
    }>('/api/boards');
  },

  get(boardId: string) {
    return apiFetch<{ board: unknown }>(`/api/boards/${boardId}`);
  },

  save(boardId: string, board: unknown) {
    return apiFetch<{ board: unknown }>(`/api/boards/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(board),
    });
  },

  create(name: string) {
    return apiFetch<{ board: unknown }>('/api/boards', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
};

export const usersApi = {
  getProfile() {
    return apiFetch<{
      user: ApiUser;
      settings: Record<string, unknown>;
    }>('/api/users/me');
  },

  updateProfile(body: {
    displayName?: string;
    settings?: Record<string, unknown>;
  }) {
    return apiFetch<{
      user: ApiUser;
      settings: Record<string, unknown>;
    }>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
