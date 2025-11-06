/**
 * MemTech configuration loader
 * Enhanced with validation based on ADR-063 and ADR-064 patterns
 */

export interface MemTechConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    url?: string;
  };
  redisCore: {
    host: string;
    port: number;
    password?: string;
    url?: string;
  };
  postgresql?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
  chroma?: {
    url?: string;
    apiKey?: string;
    tenant?: string;
    database?: string;
    collection?: string;
  };
  mcp?: {
    serverUrl?: string;
    enabled: boolean;
  };
  storage: {
    path: string;
  };
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

let config: MemTechConfig | null = null;

export function loadConfig(): MemTechConfig {
  if (config) {
    return config;
  }

  const redisHost = process.env.MEMTECH_REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.MEMTECH_REDIS_PORT || '6379', 10);
  const redisPassword = process.env.MEMTECH_REDIS_PASSWORD || undefined;
  const redisUrl = process.env.REDIS_URL_CACHE || process.env.REDIS_URL;

  const redisCoreHost = process.env.MEMTECH_REDIS_CORE_HOST || 'localhost';
  // Preferir 6379 por defecto (entorno local típico)
  const redisCorePort = parseInt(process.env.MEMTECH_REDIS_CORE_PORT || '6379', 10);
  const redisCorePassword = process.env.MEMTECH_REDIS_CORE_PASSWORD || redisPassword;
  const redisCoreUrl = process.env.REDIS_URL_CORE;

  // PostgreSQL configuration (optional)
  const pgHost = process.env.PG_HOST || 'localhost';
  const pgPort = parseInt(process.env.PG_PORT || '5433', 10);
  const pgUser = process.env.PG_USER || process.env.PGUSER || 'postgres';
  const pgPassword = process.env.PG_PASSWORD || process.env.PGPASSWORD;
  const pgDatabase = process.env.PG_DATABASE || process.env.PGDATABASE || 'surprise_metrics';

  // ChromaDB configuration (optional)
  const chromaUrl = process.env.CHROMA_URL || 'https://api.trychroma.com';
  const chromaApiKey = process.env.CHROMA_API_KEY;
  const chromaTenant = process.env.CHROMA_TENANT;
  const chromaDatabase = process.env.CHROMA_DATABASE || 'memtech';
  const chromaCollection = process.env.CHROMA_COLLECTION || 'memtech_memory';

  config = {
    redis: {
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      url: redisUrl || `redis://${redisHost}:${redisPort}`,
    },
    redisCore: {
      host: redisCoreHost,
      port: redisCorePort,
      password: redisCorePassword,
      url: redisCoreUrl || `redis://${redisCoreHost}:${redisCorePort}`,
    },
    postgresql: {
      host: pgHost,
      port: pgPort,
      user: pgUser,
      password: pgPassword,
      database: pgDatabase,
    },
    chroma: {
      url: chromaUrl,
      apiKey: chromaApiKey,
      tenant: chromaTenant,
      database: chromaDatabase,
      collection: chromaCollection,
    },
    mcp: {
      serverUrl: process.env.MEMTECH_MCP_SERVER_URL,
      enabled: Boolean(process.env.MEMTECH_MCP_ENABLED || process.env.MEMTECH_MCP_SERVER_URL),
    },
    storage: {
      path: process.env.MEMTECH_STORAGE_PATH || '.memtech/memory',
    },
  };

  return config;
}

export function getConfig(): MemTechConfig {
  return loadConfig();
}

/**
 * Validate configuration
 * Based on ADR-063: Script de Validación de Configuración MCP
 */
export function validateConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cfg = loadConfig();

  // Validate Redis Core (required for L1)
  if (!cfg.redisCore.url) {
    errors.push('REDIS_URL_CORE or MEMTECH_REDIS_CORE_HOST must be set');
  }

  if (cfg.redisCore.port < 1 || cfg.redisCore.port > 65535) {
    errors.push(`Invalid Redis Core port: ${cfg.redisCore.port} (must be 1-65535)`);
  }

  // Validate Redis (optional, for L0)
  if (cfg.redis.port < 1 || cfg.redis.port > 65535) {
    errors.push(`Invalid Redis port: ${cfg.redis.port} (must be 1-65535)`);
  }

  // Warnings
  if (!cfg.redisCore.password && process.env.NODE_ENV === 'production') {
    warnings.push('Redis Core password not set (not recommended for production)');
  }

  if (cfg.redisCore.port === 6379) {
    warnings.push('Redis Core using default port 6379 (consider using 6381 to avoid conflicts)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Reset config (for testing)
 */
export function resetConfig(): void {
  config = null;
}
