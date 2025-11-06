/**
 * Advanced KPI Command Handler for Slash Commands
 *
 * Provides comprehensive KPI analytics and reporting for slash commands
 */

import { SlashCommandHandler } from '../handlers/base.js';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult,
  CommandMetadata
} from '../types.js';
import { getKPIIntegration } from '../kpi-integration.js';

interface KPIAdvancedMetadata extends CommandMetadata {
  timeRange?: {
    start?: string;
    end?: string;
  };
  format?: 'json' | 'markdown' | 'dashboard';
  reportType?: 'summary' | 'detailed' | 'performance' | 'usage' | 'errors';
  exportPath?: string;
}

export class KPIAdvancedCommand extends SlashCommandHandler {
  constructor() {
    super({
      name: 'kpi-advanced',
      description: 'Advanced KPI analytics and reporting for slash commands',
      category: 'utilities',
      handler: 'KPIAdvancedCommand',
      requiresAuth: false,
      persistenceLevel: 'session',
      examples: [
        '/kpi-advanced',
        '/kpi-advanced --detailed',
        '/kpi-advanced --performance',
        '/kpi-advanced --start 2025-10-01 --end 2025-10-31',
        '/kpi-advanced --format dashboard --export-path docs/kpi-dashboard.md',
        '/kpi-advanced --report-type errors'
      ],
      aliases: ['kpi-adv', 'metrics-advanced', 'analytics-pro']
    });
  }

  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    // Validate format flag
    const format = this.getFlag(parsedCommand, 'format', 'markdown');
    const validFormats = ['json', 'markdown', 'dashboard'];
    if (!validFormats.includes(format)) {
      return {
        valid: false,
        message: `Invalid format: ${format}. Valid formats: ${validFormats.join(', ')}`
      };
    }

    // Validate report type
    const reportType = this.getFlag(parsedCommand, 'report-type', 'summary');
    const validReportTypes = ['summary', 'detailed', 'performance', 'usage', 'errors'];
    if (!validReportTypes.includes(reportType)) {
      return {
        valid: false,
        message: `Invalid report type: ${reportType}. Valid types: ${validReportTypes.join(', ')}`
      };
    }

    // Validate date format if provided
    const startDate = this.getFlag(parsedCommand, 'start', '');
    const endDate = this.getFlag(parsedCommand, 'end', '');

    if (startDate && !this.isValidDate(startDate)) {
      return {
        valid: false,
        message: `Invalid start date format: ${startDate}. Use YYYY-MM-DD format.`
      };
    }

    if (endDate && !this.isValidDate(endDate)) {
      return {
        valid: false,
        message: `Invalid end date format: ${endDate}. Use YYYY-MM-DD format.`
      };
    }

