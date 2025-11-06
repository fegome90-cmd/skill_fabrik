/**
 * Redis client for direct L1 access
 * Enhanced with automatic reconnection, health checks, and graceful degradation
 * Based on ADR patterns from startkit-main
 */

import { createClient, RedisClientType } from 'redis';
import { getConfig } from './config.js';

let coreClient: RedisClientType | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 1000;
const HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds
let healthCheckInterval: NodeJS.Timeout | null = null;

async function getCoreClient(): Promise<RedisClientType> {
  if (coreClient) {
    try {
      // Check if connection is still alive with timeout
      await Promise.race([
        coreClient.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 2000)
        )
      ]);
      return coreClient;
    } catch {
      // Connection lost, reset client
      console.warn('[Redis Core] Connection lost, resetting client...');
      coreClient = null;
      reconnectAttempts = 0;
    }
  }

  const config = getConfig().redisCore;

  const clientOptions: {
    url?: string;
    password?: string;
    socket?: {
      reconnectStrategy: (retries: number) => number | Error;
      connectTimeout?: number;
    };
  } = {
    url: config.url,
  };

  if (config.password) {
    clientOptions.password = config.password;
  }

  // Enhanced reconnection strategy based on ADR-012
  clientOptions.socket = {
    reconnectStrategy: (retries: number) => {
      reconnectAttempts = retries;
      if (retries > MAX_RECONNECT_ATTEMPTS) {
        const error = new Error(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
        console.error('[Redis Core]', error.message);
        return error;
      }
      const delay = Math.min(retries * RECONNECT_DELAY_MS, 3000);
      console.warn(`[Redis Core] Reconnecting in ${delay}ms (attempt ${retries}/${MAX_RECONNECT_ATTEMPTS})...`);
      return delay;
    },
    connectTimeout: 5000, // 5 seconds timeout
  };

  try {
    coreClient = createClient(clientOptions) as RedisClientType;

    // Enhanced error handling based on ADR-014 and ADR-019
    coreClient.on('error', (err: Error) => {
      console.error('[Redis Core] connection error:', err.message);
      // Don't reset client on error, let reconnectStrategy handle it
    });

    coreClient.on('connect', () => {
      console.log('[Redis Core] Connecting...');
    });

    coreClient.on('ready', () => {
      console.log('[Redis Core] Connection ready');
      reconnectAttempts = 0;
      // Start periodic health checks based on ADR-019 pattern
      startHealthChecks();
    });

    coreClient.on('reconnecting', () => {
      console.warn('[Redis Core] Reconnecting...');
    });

    if (!coreClient.isOpen) {
      await coreClient.connect();
    }

    return coreClient;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Redis Core] Failed to create client:', errorMessage);
    throw new Error(`Redis Core connection failed: ${errorMessage}`);
  }
}

/**
 * Periodic health checks based on ADR-019 pattern
 */
function startHealthChecks(): void {
  if (healthCheckInterval) {
    return;
  }

  healthCheckInterval = setInterval(async () => {
    if (coreClient) {
      try {
        await Promise.race([
          coreClient.ping(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 2000)
          )
        ]);
        // Connection is healthy
      } catch (error) {
        console.warn('[Redis Core] Health check failed:', error instanceof Error ? error.message : String(error));
        // Connection will be reset on next getCoreClient call
      }
    }
  }, HEALTH_CHECK_INTERVAL_MS);
}

/**
 * Stop health checks
 */
function stopHealthChecks(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

/**
 * Store item in L1 (Redis Core)
 * Enhanced with retry logic based on ADR-012
 */
export async function setL1Item(
  key: string,
  value: string,
  ttlSeconds: number = 86400 // 24 hours default
): Promise<void> {
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await getCoreClient();
      const prefixedKey = `memtech:L1:${key}`;
      await client.set(prefixedKey, value, { EX: ttlSeconds });
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = attempt * 200; // Exponential backoff: 200ms, 400ms
        console.warn(`[Redis Core] setL1Item failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Reset client for next attempt
        if (coreClient) {
          coreClient = null;
        }
      }
    }
  }

  throw new Error(`Failed to set L1 item after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Get item from L1
 * Enhanced with retry logic
 */
export async function getL1Item(key: string): Promise<string | null> {
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await getCoreClient();
      const prefixedKey = `memtech:L1:${key}`;
      return await client.get(prefixedKey);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = attempt * 200;
        console.warn(`[Redis Core] getL1Item failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        if (coreClient) {
          coreClient = null;
        }
      }
    }
  }

  // Return null instead of throwing for read operations (graceful degradation)
  console.warn(`[Redis Core] Failed to get L1 item after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  return null;
}

/**
 * Delete item from L1
 */
export async function deleteL1Item(key: string): Promise<void> {
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await getCoreClient();
      const prefixedKey = `memtech:L1:${key}`;
      await client.del(prefixedKey);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = attempt * 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        if (coreClient) {
          coreClient = null;
        }
      }
    }
  }

  throw new Error(`Failed to delete L1 item after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Test Redis connection
 * Based on ADR-019 health check pattern
 */
export async function testConnection(): Promise<{ connected: boolean; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    const client = await getCoreClient();
    await client.ping();
    const latency = Date.now() - start;
    return { connected: true, latency };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  stopHealthChecks();
  if (coreClient && coreClient.isOpen) {
    await coreClient.quit();
    coreClient = null;
  }
  reconnectAttempts = 0;
}
