/**
 * Router Service HTTP Server
 */

import Fastify from 'fastify';
import { healthRoutes } from './health.js';
import { userPromptSubmitHook } from './pre-invoke.js';
import { stopHook } from './stop.js';
import { loadRules, matchRulesFor } from './detectors.js';
import { checkGuardrails } from './guardrails.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';

async function createServer() {
  const fastify = Fastify({
    logger: false,
  });

  // Register health routes
  await fastify.register(healthRoutes);

  // API routes for router functionality
  fastify.post('/pre-invoke', async (request: any, reply: any) => {
    try {
      const result = await userPromptSubmitHook(request.body);
      reply.send({ success: true, result });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.post('/stop', async (request: any, reply: any) => {
    try {
      const result = await stopHook(request.body);
      reply.send({ success: true, result });
    } catch (error) {
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
      const result = await checkGuardrails(request.body.editLog, request.body.cwd || process.cwd());
      reply.send({ success: true, result });
    } catch (error) {
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

    await server.listen({
      port: PORT,
      host: HOST,
    });

    console.log(`🚀 Router service started on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);

    // Signal PM2 that server is ready (if running under PM2)
    if (process.send) {
      process.send('ready');
    }

    return server;
  } catch (error) {
    console.error('❌ Failed to start router service:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
