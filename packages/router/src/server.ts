/**
 * Router Service HTTP Server
 * Updated: 2025-11-05 - Added validation and rate limiting (SF-STABILITY-2025-T1.1)
 * Updated: 2025-11-05 - Added graceful shutdown (SF-STABILITY-2025-T1.2)
 * Updated: 2025-11-05 - Added structured logging (SF-STABILITY-2025-T2.4)
 */

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import { healthRoutes } from './health.js';
import { userPromptSubmitHook } from './pre-invoke.js';
import { stopHook } from './stop.js';
import { loadRules, matchRulesFor } from './detectors.js';
import { checkGuardrails } from './guardrails.js';
import {
  validatePreInvoke,
  validateGuardrails,
  validateStop,
  formatValidationErrors
} from './schemas/validation.js';
import { GracefulShutdown } from './shutdown.js';
import { logger, requestIdMiddleware, requestLoggingMiddleware } from './logger.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';

async function createServer() {
  const fastify = Fastify({
    logger: false, // We use our own logger
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: true // We handle this ourselves
  });

  // Register request ID middleware (Task: SF-STABILITY-2025-T2.4)
  fastify.addHook('onRequest', requestIdMiddleware());

  // Register request logging middleware (Task: SF-STABILITY-2025-T2.4)
  fastify.addHook('onRequest', requestLoggingMiddleware());

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1', '::1'],
    skipOnError: true,
    errorResponseBuilder: () => ({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      statusCode: 429
    })
  });

  // Task: SF-STABILITY-2025-T4.3 - Add HTTP compression
  await fastify.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['gzip', 'deflate'],
    zlibOptions: {
      level: 6 // Balanced compression level
    }
  });

  // Register health routes
  await fastify.register(healthRoutes);

  // API routes for router functionality
  fastify.post('/pre-invoke', async (request: any, reply: any) => {
    try {
      // Validate request body
      if (!validatePreInvoke(request.body)) {
        request.log.warn({
          validationErrors: formatValidationErrors(validatePreInvoke.errors)
        }, 'Validation failed for /pre-invoke');

        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: formatValidationErrors(validatePreInvoke.errors)
        });
      }

      const result = await userPromptSubmitHook(request.body);

      request.log.info({
        promptLength: request.body.prompt?.length,
        filesCount: request.body.openFiles?.length
      }, 'Pre-invoke hook executed successfully');

      reply.send({ success: true, result });
    } catch (error) {
      request.log.error({
        err: error,
        body: request.body
      }, 'Error in /pre-invoke endpoint');

      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.post('/stop', async (request: any, reply: any) => {
    try {
      // Validate request body
      if (!validateStop(request.body)) {
        request.log.warn({
          validationErrors: formatValidationErrors(validateStop.errors)
        }, 'Validation failed for /stop');

        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: formatValidationErrors(validateStop.errors)
        });
      }

      const result = await stopHook(request.body);

      request.log.info('Stop hook executed successfully');

      reply.send({ success: true, result });
    } catch (error) {
      request.log.error({
        err: error
      }, 'Error in /stop endpoint');

      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.get('/rules', async (request: any, reply: any) => {
    try {
      const rules = await loadRules();
      reply.send({ success: true, rules });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.post('/match-rules', async (request: any, reply: any) => {
    try {
      const rules = await loadRules();
      const matches = await matchRulesFor(request.body.input, rules);
      reply.send({ success: true, matches });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.post('/guardrails', async (request: any, reply: any) => {
    try {
      // Validate request body
      if (!validateGuardrails(request.body)) {
        request.log.warn({
          validationErrors: formatValidationErrors(validateGuardrails.errors)
        }, 'Validation failed for /guardrails');

        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: formatValidationErrors(validateGuardrails.errors)
        });
      }

      const result = await checkGuardrails(request.body.editLog, request.body.cwd || process.cwd());

      request.log.info({
        editLogCount: request.body.editLog?.length
      }, 'Guardrails check executed successfully');

      reply.send({ success: true, result });
    } catch (error) {
      request.log.error({
        err: error
      }, 'Error in /guardrails endpoint');

      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return fastify;
}

export async function startServer() {
  try {
    const server = await createServer();

    // Setup graceful shutdown (Task: SF-STABILITY-2025-T2.4 - Use structured logger)
    const shutdown = new GracefulShutdown(server, {
      timeout: 30000,
      logger: logger
    });

    // Update health check to consider shutdown state
    server.get('/health/ready', async (request, reply) => {
      if (!shutdown.isHealthy()) {
        return reply.code(503).send({
          status: 'shutting_down',
          timestamp: new Date().toISOString()
        });
      }

      return {
        status: 'ready',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    });

    await server.listen({
      port: PORT,
      host: HOST,
    });

    logger.info({
      host: HOST,
      port: PORT,
      env: process.env.NODE_ENV || 'development'
    }, '🚀 Router service started');

    logger.info({
      healthUrl: `http://${HOST}:${PORT}/health`,
      readinessUrl: `http://${HOST}:${PORT}/health/ready`
    }, '📊 Health endpoints available');

    // Signal PM2 that server is ready (if running under PM2)
    if (process.send) {
      process.send('ready');
      logger.info('Signaled PM2 that server is ready');
    }

    return server;
  } catch (error) {
    logger.fatal({
      err: error,
      host: HOST,
      port: PORT
    }, '❌ Failed to start router service');
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
