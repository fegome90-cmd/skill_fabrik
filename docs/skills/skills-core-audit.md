# Skills Core – Informe de Auditoría Técnica

Fecha: 2025-11-13  
Responsable: Auditoría conceptual (GPT-5 Codex)

## 1. Inventario resumido

| Área | Ruta | Observaciones |
| --- | --- | --- |
| Daemon | `packages/daemon` | Código y pruebas extensas; presencia de `src/app.ts.backup` y `src/persistence/backup.ts`. |
| Router | `packages/router` | Código activo; archivos `src/detectors.ts.backup` y `jest.config.js.backup` requieren decisión. |
| Shared / Discovery | `packages/shared` | Servicio de descubrimiento incluido en pm2 actual, definir si forma parte del alcance Skills Core. |
| CLI | `packages/skills-cli` | Contiene `dist.backup.1762011814/` y artefactos `.tgz` empaquetados. |
| Skills | `skills/` | 34 skills con `SKILL.md`; incluye `repo-auditor` y `repo-auditor-deny` (duplicidad parcial). |
| Documentación contratos | `docs/API/`, `docs/dev/` | Múltiples documentos para router y daemon; ausencia de `SKILL-CONTRACT.md` y `NMLB.md` oficiales. |
| pm2 | `scripts/pm2/ecosystem.config.cjs` | Única configuración encontrada; orquesta daemon, router, discovery y skills-cli. |

## 2. Contratos identificados

| Componente | Archivos detectados | Estado propuesto |
| --- | --- | --- |
| Router | `docs/API/ROUTER.md`; análisis en `dev/post-hooks-investigation/analysis/router-analysis.md` | Adoptar `docs/API/ROUTER.md` como contrato oficial; archivar/etiquetar análisis como soporte histórico. |
| Daemon | `docs/API/DAEMON.md`, `docs/DAEMON-ROBUSTNESS-IMPROVEMENTS.md`, `docs/DAEMON-REPAIR-COMPLETE.md`, `docs/investigacion-activacion-skills/DAEMON-SOLUTION.md`, `dev/post-hooks-investigation/analysis/daemon-analysis.md` | Consolidar en `docs/API/DAEMON.md`; mover el resto a `/docs/archived/` o secciones de histórico. |
| Skills contract global | *No se encontró archivo dedicado* | Crear `docs/skills/SKILL-CONTRACT.md` basado en template actual. |
| No-Mess-Left-Behind | `docs/dev/HOOKS-NO-MESS-PM2.md` (mezcla de hooks + NMLB) | Extraer NMLB a `docs/skills/NMLB.md`; dejar el documento actual como guía técnica extendida. |

## 3. Configuración runtime y CLI

- **pm2**: `scripts/pm2/ecosystem.config.cjs` declara `sf-daemon`, `router-service`, `service-discovery`, `skills-cli-service`. Requiere confirmar si discovery y cli background pertenecen al scope “Skills Core” o si se mueven a un ecosistema separado.
- **CLI**: `package.json` provee comandos `skills:index`, `skills:lint`, `skills:rules`, `test:phase3-quick`, entre otros. Documentar en Dev Docs el set mínimo para validar Skills Core.
- **Dependencias cruzadas**: Router depende del daemon vía `DAEMON_URL`; pm2 ya establece la dependencia (`dependencies: ['sf-daemon']`).

## 4. Hallazgos principales

### 4.1 Duplicados / respaldos

- `packages/daemon/src/app.ts.backup`
- `packages/daemon/src/persistence/backup.ts`
- `packages/router/src/detectors.ts.backup`
- `packages/router/jest.config.js.backup`
- `scripts/pre-deployment-check.sh.backup`
- `packages/skills-cli/dist.backup.1762011814/`
- `docs/backups/` (contiene `pnpm-lock.yaml.backup`, `husky-backup-*.tar.gz`)

**Acciones sugeridas**: Confirmar si son respaldos vigentes; mover a `/archived` con fecha o eliminarlos tras verificación.

### 4.2 Contratos dispersos

