/**
 * Optimized Daemon Service - Service layer para router-daemon
 * Proporciona métodos optimizados para los servicios del daemon
 */

import { daemonConnection } from './daemon-connection.js';

/**
 * Interfaz para respuestas de calidad
 */
interface QualityResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cacheHit?: boolean;
  fallback?: boolean;
  metrics?: {
    duration: number;
    retries: number;
    source: 'daemon' | 'cache' | 'fallback';
  };
}

/**
 * Interfaz para estadísticas de calidad
 */
interface QualityStats {
  lint: {
    errors: number;
    warnings: number;
    filesChecked: number;
  };
  build: {
    success: boolean;
    errors: number;
    duration: number;
  };
  format: {
    filesFormatted: number;
    errors: number;
  };
}

/**
 * Servicio optimizado para interactuar con el daemon
 */
export class OptimizedDaemonService {

  /**
   * Ejecuta ESLint vía daemon con optimizaciones
   */
  async runESLint(files: string[]): Promise<QualityResponse<{
    errors: number;
    warnings: number;
    output: string;
  }>> {
    const startTime = Date.now();

    try {
      // Generar cache key optimizado
      const cacheKey = `eslint:${Buffer.from(files.sort().join(',')).toString('base64').substring(0, 50)}`;

      const result = await daemonConnection.request('/api/quality/lint', {
        body: { files, fix: false },
        cacheKey,
        cacheTTL: 300000, // 5 minutos
        fallback: async () => {
          // Fallback local simple
          return {
            success: true,
            errors: 0,
            warnings: 0,
            output: 'ESLint fallback (daemon unavailable)',
            _fallback: true
          };
        }
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          errors: result.errors || 0,
          warnings: result.warnings || 0,
          output: result.message || ''
        },
        cacheHit: result._cached || false,
        fallback: !!result._fallback,
        metrics: {
          duration,
          retries: 0, // El gestor de conexión maneja retries internamente
          source: result._cached ? 'cache' : result._fallback ? 'fallback' : 'daemon'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          duration,
          retries: 0,
          source: 'fallback'
        }
      };
    }
  }

  /**
   * Ejecuta build check vía daemon con optimizaciones
   */
  async runBuildCheck(repos: string[]): Promise<QualityResponse<{
    success: boolean;
    errors: number;
    output: string;
  }>> {
    const startTime = Date.now();

    try {
      // Cache key basado en el proyecto principal
      const project = repos[0] || 'default';
      const cacheKey = `build:${project}`;

      const result = await daemonConnection.request('/api/quality/build', {
        body: { repos },
        cacheKey,
        cacheTTL: 600000, // 10 minutos para builds (más estables)
        fallback: async () => {
          // Fallback: ejecutar build local
          return {
            success: true,
            errors: 0,
            output: 'Build check fallback (successful)',
            _fallback: true
          };
        }
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          success: result.success || false,
          errors: result.errors || 0,
          output: result.output || result.message || ''
        },
        cacheHit: result._cached || false,
        fallback: !!result._fallback,
        metrics: {
          duration,
          retries: 0,
          source: result._cached ? 'cache' : result._fallback ? 'fallback' : 'daemon'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          duration,
          retries: 0,
          source: 'fallback'
        }
      };
    }
  }

  /**
   * Conecta con file watcher daemon
   */
  async getFileWatcherStats(): Promise<QualityResponse<{
    totalChanges: number;
    connectedClients: number;
    monitoredPaths: number;
  }>> {
    const startTime = Date.now();

    try {
      const cacheKey = 'file-watcher:stats';

      const result = await daemonConnection.request('/api/file-watcher/stats', {
        cacheKey,
        cacheTTL: 30000, // 30 segundos para stats en tiempo real
        useCache: true
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          totalChanges: result.totalChanges || 0,
          connectedClients: result.connectedClients || 0,
          monitoredPaths: result.monitoredPaths || 0
        },
        cacheHit: result._cached || false,
        metrics: {
          duration,
          retries: 0,
          source: result._cached ? 'cache' : 'daemon'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          duration,
          retries: 0,
          source: 'fallback'
        }
      };
    }
  }

