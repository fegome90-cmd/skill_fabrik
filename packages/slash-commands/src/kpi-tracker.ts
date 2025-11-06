/**
 * Slash Commands KPI Tracker
 *
 * Tracks metrics and analytics for slash command usage
 * Integrates with the main KPI system
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ParsedSlashCommand, SlashCommandResult } from './types.js';

export interface SlashCommandKPIEvent {
  timestamp: string;
  sessionId: string;
  command: string;
  action: string;
  success: boolean;
  executionTimeMs: number;
  userId?: string;
  workspace: string;
  integrationType: 'skill' | 'daemon' | 'cli' | 'native';
  errorType?: string;
  nextActionsCount?: number;
  metadata?: Record<string, any>;
}

export interface SlashCommandMetrics {
  totalCommands: number;
  successRate: number;
  averageExecutionTime: number;
  commandUsage: Record<string, number>;
  integrationUsage: Record<string, number>;
  errorRate: number;
  errorTypes: Record<string, number>;
  performanceMetrics: {
    fastestCommand: { command: string; time: number };
    slowestCommand: { command: string; time: number };
    p95ExecutionTime: number;
    p99ExecutionTime: number;
  };
  usagePatterns: {
    peakHour: string;
    peakDay: string;
    mostActiveWorkspaces: Record<string, number>;
  };
}

export class SlashCommandKPITracker {
  private static instance: SlashCommandKPITracker;
  private kpiLogPath: string;
  private events: SlashCommandKPIEvent[] = [];

  constructor(kpiLogPath?: string) {
    this.kpiLogPath = kpiLogPath || this.getDefaultKPIPath();
    this.loadEvents();
  }

  static getInstance(kpiLogPath?: string): SlashCommandKPITracker {
    if (!SlashCommandKPITracker.instance) {
      SlashCommandKPITracker.instance = new SlashCommandKPITracker(kpiLogPath);
    }
    return SlashCommandKPITracker.instance;
  }

  private getDefaultKPIPath(): string {
    return join(process.cwd(), 'obs', 'kpi', 'slash-commands-events.jsonl');
  }

  private loadEvents(): void {
    try {
      // Ensure directory exists
      const dir = join(this.kpiLogPath, '..');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      if (existsSync(this.kpiLogPath)) {
        const content = readFileSync(this.kpiLogPath, 'utf-8');
        const lines = content.trim().split('\n');

        this.events = lines
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line);
            } catch (error) {
              console.warn('Failed to parse KPI event:', error);
              return null;
            }
          })
          .filter(event => event !== null);
      }
    } catch (error) {
      console.warn('Failed to load KPI events:', error);
      this.events = [];
    }
  }

  /**
   * Track a slash command execution
   */
  trackCommand(
    parsedCommand: ParsedSlashCommand,
    result: SlashCommandResult,
    sessionId: string,
    userId?: string,
    workspace?: string
  ): void {
    const event: SlashCommandKPIEvent = {
      timestamp: new Date().toISOString(),
      sessionId,
      command: parsedCommand.command,
      action: this.deriveAction(parsedCommand),
      success: result.success,
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
        outputLength: result.output.length
      }
    };

    this.events.push(event);
    this.saveEvent(event);
  }

  /**
   * Derive action from parsed command
   */
  private deriveAction(parsedCommand: ParsedSlashCommand): string {
    if (parsedCommand.args.length > 0) {
      return parsedCommand.args[0];
    }
    return 'execute';
  }

  /**
   * Save event to file
   */
  private saveEvent(event: SlashCommandKPIEvent): void {
    try {
      const eventLine = JSON.stringify(event) + '\n';

      // Append to file
      if (existsSync(this.kpiLogPath)) {
        const content = readFileSync(this.kpiLogPath, 'utf-8');
        writeFileSync(this.kpiLogPath, content + eventLine);
      } else {
        writeFileSync(this.kpiLogPath, eventLine);
      }
    } catch (error) {
      console.warn('Failed to save KPI event:', error);
    }
  }

  /**
   * Calculate metrics from events
   */
  calculateMetrics(timeRange?: { start?: string; end?: string }): SlashCommandMetrics {
    let filteredEvents = this.events;

    if (timeRange?.start || timeRange?.end) {
      const startTime = timeRange.start ? new Date(timeRange.start).getTime() : 0;
      const endTime = timeRange.end ? new Date(timeRange.end).getTime() : Date.now();

      filteredEvents = this.events.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= startTime && eventTime <= endTime;
      });
    }

    if (filteredEvents.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalCommands = filteredEvents.length;
    const successfulCommands = filteredEvents.filter(e => e.success).length;
    const successRate = (successfulCommands / totalCommands) * 100;

    // Execution time metrics
    const executionTimes = filteredEvents.map(e => e.executionTimeMs).filter(t => t > 0);
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;

    // Command usage
    const commandUsage: Record<string, number> = {};
    filteredEvents.forEach(event => {
      commandUsage[event.command] = (commandUsage[event.command] || 0) + 1;
    });

    // Integration usage
    const integrationUsage: Record<string, number> = {};
    filteredEvents.forEach(event => {
      integrationUsage[event.integrationType] = (integrationUsage[event.integrationType] || 0) + 1;
    });

    // Error analysis
    const failedEvents = filteredEvents.filter(e => !e.success);
    const errorRate = (failedEvents.length / totalCommands) * 100;
    const errorTypes: Record<string, number> = {};
    failedEvents.forEach(event => {
      if (event.errorType) {
        errorTypes[event.errorType] = (errorTypes[event.errorType] || 0) + 1;
      }
    });

    // Performance metrics
    const sortedByTime = filteredEvents
      .filter(e => e.executionTimeMs > 0)
      .sort((a, b) => a.executionTimeMs - b.executionTimeMs);

    const fastestCommand = sortedByTime.length > 0 ? {
      command: sortedByTime[0].command,
      time: sortedByTime[0].executionTimeMs
    } : { command: 'unknown', time: 0 };

    const slowestCommand = sortedByTime.length > 0 ? {
      command: sortedByTime[sortedByTime.length - 1].command,
      time: sortedByTime[sortedByTime.length - 1].executionTimeMs
    } : { command: 'unknown', time: 0 };

    const sortedTimes = sortedByTime.map(e => e.executionTimeMs).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    const p95ExecutionTime = sortedTimes.length > 0 ? sortedTimes[Math.min(p95Index, sortedTimes.length - 1)] : 0;
    const p99ExecutionTime = sortedTimes.length > 0 ? sortedTimes[Math.min(p99Index, sortedTimes.length - 1)] : 0;

    // Usage patterns
    const hourUsage: Record<string, number> = {};
    const dayUsage: Record<string, number> = {};
    const workspaceUsage: Record<string, number> = {};

    filteredEvents.forEach(event => {
      const date = new Date(event.timestamp);
      const hour = date.getHours().toString();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });

      hourUsage[hour] = (hourUsage[hour] || 0) + 1;
      dayUsage[day] = (dayUsage[day] || 0) + 1;
      workspaceUsage[event.workspace] = (workspaceUsage[event.workspace] || 0) + 1;
    });

    const peakHour = Object.entries(hourUsage).sort(([, a], [, b]) => b - a)[0]?.[0] || '0';
    const peakDay = Object.entries(dayUsage).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';
    const mostActiveWorkspaces = Object.entries(workspaceUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [workspace, count]) => {
        obj[workspace] = count;
        return obj;
      }, {} as Record<string, number>);

    return {
      totalCommands,
      successRate,
      averageExecutionTime,
      commandUsage,
      integrationUsage,
      errorRate,
      errorTypes,
      performanceMetrics: {
        fastestCommand,
        slowestCommand,
        p95ExecutionTime,
        p99ExecutionTime
      },
      usagePatterns: {
        peakHour,
        peakDay,
        mostActiveWorkspaces
      }
    };
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): SlashCommandMetrics {
    return {
      totalCommands: 0,
      successRate: 0,
      averageExecutionTime: 0,
      commandUsage: {},
      integrationUsage: {},
      errorRate: 0,
      errorTypes: {},
      performanceMetrics: {
        fastestCommand: { command: 'unknown', time: 0 },
        slowestCommand: { command: 'unknown', time: 0 },
        p95ExecutionTime: 0,
        p99ExecutionTime: 0
      },
      usagePatterns: {
        peakHour: '0',
        peakDay: 'Unknown',
        mostActiveWorkspaces: {}
      }
    };
  }

  /**
   * Generate metrics report
   */
  generateReport(timeRange?: { start?: string; end?: string }): string {
    const metrics = this.calculateMetrics(timeRange);

    let report = '# Slash Commands KPI Report\n\n';

    // Summary
    report += '## Summary\n';
    report += `- Total Commands: ${metrics.totalCommands}\n`;
    report += `- Success Rate: ${metrics.successRate.toFixed(1)}%\n`;
    report += `- Error Rate: ${metrics.errorRate.toFixed(1)}%\n`;
    report += `- Average Execution Time: ${metrics.averageExecutionTime.toFixed(2)}ms\n\n`;

    // Command Usage
    report += '## Command Usage\n';
    const sortedCommands = Object.entries(metrics.commandUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    for (const [command, count] of sortedCommands) {
      const percentage = ((count / metrics.totalCommands) * 100).toFixed(1);
      report += `- /${command}: ${count} (${percentage}%)\n`;
    }
    report += '\n';

    // Performance Metrics
    report += '## Performance Metrics\n';
    report += `- Fastest Command: /${metrics.performanceMetrics.fastestCommand.command} (${metrics.performanceMetrics.fastestCommand.time}ms)\n`;
    report += `- Slowest Command: /${metrics.performanceMetrics.slowestCommand.command} (${metrics.performanceMetrics.slowestCommand.time}ms)\n`;
    report += `- P95 Execution Time: ${metrics.performanceMetrics.p95ExecutionTime}ms\n`;
    report += `- P99 Execution Time: ${metrics.performanceMetrics.p99ExecutionTime}ms\n\n`;

    // Integration Usage
    report += '## Integration Usage\n';
    for (const [integration, count] of Object.entries(metrics.integrationUsage)) {
      const percentage = ((count / metrics.totalCommands) * 100).toFixed(1);
      report += `- ${integration}: ${count} (${percentage}%)\n`;
    }
    report += '\n';

    // Error Analysis
    if (Object.keys(metrics.errorTypes).length > 0) {
      report += '## Error Analysis\n';
      for (const [errorType, count] of Object.entries(metrics.errorTypes)) {
        const percentage = ((count / metrics.totalCommands) * 100).toFixed(1);
        report += `- ${errorType}: ${count} (${percentage}%)\n`;
      }
      report += '\n';
    }

    // Usage Patterns
    report += '## Usage Patterns\n';
    report += `- Peak Hour: ${metrics.usagePatterns.peakHour}:00\n`;
    report += `- Peak Day: ${metrics.usagePatterns.peakDay}\n`;
    report += `- Most Active Workspaces:\n`;

    for (const [workspace, count] of Object.entries(metrics.usagePatterns.mostActiveWorkspaces)) {
      report += `  - ${workspace}: ${count} commands\n`;
    }

    return report;
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(timeRange?: { start?: string; end?: string }): SlashCommandMetrics {
    return this.calculateMetrics(timeRange);
  }

  /**
   * Get events count
   */
  getEventsCount(): number {
    return this.events.length;
  }

  /**
   * Clear old events (keep last N days)
   */
  clearOldEvents(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.events = this.events.filter(event =>
      new Date(event.timestamp) >= cutoffDate
    );

    // Rewrite file with filtered events
    try {
      const content = this.events.map(event => JSON.stringify(event)).join('\n');
      writeFileSync(this.kpiLogPath, content + '\n');
    } catch (error) {
      console.warn('Failed to rewrite KPI events file:', error);
    }
  }
}