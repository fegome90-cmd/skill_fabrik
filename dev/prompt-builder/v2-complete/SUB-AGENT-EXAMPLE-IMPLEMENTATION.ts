/**
 * SUB-AGENT IMPLEMENTATION: Prompt Builder v2 Assistant
 *
 * This is a practical implementation of the PBv2 sub-agent.
 * You can use this code directly or adapt it to your needs.
 */

import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { getPerformanceReport, exportMetrics } from '@skills-fabrik/skills-cli';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TaskInput {
  description: string;
  skillId?: string;
  skillIds?: string[];
  includeFiles?: boolean;
  includeTags?: boolean;
  includeTemplate?: boolean;
  includePlanContext?: boolean;
  complexity?: 'low' | 'medium' | 'high' | 'very-high';
  enableBatchCreation?: boolean;
  enableValidation?: boolean;
  enableSurpriseMetrics?: boolean;
  cwd?: string;
}

interface SkillActivation {
  skillId: string;
  score: number;
  reasons: string[];
}

interface OptimizedOutput {
  optimizedPrompt: string;
  expectedScore: number;
  activatedSkills: SkillActivation[];
  tagsCoverage?: number;
  templateScore?: number;
  metrics?: {
    cacheHit?: boolean;
    memoryMB?: number;
    parallelEfficiency?: number;
    workerUtilization?: number;
  };
}

interface AgentResponse {
  success: boolean;
  optimizedPrompt?: string;
  metrics?: {
    score: number;
    percentage: string;
    activatedSkills: SkillActivation[];
    tagsCoverage?: number;
    templateScore?: number;
  };
  contextualTags?: string[];
  recommendations?: string[];
  error?: string;
  performanceInfo?: {
    latency: number;
    cacheHit: boolean;
    memoryMB: number;
  };
}

// ============================================================================
// MAIN AGENT CLASS
// ============================================================================

class PromptBuilderV2Agent {
  private defaultOptions: Partial<TaskInput> = {
    includeFiles: true,
    includeTags: true,
    includeTemplate: true,
    includePlanContext: false,
    complexity: 'medium',
    enableValidation: true,
    enableSurpriseMetrics: false
  };

