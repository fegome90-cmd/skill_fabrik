/**
 * MCP Server for Prompt Builder v2
 *
 * This server exposes Prompt Builder v2 functionality as MCP tools
 * that Claude Code can use directly.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import PBv2 functions
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { getPerformanceReport, exportMetrics } from '@skills-fabrik/skills-cli';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const OptimizePromptSchema = z.object({
  taskDescription: z.string().describe('Natural language description of the task'),
  skillId: z.string().optional().describe('Specific skill ID to activate'),
  skillIds: z.array(z.string()).optional().describe('Multiple skill IDs to activate'),
  includeFiles: z.boolean().default(true).describe('Auto-detect relevant files'),
  includeTags: z.boolean().default(true).describe('Generate contextual TAGs'),
  includeTemplate: z.boolean().default(true).describe('Apply Template v1.1.0'),
  complexity: z.enum(['low', 'medium', 'high', 'very-high']).default('medium'),
  cwd: z.string().optional().describe('Working directory (defaults to current)'),
});

const GetMetricsSchema = z.object({
  format: z.enum(['report', 'json']).default('report').describe('Output format'),
});

const HealthCheckSchema = z.object({});

// ============================================================================
// SERVER IMPLEMENTATION
// ============================================================================

const server = new Server(
  {
    name: 'prompt-builder-v2',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ============================================================================
// TOOL HANDLERS
// ============================================================================

/**
 * Tool: optimize_prompt
 * Optimizes a user task into a structured prompt using PBv2
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'optimize_prompt': {
        const params = OptimizePromptSchema.parse(args);

        // Call PBv2
        const result = await buildOptimizedPromptV2({
          skillId: params.skillId,
          skillIds: params.skillIds,
          description: params.taskDescription,
          includeFiles: params.includeFiles,
          includeTags: params.includeTags,
          includeTemplate: params.includeTemplate,
          complexity: params.complexity,
          cwd: params.cwd || process.cwd(),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                data: {
                  optimizedPrompt: result.prompt,
                  expectedScore: result.expectedScore,
                  activatedSkills: result.skillActivation,
                  tagsCoverage: result.tagsCoverage,
                  templateScore: result.templateScore,
                  contextualTags: result.signals.tags || [],
                  relevantFiles: result.signals.paths || [],
                  recommendations: generateRecommendations(result),
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'get_performance_metrics': {
        const params = GetMetricsSchema.parse(args);

        if (params.format === 'report') {
          const report = getPerformanceReport();
          return {
            content: [
              {
                type: 'text',
                text: report,
              },
            ],
          };
        } else {
          const metrics = exportMetrics();
          return {
            content: [
              {
                type: 'text',
                text: metrics,
              },
            ],
          };
        }
      }

      case 'system_health_check': {
        const params = HealthCheckSchema.parse(args);

        // Check PBv2 system health
        const metrics = JSON.parse(exportMetrics());
        const isHealthy = metrics.summary.averageLatency < 100 &&
                         metrics.summary.memoryUsage < 18;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                healthy: isHealthy,
                metrics: {
                  averageLatency: metrics.summary.averageLatency,
                  memoryUsage: metrics.summary.memoryUsage,
                  cacheHitRate: metrics.summary.cacheHitRate,
                  totalOperations: metrics.summary.totalMetrics,
                },
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      }

      case 'list_available_skills': {
        // This would normally query skill-rules.json
        // For now, return a static list
        const skills = [
          'backend-architecture-patterns',
          'api-design-and-testing',
          'database-verification',
          'performance-optimization',
          'frontend-dev-guidelines',
          'security-patterns',
          'error-pattern-standardization',
          'test-driven-development',
        ];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                skills: skills.map((id, index) => ({
                  id,
                  name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  index: index + 1,
                })),
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// TOOL LISTING
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'optimize_prompt',
        description: 'Transform a user task into an optimized prompt using Prompt Builder v2',
        inputSchema: {
          type: 'object',
          properties: {
            taskDescription: {
              type: 'string',
              description: 'Natural language description of the task',
              examples: [
                'Create a REST API with authentication',
                'Optimize database queries for performance',
                'Build a React component with state management',
              ],
            },
            skillId: {
              type: 'string',
              description: 'Specific skill ID to activate (optional)',
              examples: ['backend-architecture-patterns'],
            },
            skillIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Multiple skill IDs to activate (optional)',
              examples: [['backend-architecture-patterns', 'security-patterns']],
            },
            includeFiles: {
              type: 'boolean',
              description: 'Auto-detect relevant files (default: true)',
            },
            includeTags: {
              type: 'boolean',
              description: 'Generate contextual TAGs (default: true)',
            },
            includeTemplate: {
              type: 'boolean',
              description: 'Apply Template v1.1.0 (default: true)',
            },
            complexity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'very-high'],
              description: 'Complexity level (default: medium)',
            },
            cwd: {
              type: 'string',
              description: 'Working directory (optional)',
            },
          },
          required: ['taskDescription'],
        },
      },
      {
        name: 'get_performance_metrics',
        description: 'Get performance metrics from Prompt Builder v2',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['report', 'json'],
              description: 'Output format (default: report)',
            },
          },
          required: [],
        },
      },
      {
        name: 'system_health_check',
        description: 'Check if Prompt Builder v2 system is healthy',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_available_skills',
        description: 'List all available skills in the system',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateRecommendations(result: any): string[] {
  const recommendations: string[] = [];

  // Low score recommendations
  if (result.expectedScore < 0.6) {
    recommendations.push('Consider opening relevant files in your editor for better context');
    recommendations.push('Use more specific keywords related to your task');
  }

  // High score recommendations
  if (result.expectedScore > 0.8) {
    recommendations.push('High confidence prompt - ready to use');
  }

  // Based on activated skills
  if (result.skillActivation) {
    const backendSkill = result.skillActivation.find((s: any) =>
      s.skillId.includes('backend')
    );
    if (backendSkill) {
      recommendations.push('Include authentication middleware for production');
    }

    const dbSkill = result.skillActivation.find((s: any) =>
      s.skillId.includes('database') || s.skillId.includes('db')
    );
    if (dbSkill) {
      recommendations.push('Use connection pooling for database operations');
    }
  }

  // TAGs recommendations
  if (result.tagsCoverage && result.tagsCoverage < 0.6) {
    recommendations.push('Add more context for better TAGs coverage (recommended: ≥60%)');
  }

  // Template recommendations
  if (!result.templateScore) {
    recommendations.push('Enable Template v1.1.0 for better structure');
  }

  return recommendations;
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Prompt Builder v2 MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
