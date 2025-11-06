import { execSync } from 'node:child_process';
export function daemonCommand(program) {
    const cmd = program.command('daemon').description('Manage Skill Fabric daemon via PM2');
    // Start daemon with PM2
    cmd
        .command('start')
        .description('Start daemon via PM2')
        .option('-e, --env <environment>', 'Environment (development|production)', 'development')
        .action(async (options) => {
        try {
            console.log(`🚀 Starting sf-daemon (${options.env})...`);
            // Start only daemon service
            execSync(`pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon --env ${options.env}`, {
                stdio: 'inherit',
                cwd: process.cwd()
            });
            // Wait and verify health
            setTimeout(async () => {
                try {
                    const response = execSync('curl -s http://127.0.0.1:7727/health', {
                        encoding: 'utf-8'
                    });
                    console.log('✅ sf-daemon started successfully');
                    console.log('📊 Health:', response.trim());
                }
                catch {
                    console.log('⚠️  sf-daemon started but health check failed');
                }
            }, 3000);
        }
        catch (error) {
            console.error('❌ Failed to start sf-daemon:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Stop daemon via PM2
    cmd
        .command('stop')
        .description('Stop daemon via PM2')
        .action(async () => {
        try {
            console.log('🛑 Stopping sf-daemon...');
            execSync('pm2 stop sf-daemon', { stdio: 'inherit' });
            console.log('✅ sf-daemon stopped');
        }
        catch (error) {
            console.error('❌ Failed to stop sf-daemon:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Restart daemon via PM2
    cmd
        .command('restart')
        .description('Restart daemon via PM2')
        .action(async () => {
        try {
            console.log('🔄 Restarting sf-daemon...');
            execSync('pm2 restart sf-daemon', { stdio: 'inherit' });
            // Verify health after restart
            setTimeout(async () => {
                try {
                    const response = execSync('curl -s http://127.0.0.1:7727/health', {
                        encoding: 'utf-8'
                    });
                    console.log('✅ sf-daemon restarted successfully');
                    console.log('📊 Health:', response.trim());
                }
                catch {
                    console.log('⚠️  sf-daemon restarted but health check failed');
                }
            }, 3000);
        }
        catch (error) {
            console.error('❌ Failed to restart sf-daemon:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Check daemon status
    cmd
        .command('status')
        .description('Check daemon status and health')
        .action(async () => {
        try {
            // PM2 status
            try {
                const pm2Status = execSync('pm2 jlist | jq -r \'.[] | select(.name=="sf-daemon") | {\(.name): .pm2_env.status, "uptime": .pm2_env.pm_uptime, "memory": .monit.memory}\'', {
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });
                if (pm2Status.trim()) {
                    console.log('📊 PM2 Status:');
                    try {
                        console.log(JSON.stringify(JSON.parse(pm2Status), null, 2));
                    }
                    catch {
                        console.log(pm2Status.trim());
                    }
                }
                else {
                    console.log('❌ sf-daemon not found in PM2');
                    return;
                }
            }
            catch (jqError) {
                // Fallback if jq not available
                const pm2List = execSync('pm2 list', { encoding: 'utf-8' });
                console.log('📊 PM2 Status:');
                console.log(pm2List);
            }
            // Health check
            try {
                const health = execSync('curl -s http://127.0.0.1:7727/health', {
                    encoding: 'utf-8'
                });
                console.log('\n🏥 Health Check:');
                try {
                    console.log(JSON.stringify(JSON.parse(health), null, 2));
                }
                catch {
                    console.log(health.trim());
                }
            }
            catch {
                console.log('\n❌ Health check failed - daemon may be unhealthy');
            }
        }
        catch (error) {
            console.error('❌ Failed to check daemon status:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // View daemon logs
    cmd
        .command('logs')
        .description('View daemon logs')
        .option('-n, --lines <number>', 'Number of lines to show', '100')
        .option('-f, --follow', 'Follow log output')
        .action(async (options) => {
        try {
            const args = ['logs', 'sf-daemon'];
            if (options.lines)
                args.push('--lines', options.lines);
            if (options.follow)
                args.push('--raw');
            execSync(`pm2 ${args.join(' ')}`, { stdio: 'inherit' });
        }
        catch (error) {
            console.error('❌ Failed to view logs:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Monitor daemon
    cmd
        .command('monit')
        .description('Open PM2 monitoring dashboard')
        .action(async () => {
        try {
            execSync('pm2 monit', { stdio: 'inherit' });
        }
        catch (error) {
            console.error('❌ Failed to open monitor:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Start all services
    cmd
        .command('start-all')
        .description('Start all services (daemon, router, skills-cli)')
        .option('-e, --env <environment>', 'Environment (development|production)', 'development')
        .action(async (options) => {
        try {
            console.log(`🚀 Starting all services (${options.env})...`);
            execSync(`pm2 start scripts/pm2/ecosystem.config.cjs --env ${options.env}`, {
                stdio: 'inherit'
            });
            console.log('✅ All services started');
            // Show status
            setTimeout(() => {
                console.log('\n📊 Service Status:');
                execSync('pm2 list', { stdio: 'inherit' });
            }, 2000);
        }
        catch (error) {
            console.error('❌ Failed to start services:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // Stop all services
    cmd
        .command('stop-all')
        .description('Stop all services')
        .action(async () => {
        try {
            console.log('🛑 Stopping all services...');
            execSync('pm2 stop all', { stdio: 'inherit' });
            console.log('✅ All services stopped');
        }
        catch (error) {
            console.error('❌ Failed to stop services:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
}
//# sourceMappingURL=daemon.js.map