    return { valid: true };
  }

  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const startTime = Date.now();

    try {
      // Get KPI integration
      const kpiIntegration = getKPIIntegration();

      // Parse options
      const format = this.getFlag(parsedCommand, 'format', 'markdown') as 'json' | 'markdown' | 'dashboard';
      const reportType = this.getFlag(parsedCommand, 'report-type', 'summary');
      const detailed = this.getFlag(parsedCommand, 'detailed', false);
      const performance = this.getFlag(parsedCommand, 'performance', false);
      const usage = this.getFlag(parsedCommand, 'usage', false);
      const errors = this.getFlag(parsedCommand, 'errors', false);
      const exportPath = this.getFlag(parsedCommand, 'export-path', '');

      // Parse time range
      const timeRange = {
        start: this.getFlag(parsedCommand, 'start', ''),
        end: this.getFlag(parsedCommand, 'end', '')
      };

      // Get current metrics
      const metrics = kpiIntegration.getMetrics();

      // Generate report based on format
      let output: string;
      let data: any;

      switch (format) {
        case 'json':
          output = await this.generateJSONReport(kpiIntegration, timeRange, reportType, detailed);
          data = metrics;
          break;
        case 'dashboard':
          output = await this.generateDashboardReport(kpiIntegration, timeRange, {
            detailed,
            performance,
            usage,
            errors
          });
          data = metrics;
          break;
        case 'markdown':
        default:
          output = await kpiIntegration.generateKPIReport(timeRange);
          data = metrics;
          break;
      }

      // Export to file if requested
      if (exportPath) {
        await this.exportReport(output, exportPath);
        output += `\n\n📄 Report exported to: ${exportPath}`;
      }

      const executionTime = Date.now() - startTime;

      // Add next actions
      const nextActions = this.generateNextActions(metrics, reportType);

      return {
        success: true,
        output,
        data,
        nextActions
      };

    } catch (error) {
      console.error('❌ KPI Advanced command failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        this.createError('execution', `KPI Advanced command failed: ${errorMessage}`)
      );
    }
  }

  private async generateJSONReport(
    kpiIntegration: any,
    timeRange: { start?: string; end?: string },
    reportType: string,
    detailed: boolean
  ): Promise<string> {
    const metrics = kpiIntegration.getMetrics();

    const report = {
      timestamp: new Date().toISOString(),
      reportType,
      detailed,
      timeRange,
      metrics,
      summary: {
        totalCommands: metrics.totalCommands,
        successRate: metrics.successRate,
        averageExecutionTime: metrics.averageExecutionTime,
        errorRate: metrics.errorRate,
        integrationUsage: metrics.integrationUsage,
        topCommands: Object.entries(metrics.commandUsage)
          .sort((a: [string, unknown], b: [string, unknown]) => (b[1] as number) - (a[1] as number))
          .slice(0, 10)
          .map(([command, count]) => ({ command, count }))
      }
    };

    return JSON.stringify(report, null, 2);
  }

  private async generateDashboardReport(
    kpiIntegration: any,
    timeRange: { start?: string; end?: string },
    options: {
      detailed?: boolean;
      performance?: boolean;
      usage?: boolean;
      errors?: boolean;
    }
  ): Promise<string> {
    const metrics = kpiIntegration.getMetrics();

    let dashboard = '# 🎯 Slash Commands KPI Dashboard\n\n';

    // KPI Cards
    dashboard += '## 📊 Key Performance Indicators\n\n';
    dashboard += this.generateKPICard('Total Commands', metrics.totalCommands.toString(), '📋', 'primary');
    dashboard += this.generateKPICard('Success Rate', `${metrics.successRate.toFixed(1)}%`, this.getSuccessIcon(metrics.successRate), this.getSuccessColor(metrics.successRate));
    dashboard += this.generateKPICard('Avg Time', `${metrics.averageExecutionTime.toFixed(2)}ms`, '⚡', this.getPerformanceColor(metrics.averageExecutionTime));
    dashboard += this.generateKPICard('Error Rate', `${metrics.errorRate.toFixed(1)}%`, '🚨', this.getErrorColor(metrics.errorRate));

    // Performance Section (if requested)
    if (options.performance) {
      dashboard += '\n## ⚡ Performance Analysis\n\n';
      dashboard += `| Metric | Value |\n`;
      dashboard += `|--------|-------|\n`;
      dashboard += `| Fastest Command | /${metrics.performanceMetrics.fastestCommand.command} (${metrics.performanceMetrics.fastestCommand.time}ms) |\n`;
      dashboard += `| Slowest Command | /${metrics.performanceMetrics.slowestCommand.command} (${metrics.performanceMetrics.slowestCommand.time}ms) |\n`;
      dashboard += `| P95 Execution Time | ${metrics.performanceMetrics.p95ExecutionTime}ms |\n`;
      dashboard += `| P99 Execution Time | ${metrics.performanceMetrics.p99ExecutionTime}ms |\n\n`;
    }

    // Usage Section (if requested)
    if (options.usage) {
      dashboard += '\n## 📈 Usage Analytics\n\n';
      dashboard += `**Peak Hour**: ${metrics.usagePatterns.peakHour}:00\n`;
      dashboard += `**Peak Day**: ${metrics.usagePatterns.peakDay}\n\n`;

      dashboard += '### Top Commands\n\n';
      const sortedCommands = Object.entries(metrics.commandUsage)
        .sort((a: [string, unknown], b: [string, unknown]) => (b[1] as number) - (a[1] as number))
        .slice(0, 10);

      for (const [command, count] of sortedCommands) {
        const countNum = count as number;
        const percentage = ((countNum / metrics.totalCommands) * 100);
        const bar = '█'.repeat(Math.round(percentage / 5));
        dashboard += `- **/${command}**: ${count} (${percentage.toFixed(1)}%) ${bar}\n`;
      }
      dashboard += '\n';
    }

    // Error Section (if requested)
    if (options.errors && Object.keys(metrics.errorTypes).length > 0) {
      dashboard += '\n## 🚨 Error Analysis\n\n';
      for (const [errorType, count] of Object.entries(metrics.errorTypes)) {
        const countNum = count as number;
        const percentage = ((countNum / metrics.totalCommands) * 100).toFixed(1);
        dashboard += `- **${errorType}**: ${count} occurrences (${percentage}%)\n`;
      }
      dashboard += '\n';
    }

    // Integration Usage
    dashboard += '\n## 🔌 Integration Breakdown\n\n';
    for (const [integration, count] of Object.entries(metrics.integrationUsage)) {
      const countNum = count as number;
      const percentage = ((countNum / metrics.totalCommands) * 100).toFixed(1);
      const icon = this.getIntegrationIcon(integration);
      dashboard += `${icon} **${integration}**: ${count} commands (${percentage}%)\n`;
    }

    return dashboard;
  }

  private async exportReport(content: string, filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Ensure directory exists
    const dir = path.dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Write file
    await fs.writeFile(filePath, content, 'utf-8');
  }

  private generateNextActions(metrics: any, reportType: string): string[] {
    const actions: string[] = [];

    // Based on performance
    if (metrics.averageExecutionTime > 100) {
      actions.push('/kpi-advanced --performance --detailed');
    }

    // Based on error rate
    if (metrics.errorRate > 5) {
      actions.push('/kpi-advanced --report-type errors --detailed');
      actions.push('/code-review --strict');
    }

    // Based on usage patterns
    const mostUsed = Object.entries(metrics.commandUsage)[0] as [string, number] | undefined;
    if (mostUsed && mostUsed[1] > 100) {
      actions.push(`/kpi-advanced --report-type usage --start ${this.getDateDaysAgo(7)} --end ${this.getDateToday()}`);
    }

    // Export actions
    actions.push('/kpi-advanced --format dashboard --export-path docs/kpi-dashboard.md');
    actions.push('/kpi-advanced --format json --export-path docs/kpi-metrics.json');

    // General actions
    actions.push('/kpi-advanced --detailed');
    actions.push('/compact');

    return actions;
  }

  private generateKPICard(title: string, value: string, icon: string, color: string): string {
    return `
<div class="kpi-card kpi-card-${color}">
  <div class="kpi-card-icon">${icon}</div>
  <div class="kpi-card-content">
    <div class="kpi-card-title">${title}</div>
    <div class="kpi-card-value">${value}</div>
  </div>
</div>`;
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private getDateToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private getSuccessIcon(successRate: number): string {
    if (successRate >= 95) return '✅';
    if (successRate >= 90) return '🟡';
    return '🔴';
  }

  private getSuccessColor(successRate: number): string {
    if (successRate >= 95) return 'success';
    if (successRate >= 90) return 'warning';
    return 'danger';
  }

  private getPerformanceColor(avgTime: number): string {
    if (avgTime <= 100) return 'success';
    if (avgTime <= 200) return 'warning';
    return 'danger';
  }

  private getErrorColor(errorRate: number): string {
    if (errorRate <= 1) return 'success';
    if (errorRate <= 5) return 'warning';
    return 'danger';
  }

  private getIntegrationIcon(integration: string): string {
    const icons: Record<string, string> = {
      'cli': '💻',
      'daemon': '🤖',
      'skill': '🧠',
      'native': '⚙️'
    };
    return icons[integration] || '❓';
  }

  protected getIntegrationType(): 'skill' | 'daemon' | 'cli' | 'native' {
    return 'cli';
  }
}