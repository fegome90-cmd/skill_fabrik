/**
 * KPI Dashboard for Slash Commands
 *
 * Provides real-time metrics and analytics for slash command execution
 * Integrates with MemTech L1 for data persistence
 * Tracks performance, quality, and usage metrics
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';

interface KPIEvent {
  timestamp: string;
  sessionId: string;
  userId?: string;
  command: string;
  executionTimeMs: number;
  success: boolean;
  errorType?: string;
  integrationType: 'skill' | 'daemon' | 'cli' | 'native';
  memtechHits: number;
  customMetrics: Record<string, any>;
  workspaceSize?: number;
  filesProcessed?: number;
}

interface KPISummary {
  totalCommands: number;
  successRate: number;
  averageExecutionTime: number;
  commandsPerSecond: number;
  errorRate: number;
  totalErrors: number;
  popularCommands: CommandStats[];
  performanceMetrics: PerformanceMetrics;
  qualityMetrics: QualityMetrics;
  usageMetrics: UsageMetrics;
}

interface CommandStats {
  command: string;
  executions: number;
  successRate: number;
  avgExecutionTime: number;
  lastUsed: string;
}

interface PerformanceMetrics {
  fastestCommand: { command: string; time: number };
  slowestCommand: { command: string; time: number };
  averageTime: number;
  percentile95: number;
  percentile99: number;
}

interface QualityMetrics {
  codeReviewScores: { avg: number; min: number; max: number };
  buildSuccessRates: { [command: string]: number };
  errorReductions: { [command: string]: number };
  autoFixRates: { [command: string]: number };
}

interface UsageMetrics {
  uniqueUsers: number;
  activeWorkspaces: number;
  peakUsageTime: { hour: number; count: number };
  popularWorkspaces: Array<{ workspace: string; commands: number }>;
  growthRate: number;
}

export class SlashCommandKPIDashboard {
  private static instance: SlashCommandKPIDashboard;
  private eventsFile: string;
  private summaryFile: string;
  private events: KPIEvent[] = [];
  private lastSummaryUpdate: number = 0;

  constructor(dataDir?: string) {
    const dataPath = dataDir || join(process.cwd(), 'obs', 'kpi');
    this.eventsFile = join(dataPath, 'slash-commands-events.jsonl');
    this.summaryFile = join(dataPath, 'slash-commands-summary.json');

    // Ensure data directory exists
    if (!existsSync(dirname(this.eventsFile))) {
      mkdirSync(dirname(this.eventsFile), { recursive: true });
    }

    this.loadEvents();
  }

  static getInstance(dataDir?: string): SlashCommandKPIDashboard {
    if (!SlashCommandKPIDashboard.instance) {
      SlashCommandKPIDashboard.instance = new SlashCommandKPIDashboard(dataDir);
    }
    return SlashCommandKPIDashboard.instance;
  }

  /**
   * Record a KPI event from command execution
   */
  async recordEvent(event: Omit<KPIEvent, 'timestamp'>): Promise<void> {
    const fullEvent: KPIEvent = {
      timestamp: new Date().toISOString(),
      ...event
    };

    this.events.push(fullEvent);

    // Persist event immediately
    await this.persistEvent(fullEvent);

    // Update summary every 10 events or every 5 minutes
    if (this.events.length % 10 === 0 || Date.now() - this.lastSummaryUpdate > 5 * 60 * 1000) {
      await this.updateSummary();
    }
  }

  /**
   * Get comprehensive KPI summary
   */
  async getSummary(timeRange?: { start: string; end?: string }): Promise<KPISummary> {
    const filteredEvents = this.filterEventsByTimeRange(this.events, timeRange);

    if (filteredEvents.length === 0) {
      return this.getEmptySummary();
    }

    return {
      totalCommands: filteredEvents.length,
      successRate: this.calculateSuccessRate(filteredEvents),
      averageExecutionTime: this.calculateAverageExecutionTime(filteredEvents),
      commandsPerSecond: this.calculateCommandsPerSecond(filteredEvents),
      errorRate: this.calculateErrorRate(filteredEvents),
      totalErrors: this.calculateTotalErrors(filteredEvents),
      popularCommands: this.getPopularCommands(filteredEvents),
      performanceMetrics: this.getPerformanceMetrics(filteredEvents),
      qualityMetrics: this.getQualityMetrics(filteredEvents),
      usageMetrics: this.getUsageMetrics(filteredEvents)
    };
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<{
    activeCommands: number;
    currentRPS: number;
    recentErrors: KPIEvent[];
    systemHealth: 'healthy' | 'degraded' | 'critical';
  }> {
    const now = Date.now();
    const recentEvents = this.events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return now - eventTime < 60 * 1000; // Last minute
    });

    const activeCommands = new Set(recentEvents.map(e => e.sessionId)).size;
    const currentRPS = recentEvents.length / 60;
    const recentErrors = recentEvents.filter(e => !e.success).slice(-10);

    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (currentRPS > 10 || recentErrors.length > 5) {
      systemHealth = 'critical';
    } else if (currentRPS > 5 || recentErrors.length > 2) {
      systemHealth = 'degraded';
    }

    return {
      activeCommands,
      currentRPS,
      recentErrors,
      systemHealth
    };
  }

  /**
   * Get command-specific metrics
   */
  async getCommandMetrics(command: string, timeRange?: { start: string; end?: string }): Promise<{
    executions: number;
    successRate: number;
    avgExecutionTime: number;
    errorTypes: Record<string, number>;
    performanceTrend: Array<{ timestamp: string; time: number }>;
    recentSessions: string[];
  }> {
    const filteredEvents = this.filterEventsByTimeRange(
      this.events.filter(e => e.command === command),
      timeRange
    );

    const executions = filteredEvents.length;
    const successRate = executions > 0 ? this.calculateSuccessRate(filteredEvents) : 0;
    const avgExecutionTime = executions > 0 ? this.calculateAverageExecutionTime(filteredEvents) : 0;

    const errorTypes: Record<string, number> = {};
    filteredEvents.forEach(event => {
      if (!event.success && event.errorType) {
        errorTypes[event.errorType] = (errorTypes[event.errorType] || 0) + 1;
      }
    });

    const performanceTrend = filteredEvents
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .slice(-100) // Last 100 executions
      .map(event => ({
        timestamp: event.timestamp,
        time: event.executionTimeMs
      }));

    const recentSessions = [...Array.from(new Set(filteredEvents.slice(-20).map(e => e.sessionId)))];

    return {
      executions,
      successRate,
      avgExecutionTime,
      errorTypes,
      performanceTrend,
      recentSessions
    };
  }

  /**
   * Generate KPI dashboard report
   */
  async generateReport(format: 'markdown' | 'json' | 'html' = 'markdown'): Promise<string> {
    const summary = await this.getSummary();
    const realTime = await this.getRealTimeMetrics();

    switch (format) {
      case 'json':
        return JSON.stringify({ summary, realTime, timestamp: new Date().toISOString() }, null, 2);

      case 'html':
        return this.generateHTMLReport(summary, realTime);

      default:
        return this.generateMarkdownReport(summary, realTime);
    }
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts(): Promise<Array<{
    type: 'warning' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }>> {
    const alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      metric: string;
      value: number;
      threshold: number;
    }> = [];

    const summary = await this.getSummary();

    // Check success rate
    if (summary.successRate < 90) {
      alerts.push({
        type: summary.successRate < 80 ? 'critical' : 'warning',
        message: `Low success rate detected`,
        metric: 'successRate',
        value: summary.successRate,
        threshold: 90
      });
    }

    // Check average execution time
    if (summary.averageExecutionTime > 5000) {
      alerts.push({
        type: summary.averageExecutionTime > 10000 ? 'critical' : 'warning',
        message: `High average execution time`,
        metric: 'averageExecutionTime',
        value: summary.averageExecutionTime,
        threshold: 5000
      });
    }

    // Check error rate
    if (summary.errorRate > 10) {
      alerts.push({
        type: summary.errorRate > 20 ? 'critical' : 'warning',
        message: `High error rate detected`,
        metric: 'errorRate',
        value: summary.errorRate,
        threshold: 10
      });
    }

    // Check performance percentiles
    if (summary.performanceMetrics.percentile95 > 15000) {
      alerts.push({
        type: 'warning',
        message: `95th percentile response time is high`,
        metric: 'percentile95',
        value: summary.performanceMetrics.percentile95,
        threshold: 15000
      });
    }

    return alerts;
  }

  /**
   * Private helper methods
   */
  private loadEvents(): void {
    try {
      if (existsSync(this.eventsFile)) {
        const content = readFileSync(this.eventsFile, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line);
        this.events = lines.map(line => JSON.parse(line));
      }
    } catch (error) {
      console.warn('Failed to load KPI events:', error);
      this.events = [];
    }
  }

  private async persistEvent(event: KPIEvent): Promise<void> {
    try {
      const line = JSON.stringify(event) + '\n';
      require('fs').appendFileSync(this.eventsFile, line);
    } catch (error) {
      console.warn('Failed to persist KPI event:', error);
    }
  }

  private async updateSummary(): Promise<void> {
    try {
      const summary = await this.getSummary();
      writeFileSync(this.summaryFile, JSON.stringify({
        summary,
        lastUpdated: new Date().toISOString(),
        totalEvents: this.events.length
      }, null, 2));
      this.lastSummaryUpdate = Date.now();
    } catch (error) {
      console.warn('Failed to update KPI summary:', error);
    }
  }

  private filterEventsByTimeRange(events: KPIEvent[], timeRange?: { start: string; end?: string }): KPIEvent[] {
    if (!timeRange) return events;

    const startTime = new Date(timeRange.start).getTime();
    const endTime = timeRange.end ? new Date(timeRange.end).getTime() : Date.now();

    return events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });
  }

  private calculateSuccessRate(events: KPIEvent[]): number {
    if (events.length === 0) return 0;
    const successful = events.filter(e => e.success).length;
    return Math.round((successful / events.length) * 100);
  }

  private calculateAverageExecutionTime(events: KPIEvent[]): number {
    if (events.length === 0) return 0;
    const totalTime = events.reduce((sum, e) => sum + e.executionTimeMs, 0);
    return Math.round(totalTime / events.length);
  }

  private calculateCommandsPerSecond(events: KPIEvent[]): number {
    if (events.length === 0) return 0;

    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const durationSeconds = (maxTime - minTime) / 1000;

    return durationSeconds > 0 ? Math.round((events.length / durationSeconds) * 100) / 100 : 0;
  }

  private calculateErrorRate(events: KPIEvent[]): number {
    if (events.length === 0) return 0;
    const errors = events.filter(e => !e.success).length;
    return Math.round((errors / events.length) * 100);
  }

  private calculateTotalErrors(events: KPIEvent[]): number {
    return events.filter(e => !e.success).length;
  }

  private getPopularCommands(events: KPIEvent[]): CommandStats[] {
    const commandGroups = events.reduce((groups, event) => {
      if (!groups[event.command]) {
        groups[event.command] = [];
      }
      groups[event.command].push(event);
      return groups;
    }, {} as Record<string, KPIEvent[]>);

    return Object.entries(commandGroups)
      .map(([command, commandEvents]) => ({
        command,
        executions: commandEvents.length,
        successRate: this.calculateSuccessRate(commandEvents),
        avgExecutionTime: this.calculateAverageExecutionTime(commandEvents),
        lastUsed: new Date(Math.max(...commandEvents.map(e => new Date(e.timestamp).getTime()))).toISOString()
      }))
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 10);
  }

  private getPerformanceMetrics(events: KPIEvent[]): PerformanceMetrics {
    const times = events.map(e => e.executionTimeMs).sort((a, b) => a - b);

    if (times.length === 0) {
      return {
        fastestCommand: { command: '', time: 0 },
        slowestCommand: { command: '', time: 0 },
        averageTime: 0,
        percentile95: 0,
        percentile99: 0
      };
    }

    const avgTime = this.calculateAverageExecutionTime(events);
    const percentile95Index = Math.floor(times.length * 0.95);
    const percentile99Index = Math.floor(times.length * 0.99);

    // Find fastest and slowest commands
    const commandTimes = events.reduce((acc, event) => {
      if (!acc[event.command] || event.executionTimeMs < acc[event.command]) {
        acc[event.command] = event.executionTimeMs;
      }
      return acc;
    }, {} as Record<string, number>);

    const fastestCommand = Object.entries(commandTimes)
      .sort(([, a], [, b]) => a - b)[0] || ['', 0];
    const slowestCommand = Object.entries(commandTimes)
      .sort(([, a], [, b]) => b - a)[0] || ['', 0];

    return {
      fastestCommand: { command: fastestCommand[0], time: fastestCommand[1] },
      slowestCommand: { command: slowestCommand[0], time: slowestCommand[1] },
      averageTime: avgTime,
      percentile95: times[percentile95Index] || 0,
      percentile99: times[percentile99Index] || 0
    };
  }

  private getQualityMetrics(events: KPIEvent[]): QualityMetrics {
    const buildEvents = events.filter(e => e.command === 'build-and-fix');
    const codeReviewEvents = events.filter(e => e.command === 'code-review');

    const buildSuccessRates: { [command: string]: number } = {};
    const errorReductions: { [command: string]: number } = {};
    const autoFixRates: { [command: string]: number } = {};

    // Calculate build success rates
    const buildCommands = ['build-and-fix', 'build', 'compile'];
    buildCommands.forEach(command => {
      const commandEvents = events.filter(e => e.command === command);
      if (commandEvents.length > 0) {
        buildSuccessRates[command] = this.calculateSuccessRate(commandEvents);
      }
    });

    // Extract quality metrics from custom metrics
    events.forEach(event => {
      if (event.customMetrics) {
        if (event.customMetrics.errorsFixed !== undefined) {
          errorReductions[event.command] = (errorReductions[event.command] || 0) + event.customMetrics.errorsFixed;
        }
        if (event.customMetrics.autoFixesApplied !== undefined) {
          autoFixRates[event.command] = (autoFixRates[event.command] || 0) + event.customMetrics.autoFixesApplied;
        }
      }
    });

    // Calculate code review scores
    const reviewScores = codeReviewEvents
      .map(e => e.customMetrics?.reviewScore)
      .filter(score => score !== undefined) as number[];

    return {
      codeReviewScores: reviewScores.length > 0 ? {
        avg: Math.round(reviewScores.reduce((sum, score) => sum + score, 0) / reviewScores.length),
        min: Math.min(...reviewScores),
        max: Math.max(...reviewScores)
      } : { avg: 0, min: 0, max: 0 },
      buildSuccessRates,
      errorReductions,
      autoFixRates
    };
  }

  private getUsageMetrics(events: KPIEvent[]): UsageMetrics {
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const activeWorkspaces = new Set(events.map(e => e.customMetrics?.workspacePath).filter(Boolean)).size;

    // Calculate peak usage time by hour
    const hourlyUsage = new Array(24).fill(0);
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyUsage[hour]++;
    });

    const maxHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));
    const peakUsageTime = { hour: maxHour, count: hourlyUsage[maxHour] };

    // Calculate popular workspaces
    const workspaceCounts = events.reduce((acc, event) => {
      const workspace = event.customMetrics?.workspacePath || 'unknown';
      acc[workspace] = (acc[workspace] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularWorkspaces = Object.entries(workspaceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([workspace, commands]) => ({ workspace, commands }));

    // Calculate growth rate (last 7 days vs previous 7 days)
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const recentEvents = events.filter(e => new Date(e.timestamp).getTime() >= weekAgo);
    const previousEvents = events.filter(e => {
      const time = new Date(e.timestamp).getTime();
      return time >= twoWeeksAgo && time < weekAgo;
    });

    const growthRate = previousEvents.length > 0
      ? Math.round(((recentEvents.length - previousEvents.length) / previousEvents.length) * 100)
      : 0;

    return {
      uniqueUsers,
      activeWorkspaces,
      peakUsageTime,
      popularWorkspaces,
      growthRate
    };
  }

  private getEmptySummary(): KPISummary {
    return {
      totalCommands: 0,
      successRate: 0,
      averageExecutionTime: 0,
      commandsPerSecond: 0,
      errorRate: 0,
      totalErrors: 0,
      popularCommands: [],
      performanceMetrics: {
        fastestCommand: { command: '', time: 0 },
        slowestCommand: { command: '', time: 0 },
        averageTime: 0,
        percentile95: 0,
        percentile99: 0
      },
      qualityMetrics: {
        codeReviewScores: { avg: 0, min: 0, max: 0 },
        buildSuccessRates: {},
        errorReductions: {},
        autoFixRates: {}
      },
      usageMetrics: {
        uniqueUsers: 0,
        activeWorkspaces: 0,
        peakUsageTime: { hour: 0, count: 0 },
        popularWorkspaces: [],
        growthRate: 0
      }
    };
  }

  private generateMarkdownReport(summary: KPISummary, realTime: any): string {
    const healthEmoji = realTime.systemHealth === 'healthy' ? '🟢' :
                        realTime.systemHealth === 'degraded' ? '🟡' : '🔴';

    let report = `# Slash Commands KPI Dashboard\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**System Health:** ${healthEmoji} ${realTime.systemHealth.toUpperCase()}\n`;
    report += `**Active Commands:** ${realTime.activeCommands}\n`;
    report += `**Current RPS:** ${realTime.currentRPS.toFixed(2)}\n\n`;

    // Overview
    report += `## Overview\n\n`;
    report += `- **Total Commands:** ${summary.totalCommands}\n`;
    report += `- **Success Rate:** ${summary.successRate}%\n`;
    report += `- **Error Rate:** ${summary.errorRate}%\n`;
    report += `- **Avg Execution Time:** ${summary.averageExecutionTime}ms\n`;
    report += `- **Commands/Second:** ${summary.commandsPerSecond}\n\n`;

    // Popular Commands
    if (summary.popularCommands.length > 0) {
      report += `## Popular Commands\n\n`;
      report += `| Command | Executions | Success Rate | Avg Time | Last Used |\n`;
      report += `|---------|------------|--------------|----------|-----------|\n`;

      summary.popularCommands.slice(0, 10).forEach(cmd => {
        report += `| /${cmd.command} | ${cmd.executions} | ${cmd.successRate}% | ${cmd.avgExecutionTime}ms | ${new Date(cmd.lastUsed).toLocaleDateString()} |\n`;
      });
      report += `\n`;
    }

    // Performance Metrics
    report += `## Performance Metrics\n\n`;
    report += `- **Fastest Command:** /${summary.performanceMetrics.fastestCommand.command} (${summary.performanceMetrics.fastestCommand.time}ms)\n`;
    report += `- **Slowest Command:** /${summary.performanceMetrics.slowestCommand.command} (${summary.performanceMetrics.slowestCommand.time}ms)\n`;
    report += `- **95th Percentile:** ${summary.performanceMetrics.percentile95}ms\n`;
    report += `- **99th Percentile:** ${summary.performanceMetrics.percentile99}ms\n\n`;

    // Quality Metrics
    report += `## Quality Metrics\n\n`;
    report += `### Code Review Scores\n`;
    report += `- **Average:** ${summary.qualityMetrics.codeReviewScores.avg}/100\n`;
    report += `- **Range:** ${summary.qualityMetrics.codeReviewScores.min} - ${summary.qualityMetrics.codeReviewScores.max}\n\n`;

    if (Object.keys(summary.qualityMetrics.buildSuccessRates).length > 0) {
      report += `### Build Success Rates\n`;
      Object.entries(summary.qualityMetrics.buildSuccessRates).forEach(([command, rate]) => {
        report += `- **/${command}:** ${rate}%\n`;
      });
      report += `\n`;
    }

    // Usage Metrics
    report += `## Usage Metrics\n\n`;
    report += `- **Unique Users:** ${summary.usageMetrics.uniqueUsers}\n`;
    report += `- **Active Workspaces:** ${summary.usageMetrics.activeWorkspaces}\n`;
    report += `- **Peak Usage Hour:** ${summary.usageMetrics.peakUsageTime.hour}:00 (${summary.usageMetrics.peakUsageTime.count} commands)\n`;
    report += `- **Growth Rate:** ${summary.usageMetrics.growthRate}%\n\n`;

    // Recent Errors
    if (realTime.recentErrors.length > 0) {
      report += `## Recent Errors\n\n`;
      realTime.recentErrors.slice(0, 5).forEach((error: any) => {
        report += `- **/${error.command}** - ${error.errorType} (${new Date(error.timestamp).toLocaleTimeString()})\n`;
      });
      report += `\n`;
    }

    return report;
  }

  private generateHTMLReport(summary: KPISummary, realTime: any): string {
    // This would generate a more comprehensive HTML report
    // For now, return the markdown report wrapped in basic HTML
    const markdown = this.generateMarkdownReport(summary, realTime);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Slash Commands KPI Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric { background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .health-healthy { color: #28a745; }
        .health-degraded { color: #ffc107; }
        .health-critical { color: #dc3545; }
    </style>
</head>
<body>
    <pre>${markdown}</pre>
</body>
</html>`;
  }
}