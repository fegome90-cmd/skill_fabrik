/**
 * MemTech Memory Integrations
 *
 * Funciones de consumo activo para Redis (cache/core), PostgreSQL, Qdrant y ChromaDB.
 * Permite que el agente MemTech genere lecturas/escrituras periódicas,
 * asegurando que el propio sistema sea el primer consumidor del stack de memoria.
 */

import 'dotenv/config';
import { createClient } from 'redis';
import { Pool } from 'pg';
import crypto from 'crypto';
import { chroma } from '../../../../scripts/chroma-wrapper.mjs';

const redisCacheUrl = process.env.REDIS_URL_CACHE || 'redis://127.0.0.1:6379';
const redisCoreUrl = process.env.REDIS_URL_CORE || 'redis://127.0.0.1:6381';

const pgConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5433', 10),
  user: process.env.PG_USER || 'felipe',
  password: process.env.PG_PASSWORD || 'surprise',
  database: process.env.PG_DATABASE || 'surprise_metrics',
  max: 5,
  idleTimeoutMillis: 5000,
};

const qdrantUrl = (process.env.QDRANT_URL || '').replace(/\/$/, '');
const qdrantApiKey = process.env.QDRANT_CLUSTER_TOKEN || process.env.QDRANT_API_KEY || '';
const qdrantCollection = process.env.MEMTECH_QDRANT_HEARTBEAT_COLLECTION || 'memtech_heartbeat';
const qdrantVectorSize = parseInt(process.env.MEMTECH_QDRANT_HEARTBEAT_DIM || '4', 10);

// ChromaDB Configuration
const chromaCollection = process.env.MEMTECH_CHROMA_HEARTBEAT_COLLECTION || 'memtech_heartbeat';

let redisCacheClient;
let redisCoreClient;
let pgPool;

export async function getRedisClient(name) {
  try {
    if (name === 'cache') {
      if (!redisCacheClient) {
        redisCacheClient = createClient({ url: redisCacheUrl });
        redisCacheClient.on('error', err => console.error('[Redis Cache] error:', err));
        await redisCacheClient.connect();
      }
      return redisCacheClient;
    }
    if (name === 'core') {
      if (!redisCoreClient) {
        redisCoreClient = createClient({ url: redisCoreUrl });
        redisCoreClient.on('error', err => console.error('[Redis Core] error:', err));
        await redisCoreClient.connect();
      }
      return redisCoreClient;
    }
    throw new Error(`Unknown redis client: ${name}`);
  } catch (error) {
    throw new Error(`Redis ${name} unavailable: ${error.message}`);
  }
}

export function getPgPool() {
  if (!pgPool) {
    pgPool = new Pool(pgConfig);
  }
  return pgPool;
}

