/**
 * Database clients for Redis, PostgreSQL, and ChromaDB
 * Based on ADR patterns from startkit-main
 */

import { createClient, RedisClientType } from 'redis';
import { Pool, Client } from 'pg';
import { getConfig, type MemTechConfig } from './config.js';

// Redis clients
let redisCacheClient: RedisClientType | null = null;
let redisCoreClient: RedisClientType | null = null;

// PostgreSQL pool
let pgPool: Pool | null = null;

/**
 * Get Redis client (cache or core)
 * Based on ADR-012 Redis optimization patterns
 */
export async function getRedisClient(name: 'cache' | 'core'): Promise<RedisClientType> {
  try {
    if (name === 'cache') {
      if (!redisCacheClient) {
        const config = getConfig().redis;
        redisCacheClient = createClient({
          url: config.url,
          password: config.password,
          socket: {
            reconnectStrategy: (retries: number) => {
              if (retries > 10) {
                return new Error('Max reconnection attempts reached');
              }
              return Math.min(retries * 100, 3000);
            },
            connectTimeout: 5000,
          },
        });

        redisCacheClient.on('error', (err: Error) => {
          console.error('[Redis Cache] error:', err.message);
        });

        if (!redisCacheClient.isOpen) {
          await redisCacheClient.connect();
        }
      }
      return redisCacheClient;
    }

    if (name === 'core') {
      if (!redisCoreClient) {
        const config = getConfig().redisCore;
        redisCoreClient = createClient({
          url: config.url,
          password: config.password,
          socket: {
            reconnectStrategy: (retries: number) => {
              if (retries > 10) {
                return new Error('Max reconnection attempts reached');
              }
              return Math.min(retries * 100, 3000);
            },
            connectTimeout: 5000,
          },
        });

        redisCoreClient.on('error', (err: Error) => {
          console.error('[Redis Core] error:', err.message);
        });

        if (!redisCoreClient.isOpen) {
          await redisCoreClient.connect();
        }
      }
      return redisCoreClient;
    }

    throw new Error(`Unknown redis client: ${name}`);
  } catch (error) {
    throw new Error(`Redis ${name} unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get PostgreSQL connection pool
 * Based on ADR-019 PostgreSQL patterns
 */
export function getPgPool(): Pool {
  const config = getConfig();
  
  if (!pgPool) {
    const pgConfig = {
      host: process.env.PG_HOST || config.redisCore.host || 'localhost',
      port: parseInt(process.env.PG_PORT || '5433', 10),
      user: process.env.PG_USER || process.env.PGUSER || 'postgres',
      password: process.env.PG_PASSWORD || process.env.PGPASSWORD || undefined,
      database: process.env.PG_DATABASE || process.env.PGDATABASE || 'surprise_metrics',
      max: 5,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    };

    pgPool = new Pool(pgConfig);

    // Error handling
    pgPool.on('error', (err: Error) => {
      console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
    });
  }

  return pgPool;
}

/**
 * Ensure PostgreSQL tables exist
 * Based on ADR-014 patterns
 */
export async function ensurePostgresTables(): Promise<void> {
  const pool = getPgPool();
  const client = await pool.connect();
  
  try {
    // Create memtech_memory_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS memtech_memory_items (
        id TEXT PRIMARY KEY,
        layer TEXT NOT NULL,
        title TEXT,
        tags TEXT[],
        payload JSONB,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create heartbeat table
    await client.query(`
      CREATE TABLE IF NOT EXISTS memtech_heartbeat (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        heartbeat_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_memtech_memory_items_layer 
      ON memtech_memory_items(layer)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_memtech_memory_items_updated_at 
      ON memtech_memory_items(updated_at)
    `);
  } finally {
    client.release();
  }
}

/**
 * Load ChromaDB wrapper dynamically
 * Based on ADR-090 and ADR-091 patterns
 */
async function loadChromaWrapper(): Promise<{ chroma: any } | null> {
  try {
    // Try to load chroma-wrapper from project root
    // Use file:// protocol for proper URL resolution
    const { fileURLToPath } = await import('url');
    const { resolve, dirname } = await import('path');
    
    // Get current file's directory
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = dirname(currentFile);
    
    // Resolve to project root scripts/chroma-wrapper.mjs
    const wrapperPath = resolve(currentDir, '../../../../scripts/chroma-wrapper.mjs');
    
    // Use file:// URL for import
    const wrapperUrl = new URL(`file://${wrapperPath}`);
    const wrapper = await import(wrapperUrl.href);
    
    return wrapper;
  } catch (error) {
    // Wrapper not available
    return null;
  }
}

/**
 * Get ChromaDB wrapper (hybrid Python+Node.js)
 * Based on ADR-090 and ADR-091 patterns
 */
export async function getChromaWrapper(): Promise<{
  heartbeat: () => Promise<{ success: boolean; error?: string }>;
  getCollection: (name: string) => Promise<{ success: boolean; error?: string }>;
  createCollection: (name: string, options?: { description?: string; metadata?: Record<string, unknown> }) => Promise<{ success: boolean; error?: string }>;
  addDocuments: (collection: string, ids: string[], documents: string[], metadatas: Array<Record<string, unknown>>) => Promise<{ success: boolean; error?: string }>;
  query: (collection: string, queryText: string, options?: { nResults?: number }) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  count: (collection: string) => Promise<{ success: boolean; data?: { count: number }; error?: string }>;
  peek: (collection: string, limit?: number) => Promise<{ success: boolean; ids?: string[]; metadatas?: Array<Record<string, unknown>>; error?: string }>;
}> {
  // ChromaDB configuration
  const chromaApiKey = process.env.CHROMA_API_KEY || process.env.CHROMA_API?.replace('chroma login --api-key ', '');

  // Try to load chroma-wrapper if available
  const chromaModule = await loadChromaWrapper();
  
  if (chromaModule && chromaModule.chroma) {
    const chroma = chromaModule.chroma;
    
    // Return wrapper with actual implementation
    return {
      heartbeat: async () => {
        try {
          const result = await chroma.heartbeat();
          return { success: result.success !== false, error: result.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      },
      getCollection: async (name: string) => {
        try {
          const result = await chroma.getCollection(name);
          return { success: result.success !== false, error: result.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      },
      createCollection: async (name: string, options?: { description?: string; metadata?: Record<string, unknown> }) => {
        try {
          const result = await chroma.createCollection(name, options?.metadata || {});
          return { success: result.success !== false, error: result.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      },
      addDocuments: async (collection: string, ids: string[], documents: string[], metadatas: Array<Record<string, unknown>>) => {
        try {
          const result = await chroma.addDocuments(collection, ids, documents, metadatas);
          return { success: result.success !== false, error: result.error };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      },
      query: async (collection: string, queryText: string, options?: { nResults?: number }) => {
        try {
          const result = await chroma.query(collection, queryText, options);
          return { success: result !== null, data: result, error: result === null ? 'Query returned no results' : undefined };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      },
      count: async (collection: string) => {
        try {
          const count = await chroma.count(collection);
          return { success: true, data: { count } };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      },
      peek: async (collection: string, limit?: number) => {
        try {
          const result = await chroma.peek(collection, limit || 5);
          return { 
            success: result !== null, 
            ids: result?.ids || [], 
            metadatas: result?.metadatas || [],
            error: result === null ? 'Peek returned no results' : undefined 
          };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      },
    };
  }
  
  // Fallback: return placeholder if wrapper not available
  if (!chromaApiKey) {
    return {
      heartbeat: async () => {
        return { success: false, error: 'CHROMA_API_KEY not configured in .env' };
      },
      getCollection: async (name: string) => {
        return { success: false, error: 'CHROMA_API_KEY not configured' };
      },
      createCollection: async (name: string, options?: { description?: string; metadata?: Record<string, unknown> }) => {
        return { success: false, error: 'CHROMA_API_KEY not configured' };
      },
      addDocuments: async (collection: string, ids: string[], documents: string[], metadatas: Array<Record<string, unknown>>) => {
        return { success: false, error: 'CHROMA_API_KEY not configured' };
      },
      query: async (collection: string, queryText: string, options?: { nResults?: number }) => {
        return { success: false, error: 'CHROMA_API_KEY not configured' };
      },
      count: async (collection: string) => {
        return { success: false, error: 'CHROMA_API_KEY not configured' };
      },
      peek: async (collection: string, limit?: number) => {
        return { success: false, error: 'CHROMA_API_KEY not configured' };
      },
    };
  }
  
  // API key configured but wrapper not found
  return {
    heartbeat: async () => {
      return { success: false, error: 'chroma-wrapper.mjs not found. Ensure scripts/chroma-wrapper.mjs exists in project root.' };
    },
    getCollection: async (name: string) => {
      return { success: false, error: 'chroma-wrapper.mjs not found' };
    },
    createCollection: async (name: string, options?: { description?: string; metadata?: Record<string, unknown> }) => {
      return { success: false, error: 'chroma-wrapper.mjs not found' };
    },
    addDocuments: async (collection: string, ids: string[], documents: string[], metadatas: Array<Record<string, unknown>>) => {
      return { success: false, error: 'chroma-wrapper.mjs not found' };
    },
    query: async (collection: string, queryText: string, options?: { nResults?: number }) => {
      return { success: false, error: 'chroma-wrapper.mjs not found' };
    },
    count: async (collection: string) => {
      return { success: false, error: 'chroma-wrapper.mjs not found' };
    },
    peek: async (collection: string, limit?: number) => {
      return { success: false, error: 'chroma-wrapper.mjs not found' };
    },
  };
}

/**
 * Test all database connections
 * Based on ADR-019 health check patterns
 */
export async function testAllConnections(): Promise<{
  redisCache: { connected: boolean; latency?: number; error?: string };
  redisCore: { connected: boolean; latency?: number; error?: string };
  postgresql: { connected: boolean; error?: string };
  chroma: { connected: boolean; error?: string };
}> {
  const results: {
    redisCache: { connected: boolean; latency?: number; error?: string };
    redisCore: { connected: boolean; latency?: number; error?: string };
    postgresql: { connected: boolean; error?: string };
    chroma: { connected: boolean; error?: string };
  } = {
    redisCache: { connected: false },
    redisCore: { connected: false },
    postgresql: { connected: false },
    chroma: { connected: false },
  };

  // Test Redis Cache
  try {
    const start = Date.now();
    const client = await getRedisClient('cache');
    await client.ping();
    results.redisCache = { connected: true, latency: Date.now() - start };
  } catch (error) {
    results.redisCache = {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test Redis Core
  try {
    const start = Date.now();
    const client = await getRedisClient('core');
    await client.ping();
    results.redisCore = { connected: true, latency: Date.now() - start };
  } catch (error) {
    results.redisCore = {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test PostgreSQL
  try {
    const pool = getPgPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    results.postgresql = { connected: true };
  } catch (error) {
    results.postgresql = {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test ChromaDB (may be disabled in legacy mode)
  try {
    const chroma = await getChromaWrapper();
    const result = await chroma.heartbeat();
    results.chroma = {
      connected: result.success || false,
      error: result.success ? undefined : result.error,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    // Check if L3 is disabled in legacy mode
    const isLegacyDisabled = errorMsg.includes('CloudClient') || 
                             errorMsg.includes('does not support') ||
                             errorMsg.includes('legacy') ||
                             errorMsg.includes('L3 storage is disabled');
    results.chroma = {
      connected: false,
      error: isLegacyDisabled 
        ? 'L3 (ChromaDB) disabled in legacy mode (ChromaDB 0.3.x + Pydantic 1.x). Use L0/L1/L2 instead.'
        : errorMsg,
    };
  }

  return results;
}

/**
 * Close all database connections
 */
export async function closeAllConnections(): Promise<void> {
  // Close Redis clients
  if (redisCacheClient && redisCacheClient.isOpen) {
    await redisCacheClient.quit();
    redisCacheClient = null;
  }

  if (redisCoreClient && redisCoreClient.isOpen) {
    await redisCoreClient.quit();
    redisCoreClient = null;
  }

  // Close PostgreSQL pool
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}
