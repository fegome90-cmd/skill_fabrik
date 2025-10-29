# Sistema Agéntico y Memoria — Análisis y Plan de Implementación

## Resumen Ejecutivo

- Objetivo: añadir un “Agente Analista” que orqueste la ingesta/análisis de PDFs, persista contexto en MemTech (MCP) y exponga datos al dashboard vía API estable.
- Enfoque: no duplicar pipelines; reutilizar `tools/*` (ETL + tidy‑estricto) y los gateways MCP existentes. Añadir una capa API mínima y el agente con contratos claros.

> Ver también: Guía agnóstica para agentes (contratos/adaptadores): `docs/AGENTE_AGNOSTICO.md`

## Inventario — Qué tenemos hoy

- ETL + Pipelines
  - Extracción híbrida: `tools/extract_pdf_labs.py` (tablas→texto, day‑first, normalización básica).
  - Generación tidy + decisión de formato: `tools/pdf_to_data.py` (CSV/Parquet/NDJSON + `decision.json`).
  - Pipeline estricto desde tidy: `tools/pipeline_tidy_strict.py` (fail‑fast, backend Agg, `plots/index.html`).
  - Runner end‑to‑end: `tools/run_all.py`; validador: `tools/validate_tidy.py`.
- Frontend (Vite + React)
  - Proxy /api → `127.0.0.1:8077`; dev en `127.0.0.1:5175` (configurado en `vite.config.ts`, `.env.local`).
- MemTech (MCP)
  - Configuración y especificaciones: `config/memtech.yaml`, `config/env.memtech.example`, `requirements-memtech.txt`.
  - Gateway/guardas: `mcp/servers/memtech/gateway/*` (health, search, router.pack, checkpoint).
- Documentación y pruebas
  - Informe de arquitectura: `docs/INFORME_OPORTUNIDADES_MEJORA.md`.
  - Manual rápido: `USAGE.txt`.
  - Tests iniciales en `tools/tests/` (fechas/unidades/escala, smoke CLI).

## Faltante — Qué necesitamos

- API mínima (FastAPI) que lea `outputs/latest/*.csv` y exponga endpoints compatibles con el dashboard:
  - `GET /api/query/summary`, `GET /api/query/timeseries/{parameter}`, `GET /api/query/samples`, `POST /api/ingest/upload`, `GET /api/validation`, `GET/POST /api/settings`.
- Agente Analista (segundo agente) con orquestación + persistencia en MemTech (MCP):
  - Decide extractor (tablas→texto→OCR), lanza pipeline tidy‑estricto, valida y persiste “hechos”.
- Módulos core compartidos (para evitar duplicación): fechas, nombres, unidades, escala, ingestión tidy.

## Arquitectura propuesta (alta‑nivel)

- Capas
  - ETL/Pipelines (existente): `tools/*` (no duplicar).
  - API Adapter (nuevo): `api/server.py` (FastAPI, puerto 8077). Lee CSV/JSON de `outputs/latest` → JSON para frontend.
  - Agente Analista (nuevo): orquesta runs y escribe/lee contexto en MemTech vía MCP.
  - Memoria jerárquica (existente): MemTech L0–L3 + gateway/guardas MCP.
- Puertos
  - Frontend: `127.0.0.1:5175` (Vite).
  - Backend API: `127.0.0.1:8077` (FastAPI).

## Flujo de orquestación (Agente Analista)

1. Enforce memoria: `MemoryGuard` (health, locks, contexto mínimo).
2. Ingesta: guardar PDFs, ejecutar `tools/run_all.py` o `pipeline_tidy_strict.py --from-tidy-dir` según el caso.
3. Lectura de artefactos: `outputs/latest/labs_long.csv`, `summary_latest.csv`, `analysis_timeseries.csv`, `validation_summary.json` (si existe), `plots/`.
4. Persistir en MemTech: crear checkpoint (run_id, métricas), registrar series/summary/outliers/“issues”.
5. Exponer estado/resultados: API responde con datos actuales y la UI consulta/actualiza.

## Contratos de datos

- Timeseries API: `{ data: [{ date: YYYY‑MM‑DD, value: number, unit: string }] }`.
- Summary API: `[{ parameter, latest_value, unit, latest_date, ref_low, ref_high, status }]`.
- Samples API: `LabSample[]` (agrupar por fecha/source_file si disponible).
- Memoria (ejemplos):
  - checkpoint: `{ run_id, timestamp, files[], metrics{rows,params,dates,plots}, status }`.
  - timeseries: `{ parameter, points[], stats{delta,slope,outliers,changepoints} }`.
  - issues: `{ type:'ocr_needed'|'unit_unknown'|'parse_gap', file, details }`.

