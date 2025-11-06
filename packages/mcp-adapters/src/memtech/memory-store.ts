/**
 * MemoryStore - Multi-layer support (L1 Redis, L2 PostgreSQL, L3 ChromaDB)
 * Based on original MemTech from startkit-main
 */

import { v4 as uuidv4 } from 'uuid';
import type { StorageLayer, StorageReference, MemoryItemPayload, MemoryItemMetadata } from './types.js';
import { setL1Item, getL1Item } from './redis-client.js';
import { getPgPool } from './database-clients.js';
import { getChromaWrapper } from './database-clients.js';

export function determineStorageLayer(meta: Record<string, unknown> = {}, content = ''): StorageLayer {
  const sizeKb = Buffer.byteLength(content || '', 'utf8') / 1024;
  const access = Number(meta.access_frequency || meta.accessFrequency || 0);
  const ageDays = Number(meta.age_days || meta.ageDays || 0);
  const sensitivity = String(meta.sensitivity || 'normal').toLowerCase();
  const layerOverride = meta.layer as StorageLayer | undefined;

  // Respect explicit layer override
  if (layerOverride && ['L0', 'L1', 'L2', 'L3'].includes(layerOverride)) {
    return layerOverride;
  }

  // Force L1 for plan snapshots (working memory)
  if (meta.type === 'plan_snapshot') {
    return 'L1';
  }

  // L0: Hot cache (very frequent access, small size)
  if (sensitivity === 'high' && sizeKb <= 256) {
    return 'L0';
  }

  if (access >= 0.7 && sizeKb <= 1024) {
    return 'L0';
  }

  // L1: Working memory (frequent access, moderate size, recent)
  if (access >= 0.4 && sizeKb <= 2048 && ageDays <= 7) {
    return 'L1';
  }

  // L2: Context memory (medium-term, structured data)
  if (sizeKb <= 4096 && ageDays <= 30) {
    return 'L2';
  }

  // L3: Long-term memory (large, old, or semantic search needed)
  // NOTE: L3 (ChromaDB) is disabled in legacy mode (ChromaDB 0.3.x + Pydantic 1.x)
  // Items that would go to L3 will fallback to L2 (PostgreSQL)
  // if (sizeKb > 4096 || ageDays > 30 || meta.needs_semantic_search) {
  //   return 'L3';
  // }
  
  // Redirect L3 candidates to L2 until L3 is available
  if (sizeKb > 4096 || ageDays > 30 || meta.needs_semantic_search) {
    return 'L2';
  }

  // Default to L1 for working memory
  return 'L1';
}

export class MemoryStore {
  private redisCorePrefix = 'memtech:L1:';
  private redisCoreTTL = 86400; // 24 hours
  private chromaCollection = process.env.CHROMA_COLLECTION || 'memtech_memory';

  async initialize(): Promise<void> {
    // Ensure PostgreSQL tables exist for L2
    try {
      const { ensurePostgresTables } = await import('./database-clients.js');
      await ensurePostgresTables();
    } catch (error) {
      console.warn('[MemoryStore] PostgreSQL initialization failed:', error instanceof Error ? error.message : String(error));
    }
  }

  async storeItem({
    layer,
    id,
    content,
    metadata,
  }: {
    layer: StorageLayer;
    id?: string;
    content: string;
    metadata: Record<string, unknown>;
  }): Promise<StorageReference> {
    if (!layer) {
      throw new Error('Layer requerida');
    }

    if (!id) {
      id = uuidv4();
    }

    const payload: MemoryItemPayload = {
      id,
      layer,
      title: String(metadata?.title || ''),
      tags: Array.isArray(metadata?.tags) ? metadata.tags as string[] : [],
      metadata: {
        id,
        title: String(metadata?.title || ''),
        description: String(metadata?.description || ''),
        tags: Array.isArray(metadata?.tags) ? metadata.tags as string[] : [],
        ...metadata,
      } as MemoryItemMetadata,
      content,
      stored_at: new Date().toISOString(),
    };

    // Route to appropriate storage based on layer
    switch (layer) {
      case 'L0':
      case 'L1':
        return await this.storeInRedis(id, payload, this.redisCorePrefix, this.redisCoreTTL);
      case 'L2':
        return await this.storeInPostgres(id, payload);
      case 'L3':
        try {
          return await this.storeInChroma(id, payload, content);
        } catch (error) {
          // L3 (ChromaDB) unavailable, fallback to L2 (PostgreSQL)
          console.warn(`L3 (ChromaDB) unavailable: ${error instanceof Error ? error.message : String(error)}. Falling back to L2 (PostgreSQL).`);
          return await this.storeInPostgres(id, payload);
        }
      default:
        throw new Error(`Unsupported layer: ${layer}`);
    }
  }

  async fetchItem(storageRef: StorageReference): Promise<MemoryItemPayload> {
    if (!storageRef?.backend) {
      throw new Error('Referencia de almacenamiento inválida');
    }

    // Route to appropriate storage based on backend
    switch (storageRef.backend) {
      case 'redis-core':
        return await this.fetchFromRedis(storageRef);
      case 'postgresql':
        return await this.fetchFromPostgres(storageRef);
      case 'chroma':
        try {
          return await this.fetchFromChroma(storageRef);
        } catch (error) {
          // L3 (ChromaDB) unavailable, try PostgreSQL as fallback
          console.warn(`L3 (ChromaDB) unavailable: ${error instanceof Error ? error.message : String(error)}. Trying PostgreSQL fallback.`);
          // Try to fetch from PostgreSQL if ID matches
          return await this.fetchFromPostgres(storageRef);
        }
      default:
        throw new Error(`Unsupported backend: ${storageRef.backend}`);
    }
  }

