# Activation Core – Guía para Devs

Objetivo: probar el núcleo compartido de activación sin romper el runtime.

## Requisitos
- Node 18+, pnpm 8+
- Build del monorepo: `pnpm -w build`

## Flags (opt-in)
- `SF_USE_SHARED_RULES=1` → Daemon carga reglas con cache por mtime (no bloqueante)
- `SF_USE_SHARED_SIGNALS=1` → Daemon usa computeSignals del shared
- `SF_CACHE_TTL=60000` → TTL de activación (ms)

Ejemplos (PM2):
```
# Iniciar con flags (prefijo env)
SF_USE_SHARED_RULES=1 SF_USE_SHARED_SIGNALS=0 pm2 start scripts/pm2/ecosystem.config.cjs \
  --only sf-daemon --env development --update-env

# O reiniciar aplicando flags
env SF_USE_SHARED_RULES=1 SF_USE_SHARED_SIGNALS=0 pm2 restart sf-daemon --update-env
```

## Flujo A/B recomendado
1) Baseline (flags off):
   - `node scripts/bench-activate.mjs` y guarda métricas
2) Activar reglas compartidas:
   - `SF_USE_SHARED_RULES=1` → repetir benchmark
3) Activar señales compartidas (staging):
   - `SF_USE_SHARED_SIGNALS=1` → repetir benchmark

## Verificación rápida
- Salud daemon: `curl -s http://127.0.0.1:7727/health | jq` (revisa ttl/cache)
- Activación CLI: `skills-cli skills activate --intent "crear endpoint" --json`

## Conclusiones esperadas
- Δ activaciones ≤ ±2% (p95)
- Δ latencia p95 ≤ 5%

## Rollback
- Desactivar flags y reiniciar PM2.