## Proveedor LLM (GLM‑4.6) — Integración

- Patrón OpenAI‑compatible mediante adaptador Zhipu (startkit-main/zen-mcp-agents-hub):
  - Env vars: `GLM_API_KEY` (obligatoria), `GLM_BASE_URL` (opcional, def. `https://api.z.ai/api/coding/paas/v4`).
  - Llamada HTTP: `POST {baseUrl}/chat/completions` con Authorization Bearer + JSON OpenAI‑like.
  - Bridge: convierte parámetros OpenAI→Zhipu (temperature, max_tokens, top_p) y la respuesta Zhipu→OpenAI (choices[0].message, usage…).
- Salud/robustez:
  - Health check periódico + circuit breaker (umbral, timeout, reintentos exponenciales).
  - Ignora/avisa parámetros no soportados (presence/frequency_penalty) para compatibilidad.
- Recomendación:
  - Si el agente analista requiere LLM (resúmenes, decisiones de fallback), reutilizar el patrón OpenAI‑compatible con `GLM_API_KEY` sin acoplarse al SDK de OpenAI.

## Pruebas y Validación (bullet‑proof)

- Unitarias
  - OCR fallback (mock de `subprocess.run`).
  - Ingesta tidy (CSV/NDJSON/Parquet) y fail‑fast sin fecha/valor.
  - Unidades/escala y normalización de nombres.
- Integración
  - API: `/api/query/*` contra fixtures de `outputs/latest/*`.
  - Upload → re‑run → UI actualiza.
- E2E
  - Lote con ≥3 PDFs (incluye escaneado + texto). Verificar plots, summary y estado.
- Resiliencia
  - MemTech offline (configurable): degradar a “stateless” en dev; en prod, bloquear si aplica.
  - Timeouts y reintentos controlados (OCR, extracción).

## Integración MCP/MemTech — Detalles prácticos

- Guardas y gateway disponibles: `mcp/servers/memtech/gateway/*` (MemoryGuard, MCP client).
- Secuencia recomendada por tool crítica:
  1. `memtech.health.ping` (con caché de health) → abortar si `hardBlockIfMemoryOffline=true`.
  2. `memtech.router.pack` para empaquetar contexto mínimo del run (paciente, rango de fechas, archivos).
  3. `memtech.search` para recuperar antecedentes (últimas anomalías/series por parámetro).
  4. `memtech.checkpoint.create` al cerrar un run (persistir métricas y enlaces a artefactos).
- Datos a persistir por run: checkpoint, summary por parámetro, marcas de issues (OCR requerido, unidad desconocida, gaps de parseo) y punteros a CSV/plots.

## API Backend — Diseño y mapeos

- GET `/api/query/summary` → `outputs/latest/summary_latest.csv`
  - Map: `{ parameter, last_value|value → latest_value, unit, date → latest_date, ref_low, ref_high, status }`.
- GET `/api/query/timeseries/{parameter}` → `outputs/latest/labs_long.csv` filtrado
  - Respuesta: `{ data: [{ date, value, unit }] }` (ordenado por fecha).
- GET `/api/query/samples?limit=50` → agrupar `labs_long.csv`
  - Construir `LabSample[]` agregando observaciones por `date` y `source_file` si existe.
- POST `/api/ingest/upload` → guardar PDFs en `./pdfs/` y ejecutar `python tools/run_all.py --data-dir .`
  - Devolver `UploadResponse { processed, results[] }` con estado por archivo.
- GET `/api/validation` → `outputs/latest/validation_summary.json` si existe, o métricas mínimas derivadas.
- GET/POST `/api/settings` → `./settings.json` (ref ranges, name mappings) con validación básica.

## Seguridad y configuración

- API keys: solo por variables de entorno (`GLM_API_KEY`, etc.); no versionar claves.
- CORS: permitir `http://127.0.0.1:5175` en FastAPI; mantener proxy `/api` en Vite.
- Upload: sanitizar nombres, límites de tamaño/tiempo, validación de tipo (PDF), rutas confinadas.
- Logs: no incluir claves ni PII; registrar métricas y contextos técnicos.

## Hardening operacional

- Health checks y circuit breaker (LLM): degradar tarea si proveedor indisponible.
- Timeouts por etapa (OCR, extracción, llamadas HTTP) con reintentos exponenciales.
- Idempotencia por run: usar symlink `outputs/latest` y `run_id` determinístico en API.
- Trazabilidad: `run_metadata.json`, `validation_summary.json`, índice de plots.

