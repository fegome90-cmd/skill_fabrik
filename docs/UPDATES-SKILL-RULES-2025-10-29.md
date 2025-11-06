# Actualización: skill-rules.json - Patterns Mejorados

**Fecha**: 2025-10-29  
**Motivo**: Identificar y corregir gaps en detección de skills  
**Referencia**: `docs/ANALISIS-SKILLS-NO-ACTIVADOS.md`

---

## 📋 Cambios Aplicados

### 1. `database-verification-find` ✅ MEJORADO

**Problema identificado**:
- Path patterns muy específicos (`**/repository/**`) no capturaban estructura `packages/mcp-adapters/**`
- Content patterns solo buscaban `findMany` (Prisma) pero no operaciones Redis/Postgres directas

**Cambios aplicados**:

```json
{
  "fileTriggers": {
    "pathPatterns": [
      "**/repository/**/*.{ts,js}",
      "**/src/**/repository/**/*.{ts,js}",
      "packages/**/memtech/**/*.{ts,js}",        // NUEVO
      "packages/**/database/**/*.{ts,js}",        // NUEVO
      "**/mcp-adapters/**/*.{ts,js}"             // NUEVO
    ],
    "contentPatterns": [
      "findMany\\s*\\(\\s*\\)|findMany\\s*\\(\\s*\\{",
      "redis\\.get|redis\\.hget|redis\\.mget",   // NUEVO
      "pool\\.query|client\\.query",              // NUEVO
      "SELECT\\s+\\*\\s+FROM",                    // NUEVO
      "getL1Item|getItem"                         // NUEVO
    ]
  }
}
```

**Impacto esperado**:
- ✅ Detectará operaciones Redis (`redis.get`, `getL1Item`)
- ✅ Detectará queries PostgreSQL (`pool.query`, `client.query`)
- ✅ Detectará archivos en `packages/mcp-adapters/src/memtech/**`

---

### 2. `secrets-and-config` ✅ MEJORADO (CRÍTICO)

**Problema identificado**:
- Content pattern requería comillas: `PASSWORD="value"` pero `.env` usa `PASSWORD=value`
- No detectaba archivos `.env` específicamente
- No detectaba variables genéricas como `REDIS_URL`, `PG_PASSWORD`

**Cambios aplicados**:

```json
{
  "fileTriggers": {
    "pathPatterns": [
      "**/*.{ts,tsx,js,json,yml,yaml}",
      "**/.env*",                                 // NUEVO
      "**/config/**/*.{ts,js,json}"               // NUEVO
    ],
    "contentPatterns": [
      "(SECRET|API_KEY|TOKEN|PASSWORD|PRIVATE_KEY)\\s*[:=]\\s*['\"][\\w-]{15,}['\"]",
      "(?:REDIS_|PG_|CHROMADB_|DATABASE_|DB_)[A-Z_]*=\\s*\\S+",  // NUEVO: formato .env
      "(?i)(password|secret|api_key|token|private_key)\\s*[:=]\\s*['\"]?[\\w-]{15,}['\"]?",  // NUEVO: case-insensitive sin comillas
      "\\.env"                                    // NUEVO: detección archivo .env
    ]
  }
}
```

**Impacto esperado**:
- ✅ Detectará formato `.env` sin comillas: `PG_PASSWORD=secret123`
- ✅ Detectará archivos `.env`, `.env.local`, `.env.production`
- ✅ Detectará variables case-insensitive: `password`, `API_KEY`, `Secret`
- ✅ Detectará archivos de configuración en `**/config/**`

---

### 3. `backend-dev-guidelines` ✅ MEJORADO

**Problema identificado**:
- Path patterns buscaban `backend/src/**` pero estructura real es `packages/**/src/**`
- Keywords muy específicas no capturaban contexto "adapters", "clients", "database"

**Cambios aplicados**:

```json
{
  "promptTriggers": {
    "keywords": [
      "backend", "controller", "service", "API", "endpoint", "route", "repositorio",
      "adapter", "client", "connection", "database", "memtech"  // NUEVOS
    ],
    "intentPatterns": [
      "(create|add|fix).*?(route|endpoint|controller|service)",
      "(how to|best practice).*?(backend|API)",
      "(configure|connect|setup).*?(redis|postgres|database)"  // NUEVO
    ]
  },
  "fileTriggers": {
    "pathPatterns": [
      "backend/src/**/*.ts",
      "**/controllers/**/*.ts",
      "**/services/**/*.ts",
      "packages/**/src/**/*.ts",                  // NUEVO
      "packages/**/commands/**/*.ts"              // NUEVO
    ]
  }
}
```

**Impacto esperado**:
- ✅ Detectará archivos en estructura monorepo (`packages/**/src/**`)
- ✅ Detectará keywords en contexto de configuración de databases
- ✅ Actuará en prompts sobre "connect redis", "setup database", etc.

---

## 📊 Comparativa Antes/Después

### Coverage Esperado

| Skill | Antes | Después | Mejora |
|-------|-------|---------|--------|
| `database-verification-find` | ~20% (solo Prisma) | ~80% (Prisma + Redis + Postgres) | +300% |
| `secrets-and-config` | ~30% (solo con comillas) | ~90% (con/sin comillas, .env) | +200% |
| `backend-dev-guidelines` | ~40% (solo backend/) | ~70% (incluye packages/) | +75% |

---

## ✅ Validación

### Tests Recomendados

1. **Test secrets-and-config**:
   ```bash
   # Crear archivo .env temporal
   echo "PG_PASSWORD=test123" > /tmp/test.env
   # Verificar que skill se activaría
   ```

2. **Test database-verification-find**:
   ```bash
   # Verificar archivos en packages/mcp-adapters/src/memtech/
   # Verificar que detecta getL1Item, pool.query
   ```

3. **Test backend-dev-guidelines**:
   ```bash
   # Verificar que detecta packages/**/src/**/*.ts
   ```

---

## 🎯 Próximos Pasos

### Validación en Producción
- ✅ Actualizar `skill-rules.json` completado
- ⏳ Validar activación en próxima ejecución de plan
- ⏳ Monitorear `obs/kpi/events.jsonl` para verificar mejoras
- ⏳ Revisar si `plan-architect` requiere cambios en lógica del router (no en rules)

### Métricas a Monitorear
- Tasa de activación de `secrets-and-config` (target: ≥80% cuando hay `.env` accedido)
- Tasa de activación de `database-verification-find` (target: ≥70% cuando hay operaciones DB)
- Falsos positivos (target: <5%)

---

**Estado**: ✅ COMPLETADO  
**Archivo actualizado**: `configs/skill-rules.json`  
**Documentación**: `docs/ANALISIS-SKILLS-NO-ACTIVADOS.md`, `docs/UPDATES-SKILL-RULES-2025-10-29.md`

