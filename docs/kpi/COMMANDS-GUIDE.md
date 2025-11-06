# Guía de Comandos - Skills Fabric

## 📋 Cuándo Usar Cada Comando

### 🔍 Monitoreo y KPIs

#### `skills kpi` - Dashboard de Métricas
**Cuándo usar:**
- Revisión diaria/semanal de métricas
- Antes de gate review de fase
- Después de cada sprint

**Ejemplos:**
```bash
# Ver dashboard en consola (últimos 7 días)
pnpm kpi:show

# Generar dashboard markdown
pnpm kpi:gen

# Dashboard de últimos 30 días
node packages/skills-cli/dist/index.js kpi --days 30 --output docs/kpi/DASHBOARD.md

# Incluir datos raw JSON
node packages/skills-cli/dist/index.js kpi --days 7 --raw --output docs/kpi/DASHBOARD.md
```

**Qué muestra:**
- Métricas de velocidad (activación, tokens, latencia)
- Métricas de calidad (adherencia, zero errors, guardrails)
- Estado holístico (excellent/good/warning/critical)
- Top skills por activaciones
- Recomendaciones automáticas

---

### 🛡️ Guardrails

#### `skills guardrail` - Validación de Patrones Peligrosos
**Cuándo usar:**
- Al revisar PRs con operaciones de BD
- Antes de ejecutar scripts peligrosos
- En CI/CD para validar cambios

**Ejemplos:**
```bash
# Validar patrón directamente
node packages/skills-cli/dist/index.js guardrail "rm -rf /"

# Validar archivo completo
node packages/skills-cli/dist/index.js guardrail --file src/repository/user-repo.ts

# Modo verbose (más detalles)
node packages/skills-cli/dist/index.js guardrail --file test.ts --verbose
```

**Qué detecta:**
- `deleteMany()` sin `where` → BLOCK
- `updateMany()` sin `where` → WARN
- `findMany()` sin `where` → SUGGEST
- Secretos hardcodeados → BLOCK
- Comandos shell peligrosos → BLOCK

---

### 📝 Planning Mode

#### `skills plan` - Gestión de Planes
**Cuándo usar:**
- Al iniciar una nueva feature/fase
- Cuando `SKILLS_PLANNING_MODE=true` (bloquea ediciones sin plan)
- Para documentar objetivos y estructura

**Ejemplos:**
```bash
# Crear plan nuevo
node packages/skills-cli/dist/index.js plan create "Implementar autenticación OAuth"

# Listar planes
node packages/skills-cli/dist/index.js plan list

# Aprobar y guardar plan (genera dev-docs + snapshot)
node packages/skills-cli/dist/index.js plan save <plan-id> --approve

# Ver detalles de plan
node packages/skills-cli/dist/index.js plan show <plan-id>
```

**Flujo típico:**
1. `plan create` → Crea plan en estado DRAFT
2. Revisar/editar plan manualmente si es necesario
3. `plan approve` → Cambia a APPROVED
4. `plan save --approve` → Genera dev-docs y snapshot MemTech L1

---

### 🎯 Skills Management

#### `skills skills` - Gestión de Skills
**Cuándo usar:**
- Al crear/editar un skill
- En CI para validar calidad
- Para regenerar reglas después de cambios

**Ejemplos:**
```bash
# Indexar todos los skills
pnpm skills:index

# Lint estricto (valida descripciones, estructura)
pnpm skills:lint

# Generar skill-rules.json
pnpm skills:rules

# Verificar activación de skill
node packages/skills-cli/dist/index.js skills check "crear endpoint API" --threshold 0.4
```

**Subcomandos útiles:**
- `skills lint` → Valida SKILL.md contra template
- `skills index` → Genera registry/index.json
- `skills rules` → Genera configs/skill-rules.json
- `skills check` → Prueba activación de skills

---

### 🔧 Setup y Configuración

#### `skills hooks` - Configurar Hooks
**Cuándo usar:**
- Setup inicial del proyecto
- Actualizar hooks después de cambios
- Migrar a nuevo editor/IDE

**Ejemplos:**
```bash
# Generar hooks configurables
node packages/skills-cli/dist/index.js hooks setup

# Esto genera:
# - .cursor/hooks/userPromptSubmit.ts
# - .cursor/hooks/stop.ts
```

**Hooks disponibles:**
- `userPromptSubmit` → Pre-invoke hook (activa skills)
- `stop` → Post-response hook (prettier, tsc, guardrails, KPIs)

---

### 🚀 PM2 Operations

#### `skills pm2` / `pm2` - Gestión de Procesos
**Cuándo usar:**
- Iniciar servicios backend
- Monitoreo en desarrollo
- Troubleshooting de servicios

