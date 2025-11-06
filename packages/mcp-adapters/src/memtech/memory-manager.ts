/**
 * MemoryManager - Simplified for L1 snapshots
 */

import { v4 as uuidv4 } from 'uuid';
import type { MemoryItemMetadata, AddItemResult, StorageLayer } from './types.js';
import MemoryStore, { determineStorageLayer } from './memory-store.js';

export class MemoryManager {
  private memoryStore: MemoryStore;
  private initialized = false;

  constructor(config: { redisCoreTTL?: number } = {}) {
    this.memoryStore = new MemoryStore();
    // Note: MemoryStore config can be extended here if needed
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.memoryStore.initialize();
    this.initialized = true;
  }

  async addItem(meta: {
    title: string;
    content?: string;
    description?: string;
    tags?: string[];
    type?: string;
    [key: string]: unknown;
  }): Promise<AddItemResult> {
    await this.initialize();

    // Validate required metadata
    if (!meta.title) {
      throw new Error('Title is required for memory items');
    }

    // Generate unique ID
    const id = uuidv4();
    const uri = `mem://${id}`;

    // Create full metadata (extract title to avoid duplication)
    const { title, ...metaRest } = meta;
    const fullMetadata: MemoryItemMetadata = {
      id,
      title: title, // Explicit title
      description: meta.description || '',
      tags: meta.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      ...metaRest, // Rest of metadata without title
    };

    // Determine layer (will default to L1)
    const layer: StorageLayer = determineStorageLayer(meta, meta.content || '');
    
    // Force L1 for plan snapshots
    const finalLayer: StorageLayer = meta.type === 'plan_snapshot' ? 'L1' : layer;

    const storageRef = await this.memoryStore.storeItem({
      layer: finalLayer,
      id,
      content: meta.content || '',
      metadata: fullMetadata,
    });

    fullMetadata.layer = finalLayer;
    fullMetadata.storage = storageRef;
    fullMetadata.updated_at = new Date().toISOString();
    fullMetadata.size_bytes = Buffer.byteLength(meta.content || '', 'utf8');
    fullMetadata.last_access = new Date().toISOString();

    return {
      success: true,
      id,
      uri,
      metadata: fullMetadata,
      created_at: new Date().toISOString(),
    };
  }

  async getItem(id: string): Promise<{
    id: string;
    metadata: MemoryItemMetadata;
    content: string;
  }> {
    await this.initialize();

    // This would require tracking storage references
    // For now, simplified - would need to extend with index storage
    throw new Error('getItem not yet implemented - requires index storage');
  }
}

export default MemoryManager;

