# Manual de Uso - Skills Fabric CLI

## 1) Inicio rápido desde una terminal externa

Requisitos: Node ≥ 18, pnpm ≥ 8

```bash
cd /Users/felipe/Developer/skills-fabrik
pnpm install
pnpm -w build

# Opción A (recomendada): usar el binario global `skills-cli`
pnpm --filter @skills-fabrik/skills-cli link --global
skills-cli --help

# Opción B: sin global, invocar el binario local
node packages/skills-cli/dist/index.js --help
```

Consejo: si usas la Opción A, podrás ejecutar `skills-cli <comando>` en cualquier carpeta del repo.

---

## 2) Catálogo de comandos (claro y directo)

| Comando | Propósito | Cuándo usar | Ejemplo |
|--------|-----------|-------------|---------|
| `cloop` | Iniciar/completar fases CLOOP con artefactos | Al comenzar/cerrar una fase | `skills-cli cloop start F6` |
| `skills` | Gestionar skills: lint/index/rules/check | Al crear/editar skills; en CI | `skills-cli skills lint ./skills --strict` |
| `hooks` | Instalar hooks pre/stop del editor | Setup inicial o al actualizar entorno | `skills-cli hooks setup` |
| `guardrail` | Detectar patrones peligrosos (SUGGEST/WARN/BLOCK) | Pre-commit/PR/CI | `skills-cli guardrail "rm -rf /"` |
| `build` | Verificar compilación y tipos | Antes de PR; CI | `skills-cli build --all -v` |
| `ci` | Ejecutar gates locales | Validación integral previa a PR | `skills-cli ci --gate skills-lint` |
| `dev-docs` | Crear/listar/actualizar docs de trabajo | Cuando hay tareas activas | `skills-cli dev-docs create "feature X"` |
| `plan` | Crear/guardar/aprobar planes (planning mode) | Antes de cambios grandes | `skills-cli plan create "Implementar OAuth"` |
| `pm2-start` | Iniciar servicios con PM2 | Monitoreo y troubleshooting | `skills-cli pm2-start` |
| `kpi` | Ver/generar dashboard de métricas | Diario/semanal; gate review | `skills-cli kpi --days 7` |

Nota: si no usaste el link global, reemplaza `skills-cli` por `node packages/skills-cli/dist/index.js` en los ejemplos.

---

## 3) Recetas rápidas (comando + salida esperada)

### A. Ver el estado del sistema (KPIs)
```bash
skills-cli kpi --days 7
```
Salida esperada (resumen):
```
Status: 🔴 CRITICAL
Velocity: Activation Rate, Tokens/Op, Latency
Quality: Adherence, Zero Errors, Guardrails
```
Guardar dashboard:
```bash
pnpm kpi:gen   # genera docs/kpi/DASHBOARD.md
```

### B. Validar que no hay patrones peligrosos
```bash
skills-cli guardrail "rm -rf /"
```
Salida esperada:
```
✗ BLOCKED: 1 destructive pattern(s) detected
```
En archivo:
```bash
skills-cli guardrail --file src/repository/user-repo.ts
```

### C. Preparar/validar skills
```bash
skills-cli skills lint ./skills --strict
skills-cli skills index ./skills --out ./registry/index.json
skills-cli skills rules
```
Salida esperada: lint sin errores, índice generado y reglas actualizadas.

### D. Ritual de fase (CLOOP)
```bash
skills-cli cloop start F6
# ...trabajo...
skills-cli cloop complete F6
pnpm kpi:gen
```

### E. Gates locales (CI)
```bash
skills-cli build --all -v
skills-cli ci --gate skills-lint
```

---

## 4) Modo de invocación (global vs local)

- Global (simple): `skills-cli <comando>` — requiere:
```bash
pnpm --filter @skills-fabrik/skills-cli link --global
```
- Local (sin global):
```bash
node packages/skills-cli/dist/index.js <comando>
```

---

## 5) Ubicaciones claves

- Eventos KPI: `obs/kpi/events.jsonl`
- Dashboard: `docs/kpi/DASHBOARD.md`
- Reglas de skills: `configs/skill-rules.json`
- Índice de skills: `registry/index.json`

