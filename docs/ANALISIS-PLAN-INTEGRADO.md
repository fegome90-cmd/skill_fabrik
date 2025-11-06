# ANÁLISIS PLAN INTEGRADO

## Auditoría Final 4D: Plan Post-Estudio Operacional

- **Score 4D Final:** 8.27/10 (PASS)
- **Gates críticos cumplidos:**
  - [x] Plan aprobado
  - [x] Tríada dev-docs generada
  - [x] Skills activados por heurística, Evidence/KPI exportado
  - [x] Handoff v2.0 y PAE validados
  - [x] Lecciones aprendidas documentadas
- **Fortalezas:**
  - Proceso reproducible, integraciones y hooks sólidas
  - Cobertura de plantillas y tagging > 70%
  - Entregables y evidencia listos para transición
- **Áreas de mejora:**
  - Automatizar aún más registro KPI y auditorías
  - Mejorar mensajes de error/manual hand-off tracking
- **Conclusión final:**
  - Plan finalizado y listo para escalar/repetir. Todos los artefactos, evidencia y aprendizajes documentados y entregados. Usar este baseline en nuevos ciclos garantiza trazabilidad y mínima fricción en integración skills.

# Análisis y Plan Integrado: Cursor‑first → Editor‑Agnóstico (Postgres‑first)

**Fecha**: 2025-10-29  
**Metodología**: CLOOP (Clarify → Layout → Operate → Observe → Reflect)

---

## 1. CLARIFY - Análisis Comparativo

### 1.1 Plan Propuesto (plan.md + task.md)

**Arquitectura propuesta (actualizada)**:
- **Fase 0 (Glue Cursor‑first, inmediato)**: atajos/Command Palette en Cursor/VS Code que llaman al CLI `sf` (sin daemon). 
  - Nuevos subcomandos CLI: `sf skills activate --json`, `sf skills execute --dry-run --json`.
  - Tríada `plan.md/context.md/tasks.md` como contrato a la vista.
- **Daemon SFP v0.x** con endpoints REST: `/activate`, `/execute`, `/list`, `/validate`, `/health` (paridad con CLI y hooks).
- **Policy Engine** deny‑by‑default con `allowed-tools` por skill (en frontmatter) y auditoría.
- **Tríada CLI operativa**: `plan new|append|commit`, `context refresh`, `task add|check` con KPIs.
- **Storage Postgres‑first + FS fallback**: PostgreSQL como L2 canónico; FS (L0) como fuente de verdad; Redis/Chroma opcionales y desactivados por defecto.
- **Tests E2E** multi‑editor (CLI + VSCode + Neovim) y validación de contratos JSON Schema.
- **Métricas**: p95 < 50 ms en `/activate` y evidencias en `obs/kpi/events.jsonl`.

**Ruta propuesta**: F0 (Glue) → F1 (SFP + Schemas) → F2 (Policy) → F3 (Storage) → F4 (Runner) → F5 (Tríada CLI) → F6 (E2E)

### 1.2 Sistema Actual (skills-fabrik)

**Lo que YA existe**:
- ✅ Hooks directos (pre-invoke, stop) sin daemon
- ✅ Heurística multi-señal (Keywords 20% + Intent 30% + Path 30% + Content 20%)
- ✅ Plan lifecycle básico (`skills plan create|save|approve`)
- ✅ Guardrails multi-nivel (suggest/warn/block)
- ✅ MemTech L0/L1/L2 (Redis/PostgreSQL/ChromaDB legacy)
- ✅ KPIs básicos (`obs/kpi/events.jsonl`)
- ✅ Stop hook completo (prettier, typecheck, hints, auto-resolver)

**Gaps identificados**:
- ❌ No hay Daemon ni Protocolo SFP (solo hooks + CLI).
- ❌ No hay Policy Engine granular (`allowed-tools` no aplicado).
- ❌ No hay Runner estándar para ejecutar skills (solo activación/inyección).
- ❌ Storage sin estrategia Postgres‑first con Redis deshabilitable de forma silenciosa.
- ❌ Tests de contrato y E2E incompletos.

