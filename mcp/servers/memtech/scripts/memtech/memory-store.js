import 'dotenv/config';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import {
  getRedisClient,
  getPgPool,
  ensureQdrantCollection,
  ensureChromaCollection,
} from './memory-integrations.js';
import { chroma } from '../../../../scripts/chroma-wrapper.mjs';

const logger = winston.createLogger({
  level: process?.env?.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

function contentToVector(content, dimensions = 8) {
  const hash = crypto
    .createHash('sha256')
    .update(content || '')
    .digest();
  const vector = [];
  for (let i = 0; i < dimensions; i++) {
    const offset = (i * 2) % hash.length;
    const value = hash.readUInt16BE(offset);
    vector.push(value / 65535);
  }
  return vector;
}

export function determineStorageLayer(meta = {}, content = '') {
  const sizeKb = Buffer.byteLength(content || '', 'utf8') / 1024;
  const access = Number(meta.access_frequency || meta.accessFrequency || 0);
  const ageDays = Number(meta.age_days || meta.ageDays || 0);
  const sensitivity = (meta.sensitivity || 'normal').toLowerCase();

  if (sensitivity === 'high' && sizeKb <= 256) {
    return 'L0';
  }

  if (access >= 0.7 && sizeKb <= 1024) {
    return 'L0';
  }

  if (access >= 0.4 && sizeKb <= 2048 && ageDays <= 7) {
    return 'L1';
  }

  if (sizeKb <= 10240 || ageDays <= 30) {
    return 'L2';
  }

  return 'L3';
}

export class MemoryStore {
  constructor(config = {}) {
    this.redisCachePrefix = config.redisCachePrefix || 'memtech:L0:';
    this.redisCorePrefix = config.redisCorePrefix || 'memtech:L1:';
    this.redisCacheTTL = config.redisCacheTTL || 3600; // 1 hora
    this.redisCoreTTL = config.redisCoreTTL || 86400; // 1 día
    this.qdrantCollection = config.qdrantCollection || 'memtech_memory';
    this.qdrantVectorSize = config.qdrantVectorSize || 8;
    this.chromaCollection =
      config.chromaCollection || process.env.CHROMA_COLLECTION || 'memtech_memory';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Asegurar tabla en PostgreSQL
    try {
      const pool = getPgPool();
      const client = await pool.connect();
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
      client.release();
    } catch (error) {
      logger.error('Error asegurando tabla memtech_memory_items:', error);
      throw error;
    }

    // Asegurar colección Qdrant si está configurada
    try {
      await ensureQdrantCollection();
    } catch (error) {
      logger.warn(`Qdrant no verificado: ${error.message}`);
    }

    this.initialized = true;
  }

  async storeItem({ layer, id, content, metadata }) {
    if (!layer) throw new Error('Layer requerida');
    if (!id) id = uuidv4();
    await this.initialize();

    const payload = {
      id,
      layer,
      title: metadata?.title || '',
      tags: metadata?.tags || [],
      metadata,
      content,
      stored_at: new Date().toISOString(),
    };

    switch (layer) {
      case 'L0':
        return await this.storeInRedis(
          'cache',
          id,
          payload,
          this.redisCachePrefix,
          this.redisCacheTTL
        );
      case 'L1':
        return await this.storeInRedis(
          'core',
          id,
          payload,
          this.redisCorePrefix,
          this.redisCoreTTL
        );
      case 'L2':
        return await this.storeInPostgres(id, payload, metadata);
      case 'L3':
        try {
          return await this.storeInQdrant(id, payload, content);
        } catch (error) {
          logger.warn(`Fallo almacenando en L3/Qdrant, degradando a L2: ${error.message}`);
          return await this.storeInPostgres(id, payload, metadata);
        }
      default:
        throw new Error(`Layer no soportada: ${layer}`);
    }
  }

  async fetchItem(storageRef = {}) {
    if (!storageRef?.backend) {
      throw new Error('Referencia de almacenamiento inválida');
    }
    await this.initialize();

    switch (storageRef.backend) {
      case 'redis-cache':
      case 'redis-core':
        return await this.fetchFromRedis(storageRef);
      case 'postgresql':
        return await this.fetchFromPostgres(storageRef);
      case 'qdrant':
        return await this.fetchFromQdrant(storageRef);
      default:
        throw new Error(`Backend no soportado: ${storageRef.backend}`);
    }
  }

  async storeInRedis(type, id, payload, prefix, ttlSeconds) {
    const client = await getRedisClient(type);
    const key = `${prefix}${id}`;
    await client.set(key, JSON.stringify(payload), { EX: ttlSeconds });
    return {
      backend: type === 'cache' ? 'redis-cache' : 'redis-core',
      key,
      ttl: ttlSeconds,
      stored_at: new Date().toISOString(),
    };
  }

  async fetchFromRedis(storageRef) {
    const type = storageRef.backend === 'redis-cache' ? 'cache' : 'core';
    const client = await getRedisClient(type);
    const value = await client.get(storageRef.key);
    if (!value) {
      throw new Error(`Key ${storageRef.key} no encontrada en ${storageRef.backend}`);
    }
    return JSON.parse(value);
  }

  async storeInPostgres(id, payload, metadata) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO memtech_memory_items (id, layer, title, tags, payload, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id)
         DO UPDATE SET layer = EXCLUDED.layer, title = EXCLUDED.title,
           tags = EXCLUDED.tags, payload = EXCLUDED.payload, updated_at = NOW()`,
        [id, payload.layer, payload.title, payload.tags, payload]
      );
    } finally {
      client.release();
    }

    return {
      backend: 'postgresql',
      table: 'memtech_memory_items',
      id,
      stored_at: new Date().toISOString(),
    };
  }

  async fetchFromPostgres(storageRef) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        'SELECT payload FROM memtech_memory_items WHERE id = $1',
        [storageRef.id]
      );
      if (!rows.length) {
        throw new Error(`Registro ${storageRef.id} no encontrado en PostgreSQL`);
      }
      return rows[0].payload;
    } finally {
      client.release();
    }
  }

  async storeInQdrant(id, payload, content) {
    const url = (process.env.QDRANT_URL || '').replace(/\/$/, '');
    if (!url) {
      throw new Error('Qdrant no configurado');
    }

    await ensureQdrantCollection();

    const headers = { 'Content-Type': 'application/json' };
    const apiKey = process.env.QDRANT_CLUSTER_TOKEN || process.env.QDRANT_API_KEY;
    if (apiKey) {
      headers['api-key'] = apiKey;
    }

    const vector = contentToVector(content || JSON.stringify(payload), this.qdrantVectorSize);

    const upsertResponse = await fetch(
      `${url}/collections/${this.qdrantCollection}/points?wait=true`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          points: [
            {
              id,
              vector,
              payload,
            },
          ],
        }),
      }
    );

    if (!upsertResponse.ok) {
      const text = await upsertResponse.text();
      throw new Error(`Error almacenando en Qdrant: ${text}`);
    }

    return {
      backend: 'qdrant',
      collection: this.qdrantCollection,
      id,
      stored_at: new Date().toISOString(),
    };
  }

  async fetchFromQdrant(storageRef) {
    const url = (process.env.QDRANT_URL || '').replace(/\/$/, '');
    if (!url) {
      throw new Error('Qdrant no configurado');
    }

    const headers = { 'Content-Type': 'application/json' };
    const apiKey = process.env.QDRANT_CLUSTER_TOKEN || process.env.QDRANT_API_KEY;
    if (apiKey) {
      headers['api-key'] = apiKey;
    }

    const response = await fetch(`${url}/collections/${storageRef.collection}/points`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ids: [storageRef.id],
        with_payload: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Error leyendo de Qdrant: ${text}`);
    }

    const data = await response.json();
    const point = data?.result?.points?.[0];
    if (!point) {
      throw new Error(`Punto ${storageRef.id} no encontrado en Qdrant`);
    }

    return point.payload;
  }

  async storeInChroma(id, payload, content) {
    // Check if collection exists
    const collectionCheck = await chroma.getCollection(this.chromaCollection);

    // If collection doesn't exist, create it
    if (
      !collectionCheck.success &&
      collectionCheck.error &&
      (collectionCheck.error.includes('does not exist') ||
        collectionCheck.error.includes('not found'))
    ) {
      await chroma.createCollection(this.chromaCollection, {
        description: 'MemTech L3 long-term memory storage',
        metadata: {
          type: 'memory',
          layer: 'L3',
          source: 'memtech-agent',
        },
      });
    }

    // Prepare document and metadata
    const document = content || JSON.stringify(payload);
    const metadata = {
      ...payload,
      stored_at: new Date().toISOString(),
      content_length: document.length,
      layer: 'L3',
    };

    // Store in ChromaDB
    await chroma.addDocuments(this.chromaCollection, [id], [document], [metadata]);

    return {
      backend: 'chroma',
      collection: this.chromaCollection,
      id,
      stored_at: metadata.stored_at,
    };
  }

  async fetchFromChroma(storageRef) {
    const collectionName = storageRef.collection || this.chromaCollection;

    // First verify collection exists
    try {
      await chroma.getCollection(collectionName);
    } catch (error) {
      throw new Error(`Colección ${collectionName} no existe`);
    }

    // Use peek to get documents (ChromaDB doesn't support direct ID lookup)
    // Note: ChromaDB free tier has a limit of 300 documents per peek
    const result = await chroma.peek(collectionName, 300);

    if (!result || !result.ids) {
      throw new Error(`Error al obtener documentos de la colección ${collectionName}`);
    }

    // ChromaDB returns ids as flat array: [id1, id2, ...]
    const ids = Array.isArray(result.ids) ? result.ids : [];
    const metadatas = Array.isArray(result.metadatas) ? result.metadatas : [];

    if (ids.length === 0) {
      throw new Error(`Documento ${storageRef.id} no encontrado en ChromaDB (collection empty)`);
    }

    // Find the document by ID
    const index = ids.indexOf(storageRef.id);

    if (index === -1) {
      throw new Error(
        `Documento ${storageRef.id} no encontrado en ChromaDB (found ${ids.length} documents but not this ID)`
      );
    }

    // Return the metadata for this document
    if (metadatas && metadatas[index]) {
      return metadatas[index];
    }

    throw new Error(`Metadatos no encontrados para documento ${storageRef.id}`);
  }
}

export default MemoryStore;
