# Configuración PM2 - Guía Completa

## Estructura ecosystem.config.cjs

```javascript
module.exports = {
  apps: [
    {
      name: 'service-name',           // Nombre único del servicio
      cwd: './path/to/service',      // Directorio de trabajo
      script: 'npm',                  // Comando a ejecutar
      args: 'start',                  // Argumentos del comando
      
      // Logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Restart y monitoreo
      autorestart: true,
      watch: false,                   // Set true para desarrollo
      max_memory_restart: '500M',     // Reinicia si excede memoria
      
      // Cluster mode (opcional)
      instances: 2,
      exec_mode: 'cluster',
      
      // Variables de entorno
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

## Parámetros Clave

### Logs
- `error_file`: Archivo para stderr
- `out_file`: Archivo para stdout
- `log_date_format`: Formato de timestamp
- `merge_logs`: Unir logs de instancias múltiples

### Performance
- `max_memory_restart`: Reiniciar si excede (ej: '500M', '1G')
- `instances`: Número de instancias (cluster mode)
- `exec_mode`: 'fork' (default) o 'cluster'

### Restart
- `autorestart`: Reiniciar automáticamente si falla
- `watch`: Observar cambios de archivos (solo desarrollo)

## Buenas Prácticas

1. **Separar logs por servicio**: Cada servicio debe tener su propia carpeta de logs
2. **Límite de memoria**: Siempre definir `max_memory_restart` para prevenir leaks
3. **Variables de entorno**: Usar `env` y `env_production` separados
4. **No usar watch en producción**: `watch: false` siempre en prod

