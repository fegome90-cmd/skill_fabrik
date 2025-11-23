# Prompt PBv2 · Discovery Sweep

## Objetivo

Enumerar archivos relevantes por dominio (router, daemon, pm2, skills, docs) y detectar patrones sospechosos (`old`, `copy`, `backup`, `deprecated`).

### Cobertura actual (2025-11-13)

- **Hallazgos registrados**: F-001 (pm2 duplicado), F-002 (contrato ROUTER duplicado), F-003 (skill obsoleto), F-004 (contratos dispersos/ausentes).
- **Acciones documentadas**: `acciones.md` con responsables (Router Lead, DocOps, Skills Curator).
- **Métricas**: `metrics-2025-11-13.json` (files_scanned=524, skills_reviewed=68, contracts_reviewed=7, hallazgos críticos=1).
- **Prompts derivados**: `outputs/discovery-20251113-filled.md`, `outputs/contract-consistency-20251113-filled.md`.

## Rutas objetivo

- `/Users/felipe/Developer/skills-fabrik/packages/daemon`
- `/Users/felipe/Developer/skills-fabrik/packages/router`
- `/Users/felipe/Developer/skills-fabrik/packages/tools`
- `/Users/felipe/Developer/skills-fabrik/scripts`
- `/Users/felipe/Developer/skills-fabrik/skills`
- `/Users/felipe/Developer/skills-fabrik/docs/skills`
- `/Users/felipe/Developer/skills-fabrik/scripts/pm2`

## Instrucciones para Prompt Builder v2

- **Entrada**: Ruta raíz, subconjunto de rutas objetivo (ver arriba) y lista de patrones a ignorar (`node_modules`, `dist`, `.sf`, `*.log`, `*.cache`).
- **Contexto clave**: Estructura del monorepo, objetivos de auditoría, criterios de severidad.
- **Salidas esperadas**:
  - Tabla con `path`, `tipo`, `motivo`, `sospechoso` (booleano).
  - Resumen de conteos por dominio.
  - Lista de archivos sospechosos priorizados.
- **Validación**:
  - Verificar que se respetan exclusiones (`node_modules`, builds).
  - Confirmar que el resumen agrupa por dominio.
  - Adjuntar comandos ejecutados o evidencias en texto plano.

## Instrucciones CLI recomendadas

1. Preparar entorno (ejecutar tras actualizar dependencias):
   ```bash
   cd /Users/felipe/Developer/skills-fabrik
   pnpm install --frozen-lockfile
   pnpm -w build
   ```
   > Para compilar sólo la CLI: `pnpm --filter @skills-fabrik/skills-cli run build`
   > Opcional (Quick use CLI): enlazar globalmente `skills-cli` con `pnpm --filter @skills-fabrik/skills-cli link --global`
2. Verificar que la CLI responde:
   ```bash
   node packages/skills-cli/dist/index.js --help
   ```
   ```bash
   skills-cli --help          # si realizaste el link global
   ```
3. Posicionarse en la raíz del repo:
   ```bash
   cd /Users/felipe/Developer/skills-fabrik
   ```
4. Generar listado general ignorando artefactos de build:
   ```bash
   find packages \
     -type f \
     -not -path "*/node_modules/*" \
     -not -path "*/dist/*" \
     -not -path "*/.sf/*" \
     | tee docs/inventario/2025Q4/raw-files-packages.txt
   ```
5. Buscar patrones sospechosos en contenido:
   ```bash
   rg -n "(old|copy|backup|deprecated)" \
     --glob '!node_modules/*' \
     --glob '!dist/*' \
     --glob '!.sf/*' \
     | tee docs/inventario/2025Q4/rg-content-$(date +%Y%m%d-%H%M).txt
   ```
6. Listar archivos con nombres sospechosos:
   ```bash
   rg --files \
     -g '*old*' \
     -g '*copy*' \
     -g '*backup*' \
     -g '*deprecated*' \
     --glob '!node_modules/*' \
     --glob '!dist/*' \
     --glob '!.sf/*' \
     | tee docs/inventario/2025Q4/rg-filenames-$(date +%Y%m%d-%H%M).txt
   ```
7. Inventariar skills:
   ```bash
   find skills \
     -name "SKILL.md" \
     -not -path "*/node_modules/*" \
     | tee docs/inventario/2025Q4/raw-skills.txt
   ```
