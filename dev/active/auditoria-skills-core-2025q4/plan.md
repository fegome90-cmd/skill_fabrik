# Plan: Auditoría Skills Core 2025Q4

**ID**: mhxknb6e-bd6b0f3  
**Status**: APPROVED  
**Created**: 13/11/2025  
**Updated**: 13/11/2025

**Approved by**: Auditor Técnico  
**Approved at**: 13/11/2025

---

## Objetivo

Realizar un discovery sweep integral sobre Skills Core (router, daemon, pm2, skills, documentación) para identificar duplicados, contratos inconsistentes y archivos obsoletos sin crear artefactos nuevos, documentando hallazgos y métricas en `docs/inventario/2025Q4/`.

## Fases

### 1. Clarify (Día 1)
- Definir alcance exacto de carpetas y exclusiones (.sf, dist, node_modules).
- Alinear hipótesis de auditoría (contratos duplicados, skills sin contrato, pm2 alternos).
- Confirmar responsables y ventanas de validación con Router Lead, Daemon Lead, Skills Curator, DocOps.

### 2. Layout (Día 1-2)
- Actualizar prompts PBv2 (`prompts/discovery-sweep.md`, `contract-consistency.md`, `pm2-review.md`).
- Preparar insumos (`raw-files-packages.txt`, `raw-skills.txt`) y checklist en `docs/inventario/2025Q4/`.
- Sincronizar plan/context/tasks en triada `dev/active/auditoria-skills-core-2025q4/`.

### 3. Operate (Día 2-3)
- Ejecutar comandos `find`/`rg` documentados, registrar hallazgos en `hallazgos.json`.
- Clasificar severidades y proponer acciones en `acciones.md`.
- Coordinar validación con responsables; registrar decisiones en `insumos-discovery.md`.

### 4. Observe (Día 3-4)
- Actualizar `metrics-2025-11-13.json` con progreso (files scanned, skills revisadas, duplicados detectados).
- Generar narrativa en `skills-core-inventario.md` (estado discovery + riesgos).
- Consolidad evidencias en MemTech snapshot.

### 5. Reflect (Día 4-5)
- Completar `presprint.md` (lecciones, riesgos residuales, backlog).
- Revisar `checklist.md` y cerrar items pendientes.
- Preparar handoff para agentes/owners (hallazgos críticos, acciones siguientes, enlaces a evidencias).

## Riesgos
- Falsos positivos en detección de duplicados → mitigación: revisión manual y confirmación con owners.
- Falta de owners disponibles → anticipar agenda y registrar responsables alternos.
- Gaps en contratos → documentar explícitamente en hallazgos, priorizar consolidación CI.
- Alarmas PBv2 por caché frío → ejecutar prompts dos veces tras abrir archivos clave.

## Métricas
- % de carpetas auditadas (packages, skills, docs, scripts).
- Nº de hallazgos críticos vs resueltos.
- Tiempo total del barrido inicial (objetivo ≤ 6h).
- Cobertura de skills revisadas (meta 100 %).
- % de contratos con una única fuente de verdad (meta ≥ 95 %).

---

**Estado actual**: APPROVED

✅ Plan aprobado y listo para ejecución