export async function ensureQdrantCollection() {
  if (!qdrantUrl) {
    throw new Error('QDRANT_URL no configurada');
  }

  const headers = {
    'Content-Type': 'application/json',
  };
  if (qdrantApiKey) {
    headers['api-key'] = qdrantApiKey;
  }

  const collectionEndpoint = `${qdrantUrl}/collections/${qdrantCollection}`;
  const response = await fetch(collectionEndpoint, { headers });

  if (response.status === 404) {
    const createResponse = await fetch(collectionEndpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        vectors: {
          size: qdrantVectorSize,
          distance: 'Cosine',
        },
      }),
    });

    if (!createResponse.ok) {
      const text = await createResponse.text();
      throw new Error(`No se pudo crear la colección heartbeat en Qdrant: ${text}`);
    }
  } else if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error verificando colección Qdrant: ${text}`);
  }
}

export async function heartbeatRedisCache() {
  const client = await getRedisClient('cache');
  const key = 'memtech:heartbeat:cache';
  const payload = {
    ts: new Date().toISOString(),
    source: 'memtech-agent',
    nonce: crypto.randomUUID(),
  };

  await client.set(key, JSON.stringify(payload), { EX: 120 });
  const stored = await client.get(key);

  return {
    target: 'redis-cache',
    key,
    payload: stored ? JSON.parse(stored) : null,
  };
}

export async function heartbeatRedisCore() {
  const client = await getRedisClient('core');
  const key = 'memtech:heartbeat:core';
  const payload = {
    ts: new Date().toISOString(),
    source: 'memtech-agent',
    nonce: crypto.randomUUID(),
  };

  await client.set(key, JSON.stringify(payload), { EX: 300 });
  const stored = await client.get(key);

  return {
    target: 'redis-core',
    key,
    payload: stored ? JSON.parse(stored) : null,
  };
}

export async function heartbeatPostgres() {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS memtech_heartbeat (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        heartbeat_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query('INSERT INTO memtech_heartbeat (source) VALUES ($1)', ['memtech-agent']);

    const { rows } = await client.query(`
      SELECT heartbeat_at
      FROM memtech_heartbeat
      ORDER BY heartbeat_at DESC
      LIMIT 5
    `);

    return {
      target: 'postgresql',
      table: 'memtech_heartbeat',
      recent: rows.map(row => row.heartbeat_at),
    };
  } catch (error) {
    throw new Error(`PostgreSQL heartbeat falló: ${error.message}`);
  } finally {
    client.release();
  }
}

export async function heartbeatQdrant() {
  if (!qdrantUrl) {
    throw new Error('Qdrant no configurado (faltan QDRANT_URL / QDRANT_API_KEY)');
  }

  await ensureQdrantCollection();

  const headers = {
    'Content-Type': 'application/json',
  };
  if (qdrantApiKey) {
    headers['api-key'] = qdrantApiKey;
  }

  const pointId = Date.now();
  const vector = Array.from({ length: qdrantVectorSize }, () => Math.random());
  const payload = {
    ts: new Date().toISOString(),
    source: 'memtech-agent',
    nonce: crypto.randomUUID(),
  };

  const upsertResponse = await fetch(
    `${qdrantUrl}/collections/${qdrantCollection}/points?wait=true`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        points: [
          {
            id: pointId,
            vector,
            payload,
          },
        ],
      }),
    }
  );

  if (!upsertResponse.ok) {
    const text = await upsertResponse.text();
    throw new Error(`Error upsert Qdrant heartbeat: ${text}`);
  }

  const retrieveResponse = await fetch(`${qdrantUrl}/collections/${qdrantCollection}/points`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ids: [pointId],
      with_payload: true,
    }),
  });

  if (!retrieveResponse.ok) {
    const text = await retrieveResponse.text();
    throw new Error(`Error recuperando heartbeat de Qdrant: ${text}`);
  }

  const data = await retrieveResponse.json();
  const point = data?.result?.points?.[0] || {};

  return {
    target: 'qdrant',
    collection: qdrantCollection,
    payload: point.payload || null,
  };
}

/**
 * Ensure ChromaDB collection exists
 * Creates the collection if it doesn't exist
 */
export async function ensureChromaCollection() {
  try {
    // Try to get existing collection
    await chroma.getCollection(chromaCollection);
  } catch (error) {
    // If collection doesn't exist, create it
    if (error.message && error.message.includes('not found')) {
      await chroma.createCollection(chromaCollection, {
        description: 'MemTech heartbeat collection for L3 monitoring',
        metadata: {
          type: 'heartbeat',
          source: 'memtech-agent',
          layer: 'L3',
        },
      });
    } else {
      throw error;
    }
  }
}

/**
 * ChromaDB heartbeat - generates read/write activity in ChromaDB
 * Ensures L3 (long-term memory) is actively consumed
 */
export async function heartbeatChroma() {
  await ensureChromaCollection();

  const pointId = `heartbeat-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();

  const document = JSON.stringify({
    ts: timestamp,
    source: 'memtech-agent',
    nonce: nonce,
    layer: 'L3',
    type: 'heartbeat',
  });

  const metadata = {
    ts: timestamp,
    source: 'memtech-agent',
    nonce: nonce,
    layer: 'L3',
  };

  // Store heartbeat document
  await chroma.addDocuments(chromaCollection, [pointId], [document], [metadata]);

  // Verify by counting documents
  const countResult = await chroma.count(chromaCollection);

  return {
    target: 'chroma',
    collection: chromaCollection,
    pointsCount: countResult.data?.count || 0,
    timestamp: timestamp,
    pointId: pointId,
  };
}

export async function heartbeatAll() {
  const results = {};
  const errors = {};

  try {
    results.redisCache = await heartbeatRedisCache();
  } catch (error) {
    errors.redisCache = error.message;
  }

  try {
    results.redisCore = await heartbeatRedisCore();
  } catch (error) {
    errors.redisCore = error.message;
  }

  try {
    results.postgresql = await heartbeatPostgres();
  } catch (error) {
    errors.postgresql = error.message;
  }

  if (qdrantUrl) {
    try {
      results.qdrant = await heartbeatQdrant();
    } catch (error) {
      errors.qdrant = error.message;
    }
  } else {
    errors.qdrant = 'Qdrant no configurado';
  }

  // ChromaDB heartbeat
  try {
    results.chroma = await heartbeatChroma();
  } catch (error) {
    errors.chroma = error.message;
  }

  return {
    results,
    errors,
  };
}

export async function teardown() {
  if (redisCacheClient) {
    await redisCacheClient.quit();
    redisCacheClient = null;
  }
  if (redisCoreClient) {
    await redisCoreClient.quit();
    redisCoreClient = null;
  }
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}
