# Context (Sprint actual)

Arquitectura actual
- Daemon: endpoints /activate y /execute; cache TTL + estado distribuido opcional; señales calculadas ad‑hoc; reglas leídas con execSync.
- Router: pre‑invoke (slash, planning gate, match rules, merge con daemon) y stop hook (Prettier → Typecheck → hints/auto‑resolver → KPI).
- CLI: comandos skills (activate/execute), prompt-builder v2 y utilidades.
- Prompt Builder v2: detección de files/paths, TAGs, Template 1.1.0, post‑audit 4D; intenta plan‑check por ruta relativa.

Skills & Activaciones
- Skills: `skills/<categoria>/*/SKILL.md` con frontmatter (id, type, when_to_use, resources, severity).
- Reglas: `configs/skill-rules.json` alimenta heurística multi‑señal (keywords 20%, intent 30%, path 30%, content 20%).
- Estado actual: reglas incluyen mayormente `keywords`; faltan `intentPatterns`, `pathPatterns` y `contentPatterns` para varios skills → activación real tiende a ser por keyword.
- Router: tests usan reglas mock con patrones completos (path/content), no reflejan totalmente reglas reales → riesgo de gap entre mock y producción.
- Daemon: añade candidatos base (`repo-auditor`, `lint-fast`, `refactor-safe`) que pueden activarse con poca señal; threshold 0.6 gobierna salida.

Mocks & Simulaciones
- Bench: `scripts/bench-activate.mjs` (mide p50/p95 de /activate). Snapshots: `scripts/snapshot-activate.mjs` y `scripts/snapshot-execute.mjs`.
- Router tests: `packages/router/src/__tests__/` con reglas mock y escenarios de path/content.
- CLI dry‑run: `skills-cli skills execute --skill-id <id> --dry-run` (no efectos), y `skills activate --intent` para probar activaciones.

Hook triggering (terminal/IDEs)
- Los hooks NO dependen de Cursor. Se disparan desde cualquier herramienta:
  - Node (import directo):
    - Pre‑invoke: `node -e 'import {userPromptSubmitHook as h} from "./packages/router/dist/index.js";(async()=>{const out=await h({prompt:"<text>",openFiles:[],activeFileContent:"",cwd:"."});console.log(JSON.stringify(out,null,2));})();'`
    - Stop: `node -e 'import {stopHook as h} from "./packages/router/dist/index.js";(async()=>{const edit=[{file:"a.ts",repo:"root",ts:Date.now()}];const out=await h({editLog:edit,reposChanged:new Set(["root"]),cwd:"."});console.log(JSON.stringify(out,null,2));})();'`
  - HTTP (router service):
    - Levantar: `pm2 start scripts/pm2/ecosystem.config.cjs --only router-service`
    - Pre‑invoke: `curl -s http://127.0.0.1:3000/pre-invoke -H 'content-type: application/json' -d '{"prompt":"<text>","openFiles":[],"activeFileContent":"","cwd":"."}' | jq`
    - Stop: `curl -s http://127.0.0.1:3000/stop -H 'content-type: application/json' -d '{"editLog":[{"file":"a.ts","repo":"root","ts":123}],"reposChanged":["root"],"cwd":"."}' | jq`
- Daemon es opcional: el pre‑invoke lo consulta si está disponible; si no, funciona igual con reglas locales.

Suposiciones del sprint
- Umbral base de activación 0.6; pesos 25% c/u (keywords/intent/path/content) → mantenemos por compatibilidad.
- Cambios gated por flags (no alteramos comportamiento por defecto).
- Dataset de activaciones reales se construye a partir de prompts típicos y openFiles de flujos recientes.

Decisiones vigentes
- No cambiar contratos públicos de APIs/CLI.
- Orquestación vía startup‑manager; ecosystem actúa como configuración PM2 pero no gobierna dependencia/health.
- Guardrails y hooks se mantienen; priorizamos idempotencia y No‑Mess Left Behind.

Daemon – detalles
- Cache activación: TTL ms (env SF_CACHE_TTL), LRU con evicción 25% y limpieza periódica (SF_CACHE_CLEANUP_INTERVAL); contadores de cacheHits/cacheMisses/evictions; soporte de estado distribuido (SF_STATE_REDIS=1) con fallback a memoria; /api/cache/{stats,clear} y /metrics.
- Seguridad: API key opcional (DAEMON_API_KEY) y JWT HS256 (DAEMON_JWT_SECRET). CORS configurado vía YAML/env.
- Descubrimiento: registro/heartbeat opcional (SF_DISCOVERY=1) contra Service Discovery.
- Riesgos: `execSync('cat skill-rules.json')` para cargar reglas; bloqueo y dependencia de OS. `npx eslint --fix` por execSync en /api/quality/lint.
- Señales: computeSignals interno con pesos 25% c/u; threshold aplicado post‑candidatos.