  private async storeInRedis(
    id: string,
    payload: MemoryItemPayload,
    prefix: string,
    ttlSeconds: number
  ): Promise<StorageReference> {
    await setL1Item(id, JSON.stringify(payload), ttlSeconds);
    return {
      backend: 'redis-core',
      key: `${prefix}${id}`,
      ttl: ttlSeconds,
      stored_at: new Date().toISOString(),
    };
  }

  private async fetchFromRedis(storageRef: StorageReference): Promise<MemoryItemPayload> {
    // Extract ID from key (remove prefix)
    const key = storageRef.key || '';
    const id = key.replace(/^memtech:(L0|L1):/, '');
    
    const value = await getL1Item(id);
    if (!value) {
      throw new Error(`Key ${key} no encontrada en redis-core`);
    }
    
    return JSON.parse(value) as MemoryItemPayload;
  }

  private async storeInPostgres(id: string, payload: MemoryItemPayload): Promise<StorageReference> {
    const pool = getPgPool();
    const client = await pool.connect();
    
    try {
      await client.query(
        `INSERT INTO memtech_memory_items (id, layer, title, tags, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           layer = EXCLUDED.layer,
           title = EXCLUDED.title,
           tags = EXCLUDED.tags,
           payload = EXCLUDED.payload,
           updated_at = NOW()`,
        [id, payload.layer, payload.title, payload.tags, JSON.stringify(payload)]
      );
      
      return {
        backend: 'postgresql',
        id,
        stored_at: new Date().toISOString(),
      };
    } finally {
      client.release();
    }
  }

  private async fetchFromPostgres(storageRef: StorageReference): Promise<MemoryItemPayload> {
    const pool = getPgPool();
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT payload FROM memtech_memory_items WHERE id = $1',
        [storageRef.id]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Item ${storageRef.id} not found in PostgreSQL`);
      }
      
      return result.rows[0].payload as MemoryItemPayload;
    } finally {
      client.release();
    }
  }

  private async storeInChroma(id: string, payload: MemoryItemPayload, content: string): Promise<StorageReference> {
    const chroma = await getChromaWrapper();
    const collectionName = this.chromaCollection;

    // Check if collection exists
    const collectionCheck = await chroma.getCollection(collectionName);
    
    // If collection doesn't exist, create it
    if (!collectionCheck.success && collectionCheck.error && 
        (collectionCheck.error.includes('does not exist') || collectionCheck.error.includes('not found'))) {
      await chroma.createCollection(collectionName, {
        description: 'MemTech L3 long-term memory storage',
        metadata: { 
          type: 'memory', 
          layer: 'L3',
          source: 'memtech-agent'
        }
      });
    }

    // Prepare document and metadata
    const document = content || JSON.stringify(payload);
    const metadata = {
      id,
      layer: payload.layer,
      title: payload.title,
      tags: payload.tags,
      stored_at: new Date().toISOString(),
      content_length: document.length,
    };

    // Store in ChromaDB
    const result = await chroma.addDocuments(
      collectionName,
      [id],
      [document],
      [metadata]
    );

    if (!result.success) {
      throw new Error(`Failed to store in ChromaDB: ${result.error}`);
    }

    return {
      backend: 'chroma',
      collection: collectionName,
      id,
      stored_at: metadata.stored_at,
    };
  }

  private async fetchFromChroma(storageRef: StorageReference): Promise<MemoryItemPayload> {
    const chroma = await getChromaWrapper();
    const collectionName = storageRef.collection || this.chromaCollection;

    // Query by ID using where filter
    const queryResult = await chroma.query(collectionName, '', { nResults: 1 });
    
    if (!queryResult.success || !queryResult.data) {
      throw new Error(`Item ${storageRef.id} not found in ChromaDB`);
    }

    // Find the item by ID in results
    const data = queryResult.data as any;
    const ids = data.ids?.[0] || [];
    const documents = data.documents?.[0] || [];
    const metadatas = data.metadatas?.[0] || [];
    
    const index = ids.indexOf(storageRef.id);
    if (index === -1) {
      throw new Error(`Item ${storageRef.id} not found in ChromaDB collection`);
    }

    // Reconstruct payload
    const metadata = metadatas[index] || {};
    const storedAt = metadata.stored_at 
      ? String(metadata.stored_at) 
      : new Date().toISOString();
    const contentStr = documents[index] ? String(documents[index]) : '';
    
    return {
      id: storageRef.id || '',
      layer: (metadata.layer as StorageLayer) || 'L3',
      title: String(metadata.title || ''),
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      metadata: {
        id: storageRef.id || '',
        title: String(metadata.title || ''),
        description: String(metadata.description || ''),
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        ...metadata,
      } as MemoryItemMetadata,
      content: contentStr,
      stored_at: storedAt,
    };
  }
}

export default MemoryStore;
