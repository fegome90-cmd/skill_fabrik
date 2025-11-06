# Diagnóstico de Bases de Datos - Redis y Postgres

**Fecha**: 2025-10-29  
**Contexto**: Durante la ejecución del skill `plan-save-workflow`, falló la conexión a Redis para crear el snapshot MemTech L1.

---

## 📊 Estado Actual de Servicios

### ✅ Redis

**Servicio**: 
- ✅ Estado: `started` (funcionando)
- ✅ Versión: Redis 8.2.2
- ✅ Ping: `PONG` (respondiendo correctamente)
- ✅ Puerto: 6379 (default)
- ✅ Conexiones recibidas: 1660

**Variables de entorno**:
```
REDIS_URL: not set
REDIS_HOST: not set  
REDIS_PORT: not set
```

**⚠️ PROBLEMA**: Los servicios están corriendo, pero **NO hay variables de entorno configuradas** para que el código Node.js se conecte.

---

### ✅ Postgres

**Servicios**:
- ✅ `postgresql@14`: `started` (funcionando)
- ❌ `postgresql@15`: `error 1` (problema con versión 15)
- ✅ `pg_isready`: aceptando conexiones en `/tmp:5432`

**Conexión verificada**:
```sql
PostgreSQL 14.19 (Homebrew) on aarch64-apple-darwin24.4.0
```

**Variables de entorno**:
```
DATABASE_URL: not set
PGHOST: not set
PGPORT: not set
PGDATABASE: not set
PGUSER: not set
```

**⚠️ PROBLEMA**: Similar a Redis, falta configuración de variables de entorno.

---

## 🔍 Análisis del Error en Skill

### Skill afectado: `plan-save-workflow`

**Ubicación del código**: `packages/skills-cli/src/commands/plan.ts:216-233`

```typescript
try {
  const snapshot = await createPlanSnapshotFallback({
    id: plan.id,
    task: plan.task,
    phases: plan.phases,
    status: plan.status,
    approved_at: plan.approvedAt,
    risks: plan.risks,
    metrics: plan.metrics,
  });
  logger.success(`MemTech L1 snapshot created: ${snapshot.id}`);
} catch (error) {
  logger.warning(`Failed to create MemTech snapshot: ${error.message}`);
  logger.info('Plan saved, but snapshot not created. Check Redis connection.');
}
```

**Comportamiento actual**:
- ✅ El plan se guarda correctamente (tríada dev-docs generada)
- ⚠️ El snapshot MemTech falla silenciosamente (solo warning)
- ✅ El workflow continúa y completa exitosamente

**¿Por qué falla?**
- `createPlanSnapshotFallback` intenta usar el adapter MemTech
- El adapter requiere conexión a Redis (local o remoto)
- Sin variables de entorno, no puede determinar dónde conectarse

---

## ✅ Soluciones

### Opción 1: Configurar Variables de Entorno (Recomendado)

Crea un archivo `.env` en la raíz del proyecto o configura en tu shell:

```bash
# .env o ~/.zshrc
export REDIS_URL="redis://127.0.0.1:6379"
export REDIS_HOST="127.0.0.1"
export REDIS_PORT="6379"

export DATABASE_URL="postgresql://felipe@localhost:5432/postgres"
export PGHOST="localhost"
export PGPORT="5432"
export PGDATABASE="postgres"
export PGUSER="felipe"
```

**Verificar**:
```bash
source ~/.zshrc  # o recarga terminal
echo $REDIS_URL
echo $DATABASE_URL
```

---

### Opción 2: Usar Defaults en el Código (Temporal)

Si no quieres configurar vars de entorno, el adapter debería usar defaults:

```typescript
// packages/mcp-adapters/src/memtech/index.ts
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
```

**⚠️ Nota**: Esto funciona solo para desarrollo local. En producción, usa variables de entorno.

---

### Opción 3: Deshabilitar Snapshot MemTech (Si no lo necesitas)

Si el snapshot MemTech no es crítico, puedes continuar sin él:

- El skill ya maneja el fallo graciosamente (warning, no error)
- La tríada dev-docs se genera correctamente
- Solo pierdes el snapshot L1 en MemTech

---

## 🧪 Comandos de Verificación Rápida

### Redis
```bash
# 1) Verificar servicio
brew services list | grep redis

# 2) Probar conexión
redis-cli PING
# Esperado: PONG

# 3) Probar desde Node.js (requiere variables de entorno)
node -e "import('redis').then(async r=>{const c=r.createClient({url:process.env.REDIS_URL||'redis://127.0.0.1:6379'});await c.connect();console.log('✅ OK');await c.quit();}).catch(e=>console.error('❌',e.message));"
```

### Postgres
```bash
# 1) Verificar servicio
brew services list | grep postgres

# 2) Probar conexión
pg_isready

# 3) Probar acceso
psql -h localhost -p 5432 -U felipe -d postgres -c 'SELECT 1;'
```

---

## 📋 Checklist de Configuración

- [ ] Variables de entorno configuradas (`.env` o shell)
- [ ] Redis respondiendo (`redis-cli PING` = PONG)
- [ ] Postgres aceptando conexiones (`pg_isready`)
- [ ] Código Node.js puede conectarse (probar con script de ejemplo)
- [ ] Skill `plan-save-workflow` genera snapshots correctamente

---

## 🎯 Próximos Pasos Recomendados

1. **Corto plazo**: Configurar variables de entorno básicas para desarrollo local
2. **Medio plazo**: Crear script `scripts/setup-env.sh` que configure variables automáticamente
3. **Largo plazo**: Documentar en README o guía de setup inicial

---

## 📚 Referencias

- Manual CLI: `docs/CLI-USER-MANUAL.md` (sección 9)
- Análisis de skill: `docs/SKILL-EXECUTION-ANALYSIS.md`
- MemTech adapter: `packages/mcp-adapters/src/memtech/index.ts`

---

*Reporte generado el 2025-10-29*

