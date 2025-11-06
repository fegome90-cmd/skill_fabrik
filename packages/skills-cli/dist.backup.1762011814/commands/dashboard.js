/**
 * Dashboard command - Interact with Skills Fabric Dashboard API
 */
import chalk from 'chalk';
export function dashboardCommand(program) {
    const dashboardCmd = program
        .command('dashboard')
        .description('Interact with Skills Fabric Dashboard API')
        .option('--host <host>', 'Dashboard API host', '127.0.0.1')
        .option('--port <port>', 'Dashboard API port', '7727');
    // Health check command
    dashboardCmd
        .command('health')
        .description('Check dashboard API health')
        .option('--json', 'Output as JSON', false)
        .action(async (options) => {
        const host = options.host || '127.0.0.1';
        const port = options.port || '7727';
        const url = `http://${host}:${port}/health`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const health = await response.json();
            if (options.json) {
                console.log(JSON.stringify(health, null, 2));
            }
            else {
                console.log(chalk.green('🏥 Dashboard API Health Check'));
                console.log(chalk.cyan(`Status: ${health.status}`));
                console.log(chalk.cyan(`Uptime: ${health.uptime}ms (${Math.floor(health.uptime / 1000)}s)`));
                console.log(chalk.yellow('\n📊 Services:'));
                Object.entries(health.services).forEach(([name, service]) => {
                    const statusColor = service.status === 'healthy' ? chalk.green :
                        service.status === 'degraded' ? chalk.yellow : chalk.red;
                    console.log(`  ${statusColor(name)}: ${service.status}`);
                });
                console.log(chalk.blue('\n📈 Metrics:'));
                console.log(`  Activations: ${health.metrics.totalActivations}`);
                console.log(`  Avg Latency: ${health.metrics.averageLatency}ms`);
                console.log(`  Cache Size: ${health.metrics.cacheSize}`);
                console.log(chalk.magenta('\n💻 System:'));
                console.log(`  Memory: ${Math.round(health.system.memoryUsage.heapUsed / 1024 / 1024)}MB`);
                console.log(`  CPU: ${Math.round(health.system.cpuUsage.user / 1000000)}ms user, ${Math.round(health.system.cpuUsage.system / 1000000)}ms system`);
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ Health check failed: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });
    // List skills command
    dashboardCmd
        .command('skills')
        .description('List available skills from dashboard')
        .option('--json', 'Output as JSON', false)
        .action(async (options) => {
        const host = options.host || '127.0.0.1';
        const port = options.port || '7727';
        const url = `http://${host}:${port}/api/skills`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const skills = await response.json();
            if (options.json) {
                console.log(JSON.stringify(skills, null, 2));
            }
            else {
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
        }
        catch (error) {
            console.error(chalk.red(`❌ Failed to fetch skills: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });
    // Real-time metrics command
    dashboardCmd
        .command('metrics')
        .description('Get real-time metrics from dashboard')
        .option('--format <format>', 'Output format', 'table')
        .action(async (options) => {
        const host = options.host || '127.0.0.1';
        const port = options.port || '7727';
        const url = `http://${host}:${port}/api/realtime-metrics`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const metrics = await response.json();
            console.log(chalk.green('📊 Real-time Metrics'));
            if (options.format === 'json') {
                console.log(JSON.stringify(metrics, null, 2));
            }
            else {
                // Display metrics in table format
                Object.entries(metrics).forEach(([key, value]) => {
                    console.log(chalk.cyan(`${key}:`));
                    if (typeof value === 'object' && value !== null) {
                        Object.entries(value).forEach(([subKey, subValue]) => {
                            console.log(`  ${subKey}: ${subValue}`);
                        });
                    }
                    else {
                        console.log(`  ${value}`);
                    }
                });
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ Failed to fetch metrics: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });
    // System health command
    dashboardCmd
        .command('system')
        .description('Get comprehensive system health report')
        .option('--json', 'Output as JSON', false)
        .action(async (options) => {
        const host = options.host || '127.0.0.1';
        const port = options.port || '7727';
        try {
            // Fetch health, metrics, and system info
            const [healthRes, skillsRes, metricsRes] = await Promise.allSettled([
                fetch(`http://${host}:${port}/health`),
                fetch(`http://${host}:${port}/api/skills`),
                fetch(`http://${host}:${port}/api/realtime-metrics`),
            ]);
            const health = healthRes.status === 'fulfilled' && healthRes.value.ok ?
                (await healthRes.value.json()) : null;
            const skills = skillsRes.status === 'fulfilled' && skillsRes.value.ok ?
                (await skillsRes.value.json()) : [];
            const metrics = metricsRes.status === 'fulfilled' && metricsRes.value.ok ?
                (await metricsRes.value.json()) : {};
            if (options.json) {
                const report = {
                    health,
                    skills,
                    metrics,
                    timestamp: new Date().toISOString(),
                };
                console.log(JSON.stringify(report, null, 2));
            }
            else {
                console.log(chalk.green('🏥 System Health Report'));
                console.log(chalk.cyan(`Timestamp: ${new Date().toISOString()}`));
                if (health) {
                    console.log(chalk.yellow('\n🔍 Health Status'));
                    console.log(`  Overall: ${health.status}`);
                    console.log(`  Uptime: ${Math.floor(health.uptime / 1000)}s`);
                    console.log(chalk.blue('\n💻 Resources'));
                    console.log(`  Memory: ${Math.round(health.system.memoryUsage.heapUsed / 1024 / 1024)}MB used`);
                    console.log(`  Cache: ${health.metrics.cacheSize} entries`);
                    console.log(chalk.magenta('\n📊 Performance'));
                    console.log(`  Requests: ${health.metrics.requestsProcessed}`);
                    console.log(`  Avg Latency: ${health.metrics.averageLatency}ms`);
                    console.log(`  Activations: ${health.metrics.totalActivations}`);
                }
                console.log(chalk.cyan(`\n📋 Skills: ${skills.length} registered`));
                if (skills.length > 0) {
                    const severities = skills.reduce((acc, skill) => {
                        const severity = skill.severity || 'unknown';
                        acc[severity] = (acc[severity] || 0) + 1;
                        return acc;
                    }, {});
                    Object.entries(severities).forEach(([severity, count]) => {
                        console.log(`  ${severity}: ${count}`);
                    });
                }
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ Failed to generate system report: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });
    return dashboardCmd;
}
//# sourceMappingURL=dashboard.js.map