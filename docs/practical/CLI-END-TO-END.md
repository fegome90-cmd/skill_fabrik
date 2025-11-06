# Guía End-to-End del CLI (Skills Fabrik)

Esta guía resume el flujo completo para ejecutar una tarea "de punta a punta" usando únicamente el CLI del proyecto.

cd /Users/felipe/Developer/skills-fabrik

## 0. Prerrequisitos rápidos
```bash
pnpm install --frozen-lockfile
pnpm -w build
pnpm --filter @skills-fabrik/skills-cli link --global   # opcional
export SKILLS_PLANNING_MODE=true                         # planning gate activo
```

> ⚠️ Recomendado: usa el CLI local con `pnpm exec` o un alias temporal. El link global
> (`pnpm link --global`) apunta al build del otro repo y puede lanzar
> `ERR_MODULE_NOT_FOUND: Cannot find package '@skills-fabrik/kpi'` cuando lo ejecutas aquí.

Alias sugerido para esta sesión:
```bash
alias skills="pnpm exec node packages/skills-cli/dist/index.js"
```

## 1. Preparar/activar un plan
```bash
# Crear plan
skills-cli plan create "Analizar integración de hooks"

# Listar planes
skills-cli plan list

# Aprobar y guardar workflow (necesario para pasar el pre-hook)
skills-cli plan approve <plan-id>
skills-cli plan save <plan-id> --approve
```

> Verifica que aparezca un directorio en `dev/active/<tarea>/task.json` apuntando al plan aprobado.

## 2. Generar prompt Startkit con PBv2
```bash
skills-cli prompt-builder \
  plan-architect \
  "[Clarify] Analizar pipeline de hooks. [K] análisis previo en docs/... [U] riesgos." \
  --v2 --include-template --include-tags --include-plan-context --show-score
```

- `--include-template` habilita la plantilla completa (frontmatter + C-LOOP + mini-tasks + métricas + auditoría 4D).
- `--include-plan-context` inyecta el plan aprobado.

## 3. Validar el plan generado (opcional pero recomendado)
```bash
node scripts/hooks/plan-quality-check.mjs --stdin \
  <<<'$(skills-cli prompt-builder ... --include-template ... )'
```

Si el plan ya está en disco:
```bash
node scripts/hooks/plan-quality-check.mjs --file dev/plans/miplan.md
```

## 4. Activar el pre-hook manualmente (cuando uses CLI/terminal)
```bash
node scripts/hooks/pre-invoke.mjs \
  --prompt "analiza los archivos del pipeline" \
  --cwd /Users/<user>/Developer/skills-fabrik
```

Salida esperada:
- Bloque "SKILL ACTIVATION CHECK" ✅ si hay plan activo.
- `blocked: false` + nota con el plan activo.

## 5. Ejecutar la tarea en tu editor/agente
- Trabaja con los SKILL.md sugeridos (apertura manual o con la salida del pre-hook).
- Realiza los cambios de código/Docs.

## 6. Ejecutar el stop hook con el output del agente
```bash
node scripts/hooks/stop.mjs --output "$(cat ultimo-output.txt)"
```

El stop hook:
1. Detecta si hay plan (PBv2) y muestra el prompt Startkit.
2. Ejecuta `plan-quality-check` automáticamente y muestra ✅/⚠️.
3. Si pasas `--edit-log '[...]'`, también correrá la pipeline de calidad (Prettier, TypeCheck, guardrails, KPIs, etc.).

## 7. Verificar repositorio limpio / NMLB
```bash
git status
```
- Si hay cambios pendientes, revísalos y confirma que los pasos del stop hook no dejaron errores.

## 8. Comandos de referencia
```bash
# Skills con PBv2
skills-cli skills check "crear API" --v2

# Documentación
skills-cli dev-docs create "feature-api-auth" --v2 --include-template

# KPIs
skills-cli kpi --days 7

# Dashboard (health + métricas)
skills-cli dashboard health
skills-cli dashboard metrics
```

## 9. Troubleshooting rápido
- `ERR_PNPM_RECURSIVE... spawn skills EACCES` → usa `skills-cli ...` o `node packages/skills-cli/dist/index.js ...`
- Pre-hook bloquea por planning → confirma plan aprobado (paso 1) o temporalmente `SKILLS_PLANNING_MODE=false` (solo para pruebas).
- Stop hook no detecta plan → revisa que el output contenga `[Clarify]`/`[Layout]`/`## Plan`.
- `plan-quality-check` falla → agrega las secciones listadas antes de aceptar el plan.

Con estos pasos puedes recorrer el flujo completo (plan → prompt → pre-hook → ejecución → stop-hook + validación) usando únicamente el CLI y los scripts incluidos en este repositorio.
