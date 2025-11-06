/**
 * Centralized Configuration with Validation
 * Task: SF-STABILITY-2025-T4.2
 * Date: 2025-11-05
 */

import { z } from 'zod';

/**
 * Configuration schema with validation
 */
const ConfigSchema = z.object({
  // Server
  server: z.object({
    port: z.number().int().min(1).max(65535).default(3000),
    host: z.string().default('127.0.0.1'),
    env: z.enum(['development', 'staging', 'production']).default('development')
  }),

  // Rate Limiting
  rateLimit: z.object({
    max: z.number().int().min(1).default(100),
    timeWindow: z.string().default('1 minute'),
    enabled: z.boolean().default(true)
  }),

  // Daemon Integration
  daemon: z.object({
    url: z.string().default('http://localhost:3001'),
    enabled: z.boolean().default(true),
    debug: z.boolean().default(false),
    apiKey: z.string().optional(),
    timeout: z.number().int().min(1000).default(5000),
    maxRetries: z.number().int().min(0).default(2),
    retryDelay: z.number().int().min(100).default(500),
    healthCheckInterval: z.number().int().min(5000).default(30000)
  }),

  // Circuit Breaker
  circuitBreaker: z.object({
    failureThreshold: z.number().int().min(1).default(5),
    successThreshold: z.number().int().min(1).default(2),
    resetTimeout: z.number().int().min(1000).default(30000)
  }),

  // Logging
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    pretty: z.boolean().default(true)
  }),

  // Compression
  compression: z.object({
    enabled: z.boolean().default(true),
    threshold: z.number().int().min(0).default(1024),
    level: z.number().int().min(0).max(9).default(6)
  })
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const rawConfig = {
    server: {
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || '127.0.0.1',
      env: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production'
    },
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false'
    },
    daemon: {
      url: process.env.SKILLS_DAEMON_URL || 'http://localhost:3001',
      enabled: process.env.SKILLS_DAEMON_ENHANCED !== 'false',
      debug: process.env.SKILLS_DAEMON_DEBUG === 'true',
      apiKey: process.env.SF_API_KEY,
      timeout: parseInt(process.env.DAEMON_TIMEOUT || '5000'),
      maxRetries: parseInt(process.env.DAEMON_MAX_RETRIES || '2'),
      retryDelay: parseInt(process.env.DAEMON_RETRY_DELAY || '500'),
      healthCheckInterval: parseInt(process.env.DAEMON_HEALTH_CHECK_INTERVAL || '30000')
    },
    circuitBreaker: {
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
      successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '2'),
      resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000')
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as any,
      pretty: process.env.LOG_PRETTY !== 'false'
    },
    compression: {
      enabled: process.env.COMPRESSION_ENABLED !== 'false',
      threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024'),
      level: parseInt(process.env.COMPRESSION_LEVEL || '6')
    }
  };

  // Validate and parse configuration
  const result = ConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error('❌ Configuration validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
}

