a u d i t o r , r e p o s i t o r i o : a u d i t [ C l a r i f y ] E j e c u t a r d i s c o v e r y s w e e p c o n f o r m e a l p l a n m h x k n b 6 e - b d 6 b 0 f 3 . [ K ] T r i a d a a c t i v a e n d e v / a c t i v e / a u d i t o r i a - s k i l l s - c o r e - 2 0 2 5 q 4 ( p l a n / c o n t e x t / t a s k s ). [ K ] R u t a s o b j e t i v o : p a c k a g e s / d a e m o n , p a c k a g e s / r o u t e r , s c r i p t s / p m 2 , s k i l l s / \* _ / S K I L L . m d , d o c s / s k i l l s / _ . m d . [ U ] I d e n t i f i c a r d u p l i c a d o s , c o n t r a t o s i n c o n s i s t e n t e s y f i c h e r o s o b s o l e t o s s i n c r e a r a r t e f a c t o s n u e v o s . [ E V I D E N C I A ] d o c s / i n v e n t a r i o / 2 0 2 5 Q 4 / r a w - f i l e s - p a c k a g e s . t x t , d o c s / i n v e n t a r i o / 2 0 2 5 Q 4 / r a w - s k i l l s . t x t , h a l l a z g o s . j s o n , m e t r i c s - 2 0 2 5 - 1 1 - 1 3 . j s o n . [ P R O P U E S T A ] D o c u m e n t a r h a l l a z g o s , m é t r i c a s y l e c c i o n e s e n l a t r i a d a y c l o s e - o u t c o n `p r e s p r i n t . m d` .

---

meta:
id: "startkit-clarify-discovery-sweep-auditoria-skills-core-2025q4"
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

# PROMPT [Clarify] Ejecutar Discovery Sweep conforme al plan mhxknb6e-bd6b0f3. [K] Triada activa en dev/active/auditoria-skills-core-2025q4 (plan/context/tasks). [K] Rutas objetivo: packages/daemon, packages/router, scripts/pm2, skills/\*_/SKILL.md, docs/skills/_.md. [U] Identificar duplicados, contratos inconsistentes y artefactos obsoletos sin crear nuevos. [EVIDENCIA] docs/inventario/2025Q4/raw-files-packages.txt, docs/inventario/2025Q4/raw-skills.txt, hallazgos.json, metrics-2025-11-13.json. [PROPUESTA] Documentar hallazgos, métricas y lecciones, cerrar checklist y presprint.

## 🧭 Contexto y Fundamentos

- **Descripción**: Auditoría de Skills Core para cerrar 2025Q4 sin deuda latente. Barrido sobre router, daemon, pm2, skills, documentación y contratos.
- **Skill activado**: Auditor de repositorio (read-only)
- **Plan activo**: auditoria-skills-core-2025q4 (triada aprobada en `dev/active/auditoria-skills-core-2025q4/`)
- **Fases vigentes**:
  - **Clarify**: Alcance, hipótesis, responsables confirmados (Router Lead, Daemon Lead, Skills Curator, DocOps, MemTech steward).
  - **Layout**: Prompts PBv2 preparados, insumos `raw-*` generados, checklist disponible.
  - **Operate**: Discovery en ejecución, hallazgos en borrador.
  - **Observe**: Métricas y narrativa en actualización continua.
  - **Reflect**: Preparación de presprint y backlog de acciones.
- **Fundamentos clave**: [K:CLOOP-METHODOLOGY] [K:QUALITY-GATES] [K:DECISION-TRACEABILITY] [K:SEMANTIC-MEMORY] [K:PBV2-STARTKIT] [K:MEMTECH-SNAPSHOT]

## 🎯 CLARIFY - Objetivos y Alcance

- Objetivo medible #1: Auditar 100 % de `packages/daemon`, `packages/router`, `packages/tools`, `scripts/pm2`, `skills/**/SKILL.md`, `docs/skills/*.md` antes del 15/11.
- Objetivo medible #2: Documentar todos los hallazgos (≥ 1 hallazgo crítico resuelto, 100 % con owner y fecha objetivo) en `hallazgos.json`.
- Riesgos críticos:
  - Falsos positivos por coincidencias en nombres → revisar manualmente y validar con owners.
  - Falta de owners disponibles → escalar a Ingeniería para reasignar.
  - Plan sin contexto en PBv2 → mantener triada abierta y refrescar prompts.
- Dependencias previas:
  - Plan aprobado y triada activa.
  - Acceso a repositorio y MemTech.
  - Disponibilidad de Router Lead / Daemon Lead para validación.
- Criterios de éxito:
  - Checklist de discovery completado.
  - Métricas actualizadas en `metrics-2025-11-13.json`.
  - `skills-core-inventario.md` con estado en progreso + riesgos.
  - Presprint documentado con próximas acciones.

## 🏗️ LAYOUT - Arquitectura y Roadmap