## Riesgos y Mitigaciones

- Dependencias opcionales (camelot/ocrmypdf/pyarrow) → detección + rutas de fallback, mensajes claros.
- Fechas ausentes/inconsistentes → fail‑fast documentado (sin sintéticos). QA de PDFs fuente.
- Duplicación de lógica → extraer a `tools/core/*` y reusar.
- Desalineo frontend/API → mantener shapes exactos; usar proxy /api y CORS local.

## Investigación pendiente (ampliada)

- MemTech MCP end‑to‑end: levantar servidor MCP local y verificar `health/search/checkpoint` con `.env.memtech`.
- GLM‑4.6: validar latencia/costo/health en tareas del analista; decidir si el agente lo usa en decisiones o solo para resúmenes.
- OCR: medir tasas de éxito con `ocrmypdf` en PDFs escaneados (multi‑página, baja resolución).
- Performance: baseline tiempo por PDF; diseñar caché (hash por archivo) y evaluar paralelización controlada.
- Seguridad: sanitizer de uploads, límites estrictos, y revisión de PII (fechas/nombres) en artefactos.

## Investigación pendiente

- MemTech MCP “end‑to‑end”: probar health/search/checkpoint en local (scripts/health, `.env.memtech`).
- OCR/quality: evaluar tasas de éxito con ocrmypdf y páginas escaneadas variadas.
- Performance: medir tiempo por PDF (pre/post caché), impacto de paralelización.
- Seguridad: sanitizar inputs en upload; límites y políticas de tamaño/tiempo.

## Roadmap por Fases

- Fase 1 — API mínima + QA (1–2 días)
  - Implementar `api/server.py` (endpoints mínimos), CORS, requirements.
  - QA con frontend (proxy /api) y datasets actuales.
- Fase 2 — Agente Analista (2–4 días)
  - Carpeta/servicio del agente; integrar MemoryGuard + MCP; persistir checkpoints/hechos.
  - Añadir tests de integración + validaciones.
- Fase 3 — Core y rendimiento (3–5 días)
  - `tools/core/*` (fechas, nombres, unidades, escala, ingestión tidy) y refactor controlado.
  - Caché de PDFs y paralelización en extracción; métricas de rendimiento.

## Checklists operativos

- API
  - [ ] `/api/query/summary`
  - [ ] `/api/query/timeseries/{parameter}`
  - [ ] `/api/query/samples`
  - [ ] `/api/ingest/upload`
  - [ ] `/api/validation`, `/api/settings`
- Agente Analista (MCP)
  - [ ] Health/locks (MemoryGuard)
  - [ ] Run pipeline + lectura de artefactos
  - [ ] Persistencia de checkpoint + hechos
  - [ ] Tooling MCP (tools/registry) y guardas
- Core y pruebas
  - [ ] Extraer `tools/core/*` y reemplazar duplicaciones
  - [ ] Tests unitarios + integración + E2E
  - [ ] Documentación de “Run backend + frontend” (añadir a `USAGE.txt`)

---

Este plan evita trabajo duplicado, se ancla a los artefactos existentes (`tools/*`, `outputs/latest/*`, gateway MCP) y prioriza compatibilidad con el dashboard. La implementación incremental (API → Agente → Core) reduce riesgos y facilita validación continua.

---

## Secuencia Operacional (prioridad: montar Front + Back; luego Agente)

- Paso 1: API mínima estable (FastAPI en 127.0.0.1:8077) y dashboard consumiendo `/api/*` sin errores.
- Paso 2: QA con datos reales (≥3 PDFs, tidy válido) y verificación de `outputs/latest/*` + gráficos.
- Paso 3: Agente Analista (MCP+MemTech) orquestando los mismos pipelines y persistiendo contexto.

> Nota: No introducir el Agente hasta que Back+Front estén estables y validados contra datasets reales.

## Agente Analista — Diseño Detallado

- Responsabilidades
  - Orquestar una corrida: decidir extractor (tablas→texto→OCR), invocar pipeline tidy‑estricto, validar y publicar artefactos.
  - Persistir contexto en MemTech (L0–L3): checkpoint de run, series, resumen, issues (OCR/escala/nombre/unidad), punteros a CSV/plots.
  - Exponer estado a Back (opcional vía `/api/runs` si se agrega en el futuro).

