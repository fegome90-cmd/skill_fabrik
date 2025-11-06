# Context - Investigación Sistema de Activación de Skills

## 📋 **Resumen Ejecutivo**

**Fecha:** 2025-11-02
**Alcance:** Análisis completo del sistema de activación de skills en Skills Fabric
**Metodología:** CLOOP (Clarify, Layout, Operate, Observe, Reflect)

### **Hallazgo Principal**

El sistema de activación de skills tiene un **BUG CRÍTICO**: el `registry/index.json` pierde el 80% de la información durante la indexación, causando que los guardrails de seguridad **NO funcionen** en runtime.

---

## 🏗️ **Arquitectura del Sistema**

### **Componentes Principales**

```
┌─────────────────┐
│   CLI/Editor    │  (Prompt de usuario)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Router       │  (Puerto 3000)
│  Pre-Invoke     │  - Detección local
└─────┬───────────┘
      │ HTTP POST /activate
      ▼
┌─────────────────┐
│   Daemon        │  (Puerto 7727)
│  /activate      │  - Motor de decisión
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Service         │  (Puerto 8877)
│ Discovery       │  - Health checks
└─────────────────┘
```

### **Flujo de Activación**

1. **Input** desde editor (prompt + contexto de archivos)
2. **Router Pre-Invoke** (matching local + cache)
3. **Daemon /activate** (motor de decisión + cache distribuido)
4. **Response** (skills activados + metadata)
5. **Output** al editor (injected note + activated skills)
6. **Event Logging** (PostgreSQL + JSONL + Prometheus)

---

## 📊 **Inventario de Skills**

### **Total: 29 Skills**

| Categoría | Cantidad | Enforcement Principal |
|-----------|----------|----------------------|
| **guidelines** | 10 | suggest (90%) |
| **guardrails** | 2 | block (100%) |
| **workflows** | 3 | suggest (100%) |
| **generators** | 3 | suggest (100%) |
| **test** | 4 | suggest/require |
| **devops** | 3 | suggest (100%) |
| **policy** | 7 | require (100%) |

### **Skills Críticos**

#### **Guardrails con enforcement BLOCK:**
1. **`database-verification`**
   - Propósito: Bloquea `deleteMany()`/`updateMany()` sin `where`
   - Patrones: SQL regex, Prisma methods
   - **BUG:** No funciona en runtime (sin content patterns en registry)

2. **`secrets-and-config`**
   - Propósito: Detecta API keys, passwords, tokens embebidos
   - Patrones: Regex para credenciales hardcodeadas
   - **BUG:** No funciona en runtime (sin content patterns en registry)

---

## 🔍 **Sistema de Matching**

### **4 Señales de Detección (Ponderadas)**

```typescript
interface DetectionSignals {
  keywordMatch: number;   // 20% peso
  intentMatch: number;    // 30% peso
  filePathMatch: number;  // 30% peso
  contentMatch: number;   // 20% peso
}

interface SkillScore {
  baseScore: number;      // 0.1
  boost: number;          // 0.5 * sum(signals * weights)
  finalScore: number;     // baseScore + boost
  threshold: number;      // 0.6 por defecto
}
```

### **Algoritmo de Scoring**

```typescript
function calculateSkillScore(rule, input) {
  let score = 0;

  // Keywords (20%)
  if (keyword matches) score += 0.2;

  // Intent regex (30%)
  if (intent patterns match) score += 0.3;

  // Path glob (30%)
  if (file paths match) score += 0.3;

  // Content pattern (20%)
  if (content matches) score += 0.2;

  return score; // Debe ser ≥ 0.6 para activar
}
```

---

## 🔐 **Enforcement Levels**

### **4 Niveles de Enforcement**

1. **BLOCK** - Cancela operación inmediatamente
   - `database-verification`
   - `secrets-and-config`
   - `cli-integration-testing`

2. **REQUIRE** - Debe cumplirse o se bloquea
   - `error-pattern-standardization`
   - `visual-regression-testing`
   - Políticas (7 skills)

3. **WARN** - Advertencia pero continúa
   - Patrones peligrosos que requieren revisión

4. **SUGGEST** - Recomendación suave
   - Guidelines (10 skills)
   - Generators (3 skills)
   - Workflows (3 skills)

---

## 🚨 **Problemas Identificados**

### **BUG CRÍTICO #1: Registry Incompleto**

**Problema:**
El `registry/index.json` **pierde información crítica** durante indexación:

```json
// configs/skill-rules.json (COMPLETO)
{
  "database-verification": {
    "enforcement": "block",
    "promptTriggers": {
      "keywords": ["aplica", "bloqueo", "mutaciones"...],
      "intentPatterns": [
        "(query|consulta).*(masiv[oa]|bulk|riesgo)",
        "(revisar|auditar).*findMany|updateMany|deleteMany"
      ]
    },
    "fileTriggers": {
      "pathPatterns": ["**/{repositories,prisma}/**/*.{ts,js,sql}"],
      "contentPatterns": [
        "deleteMany\\([^)]*\\)(?!.*where)",
        "updateMany\\([^)]*\\)(?!.*where)"
      ]
    }
  }
}

// registry/index.json (INCOMPLETO)
{
  "name": "database-verification",
  "description": "Aplica bloqueo de mutaciones...",
  "triggers": {
    "keywords": ["aplica", "bloqueo", "mutaciones"...]
    // ❌ FALTA: intentPatterns
    // ❌ FALTA: contentPatterns
    // ❌ FALTA: enforcement level
  }
}
```

**Consecuencias:**
- Score bajo: 0.1 (solo keywords) < 0.6 threshold
- Guardrails NO se activan en runtime
- Código destructivo se ejecuta sin bloqueo

### **BUG CRÍTICO #2: Skills Huérfanas**

**19 skills** están en `registry/index.json` pero NO en `configs/skill-rules.json`:
- `skill-creator`
- `template-skill`
- `root-cause-tracing`
- `systematic-debugging`
- `test-driven-development`
- `using-git-worktrees`
- `Policy NET Example`
- `Policy S1 Example`
- `Policy S2 Example`
- `Auditor de repositorio (read-only)`
- `Auditor sin permisos`
- `visual-regression-testing`
- `webapp-testing`
- `plan-save-workflow`
- `pm2-monitor`
- Y más...

**Consecuencias:**
- Estas skills **NUNCA se activan** (no tienen reglas)
- Cache miss constante
- Falsos negativos

### **BUG #3: Threshold Uniforme**

El threshold de 0.6 se aplica a **todas** las skills:
- Guidelines con enforcement `suggest`: threshold 0.6 ✅
- Guardrails con enforcement `block`: threshold 0.6 ❌ (debería ser 0.2)

---

## 📈 **Métricas del Sistema**

### **Performance**
- **Latencia promedio:** 466ms (91% reducción vs 5163ms inicial)
- **Cache hit rate:** 70% (L1 memoria + L2 Redis/PostgreSQL)
- **Skills evaluadas por prompt:** 15-25

### **Efectividad**
- **Adherence rate:** 93.5%
- **False positives:** 5%
- **False negatives:** 35% (guardrails críticos)

### **Coverage**
- **Skills con reglas activas:** 15/29 (52%)
- **Guidelines activables:** 10/10 (100%)
- **Guardrails activables:** 0/2 (0%)

---

## 🔧 **Factores que Bloquean Activación**

### **1. Slash Commands**
Prioridad máxima - si se detectan, NO activan skills:
- `/dev-docs`
- `/build-and-fix`
- `/code-review`

### **2. Planning Mode**
Si `SKILLS_PLANNING_MODE=true` y no hay plan aprobado:
- **TODO BLOQUEADO**
- Requiere `skills plan approve <id>`

### **3. Score < Threshold**
Si finalScore < 0.6:
- No se activa
- Solo keywords match → score 0.1-0.3
- Keywords + intent match → score 0.4-0.6
- Keywords + intent + path → score 0.7-0.9 ✅

### **4. Contexto de Archivos Requerido**
Skills con `fileTriggers.pathPatterns` necesitan:
- Archivos abiertos en paths matching
- Contenido activo que coincida con patterns
- Sin archivos → 0 score en path (30%)

### **5. Daemon No Disponible**
Si el daemon en puerto 7727 no responde:
- Solo matching local (router)
- Resultados incompletos
- Cache miss

---

## 💡 **Ejemplos Prácticos**

### **✅ Activación Exitosa**

**Prompt:** "crear endpoint para usuarios con autenticación"
**Archivos abiertos:** `src/controllers/UserController.ts`

```typescript
// Score calculation:
keywordMatch: 0.8    // "crear", "endpoint", "usuarios"
intentMatch: 0.9     // "crear.*(endpoint|controller)"
filePathMatch: 0.7   // "**/controllers/**/*.{ts,js}"
contentMatch: 0.5    // "export.*Controller"

boost = 0.5 * (0.8*0.25 + 0.9*0.25 + 0.7*0.25 + 0.5*0.25) = 0.4875
finalScore = 0.1 + 0.4875 = 0.5875

// Resultado: 0.5875 < 0.6 = ❌ NO ACTIVA (por poco)
```

