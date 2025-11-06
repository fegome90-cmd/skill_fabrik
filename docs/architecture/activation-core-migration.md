# Migración sin rupturas – Activation Core

Objetivo: adoptar el módulo shared en fases, con toggles y métricas.

## Fases
- F0: (hecho) Crear `packages/shared/src/activation/` y docs.
- F1: Daemon lee reglas con `loadSkillRulesCached()` bajo `SF_USE_SHARED_RULES=1`.
- F2: Daemon usa `computeSignals()` shared tras flag `SF_USE_SHARED_SIGNALS=1`.
- F3: CLI `activation` agrega `--explain-shared` para comparar señales.

## Plan de Pruebas
- Unit: comparar salida de `computeSignals` (daemon vs shared) con snapshots.
- Smoke: `scripts/bench-activate.mjs` A/B (flags on/off) midiendo latencia y activaciones.
- E2E: router pre-invoke intacto; no depende del shared.

## Rollout
1) Habilitar `SF_USE_SHARED_RULES=1` en staging.
2) Verificar estabilidad (latencia <5% y activaciones ±2%).
3) Habilitar `SF_USE_SHARED_SIGNALS=1` progresivo (dev → staging → prod).

## Reversión
- Desactivar flags para volver al comportamiento previo.

