import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function requiredInProduction(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  if (process.env.NODE_ENV === 'production' && !process.env[name]) {
    console.warn(`[config] ${name} is not set; using insecure default`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  rootDir,
  dbPath: process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(rootDir, 'data', 'living-canvas.sqlite'),
  jwtSecret: requiredInProduction(
    'JWT_SECRET',
    'dev-only-living-canvas-secret-change-me'
  ),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
} as const;
