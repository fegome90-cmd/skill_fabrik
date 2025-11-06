# Análisis: Skills que Deberían Haberse Activado

**Fecha**: 2025-10-29  
**Plan ID**: `post-estudio-operacional-20251029`  
**Estado**: Análisis de gaps en activación

---

## 📊 Resumen Ejecutivo

**Skills activados**: 1/10 (10%)  
**Skills que deberían haberse activado**: 4-5  
**Gap identificado**: 3-4 skills no activados

---

## 🔍 Análisis Detallado de Oportunidades Perdidas

### ✅ Skill Correctamente Activado

#### 1. `plan-save-workflow` ✅ ACTIVADO

**Cuándo se activó**: 2025-10-29T23:38:33.428Z  
**Score**: 1.0/1.0  
**Razón**: 
- Keywords: "guardar plan", "save plan", "aprobar" ✅
- Intent: `(guardar|save).*plan` ✅
- Path: `dev/plans/**/*.json` ✅
- Content: `"status":\s*"APPROVED"` ✅

**Evidencia**: Línea 18 en `obs/kpi/events.jsonl`

---

### ❌ Skills que DEBERÍAN Haberse Activado pero NO

#### 2. `database-verification-find` ❌ NO ACTIVADO (Debería: SÍ)

**Razón esperada de activación**:
- **Acción realizada**: Acceso a Redis, PostgreSQL, ChromaDB durante creación de snapshot L1
- **Archivos involucrados**: 
  - `packages/mcp-adapters/src/memtech/database-clients.ts`
  - `packages/mcp-adapters/src/memtech/memory-store.ts`
  - `packages/mcp-adapters/src/memtech/redis-client.ts`
- **Path patterns que coinciden**: `**/repository/**/*.{ts,js}`, `**/src/**/repository/**/*.{ts,js}`
  - ⚠️ **PROBLEMA**: Los archivos de MemTech no están en rutas `**/repository/**` sino en `packages/mcp-adapters/src/memtech/`
- **Content patterns esperados**: `findMany\(\)`, `findMany\(\s*\{`
  - ⚠️ **PROBLEMA**: Las operaciones de database son a nivel de cliente (Redis, Postgres), no queries Prisma/TypeORM con `findMany`

**¿Por qué NO se activó?**:
1. Path patterns específicos para `**/repository/**` no coinciden con `packages/mcp-adapters/src/memtech/`
2. Content patterns buscan `findMany` pero las operaciones son con clientes Redis/Postgres directos
3. No se abrieron/editaron archivos durante la ejecución del plan en el editor

**Recomendación**: 
- Ampliar path patterns para incluir `packages/mcp-adapters/src/memtech/**`
- Agregar content patterns para operaciones Redis/Postgres: `redis.get`, `pool.query`, `client.query`

---

#### 3. `secrets-and-config` ❌ NO ACTIVADO (Debería: SÍ)

**Razón esperada de activación**:
- **Acción realizada**: Acceso a `.env` para conexiones Redis, PostgreSQL, ChromaDB
- **Archivos involucrados**: 
  - `.env` (contiene `REDIS_URL_CORE`, `PG_*`, `CHROMADB_*`)
  - `packages/mcp-adapters/src/memtech/config.ts` (carga variables de entorno)
- **Path patterns que coinciden**: `**/*.{ts,tsx,js,json,yml,yaml}`
  - ✅ **COINCIDE**: `.env` está en raíz del proyecto
- **Content patterns esperados**: `(SECRET|API_KEY|TOKEN|PASSWORD|PRIVATE_KEY)\s*[:=]\s*['"][\w-]{15,}['"]`
  - ⚠️ **PROBLEMA**: `.env` típicamente tiene formato `KEY=value` sin comillas alrededor del valor
  - ⚠️ **PROBLEMA**: Variables pueden ser `REDIS_URL` sin palabras clave `SECRET|API_KEY|TOKEN|PASSWORD|PRIVATE_KEY`

**¿Por qué NO se activó?**:
1. Content pattern busca comillas alrededor del valor (`['"]value['"]`)
2. Pattern busca keywords específicos (`SECRET`, `API_KEY`, etc.) pero `.env` puede tener nombres genéricos (`REDIS_URL`, `PG_PASSWORD`)
3. Archivo `.env` no fue abierto/editado durante la ejecución en el editor

