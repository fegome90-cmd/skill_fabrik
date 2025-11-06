/**
 * Enhanced PM2 Ecosystem Configuration
 *
 * Complete service management with health checks,
 * dependency ordering, and monitoring for Skills Fabrik.
 *
 * Services:
 * - sf-daemon: Core daemon service (Port 7727)
 * - router-service: Router with daemon dependency (Port 3000)
 * - service-discovery: Central service registry (Port 8877)
 * - skills-cli-service: CLI background service
 *
 * Playbooks de troubleshooting:
 * - Ver logs: pm2 logs <service> --lines 200
 * - Monitoreo: pm2 monit
 * - Health checks: curl http://localhost:PORT/health
 * - Reiniciar: pm2 restart <service>
 */

module.exports = {
  apps: [
    {
      // Daemon Service - Core System Component
      name: 'sf-daemon',
      cwd: './packages/daemon',
      script: 'node',
      args: 'dist/index.js',
      // Cluster mode minimal: opt-in via PM2_CLUSTER=1 or env_production
      instances: process.env.PM2_CLUSTER === '1' ? 'max' : 1,
      exec_mode: process.env.PM2_CLUSTER === '1' ? 'cluster' : 'fork',

      // Process Management
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      min_uptime: '10s',
      max_restarts: 10,

      // Logging
      error_file: './logs/daemon-error.log',
      out_file: './logs/daemon-out.log',
      log_file: './logs/daemon-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',

      // Environment
      env: {
        NODE_ENV: 'development',
        SF_PORT: 7727,
        SF_HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        SF_DASHBOARD_ENABLED: 'false'  // ⭐ Deshabilitar dashboard WebSocket
      },
      env_production: {
        NODE_ENV: 'production',
        // Prefer YAML config to drive host/port. Fallbacks remain here.
        SF_PORT: 7727,
        SF_HOST: '0.0.0.0',
        PM2_CLUSTER: '1',
        LOG_LEVEL: 'warn',
        SF_DASHBOARD_ENABLED: 'false'  // ⭐ Deshabilitar dashboard WebSocket
      },

      // Health Monitoring
      health_check_url: 'http://127.0.0.1:7727/health',
      health_check_grace_period: 3000,
      health_check_interval: 5000,

      // Advanced Options
      kill_timeout: 5000,
      restart_delay: 4000,
      source_map_support: true
    },

    {
      // Router Service - Depends on Daemon
      name: 'router-service',
      cwd: './packages/router',
      script: 'node',
      args: 'dist/cli/start-router-server.js',
      instances: 1,
      exec_mode: 'fork',

      // Process Management
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',

      // Logging
      error_file: './logs/router-error.log',
      out_file: './logs/router-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DAEMON_URL: 'http://127.0.0.1:7727'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DAEMON_URL: 'http://sf-daemon:7727'
      },

      // Health Monitoring
      health_check_url: 'http://127.0.0.1:3000/health',
      health_check_grace_period: 5000,

      // Dependencies
      dependencies: ['sf-daemon'],
      wait_ready: true,
      listen_timeout: 10000
    },

    {
      // Service Discovery Server - Central Service Registry
      name: 'service-discovery',
      cwd: './packages/shared',
      script: 'node',
      args: 'dist/cli/start-discovery-server.js',
      instances: 1,
      exec_mode: 'fork',

      // Process Management
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      min_uptime: '10s',
      max_restarts: 5,

      // Logging
      error_file: './logs/discovery-error.log',
      out_file: './logs/discovery-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',

      // Environment
      env: {
        NODE_ENV: 'development',
        DISCOVERY_PORT: 8877,
        DISCOVERY_HOST: '127.0.0.1'
        // DISCOVERY_CORS removed - using compatible @fastify/cors ^8.4.0 with Fastify 4.x
      },
      env_production: {
        NODE_ENV: 'production',
        DISCOVERY_PORT: 8877,
        DISCOVERY_HOST: '0.0.0.0'
      },

      // Health Monitoring
      health_check_url: 'http://127.0.0.1:8877/health',
      health_check_grace_period: 3000,
      health_check_interval: 10000,

      // Advanced Options
      kill_timeout: 3000,
      restart_delay: 2000
    },

    {
      // Skills CLI Service - Background Tasks
      name: 'skills-cli-service',
      cwd: './packages/skills-cli',
      script: 'node',
      args: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',

      // Process Management
      autorestart: false, // Manual start for background tasks
      watch: false,
      max_memory_restart: '300M',

      // Logging
      error_file: './logs/skills-cli-error.log',
      out_file: './logs/skills-cli-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'development',
        CLI_MODE: 'service',
        DISCOVERY_URL: 'http://127.0.0.1:8877'
      },
      env_production: {
        NODE_ENV: 'production',
        CLI_MODE: 'service',
        DISCOVERY_URL: 'http://service-discovery:8877'
      }
    }
  ],

  // Deploy Configuration (for future use)
  deploy: {
    production: {
      user: 'deploy',
      host: 'production-server',
      ref: 'origin/main',
      repo: 'git@github.com:username/skills-fabrik.git',
      path: '/var/www/skills-fabrik',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm -w build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
