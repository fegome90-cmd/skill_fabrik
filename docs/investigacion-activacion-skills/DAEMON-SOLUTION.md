# Solución al Problema del Daemon - Puerto 8889

## 🚨 **Problema Identificado**

**Error:** `EADDRINUSE: address already in use :::8889`
**Causa:** El WebSocket del Dashboard en tiempo real intenta usar el puerto 8889

### **Contexto**
El daemon incluye un dashboard web con WebSocket para monitoreo en tiempo real:
- **Puerto HTTP Dashboard:** 8888 (configurable via `SF_DASHBOARD_PORT`)
- **Puerto WebSocket:** 8889 (configurable via `SF_DASHBOARD_WS_PORT`)
- **Activación:** Automática (configurable via `SF_DASHBOARD_ENABLED`)

---

## ✅ **Soluciones Disponibles**

### **Opción 1: Deshabilitar Dashboard (Recomendado)**

```bash
# Con variable de entorno
export SF_DASHBOARD_ENABLED=false

# Reiniciar daemon
pm2 restart sf-daemon
```

### **Opción 2: Cambiar Puerto WebSocket**

```bash
# Cambiar puerto WebSocket a 8890
export SF_DASHBOARD_WS_PORT=8890

# Reiniciar daemon
pm2 restart sf-daemon
```

### **Opción 3: Deshabilitar Completamente**

```bash
# Deshabilitar dashboard + logs adicionales
export SF_DASHBOARD_ENABLED=false
export SF_LOG_LEVEL=error  # Solo errores

# O deshabilitar PM2 dashboard para pruebas
pm2 stop sf-daemon
```

---

## 🔧 **Variables de Entorno del Daemon**

### **Dashboard**
```bash
SF_DASHBOARD_ENABLED=false     # false = deshabilitado, true = habilitado
SF_DASHBOARD_PORT=8888         # Puerto HTTP del dashboard
SF_DASHBOARD_WS_PORT=8889      # Puerto WebSocket del dashboard
```

### **Configuración del Daemon**
```bash
SF_HOST=0.0.0.0                # Host del daemon
SF_PORT=7727                   # Puerto del daemon (API)
SF_CORS_ORIGINS=*              # CORS (por defecto: *)
SF_CONFIG=config/default.yaml  # Archivo de configuración YAML
```

### **Observabilidad**
```bash
SF_LOG_LEVEL=info              # Log level (debug, info, warn, error)
SF_LOG_PRETTY=1                # 1 = logs pretty, 0 = JSON
SF_OTEL=1                      # 1 = OpenTelemetry habilitado
```

### **Escalabilidad**
```bash
PM2_CLUSTER=1                  # 1 = modo cluster, 0 = modo fork
SF_STATE_REDIS=1               # 1 = Redis para state distribuido
REDIS_URL=redis://localhost:6379
```

### **Autenticación (Opcional)**
```bash
DAEMON_API_KEY=your-api-key    # API Key para autenticación
DAEMON_JWT_SECRET=secret       # JWT secret para tokens
```

---

## 📊 **Configuración Recomendada para Testing**

### **Para Testing de Guardrails (Sin Dashboard)**

```bash
# Crear archivo .env.testing
cat > .env.testing << 'EOF'
SF_DASHBOARD_ENABLED=false
SF_LOG_LEVEL=warn
SF_HOST=127.0.0.1
SF_PORT=7727
SF_CORS_ORIGINS=http://localhost:3000
EOF

# Cargar y reiniciar
source .env.testing
pm2 restart sf-daemon --update-env
```

### **Para Desarrollo (Con Dashboard)**

```bash
# Crear archivo .env.development
cat > .env.development << 'EOF'
SF_DASHBOARD_ENABLED=true
SF_DASHBOARD_PORT=8888
SF_DASHBOARD_WS_PORT=8889
SF_LOG_LEVEL=debug
SF_LOG_PRETTY=1
EOF

# Cargar y reiniciar
source .env.development
pm2 restart sf-daemon --update-env
```

---

## 🧪 **Testing Guardrails**

### **Test 1: Database Verification**

```bash
# Activar skill database-verification
node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js \
  skills activate \
  --intent "implementar función para eliminar todos los usuarios" \
  --json

# Resultado esperado: database-verification se activa
# Enforcement: block
# Threshold: 0.2
# Score esperado: > 0.2
```

### **Test 2: Secrets Detection**

```bash
# Activar skill secrets-and-config
node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js \
  skills activate \
  --intent "configurar API key en el proyecto" \
  --json

# Resultado esperado: secrets-and-config se activa
# Enforcement: block (o require)
# Threshold: 0.2
# Score esperado: > 0.2
```

### **Test 3: Verificar Logs**

```bash
# Ver logs en tiempo real
pm2 logs sf-daemon --lines 50

# Buscar activación de guardrails
pm2 logs sf-daemon | grep -i "database-verification\|secrets-and-config"
```

