import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export interface DaemonConfig {
  server: {
    host: string;
    port: number;
  };
  cors: {
    origins: string[];
  };
}

const DEFAULTS: DaemonConfig = {
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  cors: {
    origins: [
      'http://localhost:5174',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
  },
};

function resolveDefaultConfigPaths(): string[] {
  const cwd = process.cwd();
  const here = dirname(fileURLToPath(import.meta.url));
  return [
    resolve(cwd, 'packages/daemon/config/default.yaml'),
    resolve(cwd, 'config/default.yaml'),
    resolve(here, '../../config/default.yaml'),
  ];
}

export async function loadDaemonConfig(): Promise<DaemonConfig> {
  // 1) Start with defaults
  const config: DaemonConfig = JSON.parse(JSON.stringify(DEFAULTS));

  // 2) Load YAML if present
  const hint = process.env.SF_CONFIG;
  const candidates = hint ? [resolve(process.cwd(), hint)] : resolveDefaultConfigPaths();
  for (const p of Array.isArray(candidates) ? candidates : [candidates]) {
    try {
      if (existsSync(p)) {
        const txt = await readFile(p, 'utf8');
        const fromYaml = YAML.parse(txt) || {};
        // Shallow merge (we only need server/cors for now)
        if (fromYaml.server) Object.assign(config.server, fromYaml.server);
        if (fromYaml.cors) Object.assign(config.cors, fromYaml.cors);
        break;
      }
    } catch {
      // ignore and continue
    }
  }

  // 3) ENV overrides
  if (process.env.SF_HOST) config.server.host = String(process.env.SF_HOST);
  if (process.env.SF_PORT) config.server.port = Number(process.env.SF_PORT);
  if (process.env.SF_CORS_ORIGINS) {
    config.cors.origins = String(process.env.SF_CORS_ORIGINS)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  return config;
}

