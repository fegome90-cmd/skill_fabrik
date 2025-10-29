import fs from 'fs-extra';
import * as path from 'path';

const { appendFile, ensureDir } = fs;

export interface KPIEvent {
  timestamp: string;
  type: string;
  data: Record<string, unknown>;
}

export async function emitKPI(event: KPIEvent): Promise<void> {
  const kpiDir = path.join(process.cwd(), 'obs', 'kpi');
  const kpiFile = path.join(kpiDir, 'events.jsonl');

  // Ensure directory exists
  await ensureDir(kpiDir);

  // Append event as JSONL
  const line = JSON.stringify(event) + '\n';
  await appendFile(kpiFile, line);
}
