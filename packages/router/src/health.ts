/**
 * Health Check Endpoint for Router Service
 */

import { type FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    const startTime = Date.now();

    try {
      // Check daemon dependency
      const daemonHealthy = await checkDaemonHealth();

      const health = {
        status: daemonHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'router-service',
        dependencies: {
          daemon: {
            url: process.env.DAEMON_URL || 'http://127.0.0.1:7727',
            status: daemonHealthy ? 'healthy' : 'unhealthy',
            responseTime: `${Date.now() - startTime}ms`
          }
        },
        metrics: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          responseTime: Date.now() - startTime
        },
        endpoints: {
          health: '/health',
          preInvokeHook: '/pre-invoke',
          stopHook: '/stop',
          activation: '/activation',
          guardrails: '/guardrails'
        }
      };

      const statusCode = daemonHealthy ? 200 : 503;
      reply.code(statusCode).send(health);

    } catch (error) {
      reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'router-service',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Basic root endpoint
  fastify.get('/', async (request, reply) => {
    reply.send({
      service: 'router-service',
      status: 'running',
      endpoints: {
        health: '/health'
      }
    });
  });
}

async function checkDaemonHealth(): Promise<boolean> {
  try {
    const daemonUrl = process.env.DAEMON_URL || 'http://127.0.0.1:7727';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${daemonUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}