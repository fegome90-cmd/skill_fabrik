# Configuración de Skills en Cursor - Listo para usar ✅

## Estado Actual

✅ **Todo configurado y funcionando**

### Componentes Activos

1. **Hooks de Cursor instalados**

   - `.cursor/hooks/userPromptSubmit.mjs` - Pre-invoke hook
   - `.cursor/hooks/stop.mjs` - Stop hook
   - `.cursor/hooks/hooks-config.json` - Configuración
2. **Planning Mode ACTIVADO**

   - Plan activo: `mhce05nu-742954f`
   - Estado: `APPROVED`
   - Ubicación: `dev/active/configurar-sistema-de-skills-con-planning-mode-activado-verificar-activaci-n-de-skills-y-hooks-de-cursor/`
3. **Skills Configuradas** (`configs/skill-rules.json`):

   - ✅ `backend-dev-guidelines` (guideline)
   - ✅ `frontend-dev-guidelines` (guideline)
   - ✅ `project-catalog-developer` (guideline)
   - ✅ `database-verification-find` (guardrail - suggest)
   - ✅ `database-verification-update` (guardrail - warn)
   - ✅ `database-verification-delete` (guardrail - block)
   - ✅ `secrets-and-config` (guardrail - require)
   - ✅ `pm2-monitor` (workflow)
   - ✅ `plan-architect` (generator)
   - ✅ `plan-save-workflow` (workflow)
4. **MemTech Integrado**

   - ✅ Redis L0/L1 conectado
   - ✅ PostgreSQL L2 conectado
   - ✅ Snapshots funcionando

## Cómo Funciona

### Pre-invoke Hook (Antes de procesar prompt)

1. **Gate de Planning Mode**: Si `SKILLS_PLANNING_MODE=true` (default):

   - Verifica si hay plan aprobado en `dev/task.json`
   - Si NO hay plan: **BLOQUEA** con mensaje instructivo
   - Si hay plan: continúa y muestra info del plan activo
2. **Activación de Skills**:

   - Analiza prompt con heurística multi-señal:
     - Keywords: 20%
     - Intent patterns: 30%
     - Path globs: 30%
     - Content patterns: 20%
   - Si score ≥ 0.6: activa skill e inyecta nota

### Stop Hook (Después de respuesta)

1. **Guardrails**: Detecta patrones peligrosos
2. **Prettier**: Formatea archivos editados
3. **TypeCheck**: Verifica errores TypeScript
4. **Error Hints**: Si 1-4 errores, muestra sugerencias
5. **Auto-resolver**: Si ≥5 errores, intenta corregir automáticamente
6. **KPIs**: Emite eventos a `obs/kpi/events.jsonl`
7. **Notificaciones**: Envía notificaciones según resultado

## Uso Inmediato

### Ya tienes plan activo - Puedes empezar a trabajar

El sistema está listo. Cuando uses Cursor:

1. **Si intentas editar sin contexto**: El gate te pedirá crear/aprobar plan
2. **Si trabajas según el plan activo**: Las skills se activarán automáticamente según:
   - Tu prompt (keywords, intents)
   - Archivos abiertos (path patterns)
   - Contenido del código (content patterns)

### Ejemplos de Activación

**Backend Guidelines** se activa cuando:

- Prompt contiene: "crear endpoint", "agregar ruta", "controller"
- Archivos abiertos: `**/controllers/**/*.ts`, `backend/src/**/*.ts`
- Código contiene: `router.`, `export.*Controller`

**Frontend Guidelines** se activa cuando:

- Prompt contiene: "componente", "hook", "UI"
- Archivos abiertos: `frontend/src/**/*.{ts,tsx}`
- Código contiene: `function`, `use[A-Z]`, `createFileRoute`

**Database Verification** (guardrail) se activa cuando:

- Editas código con `findMany()`, `updateMany()`, `deleteMany()` sin `where`
- Niveles: SUGGEST → WARN → BLOCK según severidad

**Plan Architect** se activa cuando:

- Prompt: "crear plan", "planificar tarea", "/plan"
- Archivos: `dev/plans/**/*.json`

**Plan Save Workflow** se activa cuando:

- Prompt: "guardar plan", "save plan", "dev-docs"
- Archivos: `dev/plans/**/*.json` con status APPROVED

## Variables de Entorno

```bash
# Planning mode (default: true)
SKILLS_PLANNING_MODE=true

# Umbral de activación (default: 0.6)
SKILL_ACTIVATION_THRESHOLD=0.6

# Para desactivar planning mode (no recomendado)
SKILLS_PLANNING_MODE=false
```

## Comandos Útiles

```bash
# Ver plan activo
cat dev/active/*/task.json

# Crear nuevo plan
node packages/skills-cli/dist/index.js plan create "<descripción>"

# Aprobar y activar plan
node packages/skills-cli/dist/index.js plan save <plan-id> --approve

# Ver planes
node packages/skills-cli/dist/index.js plan list

# Ver KPIs
cat obs/kpi/events.jsonl | tail -5

# Prompt Builder v2 (si no tienes `skills` en PATH)
node packages/skills-cli/dist/index.js prompt-builder plan-architect "Diseñar y aprobar plan post-estudio" --v2 --show-score
```

## Próximos Pasos

1. **Usa Cursor normalmente** - Las skills se activarán automáticamente
2. **Observa las notas inyectadas** - Verás cuándo skills se activan
3. **Revisa KPIs** - `obs/kpi/events.jsonl` tiene métricas de activación
4. **Crea nuevos planes** - Para nuevas tareas/fetas

## Troubleshooting

### "No approved plan found"

- El gate está bloqueando. Crea y aprueba un plan primero
- O desactiva: `SKILLS_PLANNING_MODE=false`

### Skills no se activan

- Verifica `configs/skill-rules.json` tiene las reglas
- Revisa que threshold no sea muy alto (`SKILL_ACTIVATION_THRESHOLD`)
- Verifica que los paths/patterns coincidan con tus archivos

### Errores TypeScript después de auto-resolver

- Re-ejecuta typecheck manualmente
- Algunos errores requieren corrección manual

---

**🎉 Sistema completamente operativo - Empieza a usar Cursor con confidence!**
