/**
 * Circuit Breaker Implementation
 * 
 * Implementa el patrón Circuit Breaker para prevenir errores en cascada
 * y mejorar la resiliencia del sistema.
 * 
 * Estados:
 * - CLOSED: Operación normal, todas las requests pasan
 * - OPEN: Circuito abierto, rechaza requests inmediatamente
 * - HALF_OPEN: Prueba si el servicio se recuperó
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Número de fallos consecutivos antes de abrir el circuito */
  failureThreshold: number;
  /** Número de éxitos consecutivos en HALF_OPEN para cerrar el circuito */
  successThreshold: number;
  /** Tiempo en ms que el circuito permanece abierto antes de intentar HALF_OPEN */
  resetTimeout: number;
  /** Timeout en ms para considerar una operación como fallida */
  timeout: number;
  /** Nombre del circuito para métricas */
  name: string;
}

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  openedAt: number | null;
}

export class CircuitBreakerError extends Error {
  constructor(message: string, public readonly state: CircuitBreakerState) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker<T> {
  private state: CircuitBreakerState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private nextAttempt = 0;
  
  // Métricas acumuladas
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private openedAt: number | null = null;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Ejecuta una función protegida por el circuit breaker
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Si el circuito está abierto
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitBreakerError(
          `Circuit breaker "${this.config.name}" is OPEN`,
          'OPEN'
        );
      }
      // Tiempo de reset alcanzado, intentar HALF_OPEN
      this.state = 'HALF_OPEN';
      this.successes = 0;
    }

    try {
      // Ejecutar con timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Ejecuta una función con timeout
   */
  private async executeWithTimeout(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timeout after ${this.config.timeout}ms`)),
          this.config.timeout
        )
      ),
    ]);
  }

  /**
   * Maneja el éxito de una operación
   */
  private onSuccess(): void {
    this.failures = 0;
    this.lastSuccessTime = Date.now();
    this.totalSuccesses++;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        // Cerrar el circuito
        this.state = 'CLOSED';
        this.openedAt = null;
      }
    }
  }

  /**
   * Maneja el fallo de una operación
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.totalFailures++;

    if (this.state === 'HALF_OPEN') {
      // En HALF_OPEN, cualquier fallo vuelve a abrir el circuito
      this.open();
    } else if (this.failures >= this.config.failureThreshold) {
      // En CLOSED, abrir si se alcanza el threshold
      this.open();
    }
  }

  /**
   * Abre el circuito
   */
  private open(): void {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.config.resetTimeout;
    this.openedAt = Date.now();
    this.successes = 0;
  }

  /**
   * Obtiene el estado actual del circuit breaker
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Obtiene las métricas del circuit breaker
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      openedAt: this.openedAt,
    };
  }

  /**
   * Resetea el circuit breaker a su estado inicial
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = 0;
    this.openedAt = null;
  }

  /**
   * Obtiene el nombre del circuit breaker
   */
  getName(): string {
    return this.config.name;
  }
}

/**
 * Configuración por defecto para circuit breakers
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: Omit<CircuitBreakerConfig, 'name'> = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30000, // 30 segundos
  timeout: 60000, // 60 segundos
};