---

## 6) Troubleshooting corto

- `--workspace-root may not be used with --global` → usa: `pnpm --filter @skills-fabrik/skills-cli link --global`
- PM2 no instalado → `npm i -g pm2`
- E2E con ts-node → `pnpm add -D ts-node typescript`
- Dashboard vacío → verifica `obs/kpi/events.jsonl` tenga eventos recientes
- Falso positivo de guardrail → revisa `configs/skill-rules.json`

---

## 7) Chec-list de verificación (2 minutos)

```bash
# 1) Ayuda general
skills-cli --help

# 2) Hooks listos
skills-cli hooks setup

# 3) Skills en orden
skills-cli skills lint ./skills --strict
skills-cli skills index ./skills --out ./registry/index.json
skills-cli skills rules

# 4) Guardrails activos
skills-cli guardrail "rm -rf /"  # debe bloquear

# 5) KPIs disponibles
skills-cli kpi --days 7
pnpm kpi:gen
```

---

## 8) Ejemplos de guardrails en archivos reales

```bash
# BLOCK: deleteMany sin where
skills-cli guardrail "." --file test-guardrails/repository/user-repository.ts

# WARN + SUGGEST: updateMany/findMany sin where
skills-cli guardrail "." --file test-guardrails/repository/warn-suggest.ts
```
Salidas esperadas:
```
# BLOCK
✗ BLOCKED: 1 destructive pattern(s) detected
- deleteMany() without where clause - will delete all records!

# WARN/SUGGEST
⚠️  WARNING: 2 risky pattern(s) detected (non-blocking)
```

---

## 9) Verificación de salud: Redis y Postgres

Si notas intermitencias, ejecuta estos chequeos en orden:

### Redis
```bash
# 1) ¿Servicio activo? (Homebrew)
brew services list | grep -i redis || true

# 2) Ping directo
redis-cli -h ${REDIS_HOST:-127.0.0.1} -p ${REDIS_PORT:-6379} PING
# Esperado: PONG

# 3) Info básica
redis-cli INFO SERVER | head -20

# 4) Conexión a través del código (smoke)
node -e "import('redis').then(async r=>{const c=r.createClient({url:process.env.REDIS_URL});c.on('error',e=>console.error(e));await c.connect();console.log('OK');await c.quit();}).catch(e=>{console.error(e);process.exit(1);})"
```

Checklist Redis:
- REDIS_URL/REDIS_HOST/REDIS_PORT configurados
- Latencia de red estable (si es remoto)
- Logs sin picos de LOADING/OOM

### Postgres
```bash
# 1) ¿Servicio activo? (Homebrew)
brew services list | grep -E "postgres|postgresql" || true

# 2) Conexión
psql ${DATABASE_URL:+"$DATABASE_URL"} -c 'select 1' || psql -h ${PGHOST:-127.0.0.1} -U ${PGUSER:-$USER} -d ${PGDATABASE:-postgres} -c 'select 1'

# 3) Estado
pg_isready -h ${PGHOST:-127.0.0.1} -p ${PGPORT:-5432} -d ${PGDATABASE:-postgres}
```

Checklist Postgres:
- DATABASE_URL/PG* vars configuradas (PGHOST/PGPORT/PGUSER/PGDATABASE)
- pg_isready = accepting connections
- Sin errores de conexiones agotadas/timeouts en logs

### Consejos ante intermitencias
- Aumenta connect_timeout en el cliente
- Revisa límites de conexiones (max_connections y pool del cliente)
- Verifica DNS/resolve si usas hostnames
- Confirma que firewall/VPN no fluctúen

---

## 10) Novedades recientes (este repo)

- Guardrails en CLI con niveles: BLOCK (deleteMany), WARN (updateMany), SUGGEST (findMany)
- Binario global estable: `pnpm setup` + `pnpm link --global` para `skills-cli`
- Dashboard KPI reproducible: `pnpm kpi:gen` y `pnpm kpi:show`
- Documentación ampliada: manual, guía de comandos, análisis de ejecución de skill