- Router y daemon poseen múltiples documentos. Riesgo de drift entre versiones.
- No existe documento formal para el contrato global de skills ni para NMLB.
- Algunos análisis técnicos (p.ej. `INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md`) solapan información clave; deben citar al contrato oficial en vez de redefinir requisitos.

### 4.3 Skills duplicados o muy similares

- `repo-auditor` vs `repo-auditor-deny`: validar si ambos están activos o si uno debe quedar como guardrail complementario.
- `generators/template-skill` y `guidelines/sample-skill`: confirmar uso actual; si son ejemplos, etiquetarlos explícitamente como “sample”.

### 4.4 Falta de política de archivo

- No existe carpeta estándar `/docs/archived` ni convención `@deprecated`.
- Documentos históricos dispersos en `dev/`, `documentos/`, `investigacion/`.

## 5. Recomendaciones prioritarias

1. **Designar contratos oficiales**: Router → `docs/API/ROUTER.md`; Daemon → `docs/API/DAEMON.md`; crear `docs/skills/SKILL-CONTRACT.md` y `docs/skills/NMLB.md`.
2. **Archivar legacy**: Crear `/docs/archived/` y mover documentos antiguos, manteniendo tabla de referencias.
3. **Limpiar respaldos**: Auditar archivos `*.backup`, `.tgz` y carpetas `dist.backup.*`; decidir conservar (archivar con fecha) o eliminar.
4. **Documentar pm2 canonical**: Declarar oficialmente `scripts/pm2/ecosystem.config.cjs` y añadir nota si se requieren variaciones (dev vs prod).
5. **Normalizar samples**: Marcar skills de ejemplo con encabezado `status: sample` y excluirlos del index si no deben distribuirse.

## 6. Checklist para CI Gate propuesto

- [ ] Un único archivo para cada contrato (router, daemon, skills, NMLB) presente y fuera de `/archived`.
- [ ] Sin archivos con sufijos `*.backup`, `*.old`, `copy`, `tmp` dentro de `packages/` ni `scripts/`.
- [ ] pm2 oficial ubicado en `scripts/pm2/ecosystem.config.cjs` sin duplicados.
- [ ] Skills con `SKILL.md` sin clones obvios (misma `id`/`summary`); ejemplos marcados como `sample`.
- [ ] Informe de auditoría actualizado (`docs/skills/skills-core-audit.md`) y JSON (`docs/skills/skills-core-audit.json`) generados en la última semana.

## 7. Política propuesta de Single Source of Truth

- **Router**: `docs/API/ROUTER.md` será el contrato oficial; cualquier documento adicional debe referenciarlo explícitamente. Versiones anteriores se moverán a `docs/archived/router/YYYY-MM-DD-ROUTER.md`.
- **Daemon**: `docs/API/DAEMON.md` como referencia única; mejoras o ADRs apuntan a este documento sin copiar definiciones.
- **Skills (contrato global)**: crear `docs/skills/SKILL-CONTRACT.md` con secciones obligatorias (metadatos, progresión, enforcement). Cada `SKILL.md` debe enlazarlo.
- **No-Mess-Left-Behind**: crear `docs/skills/NMLB.md` describiendo métricas, hooks y responsabilidades; `docs/dev/HOOKS-NO-MESS-PM2.md` queda como anexo técnico.
- **Tratamiento de legados**: Archivar en `docs/archived/` con prefijo `YYYY-MM-DD`; si un artefacto se mantiene en sitio original, agregar cabecera `@deprecated` indicando reemplazo y fecha de retiro.
- **Reglas futuras**: ningún PR puede introducir documentos denominados “ROUTER”, “DAEMON”, “SKILL-CONTRACT”, “NMLB” fuera de rutas oficiales salvo en `/archived/`. CI debe marcarlo como blocker.

## 8. Arquitectura objetivo (Mermaid)

