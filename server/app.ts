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

  // Reserved mount point for future MCP HTTP/SSE transport
  app.get('/api/mcp', (_req, res) => {
    res.status(501).json({
      error: 'MCP transport not implemented yet',
      code: 'MCP_PENDING',
      hint: 'Domain services (boards/auth) are ready to wrap as MCP tools',
    });
  });

  app.use(errorHandler);
  return app;
}
