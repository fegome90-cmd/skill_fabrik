# Inventario Skills Core · Ciclo 2025Q4

## Resumen ejecutivo

- **Objetivo**: Auditar Skills Core (router, daemon, pm2, skills, documentación) para asegurar una única fuente de verdad y detectar deuda técnica residual.
- **Alcance**: `packages/daemon`, `packages/router`, `packages/tools`, `skills/**/SKILL.md`, `scripts/*.mjs`, contratos en `docs/skills/*.md`, configuraciones pm2.
- **Hipótesis**:
  1. Cada dominio crítico posee un único contrato vigente.
  2. Los `SKILL.md` cumplen con el contrato global.
  3. Los artefactos sospechosos (sufijos `old`, `copy`, `backup`, `deprecated`) se encuentran controlados y con plan de retiro.
- **Criterios de éxito**:
  - ≤1 contrato activo por dominio.
  - 100 % de skills clasificadas con estado de salud.
  - 100 % de hallazgos documentados con responsable y fecha objetivo.

## Estado actual

- **Descubrimiento**: En progreso (ver `insumos-discovery.md` y triada activa).
- **Hallazgos**: Cuatro hallazgos registrados (F-001 a F-004) en `hallazgos.json` (F-004 = contratos ausentes).
- **Acciones**: Acciones asignadas en `acciones.md` (Router Lead, DocOps, Skills Curator).
- **Métricas**: `metrics-2025-11-13.json` actualizado (critical=1; discovery 45 %, analysis 20 %).
- **Prompt operativo**: `outputs/discovery-20251113-filled.md` y `outputs/contract-consistency-20251113-filled.md` listos para ejecución alineada al plan.

## Próximos pasos inmediatos

1. Ejecutar barrido inicial con Prompt Builder v2 (ver carpeta `prompts/`).
2. Completar `hallazgos.json` con resultados clasificados por severidad.
3. Coordinar revisión con responsables y actualizar `acciones.md`.
4. Documentar métricas y cerrar el ciclo con `presprint.md`.

## Historial de revisiones

| Fecha      | Autor           | Cambio                                                                            |
| ---------- | --------------- | --------------------------------------------------------------------------------- |
| 2025-11-13 | Auditor Técnico | Estructura inicial del inventario 2025Q4                                          |
| 2025-11-13 | Auditor Técnico | Plan `auditoria-skills-core-2025q4` generado y aprobado (triada creada)           |
| 2025-11-13 | Auditor Técnico | Prompt operativo PBv2 completado (`discovery-20251113-filled.md`)                 |
| 2025-11-13 | Auditor Técnico | Hallazgos F-001–F-003 documentados, acciones y métricas actualizadas              |
| 2025-11-13 | Auditor Técnico | F-004 detecta ausencia de contratos en `docs/skills/`                             |
| 2025-11-13 | Auditor Técnico | Prompt `contract-consistency-20251113-filled.md` listo para análisis de contratos |