```mermaid
flowchart TD
  subgraph Diseno["Capa Diseño & Authoring"]
    PB[Prompt Builder<br/>(patrones y prompts)]
    Docs[Dev Docs & Contratos<br/>(ROUTER.md, DAEMON.md,<br/>SKILL-CONTRACT.md, NMLB.md)]
  end

  subgraph CLI["Capa CLI & Orquestación"]
    CLIApp[CLI / pnpm scripts]
    PM2[pm2 Ecosystem<br/>skills-daemon & skills-router]
  end

  subgraph Runtime["Capa Runtime"]
    PreHooks[Pre Hooks<br/>validación/enrichment]
    Router[Router<br/>detectores, candidatos, guardrails]
    Daemon[Daemon<br/>ejecutor basado en SKILL.md]
    Skills[Skills<br/>herramientas, APIs, FS]
    Resultado[Resultado a cliente/agente]
  end

  subgraph Hooks["Capa Hooks & No-Mess-Left-Behind"]
    StopHooks[Stop Hooks<br/>logging, métricas, cleanup]
    Eventos[Eventos & Métricas<br/>JSONL, logs, trazas]
    NMLB[Loop No-Mess-Left-Behind]
  end

  subgraph Auditoria["Capa Auditoría & CI"]
    Audit[Proceso audit:skills]
    Informes[Informes<br/>skills-audit.json / .md]
    CI[CI Gate<br/>bloquea incoherencias]
  end

  PB --> Docs
  Docs --> CLIApp
  CLIApp --> PM2
  PM2 --> PreHooks
  PreHooks --> Router
  Router --> Daemon
  Daemon --> Skills
  Skills --> Resultado
  Daemon --> StopHooks
  StopHooks --> Eventos
  Eventos --> NMLB
  NMLB --> Router
  NMLB --> Daemon
  Eventos --> Audit
  Audit --> Informes
  Informes --> CI
  CI --> PM2
```

### Descripción de sub-bloques

- **Prompt Builder**: Biblioteca de prompts y patrones que guía la creación de skills y contratos.
- **Dev Docs & Contratos**: Documentos oficiales que definen requisitos funcionales y operativos por componente.
- **CLI / pnpm scripts**: Punto de acceso operativo; ejecuta validaciones, builds y auditorías.
- **pm2 Ecosystem**: Orquestador único que asegura el arranque coordinado de router y daemon.
- **Pre Hooks**: Valida entradas, enriquecen contexto y aplican políticas previas a la selección de skills.
- **Router**: Evalúa detectores y guardrails, decide skill ganador o retorna `null`.
- **Daemon**: Gestiona ejecución de skills según `SKILL.md`, registra resultados y eventos.
- **Skills**: Colección de capacidades con herramientas y recursos externos.
- **Resultado**: Respuesta final entregada al agente o usuario que invocó la operación.
- **Stop Hooks**: Limpieza posterior, métricas y consolidación de estado “No-Mess-Left-Behind”.
- **Eventos & Métricas**: Canaliza logs, JSONL y trazas para observabilidad.
- **Loop NMLB**: Revisa inconsistencias y asegura que no queden errores pendientes.
- **Proceso audit:skills**: Auditoría recurrente que inspecciona estructura, contratos y residuos.
- **Informes**: Artefactos para humanos y agentes; alimentan decisiones de limpieza y automatización.
- **CI Gate**: Control automático que bloquea merges si aparecen incoherencias o duplicados críticos.

## 9. Checklist final de estabilización

- [ ] `docs/API/ROUTER.md` y `docs/API/DAEMON.md` ratificados como contratos oficiales y enlazados desde documentación general.
- [ ] `docs/skills/SKILL-CONTRACT.md` y `docs/skills/NMLB.md` creados y referenciados por skills y hooks.
- [ ] Archivos `*.backup` y artefactos temporales revisados; archivados o eliminados según política.
- [ ] `scripts/pm2/ecosystem.config.cjs` documentado como configuración canónica; otras variantes eliminadas o declaradas experimentales.
- [ ] Proceso `audit:skills` descrito aquí incorporado al pipeline (manual o automatizado) con informes generados.
- [ ] CI Gate configurado con reglas de bloqueo para contratos duplicados y archivos prohibidos.

---

Este informe sirve como base para el proceso `audit:skills` y debe actualizarse tras cada ciclo de limpieza o cambios estructurales en Skills Core.