- Máquina de estados (por PDF)
  - `pending → extracting → normalizing → persisting → done | failed`
  - Reglas: reintentos exponenciales en `extracting` y `normalizing`; `failed` registra issue y no detiene lote.

- Idempotencia y contexto
  - `run_id` determinístico por lote (timestamp + hash del set de PDFs); usar `outputs/<run_id>` y `outputs/latest`.
  - Locks suaves con MemoryGuard (clave: `memtech:snickers:<run_id>`), TTL del lock y liberación en `done|failed`.

- Interfaces (MCP Tools propuestos)
  - `labs.pipeline.run({ mode, data_dir, tidy_dir? }) → { run_id, outputs }`
  - `labs.data.load({ run_id|'latest' }) → { labs_long, summary, analysis, plots }`
  - `labs.memory.push({ run_id, checkpoint, summary, issues }) → { ok }`
  - `labs.validation.report({ run_id }) → { metrics, validations }`

## Integración con MemTech (MCP) — Contratos y ejemplos

- Precondiciones
  - `memtech.health.ping() → { status: 'online'|'offline', ts }`
  - `MemoryGuard.enforce(input)`: health cache + circuit breaker; si `hardBlockIfMemoryOffline=true`, aborta.

- Empaquetado, búsqueda y checkpoint

```json
// memtech.router.pack
{
  "agent": "snickers-analyst",
  "context": { "patient": "Snickers", "run_id": "2025-10-28_134806", "files": ["A.pdf","B.pdf"] }
}

// memtech.search (antecedentes por parámetro)
{ "query": { "parameter": "Glucosa", "limit": 5 } }

// memtech.checkpoint.create
{
  "name": "snickers-run-2025-10-28_134806",
  "metadata": { "rows": 332, "params": 62, "dates": 5, "plots": 48, "status": "done" }
}
```

### Evolución de contexto (ACE) y ADRs

- Además de hechos/checkpoints, registrar ADRs para problemas recurrentes (plantilla: Contexto→Decisión→Alternativas→Consecuencias→Evidencia).
- Guardar ADRs en L3 y enlazarlos a runs/issues; recuperar ADRs similares para sugerir acciones.
- Permitir que el agente actualice políticas (ranges/mappings) con aprobación humana basada en ADRs.

### Puentes actuales (implementados)

- CLI genérica `memtech/cli/memtech_cli.mjs` (health, store, resolve, search, stats) con fallback a almacenamiento local (`.memtech/local-store`).
- Servicio Python `backend/services/memtech_bridge.py` para backend/API (`/api/memtech/*`).
- API FastAPI (`/api/memtech/health|stats|store|resolve|search`) lista para uso del futuro Agente Analista.
- Scripts de prueba (`npm run test` en `mcp/servers/memtech`) garantizan operatividad básica del stack.
- `.gitignore` actualizado para excluir `.memtech/`; CLI y backend cargan `.env.memtech` si existe (no obligatorio).

### Base del Agente Analista (nueva)

- Carpeta `agents/analyst/` con:
  - `README.md` (instrucciones rápidas, próximos pasos).
  - `config/analyst.config.yaml` (puentes iniciales: pipeline, memtech, feedback).
  - `orchestrator/orchestrator.py` (stub `AnalystOrchestrator`, `RunState`, `PipelineResult`).
  - `tools/` (`pipeline_adapter.py`, `memory_client.py`, `feedback_queue.py`).
  - `scripts/run_agent.py` (CLI stub).
  - `tests/test_orchestrator.py` (`xfail` recordatorio para completar lógica).

## Gestión de errores y reintentos (a prueba de balas)

- OCR: timeout fijo (p.ej., 60s), 1 reintento; degradar a texto si OCR falla.
- Extracción/tablas: lattice→stream→texto; si todos fallan, issue `parse_gap` con muestra de líneas.
- Unidades/escala: `auto_detect_scale_issue` + reglas de `unify_units`; si desconocida, issue `unit_unknown`.
- LLM (GLM‑4.6, si se usa para resúmenes): health check + circuit breaker; degradar a resumen mínimo offline.
- Subprocesos: `run_all.py` con captura de salida, timeout global del lote y abort controlado.

### Loop de feedback humano

- Estado `waiting_feedback` para casos irresolubles (tras K reintentos o códigos específicos).
- Endpoints sugeridos: `/api/feedback/pending` (listar) y `/api/feedback/submit` (aplicar decisiones).
- Registrar decisiones y consecuencias; alimentar políticas para reducir futuras intervenciones.

## Métricas y telemetría