8. Ejecutar Prompt Builder v2 vía CLI (usar el skill real y el plan aprobado):
   ```bash
   mkdir -p docs/inventario/2025Q4/outputs
   node packages/skills-cli/dist/index.js prompt-builder \
     "Auditor de repositorio (read-only)" \
     "[Clarify] Ejecutar discovery sweep conforme al plan mhxknb6e-bd6b0f3. [K] Triada activa en dev/active/auditoria-skills-core-2025q4 (plan/context/tasks). [K] Rutas objetivo: packages/daemon, packages/router, scripts/pm2, skills/**/SKILL.md, docs/skills/*.md. [U] Identificar duplicados y contratos inconsistentes sin crear artefactos nuevos. [EVIDENCIA] docs/inventario/2025Q4/raw-files-packages.txt, docs/inventario/2025Q4/raw-skills.txt. [PROPUESTA] Documentar hallazgos en hallazgos.json y metrics-2025-11-13.json." \
     --v2 \
     --include-template \
     --include-tags \
     --include-files \
     --include-plan-context \
     --show-score \
     > docs/inventario/2025Q4/outputs/discovery-$(date +%Y%m%d-%H%M).md
   ```
   > Alternativas:
   >
   > - `pnpm --filter @skills-fabrik/skills-cli exec skills-cli prompt-builder ...`
   > - `skills-cli prompt-builder ...` (si está linkeado globalmente)
9. Registrar los comandos ejecutados en `insumos-discovery.md` junto con su salida resumida.

### Flujo completo de auditoría (Resumen)

1. **Preparar entorno y compilar CLI** (pasos 1–3).
2. **Generar insumos brutos** (`raw-files-packages.txt`, `raw-skills.txt`, `rg-content-*.txt`, `rg-filenames-*.txt`).
3. **Generar prompt inicial** (`outputs/discovery-YYYYMMDD-HHMM.md`) y completarlo manualmente → `discovery-20251113-filled.md`.
4. **Registrar hallazgos iniciales** (F-001 a F-003) en `hallazgos.json`, asignar acciones en `acciones.md`, actualizar métricas.
5. **Generar prompt de contratos** (ver comando más abajo) → `contract-consistency-20251113-filled.md`.
6. **Documentar hallazgos adicionales** (F-004…) y actualizar métricas/narrativa.
7. **Mantener checklist, presprint y logs** para cierre del ciclo (sin modificar archivos del repositorio; auditoría solo documenta hallazgos).

### Prompt PBv2 para contratos (ejecutado el 2025-11-13)

```bash
node packages/skills-cli/dist/index.js prompt-builder \
  "Auditor de repositorio (read-only)" \
  "[Clarify] Verificar consistencia de contratos según plan mhxknb6e-bd6b0f3. [Plan] dev/active/auditoria-skills-core-2025q4/{plan.md,context.md,tasks.md}. [K] Contratos oficiales: docs/skills/ROUTER.md (v1.3, 210 líneas, 2025-04-12), docs/skills/ROUTER-copy.md (posible duplicado, 2025-05-10), docs/skills/DAEMON.md (v1.2, 2025-04-20), docs/skills/SKILL-CONTRACT.md, docs/skills/NMLB.md. [K] Artefactos operativos: packages/router/src/**, packages/daemon/src/**, skills/**/SKILL.md. [U] Identificar divergencias y duplicados sin crear artefactos nuevos. [EVIDENCIA] docs/inventario/2025Q4/raw-files-packages.txt, docs/inventario/2025Q4/outputs/discovery-20251113-filled.md. [PROPUESTA] Documentar hallazgos en hallazgos.json, acciones en acciones.md, métricas en metrics-2025-11-13.json." \
  --v2 \
  --include-template \
  --include-tags \
  --include-files \
  --include-plan-context \
  --show-score \
  > docs/inventario/2025Q4/outputs/contract-consistency-$(date +%Y%m%d-%H%M).md
```

> Nota: Si el editor no puede abrir archivos, inyectar rutas y resúmenes (como se muestra arriba) en la descripción para que PBv2 genere señales `path/content`.

## Generación de plan (opcional) para auditoría

> ⚠️ El comando `plan create` del CLI no acepta `--include-template` ni `--include-tags`. Esas banderas son sólo para Prompt Builder.

