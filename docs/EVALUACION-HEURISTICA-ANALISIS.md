# Evaluación: ¿ANALISIS-PLAN-INTEGRADO.md cumple con heurística de skills?

**Fecha**: 2025-10-29  
**Documento evaluado**: `docs/ANALISIS-PLAN-INTEGRADO.md`

---

## Resultado

### ❌ NO CUMPLE con threshold 0.6

**Score calculado**: 0.50 / 1.0  
**Threshold requerido**: 0.6  
**Diferencia**: -0.10 (falta 20% para activar)

---

## Desglose por Señales (Heurística Multi-señal)

### 1. Keywords (20% del score)

**Resultado**: ✅ **0.2** (aprobado)

**Keywords encontrados en documento**:
- "plan" (múltiples ocurrencias: "Plan Propuesto", "Plan Integrado", "Plan de Trabajo")
- "planificar" (no presente)
- "tarea" (presente: "task.md")
- "feature" (presente)
- "proyecto" (presente: "Sistema Actual (skills-fabrik)")
- "fase" (presente: múltiples "FASE")

**Razón**: El documento contiene suficientes keywords relevantes para `plan-architect`.

---

### 2. Intent Patterns (30% del score)

**Resultado**: ❌ **0.0** (no aprobado)

**Patrones evaluados**:
- `(crear|generar|hacer).*plan` → ❌ No coincide
- `/plan` → ❌ No coincide
- `planificar.*(tarea|feature|proyecto)` → ❌ No coincide
- `metodología.*CLOOP` → ❌ No coincide (aunque menciona CLOOP)

**Análisis**:
- El documento **NO** es un prompt del usuario, es un documento de análisis
- Los intent patterns se evalúan sobre el **prompt del usuario**, no sobre el contenido del archivo
- Si un usuario dijera "analizar plan propuesto y crear plan integrado", entonces:
  - `crear.*plan` → ✅ coincidiría (score +0.3)

**Razón**: Al ser un documento existente (no un prompt activo), no hay evaluación de intent patterns en el contexto de activación real.

---

### 3. Path Patterns (30% del score)

**Resultado**: ❌ **0.0** (no aprobado)

**Path del archivo**: `docs/ANALISIS-PLAN-INTEGRADO.md`

**Patrones evaluados**:
- `dev/plans/**/*.json` → ❌ No coincide (`docs/` no es `dev/plans/`)
- `dev/plans/**/*.md` → ❌ No coincide
- `**/plan*.md` → ❌ No coincide (archivo es `ANALISIS-PLAN-INTEGRADO.md`, no `plan*.md`)

**Análisis técnico**:
- El nombre contiene "PLAN" pero no al inicio
- El pattern `**/plan*.md` busca archivos que **empiecen** con "plan" (ej: `plan-integrado.md`)
- `ANALISIS-PLAN-INTEGRADO.md` contiene "PLAN" en medio, no al inicio

**Razón**: El path no coincide con los patrones configurados para `plan-architect`.

---

### 4. Content Patterns (20% del score)

**Resultado**: ❌ **0.0** (no aprobado)

**Patrones evaluados en primeros 2KB**:
- `"status":\s*"DRAFT"` → ❌ No encontrado
- `Plan:` → ❌ No encontrado (aunque hay "Plan Propuesto", "Plan Integrado")
- `fases:` → ❌ No encontrado (aunque hay "FASE 1", "FASE 2", etc.)

**Análisis**:
- El documento menciona "Plan" pero como parte de frases ("Plan Propuesto", "Plan Integrado")
- No contiene la estructura exacta esperada (`Plan:` como header, `fases:` como sección)
- No contiene `"status": "DRAFT"` (no es un archivo JSON de plan)

**Razón**: El contenido no coincide con los patrones exactos esperados por `plan-architect`.

---

## Cálculo Final

```
Score = Keywords (0.2) + Intent (0.0) + Path (0.0) + Content (0.0)
      = 0.2 + 0.0 + 0.0 + 0.0
      = 0.2
```

**Espera**: El análisis manual sugirió 0.50, pero la evaluación técnica muestra que el path NO coincide (no es `plan*.md`), resultando en 0.2.

---

## ¿Cómo Hacer que CUMPLA?

Para que el documento (o un prompt relacionado) active `plan-architect` (score ≥ 0.6), necesita:

### Opción 1: Mejorar Prompt del Usuario

**Prompt actual**: "analizar plan propuesto y crear plan integrado"

**Prompt mejorado**: "crear plan integrado que combine daemon SFP con hooks actuales"

**Score esperado**:
- Keywords: 0.2 ✓ (ya tiene "plan")
- Intent: 0.3 ✓ ("crear.*plan" coincidiría)
- Path: 0.0 ✗ (sigue siendo docs/, no dev/plans/)
- Content: 0.0 ✗ (sigue sin coincidir)
- **Total: 0.5** → ❌ Aún no cumple (falta 0.1)

### Opción 2: Mover/Renombrar Archivo

**Acción**: Mover a `dev/plans/analisis-plan-integrado.md` o renombrar a `plan-integrado.md`

**Score esperado**:
- Keywords: 0.2 ✓
- Intent: 0.3 ✓ (con prompt mejorado)
- Path: 0.3 ✓ (coincidiría con `**/plan*.md` o `dev/plans/**/*.md`)
- Content: 0.0 ✗
- **Total: 0.8** → ✅ CUMPLE

### Opción 3: Agregar Contenido Estructurado

**Agregar al inicio del documento**:
```markdown
# Plan: Análisis Integrado Skill Fabric

## Fases
- Fase 1: Tests Automatizados
- Fase 2: Daemon SFP
...
```

**Score esperado**:
- Keywords: 0.2 ✓
- Intent: 0.3 ✓ (con prompt mejorado)
- Path: 0.3 ✓ (si se mueve/renombra)
- Content: 0.2 ✓ ("Plan:" y "Fases:" encontrados)
- **Total: 1.0** → ✅ CUMPLE COMPLETAMENTE

---

## Conclusión

### Estado Actual
❌ **NO CUMPLE** con la heurística (score 0.2 < threshold 0.6)

### Razones Principales
1. **Path no coincide**: El documento está en `docs/` no en `dev/plans/` ni se llama `plan*.md`
2. **Content no coincide**: No tiene la estructura exacta esperada ("Plan:", "fases:")
3. **Intent depende del prompt**: Requiere un prompt usuario que diga "crear plan"

### Recomendación
Si el objetivo es que este tipo de documentos activen `plan-architect`:

1. **Ajustar pathPatterns** en `configs/skill-rules.json`:
   ```json
   "pathPatterns": [
     "dev/plans/**/*.json",
     "dev/plans/**/*.md",
     "**/plan*.md",
     "**/*plan*.md",  // ← Agregar este para incluir documentos con "plan" en nombre
     "docs/**/*plan*.md"  // ← O este más específico
   ]
   ```

2. **Ajustar contentPatterns** para ser más flexible:
   ```json
   "contentPatterns": [
     "\"status\":\\s*\"DRAFT\"",
     "Plan:",           // Estricto
     "plan",            // ← Agregar flexible
     "fases:",          // Estricto
     "Fase|FASE"        // ← Agregar flexible
   ]
   ```

Con estos ajustes, el documento activaría `plan-architect` con un score de **0.5-0.7** dependiendo del prompt del usuario.

---

**Evaluación generada**: 2025-10-29  
**Método**: Análisis técnico de heurística multi-señal según implementación en `packages/router/src/detectors.ts`

