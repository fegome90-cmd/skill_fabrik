# Context: auditoria-skills-core-2025q4

## Overview
- Auditoría técnica de Skills Core para cerrar 2025Q4 sin deuda latente.
- Plan aprobado: `mhxknb6e-bd6b0f3` (ver `plan.md`).
- Objetivo: identificar falencias existentes (duplicados, contratos inconsistentes, pm2 alternos) sin generar nuevos artefactos.

## Relevant Files
- `docs/inventario/2025Q4/skills-core-inventario.md`
- `docs/inventario/2025Q4/hallazgos.json`
- `docs/inventario/2025Q4/acciones.md`
- `docs/inventario/2025Q4/metrics-2025-11-13.json`
- `docs/inventario/2025Q4/prompts/*.md`
- `dev/active/auditoria-skills-core-2025q4/{plan.md,context.md,tasks.md}`
- `packages/daemon/**`, `packages/router/**`, `scripts/pm2/**`
- `skills/**/SKILL.md`, `docs/skills/*.md`

## Dependencies
- Router Lead (validar contratos y guardrails del router).
- Daemon Lead (confirmar configuración pm2 y hooks de ejecución).
- Skills Curator (alinear SKILL.md con contrato global).
- DocOps (actualizar documentación y gobernanza).
- MemTech steward (snapshot y trazabilidad).

## Constraints
- No se deben crear artefactos nuevos fuera de `docs/inventario/2025Q4`.
- Mantener cambios dentro del ciclo de auditoría (usar snapshots MemTech para persistencia).
- Evitar modificaciones operativas en router/daemon hasta concluir hallazgos.

## Decisions
- Plan generado vía `plan create` y aprobado con `plan save --approve`.
- Triada activa usada como fuente de verdad para PBv2.
- Reportes se centralizan en `docs/inventario/2025Q4/`.

## Notes
- Ejecutar prompts con archivos relevantes abiertos para mejorar señales PBv2.
- Registrar en `insumos-discovery.md` cada comando y evidencia generada.
- Actualizar MemTech snapshot al finalizar cada fase.

