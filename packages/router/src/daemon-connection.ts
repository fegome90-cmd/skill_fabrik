/**
 * Daemon Connection Manager - Optimización router-daemon
 * Proporciona conexión resiliente con circuit breaker, retry y fallback
 */

import { performance } from 'perf_hooks';

/**
 * Configuración de conexión al daemon
 */
interface DaemonConnectionConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  enableCache: boolean;
  cacheTTL: number;
}

/**
 * Estado del circuit breaker
 */
interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

/**
 * Métricas de conexión
 */
export interface ConnectionMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  averageLatency: number;
  circuitBreakerOpens: number;
  fallbackActivations: number;
}

/**
 * Opciones de request con timeout
 */
interface RequestOptions {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  fallback?: () => Promise<any>;
  method?: string;
  body?: any;
}

/**
 * Cache simple en memoria para respuestas frecuentes
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Gestor de conexión optimizada al daemon
 */
export class DaemonConnectionManager {
  private config: DaemonConnectionConfig;
  private circuitBreaker: CircuitBreakerState;
  private cache: MemoryCache;
  private metrics: ConnectionMetrics;
  private latencies: number[] = [];

  constructor(config: Partial<DaemonConnectionConfig> = {}) {
    this.config = {
      baseURL: 'http://127.0.0.1:7727',
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      enableCache: true,
      cacheTTL: 300000, // 5 minutos
      ...config
    };

    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    };

    this.cache = new MemoryCache();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      averageLatency: 0,
      circuitBreakerOpens: 0,
      fallbackActivations: 0
    };
  }

  /**
   * Verifica si el circuit breaker está abierto
   */
  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreaker.isOpen) {
      if (Date.now() >= this.circuitBreaker.nextAttemptTime) {
        // Intentar resetear el circuit breaker (half-open state)
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failureCount = 0;
        console.log('🔄 Circuit breaker reset to half-open state');
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Registra un fallo en el circuit breaker
   */
  private recordFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
      this.circuitBreaker.isOpen = true;
      this.circuitBreaker.nextAttemptTime = Date.now() + this.config.circuitBreakerTimeout;
      this.metrics.circuitBreakerOpens++;
      console.log(`⚠️ Circuit breaker OPENED after ${this.circuitBreaker.failureCount} failures`);
    }
  }

  /**
   * Registra un éxito para resetear el circuit breaker
   */
  private recordSuccess(): void {
    if (this.circuitBreaker.failureCount > 0) {
      this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 1);
    }
    if (this.circuitBreaker.isOpen) {
      this.circuitBreaker.isOpen = false;
      console.log('✅ Circuit breaker CLOSED after successful request');
    }
  }

  /**
   * Realiza request HTTP con timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Realiza request con retry y circuit breaker
   */
  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Verificar circuit breaker
      if (this.isCircuitBreakerOpen()) {
        throw new Error('Circuit breaker is OPEN');
      }

      // Intentar cache primero
      if (this.config.enableCache && options.useCache !== false && options.cacheKey) {
        const cached = this.cache.get(options.cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          const endTime = performance.now();
          this.updateLatency(endTime - startTime);
          return cached;
        }
      }

      const url = `${this.config.baseURL}${endpoint}`;
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'skills-fabrik-router/1.0'
        },
        body: JSON.stringify(options.body || {}),
      };

      const timeout = options.timeout || this.config.timeout;
      const maxRetries = options.retries || this.config.retryAttempts;
      const retryDelay = this.config.retryDelay;

      let lastError: Error | null = null;

      // Retry loop
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for ${endpoint}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          }

          const response = await this.fetchWithTimeout(url, requestOptions, timeout);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          // Cache exit response
          if (this.config.enableCache && options.useCache !== false && options.cacheKey) {
            const cacheTTL = options.cacheTTL || this.config.cacheTTL;
            this.cache.set(options.cacheKey, data, cacheTTL);
          }

          this.recordSuccess();
          this.metrics.successfulRequests++;

          const endTime = performance.now();
          this.updateLatency(endTime - startTime);

          return data;

        } catch (error) {
          lastError = error as Error;

          if (attempt === maxRetries) {
            this.recordFailure();
            this.metrics.failedRequests++;
          }

          // Si es error de red o timeout, reintentar
          if (error instanceof Error &&
              (error.message.includes('fetch') ||
               error.message.includes('timeout') ||
               error.message.includes('AbortError'))) {
            continue;
          }

          // Para otros errores, no reintentar
          break;
        }
      }

      throw lastError || new Error('Request failed after retries');

    } catch (error) {
      // Intentar fallback si está disponible
      if (options.fallback) {
        console.log(`🔄 Using fallback for ${endpoint} due to: ${error instanceof Error ? error.message : String(error)}`);
        this.metrics.fallbackActivations++;

        try {
          const fallbackResult = await options.fallback();
          const endTime = performance.now();
          this.updateLatency(endTime - startTime);
          return fallbackResult;
        } catch (fallbackError) {
          console.error(`❌ Fallback failed for ${endpoint}:`, fallbackError);
        }
      }

      this.metrics.failedRequests++;
      const endTime = performance.now();
      this.updateLatency(endTime - startTime);

      throw error;
    }
  }

  /**
   * Actualiza métricas de latencia
   */
  private updateLatency(latency: number): void {
    this.latencies.push(latency);

    // Mantener solo las últimas 100 mediciones
    if (this.latencies.length > 100) {
      this.latencies = this.latencies.slice(-100);
    }

    // Calcular promedio
    this.metrics.averageLatency = this.latencies.reduce((sum, l) => sum + l, 0) / this.latencies.length;
  }

  /**
   * Obtiene métricas de conexión
   */
  getMetrics(): ConnectionMetrics & {
    cacheSize: number;
    circuitBreakerOpen: boolean;
    failureRate: number;
    cacheHitRate: number;
  } {
    return {
      ...this.metrics,
      cacheSize: this.cache.size(),
      circuitBreakerOpen: this.circuitBreaker.isOpen,
      failureRate: this.metrics.totalRequests > 0 ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 : 0,
      cacheHitRate: this.metrics.totalRequests > 0 ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 : 0
    };
  }

  /**
   * Limpia cache y resetea métricas
   */
  reset(): void {
    this.cache.clear();
    this.latencies = [];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      averageLatency: 0,
      circuitBreakerOpens: 0,
      fallbackActivations: 0
    };
    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    };
  }

  /**
   * Cierra el circuit breaker manualmente (para mantenimiento)
   */
  openCircuitBreaker(): void {
    this.circuitBreaker.isOpen = true;
    this.circuitBreaker.nextAttemptTime = Date.now() + this.config.circuitBreakerTimeout;
    console.log('🔴 Circuit breaker OPENED manually');
  }

  /**
   * Cierra el circuit breaker manualmente
   */
  closeCircuitBreaker(): void {
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failureCount = 0;
    console.log('🟢 Circuit breaker CLOSED manually');
  }
}

/**
 * Instancia global del gestor de conexión
 */
export const daemonConnection = new DaemonConnectionManager();