---

## 🎯 **Verificación de Estado**

### **1. Verificar Daemon Iniciado**

```bash
# Estado de PM2
pm2 status | grep sf-daemon

# Debe mostrar: online, memory < 100MB, cpu < 5%
```

### **2. Verificar Health Endpoint**

```bash
# Health check
curl http://127.0.0.1:7727/health

# Resultado esperado:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "services": {
#     "database": "ok",
#     "cache": "ok"
#   }
# }
```

### **3. Verificar Registry Cargado**

```bash
# Listar skills disponibles
curl http://127.0.0.1:7727/list | jq '.skills | length'

# Resultado esperado: 30 skills
```

### **4. Verificar Métricas**

```bash
# Métricas Prometheus
curl http://127.0.0.1:7727/metrics | grep daemon_activations_total

# Debe mostrar: counter > 0 (si hubo activaciones)
```

---

## 🏗️ **Configuración de PM2**

### **Archivo: scripts/pm2/ecosystem.config.cjs**

```javascript
module.exports = {
  apps: [
    {
      name: 'sf-daemon',
      script: 'packages/daemon/dist/index.js',
      instances: 'max',              // 'max' = usar todos los cores
      exec_mode: 'cluster',          // 'cluster' o 'fork'
      env: {
        SF_DASHBOARD_ENABLED: 'false',  // ⭐ Deshabilitar dashboard
        SF_LOG_LEVEL: 'warn',
        SF_HOST: '127.0.0.1',
        SF_PORT: '7727'
      },
      env_production: {
        SF_DASHBOARD_ENABLED: 'false',
        SF_LOG_LEVEL: 'info',
        SF_HOST: '0.0.0.0',
        SF_PORT: '7727',
        PM2_CLUSTER: '1'             // Cluster en producción
      }
    }
  ]
};
```

---

## 🔍 **Troubleshooting**

### **Problema: Puerto 8889 aún en uso**

```bash
# Verificar proceso
lsof -i :8889

# Parar proceso específico (reemplazar PID)
kill -9 <PID>

# O usar puerto alternativo
export SF_DASHBOARD_WS_PORT=8890
pm2 restart sf-daemon --update-env
```

### **Problema: Daemon no inicia**

```bash
# Ver logs completos
pm2 logs sf-daemon --err --lines 100

# Verificar configuración
cat packages/daemon/config/default.yaml

# Test manual
node packages/daemon/dist/index.js
```

### **Problema: Error de conexión**

```bash
# Verificar puerto activo
netstat -an | grep 7727

# Test manual
curl -v http://127.0.0.1:7727/health
```

---

## 📈 **Métricas de Éxito**

### **Guardrails Operativos**
- [ ] `database-verification` se activa con score > 0.2
- [ ] `secrets-and-config` se activa con score > 0.2
- [ ] False negative rate < 5%

### **Daemon Saludable**
- [ ] Health endpoint: 200 OK
- [ ] Memory usage < 100MB
- [ ] CPU usage < 5%
- [ ] Uptime > 99.9%

### **Activaciones Exitosas**
- [ ] Activations total incrementando
- [ ] Latencia p95 < 100ms
- [ ] Cache hit rate > 80%

---

## 🎓 **Lecciones Aprendidas del Sprint Daemon-Infalible**

### **Resiliencia (Fase 1)**
1. ✅ Circuit breakers protegen servicios críticos
2. ✅ Retry logic recupera fallos temporales
3. ✅ Graceful shutdown evita pérdida de datos

### **Configurabilidad (Fase 2)**
1. ✅ Variables de entorno permiten flexibilidad
2. ✅ YAML config facilita deployment
3. ✅ Feature flags controlan características

### **Escalabilidad (Fase 3)**
1. ✅ PM2 cluster distribuye carga
2. ✅ Redis state habilita distribución
3. ✅ Service discovery optimiza routing

### **Observabilidad (Fase 4)**
1. ✅ Logs estructurados facilitan troubleshooting
2. ✅ Métricas Prometheus exponen health
3. ✅ Tracing OTEL mejora debugging

---

## 📚 **Referencias**

### **Documentación del Daemon**
- `/dev/daemon-infalible-sprint/` - Sprint completo
- `/docs/investigacion-activacion-skills/IMPLEMENTATION-REPORT.md` - Reporte de implementación

### **Configuración**
- `packages/daemon/src/config/daemon-config.ts` - Loader de configuración
- `packages/daemon/config/default.yaml` - Configuración por defecto
- `scripts/pm2/ecosystem.config.cjs` - Configuración PM2

### **Monitoreo**
- `GET /health` - Health check
- `GET /metrics` - Métricas Prometheus
- `GET /list` - Lista de skills

---

**Solución aplicada:** 2025-11-02
**Estado:** Listo para testing de guardrails ✅
**Configuración:** `SF_DASHBOARD_ENABLED=false`
