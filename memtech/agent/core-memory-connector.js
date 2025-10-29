#!/usr/bin/env node

/**
 * MemTech Agent - Core Memory Connector
 *
 * Conecta el MemTech Agent con TODOS los sistemas de memoria existentes en core/
 * - core/memory/ (ShortMemory/LongMemory)
 * - core/context-management/memory/ (Memory Integration, Layers, Cache)
 * - core/ace/ (Token analysis, ADR system)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CoreMemoryConnector {
  constructor() {
    this.connectedSystems = {
      core_memory: null, // core/memory/
      context_memory: null, // core/context-management/memory/
      ace_system: null, // core/ace/
      surprise_metrics: null, // core/surprise-metrics/
    };

    this.memoryState = {
      lastContextUpdate: null,
      activeContexts: [],
      memoryUsage: {},
      systemHealth: {},
    };
  }

  /**
   * Conectar con todos los sistemas de memoria de core/
   */
  async connectToCoreMemory() {
    console.log('🧠 Conectando con sistemas de memoria de core/...');

    try {
      // 1. Conectar con core/memory/
      await this.connectCoreMemory();

      // 2. Conectar con core/context-management/memory/
      await this.connectContextMemory();

      // 3. Conectar con core/ace/
      await this.connectACESystem();

      // 4. Conectar con core/surprise-metrics/
      await this.connectSurpriseMetrics();

      // 5. Inicializar estado de memoria
      await this.initializeMemoryState();

      console.log('✅ Conectado con todos los sistemas de memoria de core/');
      return true;
    } catch (error) {
      console.error('❌ Error conectando con sistemas de memoria:', error);
      return false;
    }
  }

  /**
   * Conectar con core/memory/
   */
  async connectCoreMemory() {
    try {
      const memoryPath = join(__dirname, '..', 'memory');
      const memoryStateFile = join(memoryPath, 'memory-state.json');

      // Verificar que existe el sistema
      if (existsSync(join(memoryPath, 'index.ts'))) {
        this.connectedSystems.core_memory = {
          path: memoryPath,
          status: 'available',
          components: ['short.ts', 'long.ts', 'index.ts'],
          stateFile: memoryStateFile,
        };

        // Cargar estado existente
        if (existsSync(memoryStateFile)) {
          const state = JSON.parse(readFileSync(memoryStateFile, 'utf8'));
          this.memoryState.coreMemory = state;
        }

        console.log('✅ core/memory/ conectado');
      } else {
        throw new Error('core/memory/ no encontrado');
      }
    } catch (error) {
      console.error('❌ Error conectando core/memory/:', error.message);
      this.connectedSystems.core_memory = { status: 'error', error: error.message };
    }
  }

  /**
   * Conectar con core/context-management/memory/
   */
  async connectContextMemory() {
    try {
      const contextMemoryPath = join(__dirname, '..', 'context-management', 'memory');

      // Verificar componentes principales
      const components = [
        'memory-integration.js',
        'memory-layers/memory-layers-system.js',
        'embedding-cache/embedding-cache-core.js',
        'context-memory-state.json',
      ];

      let availableComponents = 0;
      for (const component of components) {
        if (existsSync(join(contextMemoryPath, component))) {
          availableComponents++;
        }
      }

      this.connectedSystems.context_memory = {
        path: contextMemoryPath,
        status: availableComponents >= 3 ? 'available' : 'partial',
        components: components,
        availableComponents: availableComponents,
        totalComponents: components.length,
      };

      // Cargar estado de contexto
      const contextStateFile = join(contextMemoryPath, 'context-memory-state.json');
      if (existsSync(contextStateFile)) {
        const state = JSON.parse(readFileSync(contextStateFile, 'utf8'));
        this.memoryState.contextMemory = state;
      }

      console.log(
        `✅ core/context-management/memory/ conectado (${availableComponents}/${components.length} componentes)`
      );
    } catch (error) {
      console.error('❌ Error conectando context-memory:', error.message);
      this.connectedSystems.context_memory = { status: 'error', error: error.message };
    }
  }

  /**
   * Conectar con core/ace/
   */
  async connectACESystem() {
    try {
      const acePath = join(__dirname, '..', 'ace');

      // Verificar componentes principales
      const components = [
        'scripts/token_analyzer.py',
        'scripts/adr_manager.py',
        'data/token_analysis.db',
        'adr_agnostic.json',
      ];

      let availableComponents = 0;
      for (const component of components) {
        if (existsSync(join(acePath, component))) {
          availableComponents++;
        }
      }

      this.connectedSystems.ace_system = {
        path: acePath,
        status: availableComponents >= 2 ? 'available' : 'partial',
        components: components,
        availableComponents: availableComponents,
        totalComponents: components.length,
      };

      // Cargar ADR agnóstico
      const adrFile = join(acePath, 'adr_agnostic.json');
      if (existsSync(adrFile)) {
        const adrData = JSON.parse(readFileSync(adrFile, 'utf8'));
        this.memoryState.aceSystem = adrData;
      }

      console.log(
        `✅ core/ace/ conectado (${availableComponents}/${components.length} componentes)`
      );
    } catch (error) {
      console.error('❌ Error conectando ACE system:', error.message);
      this.connectedSystems.ace_system = { status: 'error', error: error.message };
    }
  }

  /**
   * Conectar con core/surprise-metrics/
   */
  async connectSurpriseMetrics() {
    try {
      const surprisePath = join(__dirname, '..', 'surprise-metrics');

      // Verificar que el sistema esté disponible
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        const health = await response.json();
        this.connectedSystems.surprise_metrics = {
          path: surprisePath,
          status: 'available',
          health: health,
          endpoints: {
            health: 'http://localhost:3000/health',
            metrics: 'http://localhost:3000/metrics',
          },
        };
        console.log('✅ core/surprise-metrics/ conectado');
      } else {
        throw new Error('Surprise Metrics System no disponible');
      }
    } catch (error) {
      console.warn('⚠️  core/surprise-metrics/ no disponible:', error.message);
      this.connectedSystems.surprise_metrics = {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Inicializar estado de memoria
   */
  async initializeMemoryState() {
    this.memoryState.lastContextUpdate = Date.now();
    this.memoryState.activeContexts = [];
    this.memoryState.memoryUsage = this.getCurrentMemoryUsage();
    this.memoryState.systemHealth = this.getSystemHealth();
  }

  /**
   * Guardar contexto en el sistema de memoria apropiado
   */
  async saveContext(topic, content, metadata = {}) {
    try {
      const context = {
        topic,
        content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          source: 'memtech-agent',
        },
      };

      // Guardar en core/memory/ si está disponible
      if (this.connectedSystems.core_memory?.status === 'available') {
        await this.saveToCoreMemory(context);
      }

      // Guardar en context-management/memory/ si está disponible
      if (this.connectedSystems.context_memory?.status === 'available') {
        await this.saveToContextMemory(context);
      }

      // Actualizar estado local
      this.memoryState.activeContexts.push(context);
      this.memoryState.lastContextUpdate = Date.now();

      console.log(`💾 Contexto guardado: ${topic}`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando contexto:', error);
      return false;
    }
  }

  /**
   * Guardar en core/memory/
   */
  async saveToCoreMemory(context) {
    try {
      const stateFile = this.connectedSystems.core_memory.stateFile;
      let state = {
        short_memory: [],
        long_memory: [],
        context_cache: {},
        agent_connections: {},
        last_updated: new Date().toISOString(),
      };

      if (existsSync(stateFile)) {
        state = JSON.parse(readFileSync(stateFile, 'utf8'));
      }

      // Agregar a short_memory
      state.short_memory.push({
        content: context.content,
        meta: {
          ts: Date.now(),
          source: context.metadata.source,
          topic: context.topic,
        },
      });

      // Mantener solo los últimos 100 registros
      if (state.short_memory.length > 100) {
        state.short_memory = state.short_memory.slice(-100);
      }

      // Actualizar context_cache
      state.context_cache[context.topic] = context;

      writeFileSync(stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error guardando en core/memory:', error);
    }
  }

  /**
   * Guardar en context-management/memory/
   */
  async saveToContextMemory(context) {
    try {
      const stateFile = join(
        this.connectedSystems.context_memory.path,
        'context-memory-state.json'
      );
      let state = {
        contextual_coherence: {},
        embedding_cache: {},
        active_contexts: [],
        memory_bridges: {},
      };

      if (existsSync(stateFile)) {
        state = JSON.parse(readFileSync(stateFile, 'utf8'));
      }

      // Agregar a active_contexts
      state.active_contexts.push(context);

      // Mantener solo los últimos 50 contextos activos
      if (state.active_contexts.length > 50) {
        state.active_contexts = state.active_contexts.slice(-50);
      }

      writeFileSync(stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error guardando en context-memory:', error);
    }
  }

  /**
   * Recuperar contexto desde los sistemas de memoria
   */
  async retrieveContext(topic) {
    try {
      // Buscar en contextos activos locales
      const localContext = this.memoryState.activeContexts.find(ctx => ctx.topic === topic);
      if (localContext) {
        console.log(`🎯 Contexto recuperado desde memoria local: ${topic}`);
        return localContext;
      }

      // Buscar en core/memory/
      if (this.connectedSystems.core_memory?.status === 'available') {
        const coreContext = await this.retrieveFromCoreMemory(topic);
        if (coreContext) {
          console.log(`🎯 Contexto recuperado desde core/memory/: ${topic}`);
          return coreContext;
        }
      }

      // Buscar en context-management/memory/
      if (this.connectedSystems.context_memory?.status === 'available') {
        const contextMemory = await this.retrieveFromContextMemory(topic);
        if (contextMemory) {
          console.log(`🎯 Contexto recuperado desde context-memory: ${topic}`);
          return contextMemory;
        }
      }

      console.log(`⚠️  No se encontró contexto para: ${topic}`);
      return null;
    } catch (error) {
      console.error('❌ Error recuperando contexto:', error);
      return null;
    }
  }

  /**
   * Recuperar desde core/memory/
   */
  async retrieveFromCoreMemory(topic) {
    try {
      const stateFile = this.connectedSystems.core_memory.stateFile;
      if (existsSync(stateFile)) {
        const state = JSON.parse(readFileSync(stateFile, 'utf8'));

        // Buscar en context_cache
        if (state.context_cache && state.context_cache[topic]) {
          return state.context_cache[topic];
        }

        // Buscar en short_memory
        const shortMemory = state.short_memory || [];
        const found = shortMemory.find(
          record => record.meta?.topic === topic || record.content.includes(topic)
        );

        if (found) {
          return {
            topic,
            content: found.content,
            metadata: found.meta,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error recuperando desde core/memory:', error);
      return null;
    }
  }

  /**
   * Recuperar desde context-management/memory/
   */
  async retrieveFromContextMemory(topic) {
    try {
      const stateFile = join(
        this.connectedSystems.context_memory.path,
        'context-memory-state.json'
      );
      if (existsSync(stateFile)) {
        const state = JSON.parse(readFileSync(stateFile, 'utf8'));

        // Buscar en active_contexts
        const activeContexts = state.active_contexts || [];
        const found = activeContexts.find(ctx => ctx.topic === topic);

        if (found) {
          return found;
        }
      }
      return null;
    } catch (error) {
      console.error('Error recuperando desde context-memory:', error);
      return null;
    }
  }

  /**
   * Obtener estado actual de memoria
   */
  getCurrentMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtener salud de sistemas conectados
   */
  getSystemHealth() {
    const health = {};

    for (const [systemName, system] of Object.entries(this.connectedSystems)) {
      health[systemName] = {
        status: system.status,
        lastCheck: new Date().toISOString(),
        healthy: system.status === 'available',
      };
    }

    return health;
  }

  /**
   * Obtener estado completo del conector
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      connectedSystems: this.connectedSystems,
      memoryState: this.memoryState,
      memoryUsage: this.getCurrentMemoryUsage(),
      systemHealth: this.getSystemHealth(),
    };
  }
}

export default CoreMemoryConnector;