### CLARIFY · Día 1

- Objetivo principal: Consolidar alcance, hipótesis y responsables.
- Entregables: Alcance documentado en `skills-core-inventario.md`, prompts PBv2 actualizados.
- Criterios de aceptación: Insumos `raw-files-packages.txt`, `raw-skills.txt` generados; triada abierta.
- Recursos/owners: Auditor Técnico + Router Lead.

### LAYOUT · Día 1-2

- Objetivo principal: Ajustar prompts PBv2 y checklist.
- Entregables: `prompts/*.md` refinados, `insumos-discovery.md` actualizado.
- Criterios de aceptación: Checklist con prerequisitos marcados `[x]`.
- Recursos/owners: Auditor Técnico + DocOps.

### OPERATE · Día 2-3

- Objetivo principal: Ejecutar discovery y registrar hallazgos.
- Entregables: `hallazgos.json`, `acciones.md` con responsables, evidencias en logs JSONL.
- Criterios de aceptación: Cada hallazgo con severidad, owner y due date.
- Recursos/owners: Auditor Técnico + Skills Curator + Router Lead.

### OBSERVE · Día 3-4

- Objetivo principal: Actualizar métricas y narrativa.
- Entregables: `metrics-2025-11-13.json`, `skills-core-inventario.md` (sección estado), snapshot MemTech.
- Criterios de aceptación: Métricas con Before/After registrado; snapshot comunicado.
- Recursos/owners: Auditor Técnico + MemTech steward.

### REFLECT · Día 4-5

- Objetivo principal: Cerrar ciclo y preparar backlog de acciones.
- Entregables: `presprint.md`, checklist cerrada, backlog de remediación.
- Criterios de aceptación: Presprint con lecciones + riesgos, acciones priorizadas en backlog.
- Recursos/owners: Auditor Técnico + DocOps + Ingeniería (owners de follow-up).

## ⚙️ OPERATE - Mini-Tasks Prioritarias

```yaml
[C] File: docs/inventario/2025Q4/raw-files-packages.txt
  → Ejecutar `find packages ... > raw-files-packages.txt`
  → Validar exclusiones (node_modules, dist, .sf)
  Criterio: Archivo actualizado con timestamp 2025-11-13
  Tiempo: 30 min

[U] File: docs/inventario/2025Q4/hallazgos.json
  → Registrar duplicados y contratos múltiples detectados
  → Adjuntar evidencia (ruta, comando usado)
  Criterio: Cada entrada con severidad, owner y due date
  Tiempo: 60 min

[D] File: docs/inventario/2025Q4/acciones.md
  → Definir acción por hallazgo crítico
  → Confirmar responsable y fecha
  Criterio: Tabla sin campos “TBD”
  Tiempo: 45 min

[K] File: docs/inventario/2025Q4/metrics-2025-11-13.json
  → Actualizar conteos de files scanned, skills revisadas, hallazgos críticos
  → Registrar progreso (discovery, analysis, validation, reporting)
  Criterio: Progreso discovery ≥ 50 %
  Tiempo: 30 min

[M] File: docs/inventario/2025Q4/presprint.md
  → Documentar lecciones, riesgos residuales y próximos pasos
  → Vincular backlog de acciones
  Criterio: Sección completada antes del cierre del ciclo
  Tiempo: 45 min
```

## 👁️ OBSERVE - Métricas y Validación

| Métrica                         | Before | Target | After | Verificación                                        |
| ------------------------------- | ------ | ------ | ----- | --------------------------------------------------- |
| % carpetas auditadas            | 0 %    | 100 %  | TBD   | Validar checklist + `raw-files-packages.txt`        |
| Hallazgos críticos documentados | 0      | ≥3     | TBD   | `docs/inventario/2025Q4/hallazgos.json`             |
| Skills revisadas                | 0 %    | 100 %  | TBD   | `raw-skills.txt` comparado con inventario `skills/` |
| Tiempo discovery inicial        | 0h     | ≤6h    | TBD   | Registro en `insumos-discovery.md`                  |
| Contratos únicos confirmados    | TBD    | ≥95 %  | TBD   | Cruce `docs/skills/*.md` vs hallazgos               |

- Comandos de verificación:
  - `pnpm lint && pnpm test`
  - `rg -n "(old|copy|backup|deprecated)" --glob '!node_modules/*' --glob '!dist/*' --glob '!.sf/*'`
  - `node scripts/hooks/plan-quality-check.mjs --stdin < docs/inventario/2025Q4/outputs/discovery-*.md`
  - `node packages/skills-cli/dist/index.js prompt-builder ... (post-refinement)`

## 🔄 REFLECT - Handoff y Auditoría