**Recomendación**:
- Agregar pattern para formato `.env`: `(?:REDIS_|PG_|CHROMADB_|API_|SECRET_).*=\s*\S+`
- Incluir detección de archivos `.env` específicamente
- Ampliar keywords para incluir `URL`, `PASSWORD`, `HOST`, `DATABASE` en contexto de configuración

---

#### 4. `backend-dev-guidelines` ❌ NO ACTIVADO (Debería: PARCIAL)

**Razón esperada de activación**:
- **Acción realizada**: Creación/modificación de archivos en `packages/` (backend structure)
- **Archivos involucrados**:
  - `packages/mcp-adapters/src/memtech/**/*.ts`
  - `packages/skills-cli/src/commands/plan.ts`
  - `packages/router/src/pre-invoke.ts`
- **Path patterns que coinciden**: `backend/src/**/*.ts`, `**/controllers/**/*.ts`, `**/services/**/*.ts`
  - ⚠️ **PROBLEMA**: Archivos están en `packages/**` no en `backend/src/**`
- **Keywords esperadas**: "backend", "controller", "service", "API", "endpoint", "route", "repositorio"
  - ⚠️ **PROBLEMA**: Prompts no usaron estas keywords explícitamente

**¿Por qué NO se activó?**:
1. Path patterns son específicos para estructura `backend/src/**` o `**/controllers/**`
2. No hay `controllers/` o `services/` explícitos en la estructura actual
3. Prompts no usaron keywords de backend explícitamente
4. El prompt principal fue sobre "plan", "template", "skills" no sobre "backend" específicamente

**Recomendación**:
- Expandir path patterns para incluir `packages/**/src/**/*.ts`
- Agregar detección de estructura de paquetes TypeScript

---

#### 5. `plan-architect` ⚠️ PODRÍA HABERSE ACTIVADO (Potencial)

**Razón esperada de activación**:
- **Acción realizada**: Creación del plan `post-estudio-operacional.json`
- **Path patterns que coinciden**: `dev/plans/**/*.json`, `dev/plans/**/*.md`, `**/plan*.md`
  - ✅ **COINCIDE**: `dev/plans/post-estudio-operacional.json` creado
- **Keywords esperadas**: "plan", "planificar", "tarea", "feature", "proyecto", "fase", "roadmap"
  - ✅ **COINCIDE**: Prompt usó "plan", "planificar"
- **Content patterns esperados**: `"status":\s*"DRAFT"`, `Plan:`, `fases:`
  - ✅ **COINCIDE**: Plan tiene `"status": "APPROVED"` y contiene `fases`

**¿Por qué NO se activó?**:
- ⚠️ **Hipótesis**: El skill `plan-architect` es de tipo `generator` con `enforcement: "suggest"`, puede no aparecer en events.jsonl si no se registra explícitamente
- ⚠️ **Hipótesis**: El skill `plan-save-workflow` tiene mayor prioridad (`priority: "high"`) y puede haber "ganado" sobre `plan-architect`

**Recomendación**:
- Verificar si `plan-architect` debería activarse en paralelo con `plan-save-workflow`
- Revisar lógica de registro de skills múltiples en pre-invoke hook

---

## 📋 Matriz de Análisis

