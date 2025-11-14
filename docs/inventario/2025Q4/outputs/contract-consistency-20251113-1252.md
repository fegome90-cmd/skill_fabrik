INFO 2025-11-13T15:52:42.112Z Generando prompt optimizado para skill(s): Auditor de repositorio (read-only) (v2)

📝 PROMPT OPTIMIZADO:

repositorio: [Clarify] Verificar consistencia de los contratos ROUTER, DAEMON, SKILL-CONTRACT y NMLB según plan mhxknb6e-bd6b0f3. [K] Triada activa en dev/active/auditoria-skills-core-2025q4 (plan/context/tasks). [K] Fuentes oficiales: docs/skills/ROUTER.md, docs/skills/DAEMON.md, docs/skills/SKILL-CONTRACT.md, docs/skills/NMLB.md. [K] Artefactos operativos: packages/router/**, packages/daemon/**, skills/\*\*/SKILL.md. [U] Identificar duplicados o divergencias sin generar archivos nuevos. [EVIDENCIA] docs/inventario/2025Q4/raw-files-packages.txt, docs/inventario/2025Q4/outputs/discovery-20251113-filled.md. [PROPUESTA] Documentar riesgos en hallazgos.json y acciones en acciones.md.

---

meta:
id: "startkit-clarify-verificar-consistencia-de-los-contratos-router-daemo"
version: "1.0.0"
created_at: "2025-11-13"
base: "Auditor de repositorio (read-only)"
mode: "implementation"
anti_drift: true
architecture: "Auditor de repositorio (read-only)"
dependencies: ["Clarify", "Layout", "Operate", "Observe", "Reflect"]
target_coverage: 80
estimated_duration: "8h"
complexity: "medium"
innovation_level: "high"
plan_reference: "auditoria-skills-core-2025q4"

---

# PROMPT [Clarify] Verificar Consistencia De Los Contratos ROUTER, DAEMON, SKILL-CONTRACT Y NMLB Según Plan Mhxknb6e-bd6b0f3. [K] Triada Activa En Dev/active/auditoria-skills-core-2025q4 (plan/context/tasks). [K] Fuentes Oficiales: Docs/skills/ROUTER.md, Docs/skills/DAEMON.md, Docs/skills/SKILL-CONTRACT.md, Docs/skills/NMLB.md. [K] Artefactos Operativos: Packages/router/**, Packages/daemon/**, Skills/\*\*/SKILL.md. [U] Identificar Duplicados O Divergencias Sin Generar Archivos Nuevos. [EVIDENCIA] Docs/inventario/2025Q4/raw-files-packages.txt, Docs/inventario/2025Q4/outputs/discovery-20251113-filled.md. [PROPUESTA] Documentar Riesgos En Hallazgos.json Y Acciones En Acciones.md.

## 🧭 Contexto y Fundamentos

- **Descripción**: [Clarify] Verificar consistencia de los contratos ROUTER, DAEMON, SKILL-CONTRACT y NMLB según plan mhxknb6e-bd6b0f3. [K] Triada activa en dev/active/auditoria-skills-core-2025q4 (plan/context/tasks). [K] Fuentes oficiales: docs/skills/ROUTER.md, docs/skills/DAEMON.md, docs/skills/SKILL-CONTRACT.md, docs/skills/NMLB.md. [K] Artefactos operativos: packages/router/**, packages/daemon/**, skills/\*\*/SKILL.md. [U] Identificar duplicados o divergencias sin generar archivos nuevos. [EVIDENCIA] docs/inventario/2025Q4/raw-files-packages.txt, docs/inventario/2025Q4/outputs/discovery-20251113-filled.md. [PROPUESTA] Documentar riesgos en hallazgos.json y acciones en acciones.md.
- **Skill activado**: Auditor de repositorio (read-only)
- **Plan activo**: Sin plan aprobado (usar planning gate)
- **Fases vigentes**:
- **Fase 1 – Clarify:** objetivos, dependencias y entregables
- **Fase 2 – Layout:** objetivos, dependencias y entregables
- **Fase 3 – Operate:** objetivos, dependencias y entregables
- **Fase 4 – Observe:** objetivos, dependencias y entregables
- **Fase 5 – Reflect:** objetivos, dependencias y entregables
- **Fundamentos clave**: [K:CLOOP-METHODOLOGY] [K:QUALITY-GATES] [K:DECISION-TRACEABILITY] [K:SEMANTIC-MEMORY]

## 🎯 CLARIFY - Objetivos y Alcance

- Objetivo medible #1:
- Objetivo medible #2:
- Riesgos críticos:
- Dependencias previas:
- Criterios de éxito:

## 🏗️ LAYOUT - Arquitectura y Roadmap

### CLARIFY · Semana 1

- Objetivo principal:
- Entregables:
- Criterios de aceptación:
- Recursos/owners:

### LAYOUT · Semana 2

- Objetivo principal:
- Entregables:
- Criterios de aceptación:
- Recursos/owners:

### OPERATE · Semana 3

- Objetivo principal:
- Entregables:
- Criterios de aceptación:
- Recursos/owners:

### OBSERVE · Semana 4

- Objetivo principal:
- Entregables:
- Criterios de aceptación:
- Recursos/owners:

### REFLECT · Semana 5

- Objetivo principal:
- Entregables:
- Criterios de aceptación:
- Recursos/owners:

## ⚙️ OPERATE - Mini-Tasks Prioritarias

#### Mini-Task T1.1: Definir acción crítica

```yaml
[C] File: path/al/archivo.ts
  → Paso 1 detallado
  → Paso 2 validado
  Criterio: Resultado esperado + comando de verificación
  Tiempo: 30 min
```

## 👁️ OBSERVE - Métricas y Validación

| Métrica    | Before | Target | After | Verificación                    |
| ---------- | ------ | ------ | ----- | ------------------------------- |
| Coverage   | 0%     | 80%    | TBD   | `pnpm test -- --coverage`       |
| Latency    | 200ms  | 80ms   | TBD   | `node scripts/test-latency.mjs` |
| Incidentes | 5      | 0      | TBD   | `scripts/alerts-report.mjs`     |

- Comandos de verificación:
  - `pnpm lint && pnpm test`
  - `node scripts/hooks/plan-quality-check.mjs --stdin`

## 🔄 REFLECT - Handoff y Auditoría

- Decisiones tomadas (con rationale):
- Artefactos generados (archivo, tipo, validación):
- Issues pendientes (severity, impacto, próximos pasos):
- Próximos pasos y owners:
- Auditoría 4D (Completitud 30% | Calidad 30% | Impacto 25% | Sostenibilidad 15%):

## 🎯 Objetivos SMART

1. **O1**: Específico | Medible | Alcanzable | Relevante | Temporal
2. **O2**: ...
3. **O3**: ...

## 🧪 Tests Ejecutables

- `pnpm test:phase3-quick`
- `node scripts/tests/run-phase3-tests.sh`
- `pnpm skills:lint --strict`

## 🧷 Auditoría & Handoff Checklist

- Documentar contexto crítico, decisiones y owners
- Adjuntar tabla de artefactos y métricas
- Guardar reporte en handoff/ y registrar en memoria

## 🛡️ Boundary Markers Anti-Drift

- **BM1**: Frontmatter YAML completo (id/version/fechas/coverage)
- **BM2**: C-LOOP aplicado extremo a extremo
- **BM3**: Tabla de métricas BEFORE/AFTER con comandos ejecutables
- **BM4**: Mini-tasks etiquetadas [C/M/U/D/K]
- **BM5**: Auditoría 4D con ponderaciones (30/30/25/15)
- **BM6**: Objetivos SMART visibles
- **BM7**: Lista de decisiones y handoff documentado
- **BM8**: Tests y validaciones obligatorias

## ✅ Template v1.1.0 (8/8)

- C1: CSE completo
- C2: TAGs cobertura >= 6
- C3: Boundary markers (≥8)
- C4: Frontmatter YAML
- C5: Anti-drift markers
- C6: Objetivos SMART
- C7: Tests ejecutables
- C8: Evidencia vs Propuesta separadas

🏷️ TAGs sugeridos: [U:PLANNING-WORKFLOW] [C:CLOOP-INTEGRATION]

🏷️ TAGs aplicados:
[U:PLANNING-WORKFLOW]
[C:CLOOP-INTEGRATION]

💡 Asegúrate de tener estos archivos abiertos en tu editor para maximizar la activación del skill.

⚠️ TAGs coverage: 20% (recomendado: ≥60%)

📊 Complejidad: medium — cobertura 80%, duración 8h

---

Audit 4D: 7.95/10
Tags: DOC, APPROVED
Summary: repositorio: [Clarify] Verificar consistencia de los contratos ROUTER, DAEMON, SKILL-CONTRACT y NMLB según plan mhxknb6e-bd6b0f3. [K] Triada activa en dev/active/auditoria-skills-core-2025q4 (plan/context/tasks)...

📊 DESGLOSE DETALLADO:

Score esperado: 0.40 / 1.0
Threshold: 0.6
Activaría skill(s): ❌ NO
Template v1.1.0: ✅ 8/8 componentes
TAGs coverage: 20% ⚠️ (recomendado: ≥60%)

Señales utilizadas:
Keywords (20%): ✓ audit, auditor, repositorio
Intent (30%): ✓ 2 pattern(s)
Path (30%): ✗
Content (20%): ✗
TAGs: ✓ 6 tags aplicados
Template Components: ✓ 8/8

Activación por skill:
• Auditor de repositorio (read-only): 0.20 (keywords: audit, auditor, repositorio)

💡 Copia el prompt generado y úsalo en tu editor/Cursor

⚠️ Score bajo (<0.6). Considera:
• Usar --include-files para detectar archivos reales
• Usar --include-template para estructura completa
• Usar --include-tags para mejorar coverage
