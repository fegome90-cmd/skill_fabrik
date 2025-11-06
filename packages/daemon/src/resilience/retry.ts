/**
 * Retry Logic con Backoff Exponencial
 * 
 * Implementa retry automático con backoff exponencial y jitter
 * para operaciones que pueden fallar temporalmente.
 */

export interface RetryConfig {
  /** Número máximo de intentos (incluyendo el primero) */
  maxAttempts: number;
  /** Delay inicial en ms */
  initialDelay: number;
  /** Factor de multiplicación para el backoff exponencial */
  backoffMultiplier: number;
  /** Delay máximo en ms */
  maxDelay: number;
  /** Agregar jitter aleatorio para evitar thundering herd */
  jitter: boolean;
  /** Función para determinar si un error es retryable */
  isRetryable?: (error: Error) => boolean;
  /** Callback ejecutado antes de cada retry */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  /** Nombre de la operación para métricas */
  operationName?: string;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Configuración por defecto para retry
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 segundo
  backoffMultiplier: 2,
  maxDelay: 30000, // 30 segundos
  jitter: true,
};

/**
 * Determina si un error es retryable por defecto
 */
function defaultIsRetryable(error: Error): boolean {
  // Errores de red/timeout son retryables
  const retryablePatterns = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'timeout',
    'network',
    'connection',
  ];

  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Calcula el delay para el siguiente intento con backoff exponencial
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Backoff exponencial: initialDelay * (backoffMultiplier ^ attempt)
  let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  
  // Aplicar límite máximo
  delay = Math.min(delay, config.maxDelay);
  
  // Agregar jitter si está habilitado
  if (config.jitter) {
    // Jitter entre 0% y 25% del delay
    const jitterAmount = delay * 0.25 * Math.random();
    delay = delay + jitterAmount;
  }
  
  return Math.floor(delay);
}

/**
 * Ejecuta una función con retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
    isRetryable: config.isRetryable || defaultIsRetryable,
  };

  let lastError: Error = new Error('Unknown error');
  const { recordRetryAttempt, recordRetrySuccess, recordRetryExhausted } = await import('../metrics.js');
  const op = finalConfig.operationName || 'generic';
  
  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      const result = await fn();
      recordRetrySuccess(op);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Verificar si el error es retryable
      const isRetryable = finalConfig.isRetryable!(lastError);
      
      if (!isRetryable) {
        // Error no retryable, lanzar inmediatamente
        throw lastError;
      }
      
      // Si es el último intento, no hacer retry
      if (attempt === finalConfig.maxAttempts - 1) {
        recordRetryExhausted(op);
        break;
      }
      
      // Calcular delay para el siguiente intento
      const delay = calculateDelay(attempt, finalConfig);
      
      // Ejecutar callback si existe
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt + 1, lastError, delay);
      }
      
      recordRetryAttempt(op);
      // Esperar antes del siguiente intento
      await sleep(delay);
    }
  }
  
  // Todos los intentos fallaron
  throw new RetryError(
    `Operation failed after ${finalConfig.maxAttempts} attempts: ${lastError.message}`,
    finalConfig.maxAttempts,
    lastError
  );
}

/**
 * Utilidad para esperar un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Crea una función retryable a partir de una función normal
 */
export function retryable<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): () => Promise<T> {
  return () => withRetry(fn, config);
}

/**
 * Decorator para métodos que necesitan retry
 */
export function Retryable(config?: Partial<RetryConfig>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(
        () => originalMethod.apply(this, args),
        config
      );
    };

    return descriptor;
  };
}
