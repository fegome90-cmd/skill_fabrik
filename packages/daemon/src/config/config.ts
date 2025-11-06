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
    port: z.number().int().min(1).max(65535).default(3001),
    host: z.string().default('127.0.0.1'),
    env: z.enum(['development', 'staging', 'production']).default('development')
  }),

  // Authentication
  auth: z.object({
    apiKey: z.string().optional(),
    jwtSecret: z.string().optional(),
    requireAuth: z.boolean().default(false)
  }),

  // Rate Limiting
  rateLimit: z.object({
    max: z.number().int().min(1).default(100),
    timeWindow: z.string().default('1 minute'),
    enabled: z.boolean().default(true)
  }),

  // CORS
  cors: z.object({
    origin: z.string().default('*'),
    credentials: z.boolean().default(true)
  }),

  // Database
  database: z.object({
    url: z.string().optional(),
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(5432),
    user: z.string().default('postgres'),
    password: z.string().optional(),
    database: z.string().default('skills_fabrik'),
    ssl: z.boolean().default(false)
  }),

  // File Watcher
  fileWatcher: z.object({
    debounceMs: z.number().int().min(100).default(2000),
    failsafeMs: z.number().int().min(1000).default(6000),
    enabled: z.boolean().default(true)
  }),

  // Quality Service
  quality: z.object({
    enabled: z.boolean().default(true),
    url: z.string().optional()
  }),

  // Service Discovery
  discovery: z.object({
    url: z.string().optional(),
    serviceName: z.string().default('skills-daemon')
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
      port: parseInt(process.env.DAEMON_PORT || '3001'),
      host: process.env.DAEMON_HOST || '127.0.0.1',
      env: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production'
    },
    auth: {
      apiKey: process.env.DAEMON_API_KEY,
      jwtSecret: process.env.DAEMON_JWT_SECRET,
      requireAuth: process.env.DAEMON_REQUIRE_AUTH === 'true'
    },
    rateLimit: {
      max: parseInt(process.env.DAEMON_RATE_LIMIT_MAX || '100'),
      timeWindow: process.env.DAEMON_RATE_LIMIT_WINDOW || '1 minute',
      enabled: process.env.DAEMON_RATE_LIMIT_ENABLED !== 'false'
    },
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS !== 'false'
    },
    database: {
      url: process.env.DATABASE_URL,
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'skills_fabrik',
      ssl: process.env.PGSSL === 'true'
    },
    fileWatcher: {
      debounceMs: parseInt(process.env.FILE_WATCHER_DEBOUNCE || '2000'),
      failsafeMs: parseInt(process.env.FILE_WATCHER_FAILSAFE || '6000'),
      enabled: process.env.FILE_WATCHER_ENABLED !== 'false'
    },
    quality: {
      enabled: process.env.QUALITY_SERVICE_ENABLED !== 'false',
      url: process.env.QUALITY_SERVICE_URL
    },
    discovery: {
      url: process.env.DISCOVERY_URL,
      serviceName: process.env.SERVICE_NAME || 'skills-daemon'
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