- Por run: duración total, n_pdfs, n_rows, n_params, n_dates, n_plots, %descartes (sin fecha/valor), errores por fase.
- Por parámetro: n puntos, rango temporal, outliers/changepoints, delta y slope.
- Memoria: health rate, latencia MCP, fallos de checkpoint.

## Concurrencia y paralelización controlada

- Pool de workers con topes por fase: p.ej., `extract=N` (IO‑bound), `ocr=1..2` (CPU‑bound), `normalize=M`.
- Throttling dinámico por métricas de recursos (CPU/mem/IO) y profundidad de cola; fairness entre corridas.
- Exponer política actual y estado en `/api/runs/status` (opcional) para observabilidad.

## Seguridad y cumplimiento

- Upload: validar tipo (PDF), tamaño máximo, nombre saneado, carpeta confinada `./pdfs`.
- Artefactos: no exponer PII en logs; `summary`/`labs_long` sólo con campos técnicos.
- API keys: variables de entorno (`GLM_API_KEY`, etc.), nunca en repositorio.

## Criterios de aceptación (UAT)

- Back+Front: `/api/summary` y `/api/timeseries/:param` responden con datos reales, dashboard muestra KPIs y gráficos.
- Agente: corre lotes con ≥3 PDFs, persiste checkpoint y emite issues cuando proceda, sin bloquear por PDF fallido.
- Reejecución: correr el mismo lote no duplica ni corrompe artefactos; `outputs/latest` apunta al run más reciente.

## Plan de implementación del Agente (tras Back+Front)

- Semana 1
  - Estructura del agente y tools MCP (`labs.*`), integración `MemoryGuard`.
  - Orquestador mínimo: invoca pipeline tidy‑estricto y publica checkpoint+summary.
  - Tests de integración con fixtures `outputs/<run>/`.
- Semana 2
  - Issues y robustez: OCR, unidades desconocidas, escala; reintentos y timeouts.
  - Persistencia ampliada (series/outliers/changepoints) y métricas de performance.
  - Documentación y tablero de estado (opcional `/api/runs`).

---

## Checklist Go/No‑Go (previo a levantar el Agente)

Backend (API) — Go si todas pasan

- [ ] API escuchando en `http://127.0.0.1:8077`
- [ ] `GET /api/query/summary` → array con campos `[parameter, latest_value, latest_date, ref_low, ref_high, status]`
- [ ] `GET /api/query/timeseries/{param}` → `{ data: [...] }` ordenada por fecha; existe ≥1 parámetro con ≥2 puntos
- [ ] `GET /api/query/samples` → responde lista (no error) y respeta `?limit`
- [ ] `POST /api/ingest/upload` → guarda PDF y dispara run; `outputs/latest` actualizado
- [ ] `GET /api/validation` → JSON válido (archivo o derivado)

Frontend (Dashboard) — Go si todas pasan

- [ ] Vite en `http://127.0.0.1:5175`; proxy `/api` → `8077`
- [ ] Tarjetas de resumen pobladas sin errores de consola
- [ ] Gráficos se renderizan para ≥1 parámetro con ≥2 puntos
- [ ] Subir 1–2 PDFs desde UI actualiza summary y gráficos tras el run

Datos y artefactos — Go si todas pasan

- [ ] `outputs/latest/` contiene: `labs_long.csv`, `labs_wide.csv`, `summary_latest.csv`, `analysis_timeseries.csv`, `plots/*.png`, `plots/index.html`
- [ ] `labs_long.csv` no está vacío y tiene fechas válidas (sin sintéticos)
- [ ] `summary_latest.csv` mapea correctamente a la API (rename `value→latest_value`, `date→latest_date` si aplica)

Rendimiento y estabilidad — Go si todas pasan

- [ ] Tiempo total de run (N PDFs) dentro del umbral acordado (anotar baseline)
- [ ] OCR no excede timeout por PDF; reintentos controlados sin bloquear lote
- [ ] Sin errores 5xx/shape mismatches en `/api/*`

Seguridad y configuración — Go si todas pasan

- [ ] Upload valida tipo/tamaño y sanea nombres; guarda en `./pdfs`
- [ ] CORS solo para `http://127.0.0.1:5175`
- [ ] API keys (p.ej., `GLM_API_KEY`) por entorno; no versionadas

No‑Go (cualquier ítem ⇒ bloquear despliegue del Agente)

- [ ] `labs_long.csv` vacío o sin fechas válidas
- [ ] Todos los gráficos clínicos faltan (n<2 en todos los parámetros relevantes)
- [ ] Endpoints `/api/*` con 5xx o shapes inesperados
- [ ] MemTech configurado en modo estricto pero `health=offline` (si se activa bloqueante)

