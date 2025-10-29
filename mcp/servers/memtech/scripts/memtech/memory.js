/**
 * MemTech Memory Module
 *
 * Módulo para gestión de memoria, resolución de URIs y búsquedas
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import process from 'process';
import crypto from 'crypto';

import MemoryStore, { determineStorageLayer } from './memory-store.js';

// Configuración del logger
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

class MemoryManager {
  constructor(config = {}) {
    this.config = {
      storage_path: config.storage_path || '.memtech/memory',
      max_items: config.max_items || 10000,
      index_enabled: config.index_enabled !== false,
      ...config,
    };

    this.memoryIndex = new Map();
    this.tagsIndex = new Map();
    this.initialized = false;

    this.memoryStore = new MemoryStore({
      redisCachePrefix: config.redisCachePrefix || 'memtech:L0:',
      redisCorePrefix: config.redisCorePrefix || 'memtech:L1:',
      redisCacheTTL: config.redisCacheTTL || 3600,
      redisCoreTTL: config.redisCoreTTL || 86400,
      qdrantCollection: config.qdrantCollection || 'memtech_memory',
      qdrantVectorSize: config.qdrantVectorSize || 8,
      chromaCollection:
        config.chromaCollection || process.env.CHROMA_COLLECTION || 'memtech_memory',
    });
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Asegurar que el directorio de almacenamiento existe
      await fs.mkdir(this.config.storage_path, { recursive: true });

      // Cargar índices existentes
      await this.loadIndexes();

      // Inicializar almacenes jerárquicos
      await this.memoryStore.initialize();

      this.initialized = true;
      logger.info('Memory Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Memory Manager:', error);
      throw error;
    }
  }

  async loadIndexes() {
    try {
      const indexPath = path.join(this.config.storage_path, 'index.json');
      const tagsIndexPath = path.join(this.config.storage_path, 'tags_index.json');

      // Cargar índice principal
      try {
        const indexData = await fs.readFile(indexPath, 'utf8');
        const index = JSON.parse(indexData);
        this.memoryIndex = new Map(Object.entries(index));
      } catch (error) {
        logger.warn('No existing memory index found, starting with empty index');
        this.memoryIndex = new Map();
      }

      // Cargar índice de etiquetas
      try {
        const tagsData = await fs.readFile(tagsIndexPath, 'utf8');
        const tagsIndex = JSON.parse(tagsData);
        this.tagsIndex = new Map(Object.entries(tagsIndex));
      } catch (error) {
        logger.warn('No existing tags index found, starting with empty tags index');
        this.tagsIndex = new Map();
      }

      logger.info(`Loaded ${this.memoryIndex.size} memory items and ${this.tagsIndex.size} tags`);
    } catch (error) {
      logger.error('Error loading indexes:', error);
      throw error;
    }
  }

  async saveIndexes() {
    try {
      const indexPath = path.join(this.config.storage_path, 'index.json');
      const tagsIndexPath = path.join(this.config.storage_path, 'tags_index.json');

      // Guardar índice principal
      const indexObject = Object.fromEntries(this.memoryIndex);
      await fs.writeFile(indexPath, JSON.stringify(indexObject, null, 2));

      // Guardar índice de etiquetas
      const tagsIndexObject = Object.fromEntries(this.tagsIndex);
      await fs.writeFile(tagsIndexPath, JSON.stringify(tagsIndexObject, null, 2));

      logger.debug('Indexes saved successfully');
    } catch (error) {
      logger.error('Error saving indexes:', error);
      throw error;
    }
  }

  async resolve(uriOrQuery, options = {}) {
    await this.initialize();

    try {
      logger.info(`Resolving URI or query: ${uriOrQuery}`);

      // Si es una URI (comienza con mem://)
      if (uriOrQuery.startsWith('mem://')) {
        return await this.resolveURI(uriOrQuery, options);
      }

      // Si es una consulta de búsqueda
      return await this.searchQuery(uriOrQuery, options);
    } catch (error) {
      logger.error(`Error resolving ${uriOrQuery}:`, error);
      throw new Error(`Failed to resolve ${uriOrQuery}: ${error.message}`);
    }
  }

  async resolveURI(uri, options = {}) {
    const uriPattern = /^mem:\/\/(.+)$/;
    const match = uri.match(uriPattern);

    if (!match) {
      throw new Error(`Invalid memory URI format: ${uri}`);
    }

    const memoryId = match[1];

    if (!this.memoryIndex.has(memoryId)) {
      throw new Error(`Memory item not found: ${memoryId}`);
    }

    const memoryMetadata = this.memoryIndex.get(memoryId);
    try {
      let payload = null;

      if (memoryMetadata.storage) {
        try {
          payload = await this.memoryStore.fetchItem(memoryMetadata.storage);
        } catch (storageError) {
          logger.warn(
            `Fallo recuperando ${memoryId} desde backend ${memoryMetadata.storage.backend}: ${storageError.message}`
          );
        }
      }

      if (!payload) {
        const legacyPath = path.join(this.config.storage_path, `${memoryId}.json`);
        try {
          const memoryData = await fs.readFile(legacyPath, 'utf8');
          payload = JSON.parse(memoryData);
        } catch (legacyError) {
          throw new Error(`Payload no disponible para ${memoryId}`);
        }
      }

      const content = payload?.content || '';
      const etag = this.generateETag(memoryId, memoryMetadata, content);

      memoryMetadata.last_access = new Date().toISOString();
      this.memoryIndex.set(memoryId, memoryMetadata);
      await this.saveIndexes();

      if (options.ifNoneMatch && options.ifNoneMatch === etag) {
        return {
          status: 'not_modified',
          uri,
          id: memoryId,
          etag,
          resolved_at: new Date().toISOString(),
        };
      }

      return {
        uri,
        id: memoryId,
        metadata: memoryMetadata,
        content,
        storage: memoryMetadata.storage || null,
        etag,
        resolved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error resolving memory ${memoryId}:`, error);
      throw new Error(`Failed to read memory item: ${memoryId}`);
    }
  }

  generateETag(id, metadata, content) {
    const etagData = `${id}:${metadata.updated_at}:${content.length}`;
    return crypto.createHash('md5').update(etagData).digest('hex');
  }

  async searchQuery(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    // Buscar en el índice principal
    for (const [id, metadata] of this.memoryIndex.entries()) {
      let relevance = 0;

      // Buscar en título
      if (metadata.title && metadata.title.toLowerCase().includes(queryLower)) {
        relevance += 10;
      }

      // Buscar en descripción
      if (metadata.description && metadata.description.toLowerCase().includes(queryLower)) {
        relevance += 5;
      }

      // Buscar en etiquetas
      if (metadata.tags) {
        for (const tag of metadata.tags) {
          if (tag.toLowerCase().includes(queryLower)) {
            relevance += 3;
          }
        }
      }

      if (relevance > 0) {
        results.push({
          id,
          uri: `mem://${id}`,
          relevance,
          metadata,
          etag: this.generateETag(id, metadata, ''), // ETag para metadata
        });
      }
    }

    // Ordenar por relevancia
    results.sort((a, b) => b.relevance - a.relevance);

    // Generar ETag para los resultados de búsqueda
    const searchETag = this.generateSearchETag(query, results);

    return {
      query,
      count: results.length,
      etag: searchETag,
      results: results.slice(0, 50), // Limitar a 50 resultados
      searched_at: new Date().toISOString(),
    };
  }

  generateSearchETag(query, results) {
    const etagData = `${query}:${results.length}:${results.map(r => r.id).join(',')}`;
    return crypto.createHash('md5').update(etagData).digest('hex');
  }

  async search(tags) {
    await this.initialize();

    try {
      logger.info(`Searching by tags: ${JSON.stringify(tags)}`);

      if (!Array.isArray(tags)) {
        tags = [tags];
      }

      const results = [];
      const tagSet = new Set(tags.map(tag => tag.toLowerCase()));

      // Buscar en el índice de etiquetas
      for (const [tag, itemIds] of this.tagsIndex.entries()) {
        if (tagSet.has(tag.toLowerCase())) {
          for (const itemId of itemIds) {
            if (this.memoryIndex.has(itemId)) {
              const metadata = this.memoryIndex.get(itemId);
              results.push({
                id: itemId,
                uri: `mem://${itemId}`,
                metadata,
                matched_tag: tag,
              });
            }
          }
        }
      }

      // Eliminar duplicados y ordenar
      const uniqueResults = results.filter(
        (item, index, self) => index === self.findIndex(t => t.id === item.id)
      );

      return {
        tags,
        count: uniqueResults.length,
        results: uniqueResults,
        searched_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error searching by tags ${JSON.stringify(tags)}:`, error);
      throw new Error(`Failed to search by tags: ${error.message}`);
    }
  }

  async addItem(meta) {
    await this.initialize();

    try {
      logger.info(`Adding memory item: ${meta.title || 'Untitled'}`);

      // Validar metadatos requeridos
      if (!meta.title) {
        throw new Error('Title is required for memory items');
      }

      // Generar ID único
      const id = uuidv4();
      const uri = `mem://${id}`;

      // Crear metadatos completos
      const fullMetadata = {
        id,
        title: meta.title,
        description: meta.description || '',
        tags: meta.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
        ...meta,
      };

      const layer = determineStorageLayer(meta, meta.content || '');
      const storageRef = await this.memoryStore.storeItem({
        layer,
        id,
        content: meta.content || '',
        metadata: fullMetadata,
      });

      fullMetadata.layer = layer;
      fullMetadata.storage = storageRef;
      fullMetadata.updated_at = new Date().toISOString();
      fullMetadata.size_bytes = Buffer.byteLength(meta.content || '', 'utf8');
      fullMetadata.last_access = new Date().toISOString();
      delete fullMetadata.content;

      // Actualizar índices
      this.memoryIndex.set(id, fullMetadata);

      // Actualizar índice de etiquetas
      if (meta.tags && Array.isArray(meta.tags)) {
        for (const tag of meta.tags) {
          const tagLower = tag.toLowerCase();
          if (!this.tagsIndex.has(tagLower)) {
            this.tagsIndex.set(tagLower, []);
          }
          this.tagsIndex.get(tagLower).push(id);
        }
      }

      // Guardar índices
      await this.saveIndexes();

      logger.info(`Memory item added successfully: ${id}`);

      return {
        success: true,
        id,
        uri,
        metadata: fullMetadata,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error adding memory item:', error);
      throw new Error(`Failed to add memory item: ${error.message}`);
    }
  }

  async getStats() {
    await this.initialize();

    try {
      const totalItems = this.memoryIndex.size;
      const totalTags = this.tagsIndex.size;
      const layers = { L0: 0, L1: 0, L2: 0, L3: 0, unknown: 0 };
      let totalSize = 0;

      for (const metadata of this.memoryIndex.values()) {
        const layer = metadata.layer || 'unknown';
        if (layers[layer] !== undefined) {
          layers[layer] += 1;
        } else {
          layers.unknown += 1;
        }
        totalSize += metadata.size_bytes || 0;
      }

      return {
        total_items: totalItems,
        total_tags: totalTags,
        storage_size_bytes: totalSize,
        storage_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
        layers,
        indexed_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting memory stats:', error);
      throw new Error(`Failed to get memory stats: ${error.message}`);
    }
  }
}

export default MemoryManager;