| Skill | Tipo | Debería Activar | Activó | Gap | Razón del Gap |
|-------|------|----------------|--------|-----|---------------|
| `plan-save-workflow` | workflow | ✅ SÍ | ✅ SÍ | ✅ | - |
| `database-verification-find` | guardrail | ✅ SÍ | ❌ NO | ❌ | Path/content patterns no coinciden |
| `database-verification-update` | guardrail | ⚠️ PARCIAL | ❌ NO | ⚠️ | No hubo updateMany sin where |
| `database-verification-delete` | guardrail | ❌ NO | ❌ NO | ✅ | No hubo deleteMany |
| `secrets-and-config` | guardrail | ✅ SÍ | ❌ NO | ❌ | Content pattern no detecta .env |
| `backend-dev-guidelines` | guideline | ⚠️ PARCIAL | ❌ NO | ⚠️ | Path patterns no incluyen packages/** |
| `frontend-dev-guidelines` | guideline | ❌ NO | ❌ NO | ✅ | No aplica (no hay frontend) |
| `project-catalog-developer` | guideline | ❌ NO | ❌ NO | ✅ | No aplica (no hay catalog) |
| `plan-architect` | generator | ⚠️ PARCIAL | ❌ NO | ⚠️ | Posible activación no registrada |
| `pm2-monitor` | workflow | ❌ NO | ❌ NO | ✅ | No aplica (no hay pm2) |

**Resumen**:
- ✅ Correctamente no activados: 4/10
- ⚠️ Parcialmente deberían: 3/10
- ❌ Deberían haberse activado: 3/10

---

## 🔧 Recomendaciones para Mejorar Detección

### 1. Expandir Path Patterns

**Problema**: Patterns muy específicos (`**/repository/**`, `backend/src/**`) no capturan estructura actual (`packages/**/src/**`)

**Solución**:
```json
{
  "database-verification-find": {
    "fileTriggers": {
      "pathPatterns": [
        "**/repository/**/*.{ts,js}",
        "**/src/**/repository/**/*.{ts,js}",
        "packages/**/memtech/**/*.{ts,js}",  // NUEVO
        "packages/**/database/**/*.{ts,js}",  // NUEVO
        "**/mcp-adapters/**/*.{ts,js}"       // NUEVO
      ]
    }
  },
  "backend-dev-guidelines": {
    "fileTriggers": {
      "pathPatterns": [
        "backend/src/**/*.ts",
        "**/controllers/**/*.ts",
        "**/services/**/*.ts",
        "packages/**/src/**/*.ts",  // NUEVO
        "packages/**/commands/**/*.ts"  // NUEVO
      ]
    }
  }
}
```

### 2. Mejorar Content Patterns para Secrets

**Problema**: Pattern actual no detecta formato `.env` ni nombres genéricos de variables

**Solución**:
```json
{
  "secrets-and-config": {
    "fileTriggers": {
      "pathPatterns": [
        "**/*.{ts,tsx,js,json,yml,yaml}",
        "**/.env*",  // NUEVO: archivos .env específicamente
        "**/config/**/*.{ts,js,json}"  // NUEVO: archivos de configuración
      ],
      "contentPatterns": [
        "(SECRET|API_KEY|TOKEN|PASSWORD|PRIVATE_KEY)\\s*[:=]\\s*['\"][\\w-]{15,}['\"]",
        "(?:REDIS_|PG_|CHROMADB_|DATABASE_|DB_)[A-Z_]*=\\s*\\S+",  // NUEVO: variables de entorno de DB
        "(password|secret|api_key|token|private_key)\\s*[:=]\\s*['\"][\\w-]{15,}['\"]",  // NUEVO: case-insensitive
        "\\.env"  // NUEVO: detección de archivo .env
      ]
    }
  }
}
```

### 3. Agregar Content Patterns para Database Operations

**Problema**: Patterns buscan `findMany`/`updateMany` de Prisma pero operaciones son clientes Redis/Postgres directos

**Solución**:
```json
{
  "database-verification-find": {
    "fileTriggers": {
      "contentPatterns": [
        "findMany\\s*\\(\\s*\\)|findMany\\s*\\(\\s*\\{",
        "redis\\.get|redis\\.hget|redis\\.mget",  // NUEVO: operaciones Redis
        "pool\\.query|client\\.query",  // NUEVO: operaciones PostgreSQL
        "SELECT\\s+\\*\\s+FROM",  // NUEVO: SQL queries sin WHERE
        "getL1Item|getItem"  // NUEVO: operaciones MemTech
      ]
    }
  }
}
```

### 4. Mejorar Keywords para Backend

**Problema**: Keywords muy específicas no capturan contexto de "configuración", "adapters", "clients"

**Solución**:
```json
{
  "backend-dev-guidelines": {
    "promptTriggers": {
      "keywords": [
        "backend", "controller", "service", "API", "endpoint", "route", "repositorio",
        "adapter", "client", "connection", "database", "memtech"  // NUEVO
      ],
      "intentPatterns": [
        "(create|add|fix).*?(route|endpoint|controller|service)",
        "(how to|best practice).*?(backend|API)",
        "(configure|connect|setup).*?(redis|postgres|database)"  // NUEVO
      ]
    }
  }
}
```

---

## 📊 Impacto de los Gaps

### Skills No Activados que Deberían Haberse Activado

1. **`database-verification-find`** (guardrail, normal)
   - **Riesgo**: Operaciones de database sin validación explícita
   - **Impacto**: Medio (no crítico pero preferible detectar)
   - **Acción**: Ampliar path/content patterns

2. **`secrets-and-config`** (guardrail, high priority, enforcement: require)
   - **Riesgo**: ALTO - Configuración sensible expuesta
   - **Impacto**: Alto - Archivo `.env` contiene conexiones a databases
   - **Acción**: URGENTE - Mejorar detección de `.env` y variables de configuración

3. **`plan-architect`** (generator, suggest)
   - **Riesgo**: Bajo - Skill de sugerencia, no bloqueante
   - **Impacto**: Bajo - `plan-save-workflow` cubrió la funcionalidad principal
   - **Acción**: Revisar si debería registrarse en paralelo

---

## 🔍 Evidencia Concreta de Oportunidades Perdidas

### Oportunidad Perdida 1: `database-verification-find` ❌

**Cuándo debería haberse activado**:
- **Momento**: Durante ejecución de `approve-plan.mjs` (2025-10-29T23:38:33)
- **Archivos accedidos**:
  - `packages/mcp-adapters/src/memtech/database-clients.ts` (líneas 21-83: operaciones Redis)
  - `packages/mcp-adapters/src/memtech/memory-store.ts` (líneas 100-180: operaciones de almacenamiento)
  - `packages/mcp-adapters/src/memtech/config.ts` (carga configuración de databases)

**Operaciones database realizadas**:
- `redisCoreClient = createClient(...)` - Conexión Redis
- `pool.query(...)` - Queries PostgreSQL (potencial)
- `await memoryManager.addItem(...)` - Operación de almacenamiento

**Razón del NO-activación**:
1. ❌ Path pattern: `**/repository/**/*.{ts,js}` NO coincide con `packages/mcp-adapters/src/memtech/**`
2. ❌ Content pattern: `findMany\(\)` NO detecta operaciones Redis/Postgres directas (`createClient`, `pool.query`, `addItem`)

**Score esperado si patterns fueran correctos**:
- Path: 0.0/0.3 (no coincide)
- Content: 0.0/0.2 (no detecta)
- **Total**: 0.0/0.6 (NO activaría)

### Oportunidad Perdida 2: `secrets-and-config` ❌ (CRÍTICO)

**Cuándo debería haberse activado**:
- **Momento**: Durante creación de snapshot L1 (acceso a `.env` para conexiones)
- **Archivos accedidos**:
  - `.env` (contiene `REDIS_URL_CORE`, `REDIS_PASSWORD`, `PG_PASSWORD`, `CHROMADB_API_KEY`)
  - `packages/mcp-adapters/src/memtech/config.ts` (líneas 50-118: carga variables de entorno)

**Contenido sensible presente** (en `.env`):
```
REDIS_URL_CORE=redis://...
REDIS_PASSWORD=...
PG_PASSWORD=...
CHROMADB_API_KEY=...
```

**Razón del NO-activación**:
1. ❌ Content pattern: `(SECRET|API_KEY|TOKEN|PASSWORD|PRIVATE_KEY)\s*[:=]\s*['\"][\w-]{15,}['\"]`
   - Busca comillas alrededor del valor: `PASSWORD="value"`
   - `.env` típicamente usa: `PASSWORD=value` (sin comillas)
2. ❌ No se abrió/leyó `.env` durante la ejecución en el editor
3. ⚠️ `CHROMADB_API_KEY` SÍ coincide con keyword `API_KEY`, pero pattern requiere comillas

**Score esperado si patterns fueran correctos**:
- Path: 0.3/0.3 (`.env` está en raíz: `**/*.{ts,tsx,js,json,yml,yaml}`) ✅
- Content: 0.0/0.2 (pattern no detecta formato sin comillas) ❌
- **Total**: 0.3/0.6 (NO activaría - bajo threshold)

### Oportunidad Perdida 3: `plan-architect` ⚠️

**Cuándo debería haberse activado**:
- **Momento**: Durante creación del plan `post-estudio-operacional.json`
- **Archivos creados**:
  - `dev/plans/post-estudio-operacional.json`
  - `dev/plans/post-estudio-operacional.md`

**Razón del NO-activación**:
1. ⚠️ Path patterns coinciden: `dev/plans/**/*.json` ✅
2. ⚠️ Keywords coinciden: "plan", "planificar" en prompt ✅
3. ⚠️ Content patterns coinciden: `"status":\s*"APPROVED"`, `fases:` ✅
4. ❌ **Hipótesis**: `plan-save-workflow` tiene mayor prioridad (`high`) y se activó primero, posiblemente bloqueando o "ganando" sobre `plan-architect`
5. ❌ **Hipótesis**: Skills `generator` tipo pueden no registrarse en events.jsonl si enforcement es `suggest`

**Score esperado**:
- Keywords: 0.2/0.2 ✅
- Intent: 0.3/0.3 ✅
- Path: 0.3/0.3 ✅
- Content: 0.2/0.2 ✅
- **Total**: 1.0/1.0 (SÍ debería activar)

**Conclusión**: ⚠️ Probable activación no registrada o suprimida por `plan-save-workflow`

### Oportunidad Perdida 4: `backend-dev-guidelines` ⚠️

**Cuándo debería haberse activado**:
- **Momento**: Durante modificación de archivos en `packages/`
- **Archivos modificados**:
  - `packages/skills-cli/src/commands/plan.ts`
  - `packages/router/src/pre-invoke.ts`
  - `packages/mcp-adapters/src/memtech/**/*.ts`

**Razón del NO-activación**:
1. ❌ Path patterns: `backend/src/**/*.ts`, `**/controllers/**/*.ts` NO coinciden con `packages/**/src/**/*.ts`
2. ❌ Prompts no usaron keywords explícitas: "backend", "controller", "service", "API"

**Score esperado si patterns fueran correctos**:
- Keywords: 0.0/0.2 (no usadas)
- Path: 0.0/0.3 (no coincide)
- **Total**: 0.0/0.6 (NO activaría)

---

## ✅ Acciones Inmediatas Recomendadas

### Prioridad ALTA (CRÍTICO)
1. ⚠️ **Actualizar `secrets-and-config` patterns** para detectar `.env` y variables sin comillas
   - Agregar pattern: `(?:REDIS_|PG_|CHROMADB_|DATABASE_)[A-Z_]*=\s*\S+`
   - Agregar pattern case-insensitive: `(password|secret|api_key|token)\s*[:=]\s*\S+`
2. ⚠️ **Expandir `database-verification` paths** para incluir `packages/mcp-adapters/**`

### Prioridad MEDIA
3. Expandir `backend-dev-guidelines` paths para incluir `packages/**/src/**`
4. Agregar content patterns para operaciones Redis/Postgres directas

### Prioridad BAJA
5. Revisar lógica de registro de skills múltiples (plan-architect vs plan-save-workflow)

---

## 📝 Evidencia de Oportunidades Perdidas

### Evidencia 1: Acceso a Database Clients

**Archivos modificados/accedidos**:
- `packages/mcp-adapters/src/memtech/database-clients.ts`
- `packages/mcp-adapters/src/memtech/redis-client.ts`
- `packages/mcp-adapters/src/memtech/memory-store.ts`

**Operaciones realizadas**:
- Conexión a Redis (L0/L1)
- Conexión a PostgreSQL (L2)
- Conexión a ChromaDB (L3 legacy)

**Skill esperado**: `database-verification-find`  
**Estado**: ❌ NO ACTIVADO

### Evidencia 2: Configuración y Secrets

**Archivos accedidos**:
- `.env` (variables `REDIS_URL_CORE`, `PG_*`, `CHROMADB_*`)
- `packages/mcp-adapters/src/memtech/config.ts` (carga de `.env`)

**Contenido sensible**:
- URLs de conexión
- Credenciales (si están en `.env`)

**Skill esperado**: `secrets-and-config` (enforcement: require)  
**Estado**: ❌ NO ACTIVADO (CRÍTICO)

### Evidencia 3: Estructura Backend

**Archivos modificados**:
- `packages/skills-cli/src/commands/plan.ts`
- `packages/router/src/pre-invoke.ts`
- `packages/mcp-adapters/src/memtech/**/*.ts`

**Estructura**: Similar a backend (packages, commands, adapters, clients)

**Skill esperado**: `backend-dev-guidelines`  
**Estado**: ❌ NO ACTIVADO (Parcial)

---

**Fecha Análisis**: 2025-10-29  
**Estado**: ✅ COMPLETADO  
**Próxima acción**: Actualizar `skill-rules.json` con patterns mejorados

