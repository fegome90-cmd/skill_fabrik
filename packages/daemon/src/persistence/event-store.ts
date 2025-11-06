import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { PersistedEvent } from './event-types.js';

export interface EventStore {
  append(evt: PersistedEvent): Promise<void>;
  readLast(count: number, dayIso?: string): Promise<PersistedEvent[]>;
}

class FileEventStore implements EventStore {
  constructor(private baseDir: string) {}

  private filePath(): string {
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return resolve(this.baseDir, `events-${day}.jsonl`);
  }

  async append(evt: PersistedEvent): Promise<void> {
    const dir = this.baseDir;
    await mkdir(dir, { recursive: true });
    const line = JSON.stringify(evt) + '\n';
    await appendFile(this.filePath(), line, 'utf8');
  }

  async readLast(count: number, dayIso?: string): Promise<PersistedEvent[]> {
    const day = (dayIso || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const file = resolve(this.baseDir, `events-${day}.jsonl`);
    try {
      const txt = await readFile(file, 'utf8');
      const lines = txt.trim().split(/\n+/);
      const picked = lines.slice(-Math.max(0, count));
      return picked.map(l => JSON.parse(l) as PersistedEvent);
    } catch {
      return [];
    }
  }
}

export async function createEventStoreFromEnv(): Promise<EventStore | null> {
  if (process.env.SF_EVENT_STORE !== '1') return null;
  const dir = resolve(process.cwd(), 'obs', 'events');
  return new FileEventStore(dir);
}

export function createFileEventStore(dir: string): EventStore {
  return new FileEventStore(dir);
}
