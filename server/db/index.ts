import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type SqlParams = SqlValue[] | Record<string, SqlValue>;

let db: Database | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persist();
  }, 50);
}

export function persist() {
  if (!db) return;
  const dir = path.dirname(config.dbPath);
  fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(config.dbPath, Buffer.from(data));
}

export async function initDb(): Promise<Database> {
  if (db) return db;

  const wasmPath = path.join(
    config.rootDir,
    'node_modules',
    'sql.js',
    'dist',
    'sql-wasm.wasm'
  );

  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });

  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.run(schema);
  persist();

  return db;
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function run(sql: string, params: SqlParams = []) {
  const database = getDb();
  database.run(sql, params as never);
  schedulePersist();
}

export function get<T extends object>(
  sql: string,
  params: SqlParams = []
): T | undefined {
  const database = getDb();
  const stmt = database.prepare(sql);
  try {
    stmt.bind(params as never);
    if (!stmt.step()) return undefined;
    return stmt.getAsObject() as T;
  } finally {
    stmt.free();
  }
}

export function all<T extends object>(
  sql: string,
  params: SqlParams = []
): T[] {
  const database = getDb();
  const stmt = database.prepare(sql);
  const rows: T[] = [];
  try {
    stmt.bind(params as never);
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
  } finally {
    stmt.free();
  }
  return rows;
}

export function closeDb() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (db) {
    persist();
    db.close();
    db = null;
  }
}