1. Ejecutar desde la raíz del repo (usa siempre la versión local para evitar errores de dependencias):
   ```bash
   cd /Users/felipe/Developer/skills-fabrik
   node packages/skills-cli/dist/index.js plan create \
     "auditoria-skills-core-2025q4" \
     --v2 \
     --show-score
   ```

   - Si linkeaste el CLI globalmente: `skills-cli plan create "auditoria-skills-core-2025q4" --v2 --show-score`
   - El plan generado se guarda en `docs/generated-prompts/` y se imprime en consola.
2. Editar el archivo resultante para completar objetivos, riesgos, métricas y mini-tasks basados en la auditoría actual.
3. Referenciar el plan en `skills-core-inventario.md` como “Plan activo” si corresponde.

## Checklist

- [ ] Incluir timestamp de la inspección.
- [ ] Exportar resultados en JSON y actualizar `hallazgos.json` (ej. F-001 a F-00x).
- [ ] Guardar evidencia en `insumos-discovery.md` y `logs/auditoria-YYYYMMDD.jsonl` (ej. `command >> logs/auditoria-2025-11-13.jsonl`).
- [ ] Actualizar métricas en `metrics-2025-11-13.json`.
- [ ] Sincronizar estado en `skills-core-inventario.md`, `acciones.md`, `presprint.md`, `checklist.md`.
- [ ] Completar `contract-consistency-20251113-filled.md` (tabla OK/Observación/Riesgo) y registrar hallazgos F-004+.
- [ ] Opcional: persistir snapshot en MemTech (`node packages/skills-cli/dist/index.js plan save mhxknb6e-bd6b0f3`) solo para registrar el estado de auditoría.

## Artefactos generados (referencia)

- `docs/inventario/2025Q4/raw-files-packages.txt`
- `docs/inventario/2025Q4/raw-skills.txt`
- `docs/inventario/2025Q4/rg-content-*.txt`
- `docs/inventario/2025Q4/rg-filenames-*.txt`
- `docs/inventario/2025Q4/outputs/discovery-YYYYMMDD-HHMM.md`
- `docs/inventario/2025Q4/outputs/discovery-20251113-filled.md` (prompt enriquecido)
- `docs/inventario/2025Q4/outputs/contract-consistency-20251113-filled.md` (contratos)
- `docs/inventario/2025Q4/hallazgos.json`, `acciones.md`, `metrics-2025-11-13.json`
- `docs/inventario/2025Q4/presprint.md`, `checklist.md` (para cierre del ciclo)
- `dev/active/auditoria-skills-core-2025q4/{plan.md,context.md,tasks.md}` (triada aprobada)

## Limitaciones detectadas y mitigaciones

- **Falta de autocompletado en plantilla Startkit**: PBv2 sólo genera el esqueleto; completar objetivos, riesgos, mini-tasks y métricas depende del agente/humano. Recomendación: usar `dev/active/auditoria-skills-core-2025q4/plan.md` como fuente y actualizar `discovery-20251113-filled.md`.
- **Plan aprobado no enlazado automáticamente**: PBv2 requiere que la triada (`plan.md`, `context.md`, `tasks.md`) esté abierta en el editor o referenciada explícitamente; de lo contrario se muestra “Sin plan aprobado”. Mitigación: abrir los tres archivos antes de ejecutar o añadir `plan_reference` manualmente.
- **Dependencia del IDE**: Si el editor no puede abrir archivos (o se trabaja sin IDE), incluir rutas y resúmenes directamente en la descripción del prompt para inyectar contexto manualmente.
- **CLI global sin dependencias workspace**: el binario global `skills-cli` falla (`ERR_MODULE_NOT_FOUND` para `@skills-fabrik/kpi`). Ejecutar siempre `node packages/skills-cli/dist/index.js ...` dentro del repo o replicar dependencias si se usa global.
- **Opción `--files` inexistente**: el comando documentado por PBv2 sugiere `--files`, pero no existe; usar `--include-files` únicamente y describir rutas dentro del prompt.
- **Vínculos débiles entre artefactos**: prompts y plan no se referencian automáticamente; mantener enlaces manuales en `skills-core-inventario.md`, `insumos-discovery.md` y el prompt generado (`discovery-20251113-filled.md`).
