/**
 * KPI Integration for Slash Commands
 *
 * Integrates slash command metrics with the main KPI system
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { KPIAggregator, type KPIEvent } from '@skills-fabrik/kpi';
import { SlashCommandKPITracker, type SlashCommandKPIEvent, type SlashCommandMetrics } from './kpi-tracker.js';
import { SlashCommandRegistryManager } from './registry.js';
import { SlashCommandParser } from './parser.js';

export interface SlashCommandKPIIntegration {
  trackCommand(
    input: string,
    result: any,
    sessionId: string,
    userId?: string,
    workspace?: string
  ): Promise<void>;

  generateKPIReport(timeRange?: { start?: string; end?: string }): Promise<string>;

  emitKPIEvent(event: SlashCommandKPIEvent): Promise<void>;

  getMetrics(): SlashCommandMetrics;
}

export class SlashCommandKPIIntegration implements SlashCommandKPIIntegration {
  private kpiAggregator: KPIAggregator;
  private slashKPITracker: SlashCommandKPITracker;
  private registry: SlashCommandRegistryManager;

  constructor(kpiEventsPath?: string) {
    this.kpiAggregator = new KPIAggregator(kpiEventsPath || join(process.cwd(), 'obs', 'kpi', 'events.jsonl'));
    this.slashKPITracker = SlashCommandKPITracker.getInstance();
    this.registry = SlashCommandRegistryManager.getInstance();
  }

  /**
   * Track a slash command execution and emit KPI events
   */
  async trackCommand(
    input: string,
    result: any,
    sessionId: string,
    userId?: string,
    workspace?: string
  ): Promise<void> {
    try {
      // Parse the command
      const parsedCommand = SlashCommandParser.parse(input);

      if (!parsedCommand) {
        return; // Not a valid slash command
      }

      // Create slash command KPI event
      const slashKPIEvent: SlashCommandKPIEvent = {
        timestamp: new Date().toISOString(),
        sessionId,
        command: parsedCommand.command,
        action: this.deriveAction(parsedCommand),
        success: result.success || false,
        executionTimeMs: result.metadata?.executionTimeMs || 0,
        userId,
        workspace: workspace || 'unknown',
        integrationType: result.metadata?.integrationType || 'cli',
        errorType: result.error?.type,
        nextActionsCount: result.nextActions?.length,
        metadata: {
          argsCount: parsedCommand.args.length,
          flagsCount: Object.keys(parsedCommand.flags).length,
          optionsCount: Object.keys(parsedCommand.options).length,
          hasError: !!result.error,
          outputLength: result.output?.length || 0,
          parsedCommand: parsedCommand.raw
        }
      };

      // Track in slash command KPI system
      this.slashKPITracker.trackCommand(parsedCommand, result, sessionId, userId, workspace);

      // Emit to main KPI system
      await this.emitKPIEvent(slashKPIEvent);

    } catch (error) {
      console.warn('Failed to track slash command KPI:', error);
    }
  }

  /**
   * Emit KPI event to main KPI system
   */
  async emitKPIEvent(event: SlashCommandKPIEvent): Promise<void> {
    const kpiEvent: KPIEvent = {
      ts: event.timestamp,
      task: `${event.command}:${event.action}`,
      latency_ms: event.executionTimeMs,
      tokens_total: 1,
      zero_errors_left_behind: event.success,
      data: {
        command: event.command,
        action: event.action,
        success: event.success,
        executionTimeMs: event.executionTimeMs,
        integrationType: event.integrationType,
        errorType: event.errorType,
        nextActionsCount: event.nextActionsCount,
        sessionId: event.sessionId,
        userId: event.userId,
        workspace: event.workspace,
        metadata: event.metadata
      }
    };

    // Save event to local file system
    await this.saveEventToFile(kpiEvent);
  }

  /**
   * Generate comprehensive KPI report
   */
  async generateKPIReport(timeRange?: { start?: string; end?: string }): Promise<string> {
    const slashMetrics = this.slashKPITracker.calculateMetrics(timeRange);

    let report = '# 📊 Slash Commands KPI Dashboard\n\n';

    // Header
    report += `**Generated**: ${new Date().toISOString()}\n`;
    if (timeRange?.start || timeRange?.end) {
      report += `**Time Range**: `;
      if (timeRange.start) report += `${timeRange.start} `;
      if (timeRange.start && timeRange.end) report += `to `;
      if (timeRange.end) report += `${timeRange.end}`;
      report += '\n';
    }
    report += '\n';

    // Executive Summary
    report += '## 🎯 Executive Summary\n\n';
    report += `- **Total Commands**: ${slashMetrics.totalCommands}\n`;
    report += `- **Success Rate**: ${slashMetrics.successRate.toFixed(1)}% ${slashMetrics.successRate >= 95 ? '✅' : slashMetrics.successRate >= 90 ? '🟡' : '🔴'}\n`;
    report += `- **Average Execution Time**: ${slashMetrics.averageExecutionTime.toFixed(2)}ms\n`;
    report += `- **Error Rate**: ${slashMetrics.errorRate.toFixed(1)}%\n`;
    report += `- **Active Integrations**: ${Object.keys(slashMetrics.integrationUsage).length}\n\n`;

    // Command Performance
    report += '## ⚡ Command Performance\n\n';
    report += '| Command | Usage | Success Rate | Avg Time | Status |\n';
    report += '|---------|-------|--------------|----------|--------|\n';

    const sortedCommands = Object.entries(slashMetrics.commandUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    for (const [command, count] of sortedCommands) {
      const percentage = ((count / slashMetrics.totalCommands) * 100).toFixed(1);
      const successRate = slashMetrics.successRate; // Simplified
      const avgTime = Math.round(slashMetrics.averageExecutionTime); // Simplified
      const status = successRate >= 95 ? '✅' : successRate >= 90 ? '🟡' : '🔴';

      report += `| /${command} | ${count} (${percentage}%) | ${successRate.toFixed(1)}% | ${avgTime}ms | ${status} |\n`;
    }
    report += '\n';

    // Integration Breakdown
    report += '## 🔌 Integration Usage\n\n';
    for (const [integration, count] of Object.entries(slashMetrics.integrationUsage)) {
      const percentage = ((count / slashMetrics.totalCommands) * 100).toFixed(1);
      const icon = this.getIntegrationIcon(integration);
      report += `- **${icon} ${integration}**: ${count} commands (${percentage}%)\n`;
    }
    report += '\n';

    // Performance Metrics
    report += '## 📈 Performance Metrics\n\n';
    report += `- **Fastest Command**: /${slashMetrics.performanceMetrics.fastestCommand.command} (${slashMetrics.performanceMetrics.fastestCommand.time}ms)\n`;
    report += `- **Slowest Command**: /${slashMetrics.performanceMetrics.slowestCommand.command} (${slashMetrics.performanceMetrics.slowestCommand.time}ms)\n`;
    report += `- **P95 Execution Time**: ${slashMetrics.performanceMetrics.p95ExecutionTime}ms\n`;
    report += `- **P99 Execution Time**: ${slashMetrics.performanceMetrics.p99ExecutionTime}ms\n\n`;

    // Usage Patterns
    report += '## 🕐 Usage Patterns\n\n';
    report += `- **Peak Hour**: ${slashMetrics.usagePatterns.peakHour}:00\n`;
    report += `- **Peak Day**: ${slashMetrics.usagePatterns.peakDay}\n`;
    report += `- **Most Active Workspaces**:\n`;

    for (const [workspace, count] of Object.entries(slashMetrics.usagePatterns.mostActiveWorkspaces)) {
      report += `  - **${workspace}**: ${count} commands\n`;
    }
    report += '\n';

    // Error Analysis (if any errors)
    if (Object.keys(slashMetrics.errorTypes).length > 0) {
      report += '## 🚨 Error Analysis\n\n';
      for (const [errorType, count] of Object.entries(slashMetrics.errorTypes)) {
        const percentage = ((count / slashMetrics.totalCommands) * 100).toFixed(1);
        report += `- **${errorType}**: ${count} occurrences (${percentage}%)\n`;
      }
      report += '\n';
    }

    // Insights and Recommendations
    report += '## 💡 Insights & Recommendations\n\n';

    if (slashMetrics.successRate >= 95) {
      report += '✅ **Excellent Performance**: Success rate is above 95%\n';
    } else if (slashMetrics.successRate >= 90) {
      report += '🟡 **Good Performance**: Success rate is above 90%\n';
    } else {
      report += '🔴 **Needs Attention**: Success rate is below 90%\n';
    }

    if (slashMetrics.averageExecutionTime <= 100) {
      report += '⚡ **Excellent Speed**: Average execution time is under 100ms\n';
    } else if (slashMetrics.averageExecutionTime <= 200) {
      report += '🟡 **Good Speed**: Average execution time is under 200ms\n';
    } else {
      report += '🔴 **Performance Issues**: Average execution time exceeds 200ms\n';
    }

    // Recommendations based on data
    if (slashMetrics.errorRate > 5) {
      report += '- **Recommendation**: Investigate and address common error patterns\n';
    }

    if (slashMetrics.performanceMetrics.slowestCommand.time > 200) {
      report += `- **Recommendation**: Optimize /${slashMetrics.performanceMetrics.slowestCommand.command} for better performance\n`;
    }

    // Most used command insights
    const mostUsed = Object.entries(slashMetrics.commandUsage)[0];
    if (mostUsed) {
      report += `- **Most Used**: /${mostUsed[0]} (${mostUsed[1]} times)\n`;
    }

    report += '\n';

    // Technical Details
    report += '## 🔧 Technical Details\n\n';
    report += `**Total Events Tracked**: ${this.slashKPITracker.getEventsCount()}\n`;
    report += `**Registry Commands**: ${this.registry.getStats().totalCommands}\n`;
    report += `**Categories**: ${Object.keys(this.registry.getStats().commandsByCategory).length}\n`;
    report += `**Aliases**: ${this.registry.getStats().totalAliases}\n\n`;

    return report;
  }

  /**
   * Get current metrics
   */
  getMetrics(): SlashCommandMetrics {
    return this.slashKPITracker.calculateMetrics();
  }

  /**
   * Derive action from parsed command
   */
  private deriveAction(parsedCommand: any): string {
    if (parsedCommand.args.length > 0) {
      return parsedCommand.args[0];
    }
    return 'execute';
  }

  /**
   * Calculate command complexity score
   */
  private calculateCommandComplexity(event: SlashCommandKPIEvent): number {
    let complexity = 1; // Base complexity

    if (event.metadata) {
      complexity += event.metadata.argsCount || 0;
      complexity += (event.metadata.flagsCount || 0) * 0.5;
      complexity += (event.metadata.optionsCount || 0) * 0.3;
    }

    return Math.round(complexity * 10) / 10;
  }

  /**
   * Get integration icon
   */
  private getIntegrationIcon(integration: string): string {
    const icons: Record<string, string> = {
      'cli': '💻',
      'daemon': '🤖',
      'skill': '🧠',
      'native': '⚙️'
    };
    return icons[integration] || '❓';
  }

  /**
   * Save KPI event to file system
   */
  private async saveEventToFile(event: KPIEvent): Promise<void> {
    try {
      const eventsDir = join(process.cwd(), 'obs', 'kpi');
      if (!existsSync(eventsDir)) {
        mkdirSync(eventsDir, { recursive: true });
      }

      const eventsFile = join(eventsDir, 'slash-commands-events.jsonl');
      const eventLine = JSON.stringify(event) + '\n';

      // Append to file
      if (existsSync(eventsFile)) {
        const existingContent = await import('fs').then(fs => fs.promises.readFile(eventsFile, 'utf-8'));
        await import('fs').then(fs => fs.promises.writeFile(eventsFile, existingContent + eventLine));
      } else {
        await import('fs').then(fs => fs.promises.writeFile(eventsFile, eventLine));
      }
    } catch (error) {
      console.error('Failed to save KPI event:', error);
    }
  }
}

// Singleton instance
let kpiIntegrationInstance: SlashCommandKPIIntegration | null = null;

export function getKPIIntegration(kpiEventsPath?: string): SlashCommandKPIIntegration {
  if (!kpiIntegrationInstance) {
    kpiIntegrationInstance = new SlashCommandKPIIntegration(kpiEventsPath);
  }
  return kpiIntegrationInstance;
}