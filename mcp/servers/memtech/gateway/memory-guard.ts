/**
 * MEMORY GUARD - Amarre Obligatorio a Memoria Jerárquica
 * Garantiza que SIEMPRE se consulte L0-L3 antes de cualquier proceso
 */

interface MemoryContext {
  hot: any[];
  retrieved: any[];
  checkpointId: string;
  lockKey: string;
  healthStatus: 'online' | 'offline' | 'degraded';
}

interface GuardConfig {
  mcpTimeoutMs: number;
  maxSteps: number;
  hardBlockIfMemoryOffline: boolean;
  checkpointOnStart: boolean;
  circuitBreaker: {
    maxFailures: number;
    resetTimeoutMs: number;
  };
}

export class MemoryGuard {
  private config: GuardConfig;
  private healthCache: Map<string, { status: string; timestamp: number }> = new Map();
  private circuitBreaker: Map<string, { failures: number; lastFailure: number }> = new Map();
  private locks: Map<string, { expires: number }> = new Map();

  constructor(config: GuardConfig) {
    this.config = config;
  }

  /**
   * AMARRE OBLIGATORIO - Bloquea ejecución sin contexto de memoria
   */
  async enforceMemoryContext(input: string): Promise<MemoryContext> {
    const runId = this.generateRunId();
    const lockKey = `memtech:${this.hashInput(input)}`;

    try {
      // 1. HEALTH CHECK (con cache 30s)
      const health = await this.checkHealthWithCache();
      if (health.status === 'offline' && this.config.hardBlockIfMemoryOffline) {
        throw new Error('🚨 Memory system offline - Cannot proceed without context');
      }

      // 2. ACQUIRE LOCK (evitar duplicidades)
      await this.acquireLock(lockKey, 30000); // 30s TTL

      // 3. CREATE CHECKPOINT (trazabilidad obligatoria)
      const checkpointId = await this.createCheckpoint(input, runId);

      // 4. PACK CONTEXT (L0-L3 retrieval)
      const contextPack = await this.packContext(input);

      // 5. VALIDATE CONTEXT (hard gate)
      if (!contextPack.hot.length && !contextPack.retrieved.length) {
        throw new Error('⚠️ No context found - Memory query failed');
      }

      return {
        hot: contextPack.hot,
        retrieved: contextPack.retrieved,
        checkpointId,
        lockKey,
        healthStatus: health.status as any,
      };
    } catch (error) {
      // Release lock on error
      await this.releaseLock(lockKey);
      throw error;
    }
  }

  /**
   * HEALTH CHECK con cache de 30 segundos
   */
  private async checkHealthWithCache(): Promise<{ status: string }> {
    const cacheKey = 'memtech:health';
    const cached = this.healthCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30000) {
      return { status: cached.status };
    }

    try {
      // Llamada MCP con timeout
      const result = await this.mcpCall('memtech.health.ping', {}, this.config.mcpTimeoutMs);
      const status = result.ok ? 'online' : 'offline';

      this.healthCache.set(cacheKey, { status, timestamp: Date.now() });
      return { status };
    } catch (error) {
      this.healthCache.set(cacheKey, { status: 'offline', timestamp: Date.now() });
      return { status: 'offline' };
    }
  }

  /**
   * PACK CONTEXT - Consulta obligatoria L0-L3
   */
  private async packContext(input: string): Promise<{ hot: any[]; retrieved: any[] }> {
    try {
      // L0-L1: Router rápido
      const hot = await this.mcpCall(
        'memtech.router.pack',
        {
          goal: input,
          budgetTokens: 4000,
        },
        this.config.mcpTimeoutMs
      );

      // L2-L3: Búsqueda profunda
      const retrieved = await this.mcpCall(
        'memtech.search',
        {
          query: input,
          tags: ['analysis', 'context', 'learning'],
          limit: 10,
        },
        this.config.mcpTimeoutMs
      );

      return {
        hot: hot.data?.hot || [],
        retrieved: retrieved.data?.results || [],
      };
    } catch (error) {
      console.error('Context pack failed:', error);
      return { hot: [], retrieved: [] };
    }
  }

  /**
   * CREATE CHECKPOINT - Trazabilidad obligatoria
   */
  private async createCheckpoint(input: string, runId: string): Promise<string> {
    if (!this.config.checkpointOnStart) {
      return `no-checkpoint-${runId}`;
    }

    try {
      const result = await this.mcpCall(
        'memtech.checkpoint.create',
        {
          name: `memtech-analysis-${runId}`,
          tags: ['analysis', 'auto-generated'],
          metadata: { input, runId },
        },
        this.config.mcpTimeoutMs
      );

      return result.data?.checkpointId || `checkpoint-${runId}`;
    } catch (error) {
      console.warn('Checkpoint creation failed:', error);
      return `checkpoint-${runId}`;
    }
  }

  /**
   * LOCK MANAGEMENT - Evitar duplicidades
   */
  private async acquireLock(key: string, ttlMs: number): Promise<void> {
    const existing = this.locks.get(key);
    if (existing && existing.expires > Date.now()) {
      throw new Error(`🔒 Operation already in progress for: ${key}`);
    }

    this.locks.set(key, { expires: Date.now() + ttlMs });
  }

  private async releaseLock(key: string): Promise<void> {
    this.locks.delete(key);
  }

  /**
   * MCP CALL con timeout y circuit breaker
   */
  private async mcpCall(tool: string, params: any, timeoutMs: number): Promise<any> {
    const breaker = this.circuitBreaker.get(tool);
    if (breaker && breaker.failures >= this.config.circuitBreaker.maxFailures) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure < this.config.circuitBreaker.resetTimeoutMs) {
        throw new Error(`🔴 Circuit breaker OPEN for ${tool}`);
      }
    }

    try {
      // Usar MCP Gateway real
      const { getMCPGateway } = await import('./mcp-gateway.js');
      const gateway = getMCPGateway();
      const result = await gateway.mcpCall(tool, params, { timeout: timeoutMs });

      if (!result.success) {
        throw new Error(result.error || 'MCP call failed');
      }

      // Reset circuit breaker on success
      this.circuitBreaker.delete(tool);
      return result.data;
    } catch (error) {
      // Update circuit breaker
      const current = this.circuitBreaker.get(tool) || { failures: 0, lastFailure: 0 };
      this.circuitBreaker.set(tool, {
        failures: current.failures + 1,
        lastFailure: Date.now(),
      });
      throw error;
    }
  }

  /**
   * SIMULATE MCP CALL (reemplazar con implementación real)
   */
  private async simulateMCPCall(tool: string, params: any, timeoutMs: number): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          // Simular respuestas según la herramienta
          switch (tool) {
            case 'memtech.health.ping':
              resolve({ ok: true, status: 'online' });
              break;
            case 'memtech.router.pack':
              resolve({ data: { hot: ['context-item-1', 'context-item-2'] } });
              break;
            case 'memtech.search':
              resolve({ data: { results: ['search-result-1', 'search-result-2'] } });
              break;
            case 'memtech.checkpoint.create':
              resolve({ data: { checkpointId: `checkpoint-${Date.now()}` } });
              break;
            default:
              resolve({ ok: true, data: {} });
          }
        },
        Math.min(timeoutMs, 1000)
      );
    });
  }

  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashInput(input: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export default MemoryGuard;
