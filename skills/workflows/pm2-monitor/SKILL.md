---
id: pm2-monitor
version: 0.1.0
type: workflow
summary: 'Configura PM2 para gestión de procesos backend con monitoreo, logs y playbooks de troubleshooting.'
audience: engineers, ops
when_to_use: 'Al configurar servicios backend con PM2, requerir monitoreo de procesos o troubleshooting de servicios en producción.'
provides: Configuración PM2, playbooks de troubleshooting, comandos estándar para monitoreo, logs y restarts.
resources:
  - resources/pm2-config.md
  - resources/troubleshooting.md
  - resources/monitoring-commands.md
scripts:
  - name: pm2-start
    run: node packages/skills-cli/dist/index.js pm2:start
    note: Inicia servicios según ecosystem.config.cjs
  - name: pm2-logs
    run: pm2 logs <service> --lines 200
    note: Muestra últimas 200 líneas de logs
  - name: pm2-restart
    run: pm2 restart <service>
    note: Reinicia un servicio específico
  - name: pm2-monit
    run: pm2 monit
    note: Monitor en tiempo real (CPU, memoria, logs)
limits: Requiere PM2 instalado globalmente (npm i -g pm2).
---

## Objetivo

Configurar y gestionar procesos backend usando PM2, proporcionando playbooks estándar para monitoreo, troubleshooting y operaciones comunes en desarrollo y producción.

**Cuándo usar**: 
- Al configurar servicios que deben ejecutarse de forma persistente
- Cuando necesitas monitoreo en tiempo real de procesos
- Para troubleshooting de servicios que fallan o consumen recursos excesivos

**Cuándo NO usar**: Para aplicaciones frontend o servicios que se ejecutan bajo Docker/Kubernetes.

**Qué problema resuelve**: Centraliza gestión de procesos, facilita debugging con logs accesibles, automatiza restarts y monitoreo.

## Procedimiento (resumen)

### 1. Configuración PM2 (ecosystem.config.cjs)

```javascript
module.exports = {
  apps: [
    {
      name: 'service-name',
      cwd: './path/to/service',
      script: 'npm',
      args: 'start',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
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
    }
  ]
};
```

### 2. Playbooks de Troubleshooting

#### Ver logs en tiempo real
```bash
pm2 logs <service> --lines 200
```

#### Monitoreo interactivo
```bash
pm2 monit
```
Muestra: CPU, memoria, logs en tiempo real

#### Reiniciar servicio
```bash
pm2 restart <service>
# O todos
pm2 restart all
```

#### Verificar estado
```bash
pm2 list
pm2 status
```

#### Ver información detallada
```bash
pm2 describe <service>
pm2 info <service>
```

### 3. Operaciones Comunes

- **Iniciar todos los servicios**: `pm2 start ecosystem.config.cjs`
- **Detener servicio**: `pm2 stop <service>`
- **Eliminar servicio**: `pm2 delete <service>`
- **Guardar configuración**: `pm2 save` (para persistir después de reboot)
- **Restaurar configuración**: `pm2 resurrect`

## Checklist

- [ ] `ecosystem.config.cjs` configurado con todos los servicios
- [ ] Logs configurados (error_file, out_file)
- [ ] `max_memory_restart` definido para prevenir memory leaks
- [ ] Variables de entorno separadas (env, env_production)
- [ ] PM2 guardado (`pm2 save`) después de configuración inicial
- [ ] Documentación de comandos estándar disponible

## Ejemplos

### ✅ Correcto

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'api-service',
      cwd: './packages/api',
      script: 'npm',
      args: 'start',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      autorestart: true,
      instances: 2, // Cluster mode
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    }
  ]
};
```

### ❌ Evitar

```javascript
// ❌ Sin límite de memoria
max_memory_restart: undefined

// ❌ Sin logs separados
error_file: undefined

// ❌ Sin variables de entorno por ambiente
env: {} // Mezcla dev/prod
```

## Recursos

Ver `resources/` para:
- `pm2-config.md`: Guía completa de configuración
- `troubleshooting.md`: Playbooks detallados por problema común
- `monitoring-commands.md`: Comandos de monitoreo y métricas