Evidencia y registro

- [ ] Capturas/links: `outputs/latest/plots/index.html`, dashboard (summary+chart), `run_metadata.json`
- [ ] Logs de API y del run (`tools/run_all.py`) sin stack traces críticos

Comandos de verificación (rápidos)

```bash
# Backend
uvicorn api.server:app --host 127.0.0.1 --port 8077 --reload
curl -s http://127.0.0.1:8077/api/query/summary | jq '.[0]'

# Frontend
npm -C snickers-veterinary-analytics-dashboard run dev

# Run end‑to‑end por CLI
python tools/run_all.py --data-dir . && open outputs/latest/plots/index.html
```

## TODOs detallados — Implementación del Agente Analista

1. Paralelización controlada

- [ ] Implementar pool por fase: `extract=N` (IO), `ocr=1..2` (CPU), `normalize=M`.
- [ ] Throttling dinámico por métricas (CPU/mem/IO) y profundidad de cola; fairness entre corridas.
- [ ] Exponer estado/política en `/api/runs/status` (opcional).

2. Loop de feedback humano

- [ ] Añadir estado `waiting_feedback` para casos irresolubles tras K reintentos.
- [ ] Implementar `/api/feedback/pending` y `/api/feedback/submit` (validación + persistencia).
- [ ] Registrar decisiones; actualizar políticas para reducir futuras intervenciones.

3. Evolución de contexto (ACE) y ADRs

- [ ] Definir plantilla ADR (Contexto→Decisión→Alternativas→Consecuencias→Evidencia).
- [ ] Persistir ADRs en L3 (MemTech) y enlazarlas a runs/issues.
- [ ] Recuperar ADRs similares para sugerir acciones; flujo de aprobación humana para cambios de política.

4. Gobernanza de tools (si se orquesta vía MCP)

- [ ] Exigir meta en tool calls `{agentId, phase}` y evidence para herramientas críticas.
- [ ] Registrar auditoría inmutable de tool calls; validar `schema_version` de contratos.
- [ ] Definir gates de consenso (p.ej., 2‑of‑3) en acciones de alto riesgo.

5. Observabilidad y métricas

- [ ] Añadir logs estructurados (JSON) con `trace_id`, `run_id`, `phase`, `duration_ms`, `error_code`.
- [ ] Métricas: `runs_total|failed`, `api_requests_total|errors_total`, `ocr_invocations`, `plots_generated`.
- [ ] Exponer `/api/runs` (list/detail/latest) y `manifest.json` por run con versiones y esquemas.

## Snippets — GLM‑4.6 (OpenAI‑compatible)

### Node.js (ESM)

```js
// npm i node-fetch
import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_URL = process.env.GLM_BASE_URL || 'https://api.z.ai/api/coding/paas/v4';
const API_KEY = process.env.GLM_API_KEY; // export GLM_API_KEY=...

if (!API_KEY) throw new Error('Falta GLM_API_KEY');

const payload = {
  model: 'glm-4.6',
  messages: [{ role: 'user', content: 'Resume en 1 línea: Snickers pipeline status.' }],
  temperature: 0.7,
  max_tokens: 512,
  top_p: 0.9,
};

const res = await fetch(`${BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Snickers/analyst-agent',
  },
  body: JSON.stringify(payload),
});

if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
const data = await res.json();
console.log(data.choices?.[0]?.message?.content || '');
```

### Python (requests)

```python
import os, requests

BASE_URL = os.environ.get('GLM_BASE_URL', 'https://api.z.ai/api/coding/paas/v4')
API_KEY = os.environ.get('GLM_API_KEY')
assert API_KEY, 'Falta GLM_API_KEY'

payload = {
    'model': 'glm-4.6',
    'messages': [
        {'role': 'user', 'content': 'Explica el flujo tidy-estricto en 2 líneas.'}
    ],
    'temperature': 0.5,
    'max_tokens': 400
}
resp = requests.post(
    f'{BASE_URL}/chat/completions',
    headers={'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'},
    json=payload,
    timeout=30
)
resp.raise_for_status()
print(resp.json()['choices'][0]['message']['content'])
```

Notas:

- Mantener timeouts y reintentos con backoff según criticidad.
- Ignorar parámetros no soportados por Zhipu (e.g., presence/frequency_penalty).

## Esqueleto FastAPI (referencia)

```python
# api/server.py (referencia)
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from pathlib import Path
import pandas as pd
import json, subprocess, os

