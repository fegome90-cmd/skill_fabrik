# Plan de Tests - Fase 3

## Matriz de Tests

| ID | Tipo | Objetivo | Cómo se prueba | Resultado esperado | Severidad |
|----|------|----------|----------------|-------------------|-----------|
| T-001 | Lint | SKILLs válidos | `pnpm skills:lint --strict` | 0 errores, 0 warnings | P0 |
| T-002 | Schema | skill-rules.json válido | jq/validador JSON Schema | Válido | P0 |
| T-003 | Build | Router y CLI compilan | `pnpm -w build` | Exit 0 | P0 |
| T-004 | Activación | Pre-invoke sugiere backend | `pnpm e2e` (prompt endpoint) | Banner backend-dev-guidelines | P0 |
| T-005 | Activación | Pre-invoke sugiere frontend | `pnpm e2e` (prompt componente) | Banner frontend-dev-guidelines | P0 |
| T-006 | Activación | Dominio catálogo | `pnpm e2e` (grid/filtros) | Banner project-catalog-developer | P1 |
| T-007 | Guardrail DB | Bloqueo deleteMany() sin where | `pnpm e2e` (diff peligroso) | blocked=true + notificación | P0 |
| T-008 | Guardrail DB | Permite mutación segura | `pnpm e2e` (diff seguro) | blocked=false | P0 |
| T-009 | Guardrail Secrets | Detecta secreto hardcodeado | Escaneo en cambios | Falla con remediación | P0 |
| T-010 | Stop-pipeline | Formatea solo editados | Editar 2 archivos → stop | Prettier en 2, no resto | P1 |
| T-011 | Stop-pipeline | Typecheck y suma errores | Introducir 3 errores TS | Reporte ≤ umbral | P1 |
| T-012 | Auto-resolver | Sugerir resolver si ≥N errores | Simular ≥5 errores TS | Mensaje auto-resolver | P2 |
| T-013 | Notificaciones | Info/success/warn/error | Provocar 4 escenarios | Scripts disparan sin romper | P1 |
| T-014 | Validador shell | Bloquea rm -rf / | `bash-validator.py --check` | Exit 1 + motivo | P0 |
| T-015 | Rendimiento | Latencia hooks | Medir pre/stop | p95 pre ≤ 200ms, stop ≤ 1500ms | P1 |
| T-016 | Tokens | SKILL.md ≤ ~400 líneas | Conteo líneas | Cumple | P1 |
| T-017 | Recursos | Rutas de resources existen | Script verificador | 100% existen/legibles | P1 |
| T-018 | Scripts | test-auth-route.js ejecuta | `node scripts/test-auth-route.js <URL>` | 2xx/3xx → exit 0 | P2 |
| T-019 | Migración | safe-migrate.ts dry-run | `pnpm ts-node scripts/db/safe-migrate.ts` | Exit 0 (sin accionar) | P2 |
| T-020 | Docs | README presente | Verificación CI | Checksum actualizado | P2 |

## Ejecución

### Suite Completa

```bash
# Ejecutar todos los tests
bash scripts/tests/run-phase3-tests.sh

# Ver reporte
cat obs/test-reports/phase3-summary-*.txt
```

### Tests Individuales

```bash
# T-001: Lint
pnpm skills:lint --strict

# T-002: Schema
node -e "require('./configs/skill-rules.json'); console.log('✅ Válido')"

# T-003: Build
pnpm -w build

# T-004: Activación backend
node packages/skills-cli/dist/index.js skills check "crear endpoint para usuarios" \
  --open-files backend/src/controllers/UserController.ts

# T-005: Activación frontend
node packages/skills-cli/dist/index.js skills check "crear componente nuevo" \
  --open-files frontend/src/components/UserList.tsx

# T-007: Guardrail bloqueo
node packages/skills-cli/dist/index.js guardrail "await prisma.user.deleteMany();"

# T-014: Validador shell
echo "rm -rf /" | python3 scripts/hooks/bash-validator.py
```

## Criterios GO/NO-GO

### GO si y solo si:

- ✅ 100% de P0 pasan (G1, G2-backend/frontend, G3, G5-validator)
- ✅ ≥ 90% de P1 pasan
- ✅ p95 pre-invoke ≤ 200 ms y stop ≤ 1500 ms
- ✅ Ratio activación correcta ≥ 90%

### NO-GO si ocurre:

- ❌ Falla cualquier P0
- ❌ Guardrail DB con falso negativo en patrón crítico
- ❌ Secretos hardcodeados sin remediación
- ❌ Latencia p95 stop hook > 2s en 3 corridas consecutivas
- ❌ SKILL.md monolítico (> 500 líneas) sin refactor

## Reportes

Los reportes se generan en:
- `obs/test-reports/phase3-tests-*.json` - JSON detallado
- `obs/test-reports/phase3-summary-*.txt` - Resumen ejecutivo
- `docs/releases/F3-gate-report.md` - Gate report formal

