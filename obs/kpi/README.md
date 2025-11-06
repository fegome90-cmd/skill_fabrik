# KPI Quickstart

## Fuente
- Archivo: `obs/kpi/events.jsonl` (JSON Lines)
- Campos útiles: `ts`, `repo`, `task`, `skill|skills`, `errors_ts`, `zero_errors_left_behind`, `latency_ms`, `labels[]`

## Rollup diario
- Script: `scripts/kpi/rollup.mjs`
- Salida: `obs/kpi/daily/<YYYY-MM-DD>.json` + `index.json`

### Ejecutar
```bash
node scripts/kpi/rollup.mjs
```

### Ejemplo de evento (smoke)
```json
{"ts":"2025-10-30T12:00:00.000Z","repo":"skills-fabrik","task":"F0 Bootstrap","skill":"plan-save-workflow","policy_decision":"allow","policy_tool":"plan-save","labels":["@intent:plan-approve","@skill:plan-save-workflow"]}
```

## Consultas rápidas
- Tasa zero-errors: contar eventos con `zero_errors_left_behind=true` / total por día.
- Carga por skill: agrupar por `skill` o concatenación de `skills[]`.
- Tendencia de `errors_ts_sum`: sumatoria por día.


