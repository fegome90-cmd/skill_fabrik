# Comandos de Monitoreo PM2

## Estado y Listado

```bash
pm2 list                    # Lista todos los procesos
pm2 status                  # Estado resumido
pm2 describe <service>      # Información detallada de un servicio
pm2 info <service>          # Info en JSON
```

## Logs

```bash
pm2 logs                    # Todos los logs (streaming)
pm2 logs <service>          # Logs de un servicio específico
pm2 logs <service> --lines 200  # Últimas 200 líneas
pm2 logs <service> --err    # Solo errores
pm2 flush                   # Limpiar logs rotados
```

## Monitoreo en Tiempo Real

```bash
pm2 monit                   # Monitor interactivo (CPU, memoria, logs)
```

## Operaciones

```bash
# Iniciar
pm2 start ecosystem.config.cjs
pm2 start ecosystem.config.cjs --only <service>

# Detener
pm2 stop <service>
pm2 stop all

# Reiniciar
pm2 restart <service>
pm2 restart all

# Recargar (zero-downtime restart)
pm2 reload <service>

# Eliminar
pm2 delete <service>
pm2 delete all
```

## Persistencia

```bash
pm2 save                    # Guardar configuración actual
pm2 resurrect              # Restaurar configuración guardada
pm2 startup                 # Generar script de inicio (systemd)
pm2 unstartup              # Remover script de inicio
```

## Métricas

```bash
pm2 jlist                  # JSON de todos los procesos
pm2 prettylist             # Formato legible de jlist
```

