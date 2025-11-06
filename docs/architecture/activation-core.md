# Activation Core (Shared)

Objetivo: unificar el cálculo de señales y tipos de activación en `packages/shared`, reduciendo drift entre daemon, router y Prompt Builder v2, sin romper el sistema actual.

## Problema
- Heurísticas duplicadas: `computeSignals` (daemon), reglas del router y scoring en Prompt Builder.
- Umbrales/pesos dispersos; reglas cargadas con distintos mecanismos y sin cache coherente.

## Propuesta
- Nuevo módulo: `packages/shared/src/activation/`
  - `index.ts`: tipos (`SkillRules`, `SignalScores`) y funciones puras: `computeSignals()`, `aggregateScore()`.
  - `rules-loader.ts`: `loadSkillRulesCached(cwd)` con cache por mtime.
- No hay cambios de consumo aún; es scaffolding para adopción progresiva.

## API (v0)
- `computeSignals(intent, ctx, rules) -> SignalScores`
- `aggregateScore(signals, weights?) -> number`
- `loadSkillRulesCached(cwd) -> SkillRules`
- Constantes: `DEFAULT_SIGNAL_WEIGHTS`, `DEFAULT_ACTIVATION_THRESHOLD (0.6)`

## Integración Faseada
1) Fase 0 (actual): solo docs + módulo shared (sin uso externo).
2) Fase 1: daemon usa `rules-loader` (cache mtime) detrás de flag.
3) Fase 2: daemon reemplaza su `computeSignals` por shared (flag). Router mantiene su engine.
4) Fase 3: CLI `activation` puede imprimir señales usando shared (solo lectura).

## Flags sugeridos
- `SF_USE_SHARED_RULES=1` (daemon)
- `SF_USE_SHARED_SIGNALS=1` (daemon)

## Riesgos y mitigación
- Cambio de pesos: mantener `DEFAULT_SIGNAL_WEIGHTS` compatibles y comparativas A/B.
- Regresiones: habilitar por flags y medir latencia/activaciones antes de promover por defecto.