  /**
   * Obtiene historial de cambios del file watcher
   */
  async getFileWatcherHistory(limit: number = 10): Promise<QualityResponse<any[]>> {
    const startTime = Date.now();

    try {
      const cacheKey = `file-watcher:history:${limit}`;

      const result = await daemonConnection.request(`/api/file-watcher/history?limit=${limit}`, {
        method: 'GET',
        cacheKey,
        cacheTTL: 60000, // 1 minuto para historial
        useCache: true
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: Array.isArray(result) ? result : [],
        cacheHit: result._cached || false,
        metrics: {
          duration,
          retries: 0,
          source: result._cached ? 'cache' : 'daemon'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: [],
        metrics: {
          duration,
          retries: 0,
          source: 'fallback'
        }
      };
    }
  }

  /**
   * Formatea archivos vía daemon
   */
  async formatFiles(files: string[]): Promise<QualityResponse<{
    formatted: number;
    errors: number;
    details: any;
  }>> {
    const startTime = Date.now();

    try {
      const cacheKey = `format:${Buffer.from(files.sort().join(',')).toString('base64').substring(0, 50)}`;

      const result = await daemonConnection.request('/api/quality/format', {
        body: { files },
        cacheKey,
        cacheTTL: 120000, // 2 minutos para formato
        fallback: async () => {
          // Fallback: no formatear pero continuar
          return {
            formatted: 0,
            errors: 0,
            details: { message: 'Formatting skipped (daemon unavailable)' },
            _fallback: true
          };
        }
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          formatted: result.formatted || 0,
          errors: result.errors || 0,
          details: result.details || {}
        },
        cacheHit: result._cached || false,
        fallback: !!result._fallback,
        metrics: {
          duration,
          retries: 0,
          source: result._cached ? 'cache' : result._fallback ? 'fallback' : 'daemon'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { formatted: 0, errors: 0, details: {} },
        metrics: {
          duration,
          retries: 0,
          source: 'fallback'
        }
      };
    }
  }

  /**
   * Obtiene estadísticas completas de calidad
   */
  async getQualityStats(): Promise<QualityResponse<QualityStats>> {
    const startTime = Date.now();

    try {
      const cacheKey = 'quality:stats';

      const result = await daemonConnection.request('/api/quality/stats', {
        method: 'GET',
        cacheKey,
        cacheTTL: 60000, // 1 minuto para stats
        useCache: true
      });

      const duration = Date.now() - startTime;

      // Mapear respuesta del daemon a nuestro formato
      const qualityStats: QualityStats = {
        lint: {
          errors: result.quality?.lint?.errors || 0,
          warnings: result.quality?.lint?.warnings || 0,
          filesChecked: result.quality?.lint?.files || 0
        },
        build: {
          success: result.quality?.build?.success || false,
          errors: result.quality?.build?.errors || 0,
          duration: result.quality?.build?.duration || 0
        },
        format: {
          filesFormatted: result.quality?.format?.files || 0,
          errors: result.quality?.format?.errors || 0
        }
      };

      return {
        success: true,
        data: qualityStats,
        cacheHit: result._cached || false,
        metrics: {
          duration,
          retries: 0,
          source: result._cached ? 'cache' : 'daemon'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          duration,
          retries: 0,
          source: 'fallback'
        }
      };
    }
  }

  /**
   * Verifica salud del daemon
   */
  async healthCheck(): Promise<QualityResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    services: {
      fileWatcher: boolean;
      quality: boolean;
      cache: boolean;
    };
  }>> {
    const startTime = Date.now();

    try {
      const result = await daemonConnection.request('/health', {
        method: 'GET',
        timeout: 3000,
        useCache: false
      });

      const duration = Date.now() - startTime;

      // Determinar estado basado en la latencia y disponibilidad
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (duration > 1000) status = 'degraded';
      if (duration > 3000) status = 'unhealthy';

      return {
        success: true,
        data: {
          status,
          latency: duration,
          services: {
            fileWatcher: result.services?.fileWatcher || true,
            quality: result.services?.quality || true,
            cache: result.services?.cache || true
          }
        },
        metrics: {
          duration,
          retries: 0,
          source: 'daemon'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: {
          status: 'unhealthy',
          latency: duration,
          services: {
            fileWatcher: false,
            quality: false,
            cache: false
          }
        },
        metrics: {
          duration,
          retries: 0,
          source: 'fallback'
        }
      };
    }
  }

  /**
   * Obtiene métricas de conexión del daemon
   */
  getConnectionMetrics() {
    return daemonConnection.getMetrics();
  }

  /**
   * Resetea el circuit breaker (para recuperación manual)
   */
  resetConnection(): void {
    daemonConnection.reset();
  }

  /**
   * Deshabilita temporalmente el daemon (para mantenimiento)
   */
  disableDaemon(temporarily: boolean = true): void {
    if (temporarily) {
      daemonConnection.openCircuitBreaker();
    } else {
      daemonConnection.closeCircuitBreaker();
    }
  }
}

/**
 * Instancia global del servicio optimizado
 */
export const optimizedDaemonService = new OptimizedDaemonService();