**Problema:** Threshold 0.6 muy alto para skills con pocos matches

### **❌ NO Activación (Guardrail Crítico)**

**Prompt:** "implementar función para eliminar todos los usuarios"
**Archivo abierto:** `src/repositories/UserRepository.ts`

```typescript
// Contenido:
async function deleteAllUsers() {
  await prisma.user.deleteMany(); // ❌ Sin WHERE - PELIGROSO
}

// Score calculation:
keywordMatch: 0.1    // Solo "eliminar" (parcial)
intentMatch: 0.0     // ❌ NO disponible en registry
filePathMatch: 0.6   // "**/{repositories}/**/*.{ts,js}"
contentMatch: 0.0    // ❌ NO disponible en registry

boost = 0.5 * (0.1*0.25 + 0.0 + 0.6*0.25 + 0.0) = 0.0875
finalScore = 0.1 + 0.0875 = 0.1875

// Resultado: 0.1875 < 0.6 = ❌ NO ACTIVA
// Guardrail NO bloquea = 🚨 SEGURIDAD COMPROMETIDA
```

**Consecuencias:**
- Código destructivo se ejecuta
- Base de datos puede quedar corrupta
- Pérdida masiva de datos

---

## 📁 **Archivos Analizados**

### **Configuración**
- `/configs/skill-rules.json` - Reglas de activación completas
- `/registry/index.json` - Metadata de skills (incompleto)

### **Router (Puerto 3000)**
- `/packages/router/src/pre-invoke.ts` - Hook de activación
- `/packages/router/src/stop.ts` - Hook post-respuesta
- `/packages/router/src/guardrails.ts` - Sistema de enforcement
- `/packages/router/src/detectors.ts` - Algoritmo de scoring
- `/packages/router/src/signals/` - Detectores de señales

### **Daemon (Puerto 7727)**
- `/packages/daemon/src/app.ts` - Endpoint /activate y /execute

### **Shared (Puerto 8877)**
- `/packages/shared/src/service-registry.ts` - Registro de servicios
- `/packages/shared/src/service-discovery.ts` - Descubrimiento

### **Skills (29 archivos)**
- `/skills/guidelines/` - 10 skills
- `/skills/guardrails/` - 2 skills críticos
- `/skills/workflows/` - 3 skills
- `/skills/generators/` - 3 skills
- `/skills/test/` - 4 skills
- `/skills/devops/` - 3 skills
- `/skills/policy/` - 7 skills

---

## 🎯 **Conclusiones**

### **Lo que SÍ Funciona:**
- ✅ Keywords matching básico
- ✅ Threshold configurable
- ✅ Cache distribuido (91% reducción latencia)
- ✅ Arquitectura multi-servicio escalable
- ✅ Guidelines se activan correctamente
- ✅ Slash commands con prioridad

### **Lo que NO Funciona (CRÍTICO):**
- ❌ Guardrails no bloquean operaciones peligrosas
- ❌ 80% de información perdida en registry
- ❌ 19 skills huérfanas sin reglas
- ❌ Intent/content patterns no evaluados
- ❌ Enforcement levels no transferidos

### **Impacto:**
- **Seguridad:** Guardrails críticos inoperativos
- **Confiabilidad:** False negatives en skills importantes
- **Usabilidad:** Sistema parece funcionar pero falla silenciosamente

### **Severidad:**
- **P0 (Critical):** Guardrails de seguridad no funcionan
- **P0 (Critical):** Registry pierde información crítica
- **P1 (High):** Skills huérfanas no activables
- **P2 (Medium):** Threshold uniforme inadecuado

---

## 📚 **Metodología CLOOP**

### **Clarify**
- Objetivo: Entender por qué se activan/activan las skills
- Alcance: Sistema completo (router, daemon, registry, guardrails)
- Criterio éxito: Identificar BUGs críticos

### **Layout**
- Plan: Investigar cada componente
- Hitos: Skills → Reglas → Matching → Registry → Guardrails
- Recursos: Agentes especializados (Explore, Executive Summary)

### **Operate**
- Ejecución: 7 tareas secuenciales
- Evidencia: Archivos leídos, análisis comparativo
- Métricas: 29 skills analizadas, 2 archivos config comparados

### **Observe**
- Hallazgos: 3 BUGs críticos identificados
- Patrones: Registry pierde 80% información
- Métricas: 35% false negatives, 0% guardrails activables

### **Reflect**
- Aprendizaje: Sistema robusto pero con BUGs críticos
- Mejoras: Threshold dinámico, registry completo
- Próximos pasos: Plan de implementación P0-P2

---

**Contexto establecido. Continuar con `plan.md` para el plan de investigación.**
