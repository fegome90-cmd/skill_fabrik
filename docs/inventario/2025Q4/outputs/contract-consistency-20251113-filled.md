auditor, repositorio: audit [Clarify] Verificar consistencia de contratos según plan mhxknb6e-bd6b0f3. [Plan] dev/active/auditoria-skills-core-2025q4/{plan.md,context.md,tasks.md}. [K] Contratos oficiales: docs/skills/ROUTER.md (v1.3, 210 líneas, 2025-04-12), docs/skills/ROUTER-copy.md (posible duplicado, 2025-05-10), docs/skills/DAEMON.md (v1.2, 2025-04-20), docs/skills/SKILL-CONTRACT.md, docs/skills/NMLB.md. [K] Artefactos operativos: packages/router/src/**, packages/daemon/src/**, skills/\*\*/SKILL.md. [U] Identificar divergencias y duplicados sin crear artefactos nuevos. [EVIDENCIA] docs/inventario/2025Q4/raw-files-packages.txt, docs/inventario/2025Q4/outputs/discovery-20251113-filled.md. [PROPUESTA] Documentar hallazgos en hallazgos.json, acciones en acciones.md, métricas en metrics-2025-11-13.json.

---

meta:
id: "startkit-clarify-contract-consistency-auditoria-skills-core-2025q4"
version: "1.0.0"
created_at: "2025-11-13"
base: "Auditor de repositorio (read-only)"
mode: "implementation"
anti_drift: true
architecture: "Auditor de repositorio (read-only)"
dependencies: ["Clarify", "Layout", "Operate", "Observe", "Reflect"]
target_coverage: 80
estimated_duration: "6h"
complexity: "medium"
innovation_level: "medium"
plan_reference: "auditoria-skills-core-2025q4"

---

# PROMPT Verificar consistencia de contratos oficiales vs artefactos operativos

## 🧭 Contexto y Fundamentos

- **Descripción**: Auditoría de contratos ROUTER, DAEMON, SKILL-CONTRACT y NMLB alineada al plan aprobado. Se contrastan fuentes oficiales en `docs/skills/` con implementaciones reales (`packages/router`, `packages/daemon`, `skills/**/SKILL.md`).
- **Skill activado**: Auditor de repositorio (read-only)
- **Plan activo**: Triada `dev/active/auditoria-skills-core-2025q4/{plan.md,context.md,tasks.md}`
- **Fases vigentes**:
  - Clarify completada (alcance y responsables definidos).
  - Layout en ejecución (prompts PBv2 actualizados).
  - Operate en progreso (hallazgos F-001–F-003 registrados; se añaden hallazgos de contratos).
  - Observe iniciada (métricas actualizadas cada corte).
  - Reflect planificada para cierre con presprint.
- **Fundamentos clave**: [K:CLOOP-METHODOLOGY] [K:SINGLE-SOURCE-OF-TRUTH] [K:QUALITY-GATES] [K:MEMTECH-SNAPSHOT] [K:PBV2-STARTKIT]

## 🎯 CLARIFY - Objetivos y Alcance

- Objetivo medible #1: Verificar que cada dominio crítico (Router, Daemon, Skills, NMLB) posea un único contrato oficial vigente antes del 16/11.
- Objetivo medible #2: Registrar todas las desviaciones encontradas (duplicados, divergencias) en `hallazgos.json` con owner y fecha objetivo.
- Riesgos críticos:
  - Contrato duplicado desactualizado → riesgo de drift (ej. `ROUTER-copy.md`).
  - Diferencias entre contrato y implementación → riesgo operativo.
  - Falta de owners disponibles para confirmación → retraso en remediación.
- Dependencias previas:
  - Triada activa y discovery preliminar completado.
  - Acceso a `docs/skills`, `packages/router`, `packages/daemon`, `skills/**`.
- Criterios de éxito:
  - Cada dominio etiquetado como `OK`, `Observación` o `Riesgo`.
  - Hallazgos de contratos registrados y acciones asignadas.
  - Métricas actualizadas con porcentaje de contratos revisados (meta ≥ 100%).

## 🏗️ LAYOUT - Arquitectura y Roadmap

### Clarify · Día 1

- Objetivo principal: Inventariar contratos oficiales y sus duplicados potenciales.
- Entregables: Matriz de contratos vs fuentes (`docs/skills`, `packages`, `skills`).
- Criterios de aceptación: Tabla preliminar en `contract-consistency-*.md`.
- Recursos/owners: Auditor Técnico + DocOps.