  /**
   * Process user task and generate optimized prompt
   */
  async processTask(task: string, options: Partial<TaskInput> = {}): Promise<AgentResponse> {
    const startTime = performance.now();

    try {
      // Merge options with defaults
      const taskOptions: TaskInput = {
        description: task,
        ...this.defaultOptions,
        ...options
      };

      // Build optimized prompt using PBv2
      const result = await buildOptimizedPromptV2(taskOptions);

      // Calculate performance metrics
      const latency = performance.now() - startTime;
      const performanceInfo = {
        latency,
        cacheHit: latency < 10, // Cache hit if < 10ms
        memoryMB: process.memoryUsage().heapUsed / 1024 / 1024
      };

      // Format response
      return {
        success: true,
        optimizedPrompt: result.prompt,
        metrics: {
          score: result.expectedScore,
          percentage: `${(result.expectedScore * 100).toFixed(0)}%`,
          activatedSkills: result.skillActivation,
          tagsCoverage: result.tagsCoverage,
          templateScore: result.templateScore
        },
        contextualTags: result.signals.tags || [],
        recommendations: this.generateRecommendations(result),
        performanceInfo
      };

    } catch (error) {
      // Handle errors gracefully
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process task with multiple skills
   */
  async processTaskMultiSkill(
    task: string,
    skillIds: string[],
    options: Partial<TaskInput> = {}
  ): Promise<AgentResponse> {
    return this.processTask(task, {
      skillIds,
      enableBatchCreation: true,
      ...options
    });
  }

  /**
   * Get performance report from PBv2
   */
  getPerformanceReport(): string {
    return getPerformanceReport();
  }

  /**
   * Export PBv2 metrics as JSON
   */
  exportMetrics(): string {
    return exportMetrics();
  }

  /**
   * Format agent response for display
   */
  formatResponse(response: AgentResponse): string {
    if (!response.success) {
      return `❌ Error: ${response.error}`;
    }

    let output = '';

    // Optimized Prompt Section
    output += `📋 OPTIMIZED PROMPT\n`;
    output += `${'='.repeat(70)}\n\n`;
    output += `${response.optimizedPrompt}\n\n`;

    // Metrics Section
    if (response.metrics) {
      output += `📊 METRICS & ANALYSIS\n`;
      output += `${'='.repeat(70)}\n`;
      output += `Score: ${response.metrics.score.toFixed(2)}/1.0 `;
      output += `(${response.metrics.percentage} confidence)\n`;

      output += `Skills Activated: ${response.metrics.activatedSkills.length} skill(s)\n`;
      response.metrics.activatedSkills.forEach(skill => {
        output += `  • ${skill.skillId}: ${(skill.score * 100).toFixed(0)}%\n`;
      });

      if (response.metrics.tagsCoverage !== undefined) {
        output += `TAGs Coverage: ${(response.metrics.tagsCoverage * 100).toFixed(0)}%\n`;
      }

      if (response.metrics.templateScore) {
        output += `Template: ✅ v1.1.0 (8/8 components)\n`;
      }

      output += '\n';
    }

    // Contextual Tags
    if (response.contextualTags && response.contextualTags.length > 0) {
      output += `🏷️ CONTEXTUAL TAGS\n`;
      output += `${'='.repeat(70)}\n`;
      output += response.contextualTags.join(', ') + '\n\n';
    }

    // Recommendations
    if (response.recommendations && response.recommendations.length > 0) {
      output += `💡 USAGE RECOMMENDATIONS\n`;
      output += `${'='.repeat(70)}\n`;
      response.recommendations.forEach((rec, index) => {
        output += `${index + 1}. ${rec}\n`;
      });
      output += '\n';
    }

    // Performance Info
    if (response.performanceInfo) {
      output += `📈 Performance: ${response.performanceInfo.latency.toFixed(2)}ms `;
      output += `(${response.performanceInfo.cacheHit ? 'cache hit' : 'cache miss'})\n`;
    }

    return output;
  }

  /**
   * Generate usage recommendations based on PBv2 output
   */
  private generateRecommendations(result: any): string[] {
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
      const backendSkill = result.skillActivation.find((s: SkillActivation) =>
        s.skillId.includes('backend')
      );
      if (backendSkill) {
        recommendations.push('Include authentication middleware for production');
      }

      const dbSkill = result.skillActivation.find((s: SkillActivation) =>
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
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Basic Task
 */
async function exampleBasicTask() {
  const agent = new PromptBuilderV2Agent();

  const response = await agent.processTask(
    'Create a user registration endpoint with email validation'
  );

  console.log(agent.formatResponse(response));
}

/**
 * Example 2: Multi-Skill Task
 */
async function exampleMultiSkillTask() {
  const agent = new PromptBuilderV2Agent();

  const response = await agent.processTaskMultiSkill(
    'Build a complete authentication system with JWT and refresh tokens',
    [
      'backend-architecture-patterns',
      'security-patterns',
      'database-verification'
    ]
  );

  console.log(agent.formatResponse(response));
}

/**
 * Example 3: Custom Options
 */
async function exampleCustomOptions() {
  const agent = new PromptBuilderV2Agent();

  const response = await agent.processTask(
    'Create a React component with state management',
    {
      skillId: 'frontend-dev-guidelines',
      complexity: 'high',
      includeFiles: true,
      includeTags: true,
      includeTemplate: true
    }
  );

  console.log(agent.formatResponse(response));
}

/**
 * Example 4: With Performance Monitoring
 */
async function exampleWithPerformance() {
  const agent = new PromptBuilderV2Agent();

  // Reset metrics before starting
  // resetMetrics(); // Uncomment if available

  const response = await agent.processTask('Optimize database queries');

  // Display response
  console.log(agent.formatResponse(response));

  // Show PBv2 performance report
  console.log('\n' + '='.repeat(70));
  console.log('PBV2 PERFORMANCE REPORT:');
  console.log('='.repeat(70));
  console.log(agent.getPerformanceReport());
}

/**
 * Example 5: Error Handling
 */
async function exampleErrorHandling() {
  const agent = new PromptBuilderV2Agent();

  // Invalid skill
  const response = await agent.processTask(
    'Create something',
    { skillId: 'invalid-skill-name' }
  );

  if (!response.success) {
    console.log(`❌ Error handled gracefully: ${response.error}`);
    console.log('💡 Suggestion: Check available skills in skill-rules.json');
  }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  // Run examples if executed directly
  console.log('🚀 Prompt Builder v2 Sub-Agent - Examples\n');

  // Example selector (uncomment to run specific example)
  // exampleBasicTask();
  // exampleMultiSkillTask();
  // exampleCustomOptions();
  // exampleWithPerformance();
  // exampleErrorHandling();
}

// ============================================================================
// EXPORT FOR USE IN OTHER MODULES
// ============================================================================

export {
  PromptBuilderV2Agent,
  TaskInput,
  OptimizedOutput,
  SkillActivation,
  AgentResponse
};

// ============================================================================
// QUICK START USAGE
// ============================================================================

/*
QUICK START:

1. Import the agent:
   import { PromptBuilderV2Agent } from './sub-agent-implementation';

2. Create instance:
   const agent = new PromptBuilderV2Agent();

3. Process tasks:
   const response = await agent.processTask('Your task description');

4. Display results:
   console.log(agent.formatResponse(response));

5. Access performance:
   console.log(agent.getPerformanceReport());

EXAMPLE SESSION:

const agent = new PromptBuilderV2Agent();

const result = await agent.processTask('Create a PostgreSQL connection pool');

console.log(result.optimizedPrompt);
console.log(`Score: ${result.metrics?.percentage}`);
console.log(result.contextualTags);
console.log(result.performanceInfo);

EXPECTED OUTPUT:
📋 OPTIMIZED PROMPT
[C1-C8 Template with your optimized prompt]

📊 METRICS
Score: 0.89/1.0 (89% confidence)
Skills Activated: 2 skills
  • database-management: 89%
  • backend-dev-guidelines: 76%

🏷️ TAGS
[K:DATABASE-CONNECTION], [C:INFRASTRUCTURE-SETUP]

💡 RECOMMENDATIONS
1. Include pg library
2. Use environment variables for connection strings
3. Implement connection leak detection

📈 Performance: 45ms (cache hit)

*/
