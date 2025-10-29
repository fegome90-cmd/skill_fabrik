#!/usr/bin/env node

/**
 * MemTech Agent - Memory Adapter
 *
 * Conecta el MemTech Agent con el sistema de memoria local existente en core/memory/
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importar el sistema de memoria existente
import { Memory, ShortMemory, LongMemory } from '../memory/index.js';

class MemTechMemoryAdapter {
  constructor() {
    this.memory = null;
    this.shortMemory = new ShortMemory();
    this.contextCache = new Map();
    this.lastContextUpdate = null;
    this.longMemoryLimit = 500;
    this.longMemoryTtlMs = 90 * 24 * 60 * 60 * 1000; // 90 días
    this.memoryStateFile = join(__dirname, '..', '..', 'core', 'memory', 'memory-state.json');
  }

  /**
   * Inicializar conexión con el sistema de memoria local
   */
  async initialize() {
    try {
      console.log('🧠 Conectando con sistema de memoria local...');

      // Crear adaptador para LongMemory
      const longAdapter = {
        store: async rec => {
          const state = this.loadMemoryState();
          const entry = {
            content: rec.content,
            meta: {
              ...(rec.meta || {}),
              ts: rec.meta?.ts ?? rec.ts ?? Date.now(),
              source: rec.meta?.source || 'long_memory',
            },
            ts: rec.ts ?? Date.now(),
          };

          state.long_memory = Array.isArray(state.long_memory) ? state.long_memory : [];
          state.long_memory.push(entry);

          if (state.long_memory.length > this.longMemoryLimit) {
            state.long_memory.splice(0, state.long_memory.length - this.longMemoryLimit);
          }

          // Compatibilidad con estructuras anteriores
          state.records = Array.isArray(state.records) ? state.records : [];
          state.records.push(entry);
          if (state.records.length > this.longMemoryLimit * 2) {
            state.records.splice(0, state.records.length - this.longMemoryLimit * 2);
          }

          this.saveMemoryState(state);
        },
        search: async (q, k = 5) => {
          const state = this.loadMemoryState();
          const records =
            Array.isArray(state.long_memory) && state.long_memory.length > 0
              ? state.long_memory
              : state.records || [];

          const normalizedQuery = q.toLowerCase();
          return records
            .filter(r => r.content && r.content.toLowerCase().includes(normalizedQuery))
            .slice(0, k)
            .map(r => ({
              content: r.content,
              meta: {
                ...(r.meta || {}),
                ts: r.meta?.ts ?? r.ts ?? Date.now(),
                source: r.meta?.source || 'long_memory',
              },
              ts: r.ts ?? r.meta?.ts ?? Date.now(),
            }));
        },
      };

      // Inicializar sistema de memoria
      this.memory = new Memory(longAdapter);

      // Cargar estado existente
      await this.loadExistingContext();

      console.log('✅ Conectado con sistema de memoria local');
      return true;
    } catch (error) {
      console.error('❌ Error conectando con memoria local:', error);
      return false;
    }
  }

  /**
   * Cargar contexto existente desde memoria
   */
  async loadExistingContext() {
    try {
      if (existsSync(this.memoryStateFile)) {
        const state = JSON.parse(readFileSync(this.memoryStateFile, 'utf8'));

        // Cargar registros en ShortMemory
        const bootstrapRecords = Array.isArray(state.records) ? state.records : [];
        const longRecords = Array.isArray(state.long_memory) ? state.long_memory : [];
        const preload = bootstrapRecords.length
          ? bootstrapRecords
          : longRecords.slice(-this.longMemoryLimit);

        for (const record of preload) {
          if (!record?.content) continue;
          this.shortMemory.push({
            content: record.content,
            meta: {
              ts: record.ts || record.meta?.ts || Date.now(),
              source: record.meta?.source || 'memtech',
              tags: record.meta?.tags || ['context'],
            },
          });
        }

        console.log(`📚 Cargados ${preload.length} registros de contexto (short preload)`);
      }
    } catch (error) {
      console.warn('⚠️  Error cargando contexto existente:', error.message);
    }
  }

  /**
   * Guardar contexto en memoria local
   */
  async saveContext(topic, content, metadata = {}) {
    try {
      const record = {
        content: content,
        meta: {
          ...metadata,
          source: 'memtech-agent',
          topic: topic,
          timestamp: new Date().toISOString(),
        },
        ts: Date.now(),
      };

      record.meta.ts = record.ts;

      // Guardar en ShortMemory
      this.shortMemory.push(record);

      // Guardar en LongMemory
      await this.memory.long.store(content, record.meta);

      // Actualizar cache de contexto
      this.contextCache.set(topic, {
        content,
        metadata,
        timestamp: Date.now(),
      });

      this.lastContextUpdate = Date.now();

      console.log(`💾 Contexto guardado: ${topic}`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando contexto:', error);
      return false;
    }
  }

  /**
   * Recuperar contexto desde memoria local
   */
  async retrieveContext(topic) {
    try {
      // Buscar en cache primero
      if (this.contextCache.has(topic)) {
        const cached = this.contextCache.get(topic);
        console.log(`🎯 Contexto recuperado desde cache: ${topic}`);
        return cached;
      }

      // Buscar en ShortMemory
      const shortResults = this.shortMemory.query(topic);
      if (shortResults.length > 0) {
        const result = {
          content: shortResults.map(r => r.content).join('\n'),
          metadata: shortResults[0].meta,
          timestamp: shortResults[0].meta.ts,
        };

        // Actualizar cache
        this.contextCache.set(topic, result);

        console.log(`🎯 Contexto recuperado desde ShortMemory: ${topic}`);
        return result;
      }

      // Buscar en LongMemory
      const longResults = await this.memory.long.search(topic, 3);
      if (longResults.length > 0) {
        const result = {
          content: longResults.map(r => r.content).join('\n'),
          metadata: longResults[0].meta,
          timestamp: longResults[0].ts,
        };

        // Actualizar cache
        this.contextCache.set(topic, result);

        console.log(`🎯 Contexto recuperado desde LongMemory: ${topic}`);
        return result;
      }

      console.log(`⚠️  No se encontró contexto para: ${topic}`);
      return null;
    } catch (error) {
      console.error('❌ Error recuperando contexto:', error);
      return null;
    }
  }

  /**
   * Inyectar contexto usando el sistema existente
   */
  async injectContext(topic) {
    try {
      return await this.memory.injectContext(topic);
    } catch (error) {
      console.error('❌ Error inyectando contexto:', error);
      return '';
    }
  }

  /**
   * Obtener estado de la memoria
   */
  getMemoryStatus() {
    return {
      shortMemory: {
        records: this.shortMemory.buf.length,
        capacity: this.shortMemory.cap,
        ttl: this.shortMemory.ttlMs,
      },
      contextCache: {
        entries: this.contextCache.size,
        lastUpdate: this.lastContextUpdate,
      },
      memoryState: {
        fileExists: existsSync(this.memoryStateFile),
        lastModified: existsSync(this.memoryStateFile)
          ? new Date(statSync(this.memoryStateFile).mtime)
          : null,
      },
    };
  }

  /**
   * Cargar estado de memoria desde archivo
   */
  loadMemoryState() {
    try {
      if (existsSync(this.memoryStateFile)) {
        const state = JSON.parse(readFileSync(this.memoryStateFile, 'utf8'));
        state.records = Array.isArray(state.records) ? state.records : [];
        state.long_memory = Array.isArray(state.long_memory) ? state.long_memory : [];
        return state;
      }
      return { records: [], long_memory: [] };
    } catch (error) {
      console.warn('⚠️  Error cargando estado de memoria:', error.message);
      return { records: [], long_memory: [] };
    }
  }

  /**
   * Guardar estado de memoria en archivo
   */
  saveMemoryState(state) {
    try {
      writeFileSync(this.memoryStateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('❌ Error guardando estado de memoria:', error);
    }
  }

  /**
   * Limpiar memoria expirada
   */
  cleanupExpiredMemory() {
    const now = Date.now();
    const ttl = this.shortMemory.ttlMs;

    // Limpiar ShortMemory
    this.shortMemory.buf = this.shortMemory.buf.filter(r => now - r.meta.ts <= ttl);

    // Limpiar cache de contexto
    for (const [topic, context] of this.contextCache.entries()) {
      if (now - context.timestamp > ttl) {
        this.contextCache.delete(topic);
      }
    }

    // Limpiar registros persistentes expirados
    const state = this.loadMemoryState();
    const filteredLong = (state.long_memory || []).filter(entry => {
      const ts = entry?.meta?.ts ?? entry?.ts ?? 0;
      return now - ts <= this.longMemoryTtlMs;
    });

    if (filteredLong.length !== (state.long_memory || []).length) {
      state.long_memory = filteredLong;
      // Mantener la lista de compatibilidad sincronizada
      state.records = filteredLong.slice(-this.longMemoryLimit * 2);
      this.saveMemoryState(state);
    }

    console.log('🧹 Memoria expirada limpiada');
  }
}

export default MemTechMemoryAdapter;