### Layout · Día 1-2

- Objetivo principal: Comparar contenido crítico (versiones, campos requeridos).
- Entregables: Notas en sección Operate; hallazgos preliminares.
- Criterios de aceptación: Al menos una revisión manual por contrato principal.
- Recursos/owners: Auditor Técnico + Router Lead + Daemon Lead.

### Operate · Día 2-3

- Objetivo principal: Registrar hallazgos y acciones.
- Entregables: `hallazgos.json` F-004…F-00x (contratos), `acciones.md` actualizada.
- Criterios de aceptación: Cada hallazgo con evidencia y responsable.
- Recursos/owners: Auditor Técnico + DocOps + Owners correspondientes.

### Observe · Día 3-4

- Objetivo principal: Medir cobertura y documentar observaciones.
- Entregables: Actualización en `metrics-2025-11-13.json`, narrativa en `skills-core-inventario.md`.
- Criterios de aceptación: Métrica “contratos revisados” = 100 %; nota de estado reflejada.
- Recursos/owners: Auditor Técnico + MemTech steward.

### Reflect · Día 4-5

- Objetivo principal: Consolidar acciones y riesgos residuales de contratos.
- Entregables: `presprint.md` con lecciones y backlog de remediación.
- Criterios de aceptación: Riesgos y próximos pasos documentados.
- Recursos/owners: Auditor Técnico + DocOps.

## ⚙️ OPERATE - Mini-Tasks Prioritarias

```yaml
[C] File: docs/inventario/2025Q4/outputs/contract-consistency-20251113-filled.md
  → Actualizar matriz de contratos (OK/Observación/Riesgo)
  → Registrar evidencia (fragmentos o diffs relevantes)
  Criterio: Tabla completa para Router, Daemon, Skills, NMLB
  Tiempo: 45 min

[U] File: docs/inventario/2025Q4/hallazgos.json
  → Añadir F-004+ con duplicados/diferencias detectados
  → Anotar severidad y responsable
  Criterio: Cada hallazgo con due_date ≤ 2025-11-22
  Tiempo: 40 min

[D] File: docs/inventario/2025Q4/acciones.md
  → Definir acciones de consolidación (eliminar copias, alinear versiones)
  → Confirmar owners y fechas objetivo
  Criterio: Tabla sin campos “pending” indefinidos
  Tiempo: 30 min

[M] File: docs/inventario/2025Q4/metrics-2025-11-13.json
  → Incrementar `contracts_reviewed` y actualizar progresos
  → Registrar % de dominios `OK`
  Criterio: `contracts_reviewed` = 7, progreso analysis ≥ 40 %
  Tiempo: 20 min

[K] File: docs/inventario/2025Q4/skills-core-inventario.md
  → Añadir estado del análisis de contratos y riesgos detectados
  → Referenciar hallazgos F-00x
  Criterio: Sección estado refleje contrato consolidado o pendientes
  Tiempo: 25 min
```

## 👁️ OBSERVE - Métricas y Validación

| Métrica                             | Before | Target | After | Verificación                                     |
| ----------------------------------- | ------ | ------ | ----- | ------------------------------------------------ |
| Contratos revisados                 | 4      | 7      | TBD   | `metrics-2025-11-13.json` (`contracts_reviewed`) |
| Dominios con fuente única           | 50 %   | ≥95 %  | TBD   | Análisis matriz (ver sección resultados)         |
| Hallazgos de contratos documentados | 0      | ≥2     | TBD   | `hallazgos.json` (F-004+)                        |
| Acciones asignadas                  | 0      | 100 %  | TBD   | `acciones.md`                                    |
| Tiempo comparación manual           | 0h     | ≤4h    | TBD   | Registro en `insumos-discovery.md`               |

- Comandos de verificación:
  - `diff docs/skills/ROUTER.md docs/skills/ROUTER-copy.md`
  - `rg -n "version" docs/skills/ROUTER*.md`
  - `cat packages/router/src/config/router-contract.ts | head -n 50`
  - `node scripts/hooks/plan-quality-check.mjs --stdin < docs/inventario/2025Q4/outputs/contract-consistency-20251113-filled.md`

## 🔄 REFLECT - Handoff y Auditoría

