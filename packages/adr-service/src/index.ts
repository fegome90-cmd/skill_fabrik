/**
 * ACE-ADR Integration Service
 * Runs on port 7730 (compatible with Skills Fabric on port 3000)
 *
 * Architecture:
 * - ComplexityDetector: Analyzes conversation/solution complexity
 * - ADROrchestrator: Invokes ACE agents (Generator, Reflector, Curator)
 * - ADRPatternMiner: Daily cron job to mine patterns
 * - SkillGenerator: Generates skills from ADR patterns
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import { ComplexityDetector } from './detector/complexity-detector.js';
import { ADROrchestrator } from './orchestrator/adr-orchestrator.js';
import { ADRPatternMiner } from './miner/adr-pattern-miner.js';
import { SkillGenerator } from './generator/skill-generator.js';

// Server configuration
const PORT = 7730; // Avoids port 3000 (Skills Fabric router)
const HOST = '127.0.0.1';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// Register plugins
await fastify.register(cors, {
  origin: ['http://127.0.0.1:3000', 'http://127.0.0.1:7730'],
  credentials: true
});

await fastify.register(swagger, {
  swagger: {
    info: {
      title: 'ACE-ADR Service API',
      description: 'Architecture Decision Records Service for Skills Fabric',
      version: '1.0.0'
    },
    host: `${HOST}:${PORT}`,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

// Initialize components
const complexityDetector = new ComplexityDetector();
const adrOrchestrator = new ADROrchestrator();
const patternMiner = new ADRPatternMiner();
const skillGenerator = new SkillGenerator();

// API Routes

/**
 * POST /adr/generate
 * Generate ADR from conversation/solution
 * Body: { conversation, solution, context }
 */
fastify.post('/adr/generate', {
  schema: {
    body: {
      type: 'object',
      required: ['conversation', 'solution'],
      properties: {
        conversation: {
          type: 'array',
          items: { type: 'string' }
        },
        solution: {
          type: 'string'
        },
        context: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            complexity: { type: 'number' },
            stakeholders: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  const { conversation, solution, context } = request.body as any;

  try {
    // Step 1: Detect complexity
    const complexity = await complexityDetector.detectComplexity(conversation, solution, context);

    if (complexity.score < 0.7) {
      return reply.status(200).send({
        status: 'not_complex_enough',
        complexity,
        message: 'Complexity score below threshold (0.7), ADR not generated'
      });
    }

    // Step 2: Generate ADR using ACE pipeline
    const adr = await adrOrchestrator.generateADR({
      conversation,
      solution,
      context,
      complexity
    });

    // Step 3: Persist ADR
    const persisted = await adrOrchestrator.persistADR(adr);

    return reply.status(201).send({
      status: 'success',
      adr: persisted,
      complexity,
      processing_time_ms: complexity.processing_time
    });

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: 'ADR_GENERATION_FAILED',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /adr/:id
 * Retrieve ADR by ID
 */
fastify.get('/adr/:id', async (request, reply) => {
  const { id } = request.params as any;

  try {
    const adr = await adrOrchestrator.getADR(id);

    if (!adr) {
      return reply.status(404).send({
        error: 'ADR_NOT_FOUND',
        message: `ADR with id ${id} not found`
      });
    }

    return reply.send(adr);

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: 'RETRIEVAL_FAILED',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
fastify.get('/health', async (request, reply) => {
  return reply.send({
    status: 'healthy',
    service: 'adr-service',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    components: {
      complexity_detector: 'ok',
      adr_orchestrator: 'ok',
      pattern_miner: 'ok',
      skill_generator: 'ok'
    }
  });
});

/**
 * POST /skills/generate-from-adrs
 * Generate skills from existing ADRs
 */
fastify.post('/skills/generate-from-adrs', {
  schema: {
    body: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', default: 10 }
      }
    }
  }
}, async (request, reply) => {
  const { query, limit } = request.body as any;

  try {
    const skills = await skillGenerator.generateFromADRs(query, limit);

    return reply.send({
      status: 'success',
      skills,
      count: skills.length,
      query
    });

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: 'SKILL_GENERATION_FAILED',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /patterns/mined
 * Get mined patterns from ADRs
 */
fastify.get('/patterns/mined', async (request, reply) => {
  try {
    const patterns = await patternMiner.getMinedPatterns();

    return reply.send({
      status: 'success',
      patterns,
      count: patterns.length,
      last_mining: patterns[0]?.mined_at || null
    });

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: 'PATTERN_RETRIEVAL_FAILED',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: error.validation
    });
  }

  return reply.status(500).send({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`🚀 ACE-ADR Service running on http://${HOST}:${PORT}`);
    fastify.log.info(`📖 API docs available at http://${HOST}:${PORT}/docs`);
    fastify.log.info(`💡 Avoiding port conflict with Skills Fabric router (port 3000)`);

    // Start pattern miner cron job (daily at 2 AM)
    await patternMiner.startCronJob();

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down...');
  await fastify.close();
  process.exit(0);
});
