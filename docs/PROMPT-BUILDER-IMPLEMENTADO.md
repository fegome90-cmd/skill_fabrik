# Prompt Builder - Implementación y Uso

**Fecha**: 2025-10-29  
**Basado en**: `startkit-main/cloop-research/metacognicion/playbook-bmcc/promptcreate.md`

---

## ✅ Implementado

### 1. Utilidad `prompt-builder.ts`

**Ubicación**: `packages/skills-cli/src/utils/prompt-builder.ts`

**Funcionalidades**:
- `buildOptimizedPrompt()`: Genera prompt optimizado para skill específico
- `suggestPromptImprovements()`: Sugiere mejoras si score < 0.6

**Características**:
- Lee `configs/skill-rules.json` automáticamente
- Calcula score esperado (Keywords 20% + Intent 30% + Path 30% + Content 20%)
- Genera sugerencias de archivos y contenido según patterns

### 2. Comando CLI

**Comando**: `skills prompt-builder <skill-id> "<description>" [opciones]`

**Opciones**:
- `--include-files`: Incluir sugerencias de archivos (default: true)
- `--include-content`: Incluir snippets de contenido (default: true)
- `--show-score`: Mostrar score esperado y desglose

**Ejemplos**:
```bash
# Generar prompt para backend-dev-guidelines
skills prompt-builder backend-dev-guidelines "crear endpoint de autenticación" --show-score

# Generar prompt para plan-architect
skills prompt-builder plan-architect "integración daemon SFP" --show-score
```

---

## Cómo Funciona

### Proceso de Generación

1. **Lee skill-rules.json**: Obtiene reglas del skill objetivo
2. **Extrae señales**: Keywords, intent patterns, path patterns, content patterns
3. **Construye prompt base**: Agrega keywords relevantes al inicio
4. **Mejora intención**: Ajusta descripción para coincidir con intent patterns
5. **Sugiere archivos**: Genera paths de ejemplo según pathPatterns
6. **Sugiere contenido**: Genera snippets según contentPatterns
7. **Calcula score**: Valida que score esperado ≥ 0.6

### Ejemplo de Output

**Input**:
```bash
skills prompt-builder backend-dev-guidelines "autenticación de usuarios"
```

**Output esperado**:
```
📝 PROMPT OPTIMIZADO:

backend, controller, service: crear endpoint nuevo para autenticación de usuarios

Archivos a editar:
- backend/src/controllers/**/example.ts

Contenido esperado:
router.post('/endpoint', Controller.handler);
```

**Score esperado**: 0.7-1.0 (dependiendo de archivos abiertos)

---

## Integración con Heurística

### Cumplimiento Automático de Señales

El prompt generado **garantiza** que:

1. ✅ **Keywords (20%)**: Incluye keywords del skill al inicio
2. ✅ **Intent (30%)**: Usa verbos que coinciden con intent patterns (crear, hacer, generar)
3. ✅ **Path (30%)**: Sugiere archivos en rutas relevantes
4. ✅ **Content (20%)**: Incluye snippets que coinciden con content patterns

### Validación Pre-generación

Si el prompt generado no alcanza score ≥ 0.6, se advierte al usuario y se sugieren ajustes.

---

## Próximas Mejoras

### 1. Integración con Template promptcreate.md

**Fase pendiente**: Incluir estructura completa de promptcreate.md:
- CSE completo (Contexto, Especificación, Verificación)
- TAGs ([K:], [C:], [U:], [EVIDENCIA:], [PROPUESTA:])
- Boundary Markers (35+ marcadores)
- Frontmatter YAML
- Anti-Drift mecanismos
- Objetivos SMART
- Tests ejecutables

### 2. Sugerencia Proactiva

**Fase pendiente**: En pre-invoke hook, si score < 0.6:
- Detectar automáticamente
- Sugerir: "¿Quieres que genere un prompt optimizado?"
- Ejecutar `prompt-builder` automáticamente si usuario acepta

### 3. Multi-Skill Prompts

**Fase pendiente**: Generar prompts que activen múltiples skills simultáneamente:
```bash
skills prompt-builder multiple --skills backend-dev,frontend-dev "feature completa login"
```

---

## Tests Realizados

### Test 1: backend-dev-guidelines
**Prompt generado**: "backend, controller, service: crear endpoint nuevo para autenticación"  
**Score esperado**: ≥ 0.7  
**Resultado**: ✅ Genera prompt con keywords + intent + paths + content

### Test 2: plan-architect
**Prompt generado**: "plan, planificar: crear plan para integración daemon"  
**Score esperado**: ≥ 0.6  
**Resultado**: ✅ Genera prompt optimizado

---

**Implementación completada**: 2025-10-29  
**Estado**: ✅ Funcional y listo para usar

