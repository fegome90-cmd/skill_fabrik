# ALERTA: Configuración del Motor de Activación (NO ROMPER)

Este archivo documenta la configuración sensible del motor de activación. Cambios aquí pueden desactivar activaciones o degradar el sistema. Usa SIEMPRE este flujo para calibrar.

## Variables de entorno (Daemon)
- SF_USE_SHARED_RULES=1  Activa loader compartido de reglas (recomendado)
- SF_USE_SHARED_SIGNALS=1  Usa computeSignals del shared (opt‑in seguro)
- SF_ACTIVATION_THRESHOLD=0.6  Umbral global por defecto (CLI/HTTP puede sobrescribir)
- SF_W_KEYWORDS=0.25 SF_W_INTENT=0.25 SF_W_PATH=0.25 SF_W_CONTENT=0.25  Pesos de señales (sumados se normalizan)

Reinicio con flags: `SF_USE_SHARED_RULES=1 SF_USE_SHARED_SIGNALS=1 pm2 restart sf-daemon --update-env`

## Overrides por request (/activate)
- options.threshold: número (ej. 0.6)
- options.signalWeights: `{ keywords, intent, path, content }`

Respuesta incluye: `metrics.weights` y `/health.services.signals` expone weights y threshold por defecto.

## Flags útiles (CLI)
- `skills activate --intent "..." --threshold 0.6 [--daemon URL]` (ajuste puntual)
- `prompt-builder --validate` (compara PBv2 vs /activate)
- `prompt-builder --raw --no-audit` (DX, no afecta activación)

## Dónde quedan los datos (no dashboards)
- PBv2: `dev/agent-dev-docs/pb2-activations.jsonl`, `pb2-daily-YYYY-MM-DD.json`
- Señales daemon: `dev/agent-dev-docs/pb2-signals.jsonl`
- Activaciones con contexto: `dev/agent-dev-docs/activate-activations.jsonl`

## Flujo SEGURO de calibración
1) Reinicia daemon con shared (arriba).
2) Corre lote con contexto: `pnpm activate:batch && pnpm activate:report`.
3) Barre umbral/pesos: `pnpm activate:sweep` y revisa `dev/agent-dev-docs/activate-sweep-*.json`.
4) Fija envs (solo si mejora): SF_W_* y SF_ACTIVATION_THRESHOLD. Reinicia.
5) Sanity: `prompt-builder --validate` en casos P1.

## Políticas (Do / Don’t)
- DO: ajustar primero por request (threshold/weights) y validar con `activate:sweep`.
- DO: usar envs SF_W_* / SF_ACTIVATION_THRESHOLD SOLO tras evidencia en archivos de dev/agent-dev-docs.
- DO: mantener SF_USE_SHARED_RULES=1 (loader estable) y activar SF_USE_SHARED_SIGNALS=1 para paridad.
- DON’T: cambiar defaults en código; usa envs y reinicio.
- DON’T: subir umbral sin dataset con contexto; causa 0 activaciones.

## Reversión rápida (si algo rompe)
1) Exporta: `SF_ACTIVATION_THRESHOLD=0.6 SF_W_KEYWORDS=0.25 SF_W_INTENT=0.25 SF_W_PATH=0.25 SF_W_CONTENT=0.25`
2) Reinicia daemon: `pm2 restart sf-daemon --update-env`
3) Verifica salud: `curl -s :7727/health | jq '.services.signals, .metrics'`
4) Caso control: `skills activate --intent "lint rápido" --json` (debe activar)

## Señales de advertencia
- `candidatesEvaluated: 0` → revisa loaders y default candidates (ya activados por código).
- Cache hit 0% persistente → prompts variados o múltiples instancias sin Redis; prueba repetición misma intent.
- `.services.rules.usingSharedLoader: false` sin querer → exporta SF_USE_SHARED_RULES=1 y reinicia.

Mantén este archivo visible en PRs de calibración. No merges sin evidencia en `dev/agent-dev-docs/`.

