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
- Post-hook: calcula Score 4D (Completitud, Calidad, Impacto, Sostenibilidad), agrega tags de salida (APPROVED/REVIEW, DOC) y un resumen al final del prompt.

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
- Prompt optimizado + bloque final de auditoría:
```
---
Audit 4D: <score>/10
Tags: APPROVED|REVIEW, DOC?
Summary: <2 frases>...
```

## Solución de problemas
- `zsh: command not found: skills` → usa el comando `node packages/...` o `pnpm exec` (ver arriba) o `pnpm link -g`.
- Compilación fallida → `pnpm -w build` y reintenta.
- Plan no detectado → asegúrate de tener un plan aprobado en `dev/plans/*.json` y usa `--include-plan-context`.

## Dónde se reflejan los resultados
- `obs/kpi/events.jsonl`: puedes extender para registrar intent/fase/score4D si lo deseas.


