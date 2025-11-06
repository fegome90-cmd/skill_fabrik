/**
 * KPI Dashboard Command
 */

import { Command } from 'commander';
import { KPIAggregator, DashboardGenerator } from '@skills-fabrik/kpi';
import { Logger } from '../utils/logger.js';

export function kpiCommand(program: Command) {
  const kpiCmd = program
    .command('kpi')
    .description('Show KPI dashboard and metrics')
    .option('--days <number>', 'Number of days to aggregate', '7')
    .option('--output <path>', 'Output dashboard to file (markdown)', 'docs/kpi/DASHBOARD.md')
    .option('--raw', 'Include raw JSON data in output')
    .option('--events-file <path>', 'Path to events.jsonl', 'obs/kpi/events.jsonl')
    .action(async (options: {
      days?: string;
      output?: string;
      raw?: boolean;
      eventsFile?: string;
    }) => {
      const logger = new Logger(true);

      try {
        const days = parseInt(options.days || '7', 10);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        logger.info(`📊 Aggregating KPIs for last ${days} days...`);

        const aggregator = new KPIAggregator(options.eventsFile);
        const dashboardGen = new DashboardGenerator(aggregator);

        // Generate and display dashboard
        const markdown = await dashboardGen.generate({
          outputPath: options.output,
          timeRange: { start: startDate, end: endDate },
          includeRaw: options.raw,
        });

        // Also display summary in console
        const summary = await aggregator.aggregate({ start: startDate, end: endDate });
        
        logger.info('\n📈 KPI Summary:');
        logger.info(`  Total Events: ${summary.totalEvents}`);
        logger.info(`  Time Range: ${summary.timeRange.start.toISOString().split('T')[0]} - ${summary.timeRange.end.toISOString().split('T')[0]}`);
        
        const emoji = {
          excellent: '🟢',
          good: '🟡',
          warning: '🟠',
          critical: '🔴',
        }[summary.thresholdChecks.holisticStatus];

        logger.info(`  Status: ${emoji} ${summary.thresholdChecks.holisticStatus.toUpperCase()}`);
        logger.info('\n  Velocity Metrics:');
        logger.info(`    Activation Rate: ${summary.metricPairs.velocity.skillActivationRate} skills/op`);
        logger.info(`    Tokens/Op: ${summary.metricPairs.velocity.tokensPerOperation.toLocaleString()}`);
        logger.info(`    Latency: ${summary.metricPairs.velocity.meanActivationLatency}ms`);
        logger.info('\n  Quality Metrics:');
        logger.info(`    Adherence: ${summary.metricPairs.quality.skillAdherenceRate.toFixed(1)}%`);
        logger.info(`    Zero Errors: ${summary.metricPairs.quality.zeroErrorsRate.toFixed(1)}%`);
        logger.info(`    Guardrail Effectiveness: ${summary.metricPairs.quality.guardrailEffectiveness.toFixed(1)}%`);

        if (Object.keys(summary.skillActivations).length > 0) {
          logger.info('\n  Top Skills:');
          Object.entries(summary.skillActivations)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .forEach(([skill, count]) => {
              logger.info(`    ${skill}: ${count}`);
            });
        }

        if (options.output) {
          logger.success(`\n✅ Dashboard saved to ${options.output}`);
        } else {
          logger.info('\n📋 Dashboard:');
          logger.info(markdown);
        }
      } catch (error) {
        logger.error(`Error generating dashboard: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  return kpiCmd;
}

