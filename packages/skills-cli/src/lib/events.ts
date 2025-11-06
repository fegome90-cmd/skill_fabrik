import { appendFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

export async function writeEvent(e: any): Promise<void> {
  const dir = resolve(process.cwd(), 'obs/kpi');
  await mkdir(dir, { recursive: true });
  await appendFile(join(dir, 'events.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...e }) + '\n');
}

