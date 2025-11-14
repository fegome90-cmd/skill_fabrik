/**
 * PM2 Ecosystem Configuration for Skills Fabrik Daemon V2
 * Enhanced clustering with load balancing and monitoring
 * Task: SF-DAEMON-2025-V2.1
 * Date: 2025-11-14
 */

module.exports = {
  apps: [
    {
      name: 'skills-daemon',
      script: './dist/daemon-v2.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',

      // Environment configuration
      env: {
        NODE_ENV: 'production',
        PORT: 7730,
        SF_DAEMON_MODE: 'cluster'
      },

      env_development: {
        NODE_ENV: 'development',
        PORT: 7731,
        SF_DAEMON_MODE: 'development',
        LOG_LEVEL: 'debug'
      },

      env_staging: {
        NODE_ENV: 'staging',
        PORT: 7732,
        SF_DAEMON_MODE: 'staging',
        LOG_LEVEL: 'info'
      },

      // Resource limits
      max_memory_restart: '2G',
      kill_timeout: 5000,
      listen_timeout: 10000,

      // Monitoring and health checks
      pmx: true,
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,

      // Logging configuration
      log_file: './logs/daemon-combined.log',
      out_file: './logs/daemon-out.log',
      error_file: './logs/daemon-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Performance monitoring
      v8_args: [
        '--max-old-space-size=2048',
        '--optimize-for-size',
        '--gc-interval=100'
      ],

      // Node.js arguments
      node_args: [
        '--experimental-modules',
        '--no-warnings'
      ],

      // Watch configuration (for development)
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'coverage',
        'dist',
        '.git'
      ],

      // Instance configuration
      instance_var: 'INSTANCE_ID',
      name_prefix: 'sf-daemon-',

      // Cluster configuration
      pmx: true,
      vizion: true, // Enable version control integration

      // Custom environment variables
      env_production: {
        SF_CLUSTER_SIZE: process.env.SF_CLUSTER_SIZE || 'max',
        SF_HEALTH_CHECK_INTERVAL: process.env.SF_HEALTH_CHECK_INTERVAL || '30000',
        SF_METRICS_ENABLED: process.env.SF_METRICS_ENABLED || 'true',
        SF_GRACEFUL_SHUTDOWN_TIMEOUT: process.env.SF_GRACEFUL_SHUTDOWN_TIMEOUT || '30000'
      }
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['prod-server-1', 'prod-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:fegome90-cmd/skill_fabrik.git',
      path: '/var/www/skills-fabrik',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build:v2 && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },

    staging: {
      user: 'deploy',
      host: ['staging-server'],
      ref: 'origin/develop',
      repo: 'git@github.com:fegome90-cmd/skill_fabrik.git',
      path: '/var/www/skills-fabrik-staging',
      'post-deploy': 'pnpm install && pnpm run build:v2 && pm2 reload ecosystem.config.js --env staging'
    }
  }
};