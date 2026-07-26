import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { boardsRouter } from './routes/boards.js';
import { usersRouter } from './routes/users.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'living-canvas-api',
      env: config.env,
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/boards', boardsRouter);

  // Stdio MCP lives in server/mcp/index.ts (Cursor). HTTP/SSE transport TBD.
  app.get('/api/mcp', (_req, res) => {
    res.json({
      ok: true,
      transport: 'stdio',
      entry: 'server/mcp/index.ts',
      tools: [
        'list_boards',
        'get_board',
        'upsert_entity',
        'upsert_connection',
        'export_architecture',
        'create_board',
      ],
      prompt: 'update_board_from_requirements',
      docs: 'docs/mcp.md',
    });
  });

  app.use(errorHandler);
  return app;
}
