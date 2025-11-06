/**
 * Dashboard command - Interact with Skills Fabric Dashboard API
 */

import { Command } from 'commander';
import chalk from 'chalk';

// Use global AbortController (available in Node.js 18+)

interface SkillInfo {
  id: string;
  name: string;
  description: string;
  severity?: string;
  activationCount?: number;
  lastUsed?: string;
}

interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  dependencies: {
    [key: string]: { status: string; error?: string; url?: string };
  };
  metrics: {
    totalActivations?: number;
    averageLatency?: number;
    cacheSize?: number;
    requestsProcessed?: number;
    memoryUsage?: any;
    cpuUsage?: any;
  };
}

export function dashboardCommand(program: Command) {
  const dashboardCmd = program
    .command('dashboard')
    .description('Interact with Skills Fabric Dashboard API')
    .option('--host <host>', 'Dashboard API host', '127.0.0.1')
    .option('--port <port>', 'Dashboard API port', '3000'); // Corrected default port

  // Health check command
  dashboardCmd
    .command('health')
    .description('Check dashboard API health')
    .option('--json', 'Output as JSON', false)
    .action(async (options: { host?: string; port?: string; json?: boolean }) => {
      const host = options.host || '127.0.0.1';
      const port = options.port || '3000'; // Corrected default port
      const url = `http://${host}:${port}/health`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

        const response = await fetch(url, { signal: controller.signal as any });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const health: SystemHealth = await response.json() as SystemHealth;

        if (options.json) {
          console.log(JSON.stringify(health, null, 2));
        } else {
          console.log(chalk.green('🏥 Dashboard API Health Check'));
          console.log(chalk.cyan(`Status: ${health.status}`));
          console.log(chalk.cyan(`Uptime: ${health.uptime}ms (${Math.floor(health.uptime / 1000)}s)`));

          console.log(chalk.yellow('\n📊 Dependencies:'));
          Object.entries(health.dependencies).forEach(([name, service]: [string, any]) => {
            const statusColor = service.status === 'healthy' ? chalk.green :
                             service.status === 'degraded' ? chalk.yellow : chalk.red;
            console.log(`  ${statusColor(name)}: ${service.status}`);
          });

          console.log(chalk.blue('\n📈 Metrics:'));
          console.log(`  Activations: ${health.metrics.totalActivations}`);
          console.log(`  Avg Latency: ${health.metrics.averageLatency}ms`);
          console.log(`  Cache Size: ${health.metrics.cacheSize}`);

          if (health.metrics.memoryUsage) {
            console.log(chalk.magenta('\n💻 System:'));
            console.log(`  Memory: ${Math.round(health.metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
            console.log(`  CPU: ${Math.round(health.metrics.cpuUsage.user / 1000000)}ms user, ${Math.round(health.metrics.cpuUsage.system / 1000000)}ms system`);
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ Health check failed: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // List skills command
  dashboardCmd
    .command('skills')
    .description('List available skills from dashboard')
    .option('--json', 'Output as JSON', false)
    .action(async (options: { host?: string; port?: string; json?: boolean }) => {
      const host = options.host || '127.0.0.1';
      const port = options.port || '3000'; // Corrected default port
      const url = `http://${host}:${port}/api/skills`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, { signal: controller.signal as any });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const skills: SkillInfo[] = await response.json() as SkillInfo[];

        if (options.json) {
          console.log(JSON.stringify(skills, null, 2));
        } else {
          console.log(chalk.green('📋 Available Skills'));
          console.log(chalk.cyan(`Total: ${skills.length} skills`));

          if (skills.length === 0) {
            console.log(chalk.yellow('  No skills registered in dashboard'));
            console.log(chalk.gray('  Tip: Use "skills index" to register skills'));
            return;
          }

          skills.forEach((skill, index) => {
            const severityColor = skill.severity === 'critical' ? chalk.red :
                               skill.severity === 'high' ? chalk.yellow : chalk.blue;
            console.log(`${index + 1}. ${skill.name || skill.id}`);
            console.log(`   ${chalk.gray(skill.description || 'No description')}`);
            if (skill.activationCount) {
              console.log(`   ${chalk.cyan(`Activations: ${skill.activationCount}`)}`);
            }
            if (skill.lastUsed) {
              console.log(`   ${chalk.gray(`Last used: ${new Date(skill.lastUsed).toLocaleString()}`)}`);
            }
            if (skill.severity) {
              console.log(`   ${severityColor(`Severity: ${skill.severity}`)}`);
            }
          });
        }
      } catch (error) {
        console.error(chalk.red(`❌ Failed to fetch skills: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Real-time metrics command
  dashboardCmd
    .command('metrics')
    .description('Get real-time metrics from dashboard')
    .option('--format <format>', 'Output format', 'table')
    .action(async (options: { host?: string; port?: string; format?: string }) => {
      const host = options.host || '127.0.0.1';
      const port = options.port || '3000'; // Corrected default port
      const url = `http://${host}:${port}/api/realtime-metrics`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, { signal: controller.signal as any });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const metrics = await response.json() as Record<string, any>;

        console.log(chalk.green('📊 Real-time Metrics'));

        if (options.format === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          // Display metrics in table format
          Object.entries(metrics).forEach(([key, value]) => {
            console.log(chalk.cyan(`${key}:`));
            if (typeof value === 'object' && value !== null) {
              Object.entries(value).forEach(([subKey, subValue]) => {
                console.log(`  ${subKey}: ${subValue}`);
              });
            } else {
              console.log(`  ${value}`);
            }
          });
        }
      } catch (error) {
        console.error(chalk.red(`❌ Failed to fetch metrics: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // System health command
  dashboardCmd
    .command('system')
    .description('Get comprehensive system health report')
    .option('--json', 'Output as JSON', false)
    .action(async (options: { host?: string; port?: string; json?: boolean }) => {
      const host = options.host || '127.0.0.1';
      const port = options.port || '3000'; // Corrected default port

      try {
        // Fetch health, metrics, and system info
        const [healthRes, skillsRes, metricsRes] = await Promise.allSettled([
          fetch(`http://${host}:${port}/health`),
          fetch(`http://${host}:${port}/api/skills`),
          fetch(`http://${host}:${port}/api/realtime-metrics`),
        ]);

        const health = healthRes.status === 'fulfilled' && healthRes.value.ok ?
          (await healthRes.value.json()) as SystemHealth : null;
        const skills = skillsRes.status === 'fulfilled' && skillsRes.value.ok ?
          (await skillsRes.value.json()) as SkillInfo[] : [];
        const metrics = metricsRes.status === 'fulfilled' && metricsRes.value.ok ?
          (await metricsRes.value.json()) as Record<string, any> : {};

        if (options.json) {
          const report = {
            health,
            skills,
            metrics,
            timestamp: new Date().toISOString(),
          };
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(chalk.green('🏥 System Health Report'));
          console.log(chalk.cyan(`Timestamp: ${new Date().toISOString()}`));

          if (health) {
            console.log(chalk.yellow('\n🔍 Health Status'));
            console.log(`  Overall: ${health.status}`);
            console.log(`  Uptime: ${Math.floor(health.uptime / 1000)}s`);

            if (health.metrics.memoryUsage) {
              console.log(chalk.blue('\n💻 Resources'));
              console.log(`  Memory: ${Math.round(health.metrics.memoryUsage.heapUsed / 1024 / 1024)}MB used`);
              console.log(`  Cache: ${health.metrics.cacheSize} entries`);
            }

            console.log(chalk.magenta('\n📊 Performance'));
            console.log(`  Requests: ${health.metrics.requestsProcessed}`);
            console.log(`  Avg Latency: ${health.metrics.averageLatency}ms`);
            console.log(`  Activations: ${health.metrics.totalActivations}`);
          }

          console.log(chalk.cyan(`\n📋 Skills: ${skills.length} registered`));
          if (skills.length > 0) {
            const severities = skills.reduce((acc: Record<string, number>, skill: SkillInfo) => {
              const severity = skill.severity || 'unknown';
              acc[severity] = (acc[severity] || 0) + 1;
              return acc;
            }, {});

            Object.entries(severities).forEach(([severity, count]) => {
              console.log(`  ${severity}: ${count}`);
            });
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ Failed to generate system report: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  return dashboardCmd;
}