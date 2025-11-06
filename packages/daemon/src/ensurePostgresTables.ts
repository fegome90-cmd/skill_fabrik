import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function ensurePostgresTables(pool: Pool): Promise<void> {
  const sqlPath = resolve(process.cwd(), 'db/migrations/001_init.sql');
  const sql = await readFile(sqlPath, 'utf8');
  await pool.query(sql);
}