### 1.3 Estrategia de Integración

**Recomendación**: Glue hoy + Daemon wrapper + Postgres‑first

- Mantener hooks actuales (`pre-invoke` y `stop`).
- Añadir Glue inmediato con CLI (`sf skills activate/execute`) para productividad en Cursor.
- Implementar Daemon SFP como wrapper de hooks/routers para unificar CLI y editores.
- Adoptar PostgreSQL local como base (L2); FS como L0; desactivar Redis/Chroma por defecto para evitar ruido; habilitar explícitamente cuando existan.

---

## 2. LAYOUT - Plan Integrado

### 2.1 Arquitectura Híbrida

```
┌─────────────────────────────────────┐
│   Editor (CLI/VSCode/Neovim)       │
└───────────────┬─────────────────────┘
                │
        ┌───────▼──────────┐
        │  Daemon SFP      │  ← NUEVO
        │  (endpoints)     │
        └───────┬──────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼──────┐        ┌───────▼──────┐
│ Hooks    │        │ Policy Engine │  ← NUEVO
│ (actual) │        │ (granular)   │
└───┬──────┘        └───────┬──────┘
    │                       │
┌───▼───────────────────────▼──────┐
│  Router (detectors, guardrails) │  ← ACTUAL
└───┬─────────────────────────────┘
    │
┌───▼────────────────────────────┐
│  Storage (Postgres‑first)      │
│  - PostgreSQL (L2) ✔           │
│  - FS (L0, fuente de verdad) ✔ │
│  - Redis (L1, opcional)        │
│  - Chroma (L3, opcional)       │
└────────────────────────────────┘
```

### 2.2 Plan de Trabajo Integrado (reordenado)

**FASE 0: Glue Cursor‑first (inmediato)**
- Alias `sf` → `node packages/skills-cli/dist/index.js`.
- Nuevos comandos: `sf skills activate --intent "…" --open "…" --content "…" --json`; `sf skills execute --skill-id <id|auto> --dry-run --json`.
- `.vscode/tasks.json` y `keybindings.json` para llamar al CLI desde editor; tríada fijada en tabs.
- Gate: “activate → execute --dry-run → plan commit” desde editor; `events.jsonl` crece; latencia CLI < 50 ms.

**FASE 1: SFP v0.x (Daemon + Schemas)**
- Crear `packages/sfp-daemon` con `/activate`, `/execute`, `/health`, `/validate`, `/list`.
- Publicar `schemas/activate.schema.json` y `schemas/execute.schema.json`; validar requests/responses.
- Wrapper `/activate` → `userPromptSubmitHook()`; `/execute` → runner (dry‑run inicialmente).
- DoD: p95 `/activate` < 50 ms; paridad CLI/editor; validación por JSON Schema en CI.

**FASE 2: Policy Engine (allowed-tools)**
- Middleware deny‑by‑default; lectura de `allowed-tools` desde frontmatter de SKILL.md.
- Mapeo a adapters locales (fs, git, pm2, metrics, memtech); confirmaciones para operaciones peligrosas.
- Auditoría a `obs/kpi/events.jsonl` con `evidence_id`.
- DoD: bloqueo efectivo de herramientas no permitidas + eventos registrados.

**FASE 3: Storage (Postgres‑first + FS fallback)**
- `.env` con `PG_HOST/PG_PORT/PG_USER/PG_DATABASE`; usar `ensurePostgresTables()`.
- Deshabilitar Redis/Chroma por defecto; banderas `MEMTECH_REDIS_ENABLED=false`, `MEMTECH_CHROMA_ENABLED=false`.
- Fallback silencioso a FS (L0) cuando no hay Postgres; mantener evidencias en archivos.
- DoD: sistema funciona sin Redis/Chroma; con Postgres local responde sin ruido.

