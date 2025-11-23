# Informe Técnico – Flujo de Activación de Skills vía CLI (Discovery Sweep)

**Fecha:** 2025-11-13  
**Contexto:** Auditoría de Skills Core centrada en el flujo de activación por CLI (Prompt Builder v2), utilizando el caso `Discovery Sweep` como guía.  
**Alcance:** Observacional; no se aplicaron cambios en el repositorio. Se documentaron hallazgos, acciones sugeridas y limitaciones del sistema.

---

## 1. Resumen Ejecutivo

- **Objetivo:** validar el proceso de activación de skills vía CLI, registrando evidencias y hallazgos sin modificar artefactos.
- **Acciones ejecutadas:** preparación de entorno, generación de insumos (`find`, `rg`), creación de prompts PBv2 (`discovery-20251113-filled.md`, `contract-consistency-20251113-filled.md`), documentación de hallazgos (F-001 a F-004) y actualización de métricas.
- **Hallazgos clave:**
  - Ecosistema pm2 duplicado (`router-ecosystem-old.cjs`).
  - Contrato ROUTER duplicado (`docs/skills/ROUTER-copy.md`) y contratos primarios inexistentes en `docs/skills/`.
  - Skill obsoleto (`backend-dev-old/SKILL.md`).
- **Estado:** auditoría totalmente documentada; ninguna acción correctiva aplicada aún.

---

## 2. Flujo de activación observado

### 2.1 Preparación del entorno

```bash
cd /Users/felipe/Developer/skills-fabrik
pnpm install --frozen-lockfile
pnpm -w build
node packages/skills-cli/dist/index.js --help
```

### 2.2 Generación de insumos

```bash
find packages ... | tee docs/inventario/2025Q4/raw-files-packages.txt
find skills ...   | tee docs/inventario/2025Q4/raw-skills.txt
rg -n "(old|copy|backup|deprecated)" ... | tee docs/inventario/2025Q4/rg-content-*.txt
rg --files -g '*old*' ...                | tee docs/inventario/2025Q4/rg-filenames-*.txt
```

### 2.3 Prompt PBv2 – Discovery

```bash
node packages/skills-cli/dist/index.js prompt-builder \
  "Auditor de repositorio (read-only)" \
  "[Clarify] Ejecutar discovery sweep conforme al plan mhxknb6e-bd6b0f3..." \
  --v2 --include-template --include-tags --include-files --include-plan-context --show-score \
  > docs/inventario/2025Q4/outputs/discovery-20251113-1219.md
```

- Resultado enriquecido manualmente → `discovery-20251113-filled.md`.
- Registro de hallazgos y métricas en `hallazgos.json`, `acciones.md`, `metrics-2025-11-13.json`.

### 2.4 Prompt PBv2 – Contratos

```bash
node packages/skills-cli/dist/index.js prompt-builder \
  "Auditor de repositorio (read-only)" \
  "[Clarify] Verificar consistencia de contratos según plan mhxknb6e-bd6b0f3..." \
  --v2 --include-template --include-tags --include-files --include-plan-context --show-score \
  > docs/inventario/2025Q4/outputs/contract-consistency-20251113-1258.md
```

- Resultado completado → `contract-consistency-20251113-filled.md`.
- Score esperado 0.72 tras añadir contexto manual y triada (`plan.md`, `context.md`, `tasks.md`).

### 2.5 Registro de evidencias

- **Hallazgos:** F-001 (pm2 duplicado), F-002 (contrato ROUTER copy), F-003 (skill obsoleto), F-004 (contratos dispersos).
- **Acciones:** asignadas en `acciones.md` (Router Lead, DocOps, Skills Curator).
- **Métricas:** `metrics-2025-11-13.json` (files_scanned=524, skills_reviewed=68, contracts_reviewed=7, hallazgos críticos=1).
- **Narrativa:** actualizada en `skills-core-inventario.md` e `insumos-discovery.md`.
- **Triada plan:** `dev/active/auditoria-skills-core-2025q4/{plan.md, context.md, tasks.md}` (estado APPROVED).
- **Logs:** se sugiere capturar en `logs/auditoria-YYYYMMDD.jsonl` (pendiente).
- **MemTech:** se recomienda `node packages/skills-cli/dist/index.js plan save mhxknb6e-bd6b0f3` sólo para snapshot (opcional).

---

## 3. Hallazgos registrados

| ID    | Ruta / Dominio                                               | Severidad | Descripción                                                                    | Owner          | Estado  |
| ----- | ------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------ | -------------- | ------- |
| F-001 | `packages/router/scripts/pm2/router-ecosystem-old.cjs` (pm2) | P1        | Ecosistema pm2 duplicado                                                       | Router Lead    | Pending |
| F-002 | `docs/skills/ROUTER-copy.md` (docs)                          | P1        | Contrato duplicado desactualizado                                              | DocOps         | Pending |
| F-003 | `skills/guidelines/backend-dev-old/SKILL.md` (skills)        | P2        | Skill obsoleto (sufijo `-old`)                                                 | Skills Curator | Pending |
| F-004 | `docs/skills/` (docs)                                        | P0        | Contratos oficiales ausentes; versiones dispersas (`docs/API/ROUTER.md`, etc.) | DocOps         | Pending |

> Nota: Se documentaron pero no se ejecutaron acciones correctivas.

---

## 4. Limitaciones del proceso

- Plantilla Startkit PBv2 requiere llenado manual (sin autocompletar objetivos, riesgos, métricas).
- El reconocimiento del plan depende de abrir `plan.md/context.md/tasks.md` en el editor; en flujos sin IDE, hay que inyectar rutas manualmente.
- El CLI global (`skills-cli`) falla por dependencias faltantes; ejecutar siempre `node packages/skills-cli/dist/index.js ...` desde el repositorio.
- El comando `--files` sugerido por PBv2 no existe; se usa `--include-files` y se listan rutas en la descripción.
- Contratos oficiales están fuera de `docs/skills/`; es necesario documentar su reubicación.
- Logs (`logs/auditoria-YYYYMMDD.jsonl`) y snapshots MemTech son recomendados pero opcionales (documentación manual).

---

## 5. Acciones recomendadas (cuando se autorice ejecución)

1. Consolidar contratos en `docs/skills/` siguiendo la política single source of truth.
2. Eliminar o archivar artefactos duplicados (`router-ecosystem-old.cjs`, `ROUTER-copy.md`).
3. Retirar skills obsoletos (`backend-dev-old/SKILL.md`) o moverlos a `/archived`.
4. Automatizar verificaciones CLI/CI (auditoría de contratos, duplicados, skills sin contrato).
5. Formalizar logs y snapshots en MemTech para preservar evidencia.

---

## 6. Conclusión

El proceso de activación vía CLI (Prompt Builder v2) se validó como herramienta para documentar auditorías y generar prompts enriquecidos, pero requiere intervención manual y depende del contexto proporcionado por el IDE. Ningún skill real se ejecutó ni se modificaron artefactos; toda la información se centralizó en `docs/inventario/2025Q4/`. Los hallazgos (F-001–F-004) quedan listos para remediación cuando se tomen decisiones operativas.
