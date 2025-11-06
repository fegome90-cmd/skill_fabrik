# Playbooks de Troubleshooting PM2

## Problema: Servicio no inicia

### Diagnóstico
```bash
pm2 logs <service> --lines 50    # Ver últimos logs
pm2 describe <service>            # Ver configuración
pm2 status                         # Ver estado general
```

### Soluciones comunes
1. **Puerto en uso**: Cambiar `PORT` en `env`
2. **Variable faltante**: Verificar `.env` y variables requeridas
3. **Error de sintaxis**: Verificar `tsc --noEmit` o lint
4. **Dependencias faltantes**: Ejecutar `pnpm install`

## Problema: Servicio consume mucha memoria

### Diagnóstico
```bash
pm2 monit                         # Monitor en tiempo real
pm2 describe <service>             # Ver uso actual de memoria
```

### Soluciones
1. **Ajustar `max_memory_restart`**: Reducir límite si es muy alto
2. **Memory leak**: Revisar código (setInterval sin clear, listeners sin remove)
3. **Cluster mode**: Distribuir carga entre instancias

## Problema: Servicio se reinicia constantemente

### Diagnóstico
```bash
pm2 logs <service> --err           # Solo errores
pm2 describe <service>             # Ver restart count
```

### Soluciones
1. **Error fatal**: Revisar logs de error
2. **Crasheo rápido**: Verificar dependencias o configuración
3. **Límite de memoria muy bajo**: Aumentar `max_memory_restart`

## Problema: Logs no aparecen

### Diagnóstico
```bash
ls -la logs/                       # Verificar que directorio existe
pm2 describe <service>            # Verificar rutas de logs
```

### Soluciones
1. **Crear directorio de logs**: `mkdir -p logs/`
2. **Permisos**: Verificar permisos de escritura
3. **Rutas absolutas**: Usar rutas absolutas en config si hay problemas

## Comandos Útiles

```bash
# Ver todos los logs combinados
pm2 logs

# Limpiar logs antiguos
pm2 flush

# Reiniciar y guardar configuración
pm2 restart all && pm2 save

# Detener y eliminar servicio
pm2 delete <service>
```

