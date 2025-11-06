# Guía de Uso - Prompt Builder v2 (con pre/post hooks por defecto)

## Requisitos
- Node 18+
- pnpm 8+
- Proyecto compilado: `pnpm -w build`

## Formas de ejecución

Si el bin `skills` no está en tu PATH:

```bash
# 1) Ejecutar el CLI directamente
node packages/skills-cli/dist/index.js prompt-builder plan-architect "Diseñar y aprobar plan post-estudio" --v2 --show-score

# 2) Usar pnpm exec filtrando el package
pnpm -w --filter @skills-fabrik/skills-cli exec skills prompt-builder plan-architect "Diseñar y aprobar plan post-estudio" --v2 --show-score

# (Opcional) Link global
pnpm -w --filter @skills-fabrik/skills-cli link -g
skills prompt-builder plan-architect "Diseñar y aprobar plan post-estudio" --v2 --show-score
```

## Qué hace v2 por defecto
- Pre-hook: detecta intención/fase CLOOP, extrae TAGs [K][C][U][EVIDENCIA][PROPUESTA], calcula `preScore` y sube el `expectedScore` (+preScore×0.2).
- Plantilla Startkit (si usas `--include-template`): inserta el blueprint completo con frontmatter YAML, C-LOOP, mini-tasks [C/M/U/D/K], métricas Before/After, objetivos SMART, tests ejecutables, auditoría 4D y boundary markers.
- Post-hook: calcula Score 4D (Completitud, Calidad, Impacto, Sostenibilidad), agrega tags de salida (APPROVED/REVIEW, DOC) y un resumen al final del prompt.

### Estructura de la plantilla Startkit
1. **Frontmatter meta** con `meta.id`, versionado, fecha, coverage objetivo, complejidad y referencia al plan activo.
2. **Contexto + Fundamentos**: fases actuales, tags `[K:]` importantes y fundamentos teóricos.
3. **Secciones C-LOOP**:
   - `CLARIFY`: objetivos medibles, riesgos, dependencias, criterios de éxito.
   - `LAYOUT`: roadmap semanal/fase con objetivos, entregables y owners.
   - `OPERATE`: mini-tasks en YAML etiquetadas [C/M/U/D/K].
   - `OBSERVE`: tabla de métricas Before/Target/After + comandos `pnpm`/`node`.
   - `REFLECT`: handoff (decisiones, artefactos, issues, auditoría 4D).
4. **Objetivos SMART (O1-O3)** y **tests ejecutables**.
5. **Auditoría & Handoff checklist**, **Boundary markers anti-drift** y **Template v1.1.0 (8/8)**.
6. `🏷️ TAGs sugeridos` derivados del skill + plan.

> Para ver el bloque completo sin ejecutar la cadena completa, corre el builder con `--include-template --include-tags --include-plan-context` y revisa la salida en consola.

## Flags útiles
```bash
--include-template      # Inserta estructura Template v1.1.0 (8/8)
--include-tags          # Activa sistema de TAGs en el prompt
--include-plan-context  # Inyecta plan activo aprobado si existe
--complexity <level>    # low|medium|high|very-high (personaliza cobertura/duración)
--duration <time>       # Pista de tiempo (ej: 12h)
--show-score            # Muestra desglose de puntuaciones y señales
--multiple-skills       # Permite pasar múltiples skills separados por coma
```

## Ejemplos

### 1) Plan con Template + TAGs y auditoría final
```bash
node packages/skills-cli/dist/index.js prompt-builder \
  plan-architect \
  "[Clarify] Planificar siguiente etapa. [K] análisis completado. [U] riesgos críticos. [EVIDENCIA] docs/ESTADO-FINAL-CONSOLIDADO.md [PROPUESTA] activar plan-save-workflow" \
  --v2 --include-template --include-tags --include-plan-context --show-score
```

### 2) Backend + DB verification (múltiples skills)
```bash
node packages/skills-cli/dist/index.js prompt-builder \
  "backend-dev-guidelines,database-verification-find" \
  "Crear endpoint de usuarios con validaciones y conexión a Postgres/Redis" \
  --v2 --multiple-skills --include-tags --show-score
```

### 3) Multi-día con handoffs inter-día (solo v2)
```bash
node packages/skills-cli/dist/index.js prompt-builder \
  plan-architect \
  "Implementar feature en 3 días con validación diaria" \
  --v2 --include-template --include-tags --show-score --multiday 3
```

## Cómo “alimentar” el pre-hook
- Expresa intención clara: planificar/crear/analizar/auditar.
- Indica fase CLOOP si aplica: Clarify/Layout/Operate/Observe/Reflect.
- Usa TAGs donde corresponda: [K] hechos, [C] cálculos, [U] incógnitas, [EVIDENCIA] referencias, [PROPUESTA] cambios.

Ejemplo breve (en la descripción):
```
[Clarify] Planificar siguiente fase. [K] estado consolidado. [U] riesgos A/B.
[EVIDENCIA] docs/ESTADO-FINAL-CONSOLIDADO.md [PROPUESTA] activar plan-architect + db-verification.
```

## Qué verás en la salida
- Prompt optimizado + bloque Startkit (si `--include-template` está activo).
- Resumen del post-hook con Score 4D y tags finales:
```
---
Audit 4D: <score>/10
Tags: APPROVED|REVIEW, DOC?
Summary: <2 frases>...
```

## Validador Startkit (`plan-quality-check`)
Para garantizar que cada plan cumple el estándar, usa `scripts/hooks/plan-quality-check.mjs`. El script valida 14 secciones obligatorias (frontmatter, secciones C-LOOP, mini-tasks, métricas, objetivos SMART, tests, handoff, auditoría 4D, anti-drift y checklist Template 8/8) y emite advertencias si faltan TAGs `[K:/C:/U:]` o comandos formateados.

```bash
# Validar archivo existente
node scripts/hooks/plan-quality-check.mjs --file dev/plans/miplan.md

# Validar la salida inmediata de PBv2
node packages/skills-cli/dist/index.js prompt-builder ... --include-template \
  | node scripts/hooks/plan-quality-check.mjs --stdin
```

> El stop hook (`scripts/hooks/stop.mjs`) ejecuta este validador automáticamente y mostrará `✅ Startkit plan quality check passed` o un listado de secciones faltantes.

## Solución de problemas
- `zsh: command not found: skills` → usa el comando `node packages/...` o `pnpm exec` (ver arriba) o `pnpm link -g`.
- Compilación fallida → `pnpm -w build` y reintenta.
- Plan no detectado → asegúrate de tener un plan aprobado en `dev/plans/*.json` y usa `--include-plan-context`.
- Validador falló → revisa la lista `⚠️ Plan quality issues` y completa las secciones faltantes antes de aceptar/ejecutar el plan.

## Dónde se reflejan los resultados
- `obs/kpi/events.jsonl`: puedes extender para registrar intent/fase/score4D si lo deseas.
- Stop hook (`scripts/hooks/stop.mjs`): imprime el prompt + estado del validador Startkit inmediatamente después de generar el plan.
