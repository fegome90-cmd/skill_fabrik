#!/usr/bin/env node
/**
 * Service Discovery Server - CLI Entry Point (TypeScript)
 * Reads env, starts server, and handles graceful shutdown.
 */
import { startDiscoveryServer } from '../service-discovery-server.js';

type StringMap = Record<string, string | undefined>;

function env(v: StringMap, key: string, fallback: string): string {
  const val = v[key];
  return val === undefined || val === '' ? fallback : val;
}

async function main() {
  try {
    const serverConfig = {
      port: parseInt(env(process.env, 'DISCOVERY_PORT', '8877'), 10),
      host: env(process.env, 'DISCOVERY_HOST', '127.0.0.1'),
      cors: env(process.env, 'DISCOVERY_CORS', 'true') !== 'false',
      logging: env(process.env, 'DISCOVERY_LOGGING', 'true') !== 'false',
    };

    const allowedStrategies = ['round-robin', 'random', 'health-based'] as const;
    type Strategy = (typeof allowedStrategies)[number];
    const rawStrategy = env(process.env, 'DISCOVERY_LB_STRATEGY', 'round-robin');
    const strategy: Strategy = (allowedStrategies as readonly string[]).includes(rawStrategy)
      ? (rawStrategy as Strategy)
      : 'round-robin';

    const discoveryConfig = {
      registry: {
        enabled: true,
        port: serverConfig.port,
        host: serverConfig.host,
      },
      cache: {
        enabled: env(process.env, 'DISCOVERY_CACHE', 'true') !== 'false',
        ttl: parseInt(env(process.env, 'DISCOVERY_CACHE_TTL', '30'), 10),
      },
      loadBalancing: {
        enabled: env(process.env, 'DISCOVERY_LB', 'true') !== 'false',
        strategy,
      },
      healthCheck: {
        enabled: env(process.env, 'DISCOVERY_HEALTH', 'true') !== 'false',
        interval: parseInt(env(process.env, 'DISCOVERY_HEALTH_INTERVAL', '10000'), 10),
        timeout: parseInt(env(process.env, 'DISCOVERY_HEALTH_TIMEOUT', '5000'), 10),
        retries: parseInt(env(process.env, 'DISCOVERY_HEALTH_RETRIES', '3'), 10),
      },
    } as const;

    // Startup
    // eslint-disable-next-line no-console
    console.log('🔍 Starting Service Discovery Server...');
    // eslint-disable-next-line no-console
    console.log(`📍 Configuration: ${JSON.stringify({ serverConfig, discoveryConfig }, null, 2)}`);

    const server = await startDiscoveryServer(discoveryConfig, serverConfig);

    const gracefulShutdown = async (signal: 'SIGINT' | 'SIGTERM') => {
      // eslint-disable-next-line no-console
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start service discovery server:', error);
    process.exit(1);
  }
}

void main();