**Ejemplos:**
```bash
# Iniciar todos los servicios
pm2 start scripts/pm2/ecosystem.config.cjs

# Ver logs en tiempo real
pm2 logs router-service --lines 200

# Monitoreo interactivo
pm2 monit

# Reiniciar servicio
pm2 restart router-service

# Listar procesos
pm2 list

# Detener servicios
pm2 stop all
```

**Servicios configurados:**
- `router-service` → Router de skills (puerto 3000)
- `skills-cli-service` → CLI service (si aplica)

---

### 🏗️ Build y CI

#### `pnpm build` - Compilar Packages
**Cuándo usar:**
- Antes de commit
- En CI/CD
- Después de cambios en código

**Ejemplos:**
```bash
# Build todos los packages
pnpm -w build

# Build específico
pnpm --filter @skills-fabrik/router build
pnpm --filter @skills-fabrik/skills-cli build
pnpm --filter @skills-fabrik/kpi build
```

#### `pnpm e2e` - Tests End-to-End
**Cuándo usar:**
- Validar router y hooks
- Antes de PR
- Después de cambios críticos

**Ejemplos:**
```bash
# Ejecutar simulación E2E
pnpm e2e

# Esto prueba:
# - Pre-invoke hook (activación de skills)
# - Stop hook (prettier, tsc, guardrails)
# - Guardrail blocking
```

---

### 📊 Flujo Completo Típico

#### 1. Inicio de Feature (Planning Mode activo)
```bash
# Crear plan
node packages/skills-cli/dist/index.js plan create "Nueva feature"

# Aprobar y guardar (genera dev-docs)
node packages/skills-cli/dist/index.js plan save <plan-id> --approve
```

#### 2. Desarrollo
```bash
# Editar código (skills se activan automáticamente vía hooks)

# Verificar guardrails antes de commit
node packages/skills-cli/dist/index.js guardrail --file path/to/changed.ts

# Build para verificar errores
pnpm -w build
```

#### 3. Antes de Commit
```bash
# Lint skills actualizados
pnpm skills:lint

# Indexar skills
pnpm skills:index

# Regenerar reglas
pnpm skills:rules

# Ver dashboard
pnpm kpi:show
```

#### 4. CI/CD
```bash
# Gates automáticos
pnpm gates

# Incluye:
# - Build check
# - Skills lint
# - Schema validation
# - E2E tests
```

---

## 🎯 Comandos por Escenario

### Escenario 1: Setup Inicial del Proyecto
```bash
pnpm install
pnpm -w build
node packages/skills-cli/dist/index.js hooks setup
pnpm skills:index
pnpm skills:rules
```

### Escenario 2: Crear Nuevo Skill
```bash
# 1. Crear SKILL.md manualmente en skills/<tipo>/<nombre>/
# 2. Validar
pnpm skills:lint
# 3. Indexar
pnpm skills:index
# 4. Regenerar reglas
pnpm skills:rules
# 5. Probar activación
node packages/skills-cli/dist/index.js skills check "descripción relevante" --threshold 0.4
```

### Escenario 3: Troubleshooting de Guardrail
```bash
# Verificar qué detecta
node packages/skills-cli/dist/index.js guardrail --file problematic-file.ts --verbose

# Verificar reglas activas
cat configs/skill-rules.json | jq '.["database-verification-delete"]'
```

### Escenario 4: Monitoreo Continuo
```bash
# Dashboard diario
pnpm kpi:gen

# Ver eventos recientes
tail -20 obs/kpi/events.jsonl | jq

# Ver métricas de última semana
node packages/skills-cli/dist/index.js kpi --days 7
```

---

## 📚 Referencias Rápidas

| Comando | Propósito | Frecuencia |
|---------|-----------|------------|
| `pnpm kpi:gen` | Generar dashboard | Diario/Semanal |
| `pnpm skills:lint` | Validar skills | Pre-commit |
| `pnpm skills:index` | Actualizar registry | Al cambiar skills |
| `pnpm skills:rules` | Regenerar reglas | Al cambiar skills |
| `pnpm -w build` | Compilar | Pre-commit |
| `skills plan create` | Crear plan | Por feature |
| `skills guardrail` | Validar código | Pre-commit / PR review |

---

## 💡 Tips

1. **Dashboard automático**: Agrega `pnpm kpi:gen` a tu workflow diario o CI
2. **Guardrails preventivos**: Ejecuta `skills guardrail` antes de revisar PRs grandes
3. **Planning Mode**: Útil para features complejas, desactívalo para tareas pequeñas
4. **Skills check**: Úsalo para probar triggers antes de commit

---

*Última actualización: 2025-10-29*

