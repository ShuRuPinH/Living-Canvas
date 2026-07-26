/**
 * Domain service re-exports for in-process MCP / future SSE transport.
 * The stdio MCP entrypoint (`./index.ts`) uses the HTTP API client instead,
 * so the API process remains the single SQLite writer.
 */
export { authService } from '../services/auth.js';
export { boardsService } from '../services/boards.js';
export { usersService } from '../services/users.js';
