/**
 * PM2 Ecosystem Configuration Template
 * 
 * Ejemplo de configuración para servicios backend con PM2
 * Ajusta según tus servicios específicos
 */

module.exports = {
  apps: [
    {
      name: 'form-service',
      cwd: './form',
      script: 'npm',
      args: 'start',
      error_file: './form/logs/error.log',
      out_file: './form/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    // Añade más servicios según necesites:
    // {
    //   name: 'email-service',
    //   cwd: './email',
    //   script: 'npm',
    //   args: 'start',
    //   error_file: './email/logs/error.log',
    //   out_file: './email/logs/out.log',
    //   ...
    // }
  ]
};

