/**
 * Claude Agent SDK Example: Prompt Builder v2 Agent
 *
 * This shows how to create a custom agent using the Claude Agent SDK
 * that integrates with Prompt Builder v2.
 */

import {
  Agent,
  AnthropicTool,
  ToolResult,
  createAgent,
} from '@anthropic-ai/claude-agent-sdk';

// Import PBv2 functions
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { getPerformanceReport, exportMetrics } from '@skills-fabrik/skills-cli';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const optimizePromptTool: AnthropicTool = {
  name: 'optimize_prompt',
  description: 'Transform a user task into an optimized prompt using Prompt Builder v2',
  input_schema: {
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
    },
    required: ['taskDescription'],
  },
};

const getPerformanceTool: AnthropicTool = {
  name: 'get_performance_metrics',
  description: 'Get performance metrics from Prompt Builder v2',
  input_schema: {
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
};

const healthCheckTool: AnthropicTool = {
  name: 'system_health_check',
  description: 'Check if Prompt Builder v2 system is healthy',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const listSkillsTool: AnthropicTool = {
  name: 'list_available_skills',
  description: 'List all available skills in the system',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// ============================================================================
// AGENT IMPLEMENTATION
// ============================================================================

const promptBuilderAgent = createAgent({
  name: 'Prompt Builder v2 Agent',
  description: 'An agent that optimizes prompts using Prompt Builder v2 technology',

  // System prompt defining the agent's role and behavior
  systemPrompt: `
You are a specialized Prompt Builder v2 Agent. Your role is to help users transform
their tasks into optimized, structured prompts using Prompt Builder v2.

Capabilities:
- Transform natural language tasks into optimized prompts
- Apply Template v1.1.0 structure (C1-C8)
- Generate contextual TAGs [K:C:U:EVIDENCIA:PROPUESTA]
- Activate multiple skills simultaneously
- Provide performance metrics and analysis
- Deliver actionable recommendations

When a user gives you a task:
1. Ask clarifying questions if needed
2. Use the optimize_prompt tool to generate the optimized prompt
3. Present the results with:
   - The optimized prompt
   - Expected activation score
   - Activated skills
   - Contextual TAGs
   - Usage recommendations
4. Offer to optimize further or adjust parameters

Always be helpful, accurate, and provide actionable guidance.
`.trim(),

  // Available tools
  tools: [
    optimizePromptTool,
    getPerformanceTool,
    healthCheckTool,
    listSkillsTool,
  ],

  // Tool implementations
  toolHandlers: {
    optimize_prompt: async (args: any): Promise<ToolResult> => {
      try {
        const {
          taskDescription,
          skillId,
          skillIds,
          includeFiles = true,
          includeTags = true,
          includeTemplate = true,
          complexity = 'medium',
        } = args;

        // Call PBv2
        const result = await buildOptimizedPromptV2({
          skillId,
          skillIds,
          description: taskDescription,
          includeFiles,
          includeTags,
          includeTemplate,
          complexity,
          cwd: process.cwd(),
        });

        // Generate recommendations
        const recommendations = generateRecommendations(result);

        // Format response
        const response = {
          success: true,
          optimizedPrompt: result.prompt,
          expectedScore: result.expectedScore,
          activatedSkills: result.skillActivation,
          tagsCoverage: result.tagsCoverage,
          templateScore: result.templateScore,
          contextualTags: result.signals.tags || [],
          relevantFiles: result.signals.paths || [],
          recommendations,
        };

        return {
          type: 'tool_result',
          content: JSON.stringify(response, null, 2),
        };
      } catch (error) {
        return {
          type: 'tool_result',
          content: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }, null, 2),
          is_error: true,
        };
      }
    },

    get_performance_metrics: async (args: any): Promise<ToolResult> => {
      try {
        const { format = 'report' } = args;

        if (format === 'report') {
          const report = getPerformanceReport();
          return {
            type: 'tool_result',
            content: report,
          };
        } else {
          const metrics = exportMetrics();
          return {
            type: 'tool_result',
            content: metrics,
          };
        }
      } catch (error) {
        return {
          type: 'tool_result',
          content: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }, null, 2),
          is_error: true,
        };
      }
    },

    system_health_check: async (args: any): Promise<ToolResult> => {
      try {
        // Check PBv2 system health
        const metrics = JSON.parse(exportMetrics());
        const isHealthy = metrics.summary.averageLatency < 100 &&
                         metrics.summary.memoryUsage < 18;

        const response = {
          success: true,
          healthy: isHealthy,
          metrics: {
            averageLatency: metrics.summary.averageLatency,
            memoryUsage: metrics.summary.memoryUsage,
            cacheHitRate: metrics.summary.cacheHitRate,
            totalOperations: metrics.summary.totalMetrics,
          },
          timestamp: new Date().toISOString(),
          warnings: isHealthy ? [] : [
            metrics.summary.averageLatency >= 100 ?
              `Average latency (${metrics.summary.averageLatency}ms) exceeds threshold (100ms)` : null,
            metrics.summary.memoryUsage >= 18 ?
              `Memory usage (${metrics.summary.memoryUsage}MB) exceeds threshold (18MB)` : null,
          ].filter(Boolean),
        };

        return {
          type: 'tool_result',
          content: JSON.stringify(response, null, 2),
        };
      } catch (error) {
        return {
          type: 'tool_result',
          content: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }, null, 2),
          is_error: true,
        };
      }
    },

    list_available_skills: async (args: any): Promise<ToolResult> => {
      try {
        // Static list of available skills
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

        const response = {
          success: true,
          skills: skills.map((id, index) => ({
            id,
            name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            index: index + 1,
          })),
        };

        return {
          type: 'tool_result',
          content: JSON.stringify(response, null, 2),
        };
      } catch (error) {
        return {
          type: 'tool_result',
          content: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }, null, 2),
          is_error: true,
        };
      }
    },
  },
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
// USAGE EXAMPLES
// ============================================================================

// Example 1: Create and use the agent
async function exampleBasicUsage() {
  const agent = await promptBuilderAgent.create();

  // Send a message to the agent
  const response = await agent.send({
    message: 'I need to create a user authentication system with JWT',
  });

  console.log('Agent Response:', response.content);
}

// Example 2: Use with specific skills
async function exampleMultiSkill() {
  const agent = await promptBuilderAgent.create();

  const response = await agent.send({
    message: `
      Optimize this task with multiple skills:

      Task: Build a complete e-commerce API with products, cart, and checkout
      Skills: backend-architecture-patterns, api-design-and-testing, database-verification
      Complexity: very-high
    `,
  });

  console.log('Agent Response:', response.content);
}

// Example 3: Check performance
async function examplePerformanceCheck() {
  const agent = await promptBuilderAgent.create();

  const response = await agent.send({
    message: 'Check the performance of Prompt Builder v2',
  });

  console.log('Agent Response:', response.content);
}

// Example 4: List available skills
async function exampleListSkills() {
  const agent = await promptBuilderAgent.create();

  const response = await agent.send({
    message: 'What skills are available?',
  });

  console.log('Agent Response:', response.content);
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Prompt Builder v2 Agent - Examples\n');

  // Example selector (uncomment to run specific example)
  // exampleBasicUsage();
  // exampleMultiSkill();
  // examplePerformanceCheck();
  // exampleListSkills();
}

// ============================================================================
// EXPORT
// ============================================================================

export { promptBuilderAgent };