**FASE 4: Runner Estándar (ejecución de skills)**
- Resolver `skill_id` (auto/manual), evaluar `scripts.run` y `allowed-tools`; soportar `--dry-run`.
- DoD: ejecutar un skill ejemplo en `dry-run` mostrando `planned_steps` y latencias.

**FASE 5: Tríada CLI Operativa**
- Mejoras: `plan new|append|commit`, `context refresh`, `task add|check` con escritura de KPIs.
- DoD: cada ejecución actualiza la tríada + `events.jsonl`.

**FASE 6: Tests E2E Multi‑editor**
- Fixtures (Cursor/VSCode/Neovim) + asserts sobre activación/ejecución/policy.
- DoD: suite E2E pasa local sin servicios externos.

---

## 3. OPERATE - Prioridades y Gates

- P0: FASE 0 (Glue) → productividad inmediata sin riesgos.
- P1: FASE 1 (SFP + Schemas) → contrato estable para ser editor‑agnóstico.
- P2: FASE 2 (Policy) → seguridad antes de habilitar ejecución real.
- P3: FASE 3 (Storage Postgres‑first) → resiliencia sin ruido.
- P4: FASE 4–6 (Runner, Tríada avanzada, E2E) → maduración.

Gates por fase:
- F0 Gate: “activate/execute/commit” desde editor, latencia < 50 ms, `events.jsonl` OK.
- F1 Gate: `/activate` p95 < 50 ms, validación JSON Schema, paridad CLI/editor.
- F2 Gate: bloqueos “allowed-tools” con auditoría.
- F3 Gate: operación sin Redis/Chroma y con Postgres local; sin reconexiones ruidosas.
- F4–F6 Gates: runner dry‑run funcional; tríada escribe KPIs; E2E PASS.

---

## 4. OBSERVE - Métricas de Integración

- Compatibilidad: hooks actuales siguen funcionando.
- Paridad: etiquetas idénticas CLI vs editor.
- Latencia: `/activate` p95 < 50 ms.
- Seguridad: policy bloquea herramientas no permitidas (evidencia con `evidence_id`).
- Trazabilidad: `events.jsonl` con todos los eventos (activación, ejecución, policy).

---

## 5. REFLECT - Decisiones y Riesgos

### Decisiones

1. Daemon como wrapper (no reemplaza hooks); paridad CLI/editor.
2. Policy en middleware con `allowed-tools` deny‑by‑default y confirmaciones para operaciones peligrosas.
3. Postgres‑first + FS como fuente de verdad; Redis/Chroma opcionales/deshabilitados por defecto.
4. Contratos SFP (JSON Schema) versionados y validados en CI.

### Riesgos y Mitigaciones

- Reconexiones ruidosas (Redis/Chroma) → desactivar por defecto; fallback silencioso.
- Coste `tsc` en stop hook → modo `--fast` y cache por paquete.
- Divergencia CLI/editor → pruebas de paridad + contratos validados.

---

## 6. Uso de Skills durante Análisis

**Skills activadas**: 0 (análisis documental)

**Skills que podrían haberse activado**:
- `plan-architect`: Si hubiera prompt "crear plan"
- `backend-dev-guidelines`: Si hubiera prompt "crear endpoint" con archivos backend

**Razón de no activación**: Análisis es actividad de documentación/revisión, no requiere activación de skills.

---

## 7. Acciones Inmediatas (1–2 días)

- Agregar subcomandos CLI:
  - `sf skills activate --intent "…" --open "…" --content "…" --json`
  - `sf skills execute --skill-id <id|auto> --dry-run --json`
- Publicar `schemas/activate.schema.json` y `schemas/execute.schema.json`; hook de validación en CI.
- Configurar Postgres local en `.env` y llamar `ensurePostgresTables()`; desactivar Redis/Chroma por defecto.
- Añadir `.vscode/tasks.json` y `keybindings.json` para Glue Cursor‑first.