BASE = Path(__file__).resolve().parents[1]
LATEST = BASE / 'outputs' / 'latest'

app = FastAPI(title='Snickers API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://127.0.0.1:5175'],
    allow_methods=['*'],
    allow_headers=['*'],
)

def _csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise HTTPException(404, f'No existe {path.name}')
    return pd.read_csv(path)

@app.get('/api/query/summary')
def get_summary() -> List[Dict[str, Any]]:
    df = _csv(LATEST / 'summary_latest.csv')
    # Mapear a shape esperado por el frontend
    # (latest_value/latest_date desde value/date si aplica)
    cols = {c.lower(): c for c in df.columns}
    if 'latest_value' not in df.columns and 'value' in df.columns:
        df = df.rename(columns={'value': 'latest_value'})
    if 'latest_date' not in df.columns and 'date' in df.columns:
        df = df.rename(columns={'date': 'latest_date'})
    fields = ['parameter','latest_value','unit','latest_date','ref_low','ref_high','status']
    return df[ [c for c in fields if c in df.columns] ].to_dict(orient='records')

@app.get('/api/query/timeseries/{parameter}')
def get_timeseries(parameter: str) -> Dict[str, Any]:
    df = _csv(LATEST / 'labs_long.csv')
    mask = df['parameter'].astype(str).str.lower() == parameter.lower()
    out = df.loc[mask, ['date','value','unit']].sort_values('date') if 'unit' in df.columns else df.loc[mask, ['date','value']].sort_values('date')
    return {'data': out.to_dict(orient='records')}

@app.get('/api/query/samples')
def get_samples(limit: int = 50) -> List[Dict[str, Any]]:
    df = _csv(LATEST / 'labs_long.csv')
    if 'source_file' not in df.columns:
        df['source_file'] = 'unknown.pdf'
    groups = df.groupby(['date','source_file'])
    samples = []
    for (date, src), g in groups:
        obs = g[['parameter','value','unit']].to_dict(orient='records') if 'unit' in g.columns else g[['parameter','value']].to_dict(orient='records')
        samples.append({'id': f'{date}-{src}', 'date': str(date), 'source_file': src, 'observations': obs})
    return samples[:limit]

