/**
 * KPI Command Handler (Simple Version)
 *
 * Displays KPI metrics and analytics for slash commands
 */

import { SlashCommandHandler } from '../handlers/base.js';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult,
  CommandMetadata
} from '../types.js';
import { SlashCommandKPITracker } from '../kpi-tracker.js';

export class KPISimpleCommand extends SlashCommandHandler {
  constructor() {
    super({
      name: 'kpi',
      description: 'Display KPI metrics and analytics for slash commands',
      category: 'utilities',
      handler: 'KPISimpleCommand',
      requiresAuth: false,
      persistenceLevel: 'session',
      examples: [
        '/kpi',
        '/kpi --detailed',
        '/kpi --performance'
      ],
      aliases: ['metrics', 'analytics', 'stats']
    });
  }

  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    // All validations pass for simple version
    return { valid: true };
  }

  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const startTime = Date.now();

    try {
      // Get KPI tracker
      const kpiTracker = SlashCommandKPITracker.getInstance();

      // Calculate metrics
      const metrics = kpiTracker.calculateMetrics();

      // Generate report
      let output = '# Slash Commands KPI Report\n\n';
      output += '## Summary\n';
      output += `- Total Commands: ${metrics.totalCommands}\n`;
      output += `- Success Rate: ${metrics.successRate.toFixed(1)}%\n`;
      output += `- Error Rate: ${metrics.errorRate.toFixed(1)}%\n`;
      output += `- Average Execution Time: ${metrics.averageExecutionTime.toFixed(2)}ms\n\n`;

      // Command Usage
      output += '## Command Usage\n';
      const sortedCommands = Object.entries(metrics.commandUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      for (const [command, count] of sortedCommands) {
        const percentage = ((count / metrics.totalCommands) * 100).toFixed(1);
        output += `- /${command}: ${count} (${percentage}%)\n`;
      }

      // Performance Metrics
      output += '\n## Performance\n';
      output += `- Fastest Command: /${metrics.performanceMetrics.fastestCommand.command} (${metrics.performanceMetrics.fastestCommand.time}ms)\n`;
      output += `- Slowest Command: /${metrics.performanceMetrics.slowestCommand.command} (${metrics.performanceMetrics.slowestCommand.time}ms)\n`;
      output += `- P95 Execution Time: ${metrics.performanceMetrics.p95ExecutionTime}ms\n`;

      const executionTime = Date.now() - startTime;

      // Add next actions
      const nextActions = ['/compact', '/kpi --detailed'];

      return {
        success: true,
        output,
        data: metrics,
        nextActions
      };

    } catch (error) {
      console.error('❌ KPI command failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        this.createError('execution', `KPI command failed: ${errorMessage}`)
      );
    }
  }

  protected getIntegrationType(): 'skill' | 'daemon' | 'cli' | 'native' {
    return 'cli';
  }
}