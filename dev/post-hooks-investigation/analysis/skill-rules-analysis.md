# Análisis de skill-rules.json y Sistema de Activación

**Fecha**: 2025-11-01  
**Archivo**: `configs/skill-rules.json`  
**Líneas**: 442

---

## 📋 Índice

1. [Estructura General](#estructura-general)
2. [Tipos de Skills](#tipos-de-skills)
3. [Niveles de Enforcement](#niveles-de-enforcement)
4. [Triggers y Patterns](#triggers-y-patterns)
5. [Guardrails en skill-rules.json](#guardrails-en-skill-rulesjson)
6. [Alineación con Implementación](#alineación-con-implementación)

---

## 🎯 Estructura General

### Schema de SkillRule

```typescript
interface SkillRule {
  type: 'guideline' | 'guardrail' | 'workflow' | 'analyst' | 'generator';
  enforcement?: 'suggest' | 'warn' | 'require' | 'block';
  priority?: 'critical' | 'high' | 'normal' | 'low';
  promptTriggers?: {
    keywords?: string[];
    intentPatterns?: string[];
  };
  fileTriggers?: {
    pathPatterns?: string[];
    contentPatterns?: string[];
  };
  resources?: string[];
}
```

### Estadísticas de skill-rules.json

**Total de Skills**: 19

| Tipo | Cantidad | % |
|------|----------|---|
| guideline | 14 | 73.7% |
| guardrail | 5 | 26.3% |
| workflow | 0 | 0% |
| analyst | 0 | 0% |
| generator | 0 | 0% |

---

## 📊 Tipos de Skills

### Guideline (14 skills)

**Propósito**: Sugerencias y mejores prácticas, no bloquean operaciones.

**Skills Identificados**:
1. `plan-architect`
2. `database-verification` (enforcement: suggest)
3. `secrets-and-config`
4. `backend-dev-guidelines`
5. `error-pattern-standardization` (enforcement: require)
6. `frontend-dev-guidelines`
7. `project-catalog-developer`
8. `sample-skill`
9. `Policy NET Example` (enforcement: require)
10. `Policy S1 Example` (enforcement: require)
11. `Auditor de repositorio (read-only)`
12. `Auditor sin permisos`
13. `test-skill`
14. `plan-save-workflow`
15. `pm2-monitor`
16. `visual-regression-testing` (enforcement: require)

### Guardrail (5 skills)

**Propósito**: Protección multi-nivel (SUGGEST → WARN → BLOCK).

**Skills Identificados**:
1. `cli-compilation-fixes` (enforcement: block, priority: critical)
2. `Policy S2 Example` (enforcement: block, priority: critical)
3. `cli-integration-testing` (enforcement: block, priority: critical)

**Nota**: Solo 3 de los 5 guardrails identificados tienen `type: "guardrail"`. Los otros 2 (`database-verification` y `secrets-and-config`) están marcados como `guideline` pero deberían ser `guardrail`.

---

## 🛡️ Niveles de Enforcement

### Distribución de Enforcement

| Enforcement | Cantidad | % | Uso |
|-------------|----------|---|-----|
| suggest | 12 | 63.2% | Solo muestra mensaje |
| require | 4 | 21.1% | Requiere cumplimiento |
| block | 3 | 15.8% | Bloquea operación |
| warn | 0 | 0% | Advertencia (no bloquea) |

### Enforcement por Tipo

**Guidelines**:
- `suggest`: 11 skills
- `require`: 3 skills (`error-pattern-standardization`, `Policy NET Example`, `Policy S1 Example`, `visual-regression-testing`)

**Guardrails**:
- `block`: 3 skills (`cli-compilation-fixes`, `Policy S2 Example`, `cli-integration-testing`)

---

## 🎯 Triggers y Patterns

### Prompt Triggers

#### Keywords

**Ejemplos**:
```json
"plan-architect": {
  "promptTriggers": {
    "keywords": [
      "genera", "planes", "estructurados", "siguiendo",
      "metodología", "cloop", "(clarify", "layout",
      "operate", "observe", "reflect)", "para"
    ]
  }
}
```

**Características**:
- Matching case-insensitive
- Substring matching (no exact)
- Puede contener palabras con paréntesis (ej: "(clarify")

#### Intent Patterns

**Ejemplos**:
```json
"error-pattern-standardization": {
  "promptTriggers": {
    "intentPatterns": [
      "(estandariza|normaliza|unifica).*(errores|mensajes|exit\\s*codes)",
      "(manejo|gesti[oó]n).*(errores|exceptions|try\\s*\\{)"
    ]
  }
}
```

**Características**:
- Regex patterns (case-insensitive con flag `i`)
- Soporta grupos, alternativas, cuantificadores
- Escaping necesario para caracteres especiales

### File Triggers

#### Path Patterns

**Ejemplos**:
```json
"error-pattern-standardization": {
  "fileTriggers": {
    "pathPatterns": [
      "**/*.{ts,js}",
      "packages/**/src/**/*.{ts,js}"
    ]
  }
}
```

**Skills con pathPatterns**: 3 skills
- `error-pattern-standardization`
- `project-catalog-developer`
- `visual-regression-testing`

**Soporte de Glob**:
- `**` → Recursivo (cualquier profundidad)
- `*` → Single level
- `{ts,js}` → Extensiones múltiples

#### Content Patterns

**Ejemplos**:
```json
"error-pattern-standardization": {
  "fileTriggers": {
    "contentPatterns": [
      "process\\.exit\\(",
      "console\\.error\\(",
      "try\\s*\\{"
    ]
  }
}
```

**Skills con contentPatterns**: 3 skills
- `error-pattern-standardization`
- `project-catalog-developer`
- `visual-regression-testing`

**Características**:
- Regex patterns (sin flags por defecto, case-sensitive)
- Escaping necesario para caracteres especiales (ej: `\\.` para punto literal)
- Matching en contenido completo del archivo

---

## 🛡️ Guardrails en skill-rules.json

### Guardrails Definidos

#### 1. `cli-compilation-fixes`

```json
{
  "type": "guardrail",
  "enforcement": "block",
  "priority": "critical",
  "promptTriggers": {
    "keywords": [...]
  },
  "fileTriggers": {}
}
```

**Estado**: ⚠️ **Solo promptTriggers, sin contentPatterns**
- No tiene `fileTriggers.contentPatterns`
- No se activará en stop hook (guardrails requiere contentPatterns)

#### 2. `Policy S2 Example`

```json
{
  "type": "guardrail",
  "enforcement": "block",
  "priority": "critical",
  "promptTriggers": {
    "keywords": [...]
  },
  "fileTriggers": {}
}
```

**Estado**: ⚠️ **Solo promptTriggers, sin contentPatterns**
- No tiene `fileTriggers.contentPatterns`
- No se activará en stop hook

#### 3. `cli-integration-testing`

```json
{
  "type": "guardrail",
  "enforcement": "block",
  "priority": "critical",
  "promptTriggers": {
    "keywords": [...]
  },
  "fileTriggers": {}
}
```

**Estado**: ⚠️ **Solo promptTriggers, sin contentPatterns**
- No tiene `fileTriggers.contentPatterns`
- No se activará en stop hook

### Guardrails Implícitos (Guidelines que deberían ser Guardrails)

#### 4. `database-verification`

```json
{
  "type": "guideline",  // ⚠️ Debería ser "guardrail"
  "enforcement": "suggest",
  "fileTriggers": {}
}
```

**Estado**: ⚠️ **Marcado como guideline, no tiene contentPatterns**
- Debería tener patterns para `deleteMany`, `updateMany`, `findMany` sin `where`
- Actualmente no se activa en stop hook

#### 5. `secrets-and-config`

```json
{
  "type": "guideline",  // ⚠️ Debería ser "guardrail"
  "enforcement": "suggest",
  "fileTriggers": {}
}
```

**Estado**: ⚠️ **Marcado como guideline, no tiene contentPatterns**
- Debería tener patterns para secretos hardcodeados
- Actualmente no se activa en stop hook

### Gaps Identificados

1. **❌ Ningún guardrail tiene contentPatterns definidos**
   - Los 3 guardrails existentes solo tienen `promptTriggers`
   - No se activarán en stop hook (guardrails requiere `fileTriggers.contentPatterns`)

2. **❌ Guardrails críticos faltantes**
   - Patterns para `deleteMany()` sin `where`
   - Patterns para `updateMany()` sin `where`
   - Patterns para secretos hardcodeados
   - Patterns para operaciones destructivas

3. **⚠️ Inconsistencia de tipos**
   - `database-verification` y `secrets-and-config` deberían ser `guardrail`, no `guideline`

---

## 🔗 Alineación con Implementación

### Alineación con detectors.ts

**Sistema de Scoring**:
- Keywords: 20% ✓ (alineado con skill-rules)
- Intent: 30% ✓ (alineado con skill-rules)
- Path: 30% ✓ (alineado con skill-rules)
- Content: 20% ✓ (alineado con skill-rules)

**Threshold Default**: 0.6 ✓

### Alineación con guardrails.ts

**Problema Crítico**: 

```typescript
// guardrails.ts: loadGuardrailPatterns()
if (rule.type === 'guardrail' && rule.enforcement) {
  const contentPatterns = rule.fileTriggers?.contentPatterns || [];
  // ...
}
```

**Análisis**:
- ✅ Filtra por `type === 'guardrail'` (correcto)
- ✅ Requiere `contentPatterns` en `fileTriggers`
- ❌ **Ningún guardrail en skill-rules.json tiene `fileTriggers.contentPatterns`**
- ❌ Los guardrails definidos solo tienen `promptTriggers`

**Conclusión**: **Los guardrails definidos en skill-rules.json NO se activan en el stop hook**

### Alineación con stop.ts

**Flujo de Guardrails**:
1. `checkGuardrails()` carga patterns desde skill-rules.json
2. Solo procesa skills con `type === 'guardrail'` Y `fileTriggers.contentPatterns`
3. **Como ningún guardrail tiene contentPatterns, no se ejecutan guardrails**

**Impacto**: El sistema de guardrails está **funcionalmente deshabilitado** porque no hay patterns definidos.

---

## 📝 Recomendaciones

### P0 (Crítico)

1. **Agregar contentPatterns a guardrails existentes**:
   ```json
   "cli-compilation-fixes": {
     "type": "guardrail",
     "enforcement": "block",
     "fileTriggers": {
       "contentPatterns": [
         // Patterns específicos para CLI compilation issues
       ]
     }
   }
   ```

2. **Convertir guidelines a guardrails cuando corresponda**:
   - `database-verification` → `guardrail` con patterns para `deleteMany/updateMany/findMany`
   - `secrets-and-config` → `guardrail` con patterns para secretos

### P1 (Importante)

3. **Crear guardrails faltantes críticos**:
   - `database-mass-mutations` (block para `deleteMany/updateMany` sin `where`)
   - `hardcoded-secrets` (block para secretos en código)
   - `destructive-operations` (block para `TRUNCATE`, `DROP`, etc.)

4. **Documentar patterns recomendados**:
   - Crear documentación de patterns de guardrails efectivos
   - Ejemplos de regex patterns para casos comunes

### P2 (Mejoras Futuras)

5. **Agregar guardrails para ESLint**:
   - Patterns para reglas críticas de ESLint
   - Integración con quality service del daemon

6. **Validación de skill-rules.json**:
   - Schema validation para asegurar guardrails tengan contentPatterns
   - Linter para detectar guardrails sin patterns

---

## 📊 Resumen

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Total Skills | 19 | ✓ |
| Guardrails Definidos | 3 | ⚠️ Solo promptTriggers |
| Guardrails con contentPatterns | 0 | ❌ **Crítico** |
| Alineación detectors.ts | ✓ | Correcta |
| Alineación guardrails.ts | ❌ | Guardrails no se activan |
| Alineación stop.ts | ❌ | Sistema de guardrails deshabilitado |

---

**Última actualización**: 2025-11-01  
**Siguiente**: Análisis de integraciones

