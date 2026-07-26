import { createApp } from './app.js';
import { config } from './config.js';
import { closeDb, initDb } from './db/index.js';

async function main() {
  await initDb();
  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`[living-canvas] API listening on http://localhost:${config.port}`);
    console.log(`[living-canvas] SQLite: ${config.dbPath}`);
  });

  const shutdown = () => {
    console.log('[living-canvas] shutting down...');
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[living-canvas] failed to start', err);
  process.exit(1);
});