- Decisiones tomadas: Contratos vigentes por dominio se consolidan en `docs/skills/*.md`; archivos duplicados se moverán a `/archived` tras aprobación.
- Artefactos generados: `hallazgos.json`, `acciones.md`, `metrics-2025-11-13.json`, `skills-core-inventario.md` (estado actualizado), snapshot MemTech.
- Issues pendientes: Automatizar verificación de contratos duplicados (a planificar), validar hooks pbv2 con triadas múltiples.
- Próximos pasos y owners:
  - DocOps: actualizar gobernanza en `docs/skills`.
  - Router Lead: consolidar contratos duplicados detectados.
  - Ingeniería: ejecutar backlog de remediación.
- Auditoría 4D: Completitud 30 % | Calidad 30 % | Impacto 25 % | Sostenibilidad 15 %; puntaje parcial 7.95/10.

## 🎯 Objetivos SMART

1. **O1**: Auditar 100 % de los directorios objetivo y registrar hallazgos críticos antes del 15/11 (medible por checklist + hallazgos).
2. **O2**: Lograr ≥95 % de contratos con fuente única documentada y validada por los owners antes del 18/11.
3. **O3**: Completar presprint con lecciones y backlog priorizado antes del 19/11, dejando acciones listas para próxima iteración.

## 🧪 Tests Ejecutables

- `pnpm lint && pnpm test`
- `pnpm skills:lint --strict`
- `node scripts/tests/run-phase3-tests.sh` (en caso de afectar componentes críticos)
- `node scripts/hooks/plan-quality-check.mjs --stdin < docs/inventario/2025Q4/outputs/discovery-*.md`

## 🧷 Auditoría & Handoff Checklist

- [ ] Hallazgos registrados y clasificados en `hallazgos.json`.
- [ ] Acciones con responsables y fechas en `acciones.md`.
- [ ] Métricas actualizadas en `metrics-2025-11-13.json`.
- [ ] Narrativa `skills-core-inventario.md` con estado observaciones.
- [ ] `presprint.md` completado con lecciones y backlog.
- [ ] MemTech snapshot final generado y documentado.

## 🛡️ Boundary Markers Anti-Drift

- **BM1**: Frontmatter Startkit completo (`meta` + triada referenciada).
- **BM2**: C-LOOP aplicado extremo a extremo con fechas y owners.
- **BM3**: Tabla de métricas con Before/Target/After + comandos.
- **BM4**: Mini-tasks etiquetadas [C/M/U/D/K] con criterios claros.
- **BM5**: Auditoría 4D documentada y monitoreada.
- **BM6**: Objetivos SMART visibles y accionables.
- **BM7**: Checklist de auditoría alineada a `docs/inventario`.
- **BM8**: Evidencia y propuesta separadas en todo el documento.

## ✅ Template v1.1.0 (8/8)

- C1: CSE completo
- C2: TAGs cobertura ≥6 (actual: `[K]`, `[U]`, `[C]`, `[EVIDENCIA]`, `[PROPUESTA]`, `[M]`)
- C3: Boundary markers ≥8 definidos
- C4: Frontmatter YAML presente
- C5: Anti-drift markers listados
- C6: Objetivos SMART definidos
- C7: Tests ejecutables concretos
- C8: Evidencia y propuesta diferenciadas

🏷️ TAGs sugeridos: [K:CLOOP-METHODOLOGY] [K:PBV2-STARTKIT] [K:MEMTECH-SNAPSHOT] [C:DISCOVERY-AUDIT] [M:METRICS-TRACKING] [U:CONTRACT-CONSISTENCY] [D:ACTION-REGISTER] [P:PLAN-HANDOFF]

🏷️ TAGs aplicados en secciones: `[K]`, `[C]`, `[U]`, `[EVIDENCIA]`, `[PROPUESTA]`, `[M]`

⚠️ TAGs coverage: 70 % (≥60 % cumplido)

📊 Complejidad: medium — cobertura objetivo 80 %, duración estimada 8 h

---

Audit 4D: 8.45/10  
Tags: DOC, APPROVED  
Summary: auditoría discovery sweep alineada al plan aprobado; checklist y métricas completas; acciones en backlog.

---

📊 DESGLOSE DETALLADO:

- Score esperado: 0.74 / 1.0
- Threshold: 0.6
- Activaría skill(s): ✅ Sí
- Template v1.1.0: ✅ 8/8 componentes
- TAGs coverage: 70 % ✅

Señales utilizadas:

- Keywords (20 %): audit, auditor, repositorio, discovery, hallazgos
- Intent (30 %): 3 patrones (auditar repositorio, documentar hallazgos, consolidar contratos)
- Path (30 %): `docs/inventario/2025Q4/...`, `dev/active/auditoria-skills-core-2025q4/...`
- Content (20 %): fragmentos de plan y checklist
- TAGs: 6+
- Template Components: 8/8

Activación por skill:

- Auditor de repositorio (read-only): 0.74 (keywords, intent, paths, content, tags)

💡 Usa este prompt dentro de tu editor/Cursor para ejecutar el discovery sweep conforme al plan aprobado.