PM2 – detalles
- Ecosystem: `sf-daemon` (cluster opt‑in con PM2_CLUSTER), `router-service` (wait_ready: true), `service-discovery`, `skills-cli-service`.
- Campos no estándar (health_check_url, dependencies) son ignorados por PM2; la orquestación real vive en scripts/pm2/startup-manager.mjs.
- Bug detectado: startup-manager instancia `new ServiceManager()` cuando la clase definida es `EnhancedServiceManager` (NameError en runtime).
- Operación: reinicio con `--update-env`; logs combinados; límites de memoria (max_memory_restart). Router envía `process.send('ready')` correctamente.

Startup & ejecución
- Daemon ajusta CWD a la raíz del paquete (src/index.ts) para rutas relativas consistentes (schemas/, config/).
- Router publica /health y envía `process.send('ready')` al iniciar (PM2 wait_ready). Daemon no usa wait_ready hoy.

Configuración & calibración
- Umbral (daemon): `SF_ACTIVATION_THRESHOLD` (default 0.6). También `options.threshold` por request.
- Pesos (daemon): `SF_W_KEYWORDS|INTENT|PATH|CONTENT` (default 0.25 c/u), normalizados internamente. Por request: `options.signalWeights`.
- Shared (opt‑in): `SF_USE_SHARED_RULES=1`, `SF_USE_SHARED_SIGNALS=1`.
- /health expone `services.signals` y response.metrics incluye `weights` usados.
- Archivo de alerta: `dev/agent-dev-docs/ALERTA-ACTIVATION-CONFIG.md`.

Dolores detectados
- Drift de heurísticas: daemon/router/builder usan señales y pesos distintos.
- Plan‑check frágil en builder (import relativo a router/src/utils/plan-check.js).
- Carga de reglas bloqueante/OS‑specific en daemon (execSync cat …).
 - PM2 startup-manager roto por nombre de clase; campos “dependencies/health_check_*” en ecosystem no aplican por sí mismos.

Propuesta (sin ruptura)
- Shared Activation Core: computeSignals() y loadSkillRulesCached() opt‑in por flags.
- DX builder: modo --raw/--no-audit y validación con skills activate.
- PM2/operación: envs documentadas; health estable; Redis opcional para cluster.
 - Corregir startup-manager; documentar que las dependencias se gestionan por ese script (no por PM2 nativo). Opcional: readiness para daemon.

Restricciones
- No cambiar contratos públicos ni comportamiento por defecto.
- Flags opt‑in; rollback inmediato (desactivar flags).

Estado de colaboración
- Otro agente trabaja en: skills (`skills/**`) y mejoras directas de hooks (router `pre-invoke.ts` y `stop.ts`).
- Nuestro foco: daemon/PM2, shared activation core, DX del Prompt Builder v2 y wrappers universales para disparo de hooks desde terminal/IDE.
- Integración pactada: contratos de `skill-rules.json`, payloads de hooks y wrappers `scripts/hooks/*`.

Wrapper CLI Spec (contrato)
- pre-invoke.mjs
  - Args: `--prompt <text>` `--open-files '<json[]>'` `--active-file-content '<string>'` `--cwd <path>`
  - Output: JSON `{ injectedNote?: string, activated: string[], metadata: { scores: Record<string,number>, reasons: Record<string,string[]> } }`
  - Exit code: 0 siempre (no bloquea flujos)
- stop.mjs
  - Args: `--edit-log '<json[]>'` (o auto modo git) `--cwd <path>`
  - Output: JSON `{ formatted: string[], typecheck: {repo:string,errors:number,output:string}[], hints?: string[], autoResolved: boolean, kpiEvent: object }`
  - Exit code: 0 por defecto (no rígido); modo estricto opcional a definir por el otro agente

Registry/skills (expectativas)
- Registry regenerado con 19 skills (Phase 1 del otro agente) disponible en `registry/index.json`.
- `configs/skill-rules.json` alineado al contrato: `promptTriggers.{keywords[],intentPatterns[]}`, `fileTriggers.{pathPatterns[],contentPatterns[]}` para skills prioritarios.

Definiciones
- Threshold base: 0.6; pesos por defecto: 0.25 c/u (keywords/intent/path/content).
- Éxito: paridad señales, latencia controlada, hooks sin regresiones.