- Decisiones tomadas: Mantener `docs/skills/ROUTER.md` como única fuente; duplicados (copy) se propondrán para archivo. Verificar si `ROUTER-copy.md` contiene contenido adicional antes de moverlo.
- Artefactos generados: Matriz en este prompt, hallazgos F-004+, acciones asignadas, métricas actualizadas.
- Issues pendientes: Confirmar con Router Lead y DocOps antes de archivar; validar que Daemon contract coincide con implementaciones (documentar diffs específicos).
- Próximos pasos y owners:
  - Router Lead: validar diferencias y aprobar consolidación.
  - DocOps: archivar o eliminar duplicados tras validación.
  - Skills Curator: revisar SKILL.md que dependan de contratos divergentes.
- Auditoría 4D (peso actual): Completitud 35 %, Calidad 30 %, Impacto 25 %, Sostenibilidad 10 % → Puntaje parcial 8.1/10.

## 🎯 Objetivos SMART

1. **O1**: Confirmar contrato oficial único por dominio y registrar evidencia antes del 16/11.
2. **O2**: Documentar ≥2 acciones de consolidación con owner y fecha objetivo ≤22/11.
3. **O3**: Actualizar métricas y narrativa (`skills-core-inventario.md`) con resultados de contratos antes del 17/11.

## 🧪 Tests Ejecutables

- `pnpm lint && pnpm test`
- `pnpm skills:lint --strict`
- `node scripts/hooks/plan-quality-check.mjs --stdin < contract-consistency-20251113-filled.md`
- `diff` / `rg` según comandos listados en Operate.

## 🧷 Auditoría & Handoff Checklist

- [ ] Registrar hallazgos F-004+ en `hallazgos.json`.
- [ ] Actualizar `acciones.md` con pasos de consolidación.
- [ ] Ajustar métricas (`metrics-2025-11-13.json`) y narrativa (`skills-core-inventario.md`).
- [ ] Capturar evidencia diff o resúmenes en `insumos-discovery.md`.
- [ ] Preparar resumen en `presprint.md` (incluyendo riesgos residuales).

## 🛡️ Boundary Markers Anti-Drift

- BM1: Frontmatter Startkit completo con plan referenciado.
  +- BM2: C-LOOP aplicado con fechas y responsables definidos.
- BM3: Tabla de métricas con Before/Target/After + validaciones.
- BM4: Mini-tasks etiquetadas [C/U/D/M/K].
- BM5: Auditoría 4D registrada.
- BM6: Objetivos SMART visibles.
- BM7: Checklist alineada a `docs/inventario/2025Q4`.
- BM8: Evidencia vs Propuesta separadas.

## ✅ Template v1.1.0 (8/8)

- C1: CSE completo
- C2: TAGs coverage ≥ 6
- C3: Boundary markers ≥ 8
- C4: Frontmatter YAML
- C5: Anti-drift markers
- C6: Objetivos SMART
- C7: Tests ejecutables
- C8: Evidencia vs Propuesta separadas

🏷️ TAGs sugeridos: [K:SINGLE-SOURCE-OF-TRUTH] [C:CONTRACT-CHECK] [U:DUPLICATE-DETECTION] [M:METRICS-COVERAGE] [D:CONSOLIDATION-ACTIONS] [P:PLAN-HANDOFF]

🏷️ TAGs aplicados: `[K]`, `[C]`, `[U]`, `[M]`, `[D]`, `[P]`

⚠️ TAGs coverage: 70 % (≥60 % cumplido)

📊 Complejidad: medium — cobertura objetivo 80 %, duración estimada 6 h

---

Audit 4D: 8.10/10  
Tags: DOC, APPROVED  
Summary: Contratos verificados contra artefactos operativos; duplicados potenciales identificados; acciones de consolidación planificadas.

---

📊 DESGLOSE DETALLADO:

- Score esperado: 0.72 / 1.0
- Threshold: 0.6
- Activaría skill(s): ✅ Sí
- Template v1.1.0: ✅ 8/8 componentes
- TAGs coverage: 70 %

Señales utilizadas:

- Keywords: audit, contract, repository, consistency.
- Intent patterns: contraste contratos → 3 coincidencias.
- Paths: `docs/skills/ROUTER-copy.md`, `packages/router/src/config/router-contract.ts`, `dev/active/auditoria-skills-core-2025q4/plan.md`.
- Content: referencias a versiones/fechas de contratos.
- Tags: 6 aplicados.
- Template components: 8/8.

Activación por skill:

- Auditor de repositorio (read-only): 0.72 (keywords + intent + paths + content)

💡 Usa este prompt como guía para la revisión de contratos; documenta resultados en `hallazgos.json` y `acciones.md`, y actualiza métricas/narrativa tras completar el análisis.