@app.post('/api/ingest/upload')
async def ingest_upload(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    pdf_dir = BASE / 'pdfs'
    pdf_dir.mkdir(exist_ok=True)
    results = []
    for f in files:
        dest = pdf_dir / f.filename
        with dest.open('wb') as out:
            out.write(await f.read())
        results.append({'file': f.filename, 'status': 'saved'})
    # Disparar pipeline
    subprocess.run(['python', str(BASE / 'tools' / 'run_all.py'), '--data-dir', str(BASE)], check=False)
    return {'processed': len(results), 'results': results}

@app.get('/api/validation')
def get_validation() -> Dict[str, Any]:
    p = LATEST / 'validation_summary.json'
    if p.exists():
        return json.loads(p.read_text())
    # Métricas mínimas derivadas si no existe
    df = _csv(LATEST / 'labs_long.csv')
    return {'rows_long': len(df), 'n_parameters': int(df['parameter'].nunique())}

@app.get('/api/settings')
def get_settings() -> Dict[str, Any]:
    p = BASE / 'settings.json'
    return json.loads(p.read_text()) if p.exists() else {'refRanges': {}, 'mappings': []}

@app.post('/api/settings')
def set_settings(body: Dict[str, Any]) -> Dict[str, Any]:
    p = BASE / 'settings.json'
    p.write_text(json.dumps(body, ensure_ascii=False, indent=2))
    return {'status': 'ok'}
```

Comandos (dev):

- `pip install fastapi uvicorn pandas`
- `uvicorn api.server:app --host 127.0.0.1 --port 8077 --reload`

---

## Especificaciones Operativas (SLO/SLA y Presupuestos)

- Latencia API: p50 ≤ 150 ms, p95 ≤ 600 ms (local) para `/api/query/*` con artefactos ya generados.
- Tiempo de corrida (N PDFs): objetivo ≤ 90s para 5 PDFs estándar (sin OCR masivo); OCR añade hasta +60s/PDF.
- Disponibilidad local (dev): n/a; en prod: error budget ≤ 1% mensual de 5xx en `/api/*`.
- Presupuesto LLM (si se usa): máximo $0.50/día, hard‑stop con circuit breaker.

## Taxonomía de Errores y Política de Retries

- OCR_TIMEOUT → 1 reintento; si persiste, degradar a texto plano y crear `issue: ocr_needed`.
- TABLE_PARSE_FAIL → fallback a stream→texto; si falla, `issue: parse_gap` con muestra de líneas.
- UNIT_UNKNOWN → registrar y continuar; marcar `issue: unit_unknown` y dejar unit vacío (o preferencia base).
- SCALE_SUSPECT → aplicar `auto_detect_scale_issue` y taggear corrección en metadatos.
- API_SHAPE_MISMATCH → 500 + log estructurado con `trace_id`; bloquear Go/No‑Go.

## Observabilidad y Trazabilidad

- Logging estructurado (JSON) con claves: `trace_id`, `run_id`, `phase`, `filename`, `duration_ms`, `error_code`.
- Propagar `run_id` a todos los logs y a `run_metadata.json`.
- Métricas mínimas: `runs_total`, `runs_failed`, `ocr_invocations`, `plots_generated`, `api_requests_total`, `api_errors_total`.
- Trazas manuales: anotar inicios/finales de fases (extract/normalize/persist/plot).

## Esquemas de Datos y Versionado

- labs_long.csv: `date(ISO)`, `parameter(str)`, `value(float)`, `unit(str|empty)`, `source_file(str)`.
- summary_latest.csv: `parameter`, `latest_value`, `latest_date(ISO)`, `unit?`, `ref_low?`, `ref_high?`, `status`.
- analysis_timeseries.csv: `parameter`, `first_date`, `last_date`, `n_points`, `slope_per_day`, `delta_abs`, `delta_pct`, `outliers_idx`, `changepoints_idx`.
- Versionado de contrato API: v1 estable; añadir `X-Contract-Version: 1` si se requiere auditar.

## Seguridad (Threat Model resumido)

- Superficie: Upload de PDFs, lectura de CSV locales, llamadas LLM (opcional), endpoints `/api/*`.
- Controles: limitación de tamaño de upload, verificación de tipo MIME/ext, sandbox de escritura a `./pdfs`, CORS limitado, redacción de PII en logs.
- Secretos: sólo env vars (`GLM_API_KEY`, etc.), `.env*` ignorados por VCS.
- Protección DoS local: `max_concurrent_runs=1` (cola) y tamaño/burst por IP para `/api/ingest/upload`.

## Concurrencia y Bloqueos

- Un único run activo por `run_id`; lock de proceso (archivo `.lock` en `outputs/<run_id>/`) + `MemoryGuard` si MCP activo.
- Backpressure: si llega un nuevo upload durante un run, encolar o rechazar con 429 y mensaje "run en progreso".

## Procedimientos de Recuperación y Rollback

- Falla en medio de la corrida: mantener todo en `outputs/<run_id>/` y no tocar `outputs/latest`.
- Rollback: si un run falla tras publicar, re‑linkear `outputs/latest` al run previo estable y registrar incidente.
- Reejecutar: eliminar `.lock`, depurar `tmp/`, y ejecutar `tools/run_all.py` con los mismos PDFs.

## Matriz de Pruebas (prioritaria)

- OCR/Escaneados: 3 PDFs (texto escaso, multi‑página, baja resolución) → verificar `ocr_needed` y datos válidos.
- Tablas complejas: PDFs con celdas unidas y columnas desalineadas → stream fallback.
- Unidades/escala: casos Albúmina g/L→g/dL; Hematocrito fracción→%; Leucocitos x1000.
- API: inputs inválidos (param no existente), límite `samples?limit=1`, shape de summary/timeseries.
- Performance: lote 10 PDFs → medir tiempo total y generación de 20+ plots.

## Datos Sintéticos para QA

- Generar PDFs de prueba con plantillas (tabla simple, fechas en cabecera/pie, valores controlados).
- Incluir un set con unidades no preferidas y valores mal escalados para validar correcciones.

## Modo Degradado y Offline

- Sin LLM: resúmenes mínimos a partir de `summary_latest.csv`.
- Sin Camelot: sólo texto con regex; avisar de `precision: low` en logs.
- MCP offline: si `hardBlockIfMemoryOffline=false`, omitir persistencia pero mantener run y API.

## CI/CD y Entornos

- Pre‑merge: `pytest -q` (tests de tools), lint básico; opcional smoke API en CI.
- Pre‑release local: script que corre `tools/run_all.py` con set de PDFs de QA y verifica Go/No‑Go.
- Entornos: `dev` (local), `staging` (datos sintéticos), `prod` (datos reales controlados).
