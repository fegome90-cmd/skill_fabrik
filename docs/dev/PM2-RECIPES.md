# PM2 – Recetas operativas

## Iniciar servicios
```
pm2 start scripts/pm2/ecosystem.config.cjs --env development
```

Servicios comunes: `sf-daemon`, `router-service`, `service-discovery`, `skills-cli-service`.

## Reinicio con nuevas env vars
```
pm2 restart sf-daemon --update-env
```

## Logs y monitoreo
```
pm2 logs sf-daemon --lines 200
pm2 monit
```

## Cluster
- Habilitar: `PM2_CLUSTER=1` en el entorno del servicio.
- Verifica health y sticky routing si aplica.

## Limpieza y rotación
- Si cambian muchas env vars: `pm2 delete sf-daemon && pm2 start ...`
- Configurar `max_size`/retención para evitar crecimiento de logs.

## Troubleshooting rápido
- Servicio en "waiting": asegurarse de emitir `process.send('ready')` si `wait_ready`.
- Variables stale: usar `--update-env` o `delete + start`.
- Descubrimiento del daemon: confirmar `service-discovery` en http://127.0.0.1:8877/health.
