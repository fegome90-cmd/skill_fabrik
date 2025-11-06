# Test Plan – Activation Core

## Alcance
Validar que la adopción del módulo shared no cambia decisiones de activación de forma inesperada.

## Pruebas
- Unit (shared):
  - `computeSignals` con reglas sintéticas (keywords/intent/path/content) → asserts de scores.
  - `aggregateScore` con pesos por defecto y custom.
  - `loadSkillRulesCached` invalida cache al cambiar mtime.
- Unit (daemon):
  - Paridad entre computeSignals actual y shared (dataset fijo de intents/ctx).
- Smoke:
  - `scripts/bench-activate.mjs` con 50 intents comunes, flags on/off; comparar latencia y #candidatos.
- E2E:
  - Router pre-invoke sigue retornando activaciones y notas (slash/plan-check) sin cambios.

## Métricas de Aceptación
- Δ activaciones por intent ≤ ±2% (p95).
- Δ latencia p95 ≤ 5%.
- Sin errores en logs ni regresiones en `/health`.

