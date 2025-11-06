/**
 * Circuit Breaker Registry
 * 
 * Gestiona múltiples circuit breakers para diferentes servicios/operaciones
 */

import {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from './circuit-breaker.js';

export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker<any>>();

  /**
   * Obtiene o crea un circuit breaker para un servicio
   */
  getOrCreate<T>(
    name: string,
    config?: Partial<Omit<CircuitBreakerConfig, 'name'>>
  ): CircuitBreaker<T> {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const breaker = new CircuitBreaker<T>({
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...config,
      name,
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Obtiene un circuit breaker existente
   */
  get<T>(name: string): CircuitBreaker<T> | undefined {
    return this.breakers.get(name);
  }

  /**
   * Elimina un circuit breaker
   */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * Obtiene todos los nombres de circuit breakers registrados
   */
  getNames(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * Obtiene las métricas de todos los circuit breakers
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Resetea todos los circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Resetea un circuit breaker específico
   */
  reset(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
      return true;
    }
    return false;
  }
}

/**
 * Instancia global del registry
 */
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

