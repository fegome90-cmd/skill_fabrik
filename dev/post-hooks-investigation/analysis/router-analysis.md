# Análisis Exhaustivo del Router Package

**Fecha**: 2025-11-01  
**Componente**: `packages/router/`  
**Método**: Análisis código fuente completo

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Análisis de stop.ts (Post-Hook Principal)](#análisis-de-stopts-post-hook-principal)
3. [Análisis de pre-invoke.ts (Pre-Hook)](#análisis-de-pre-invokets-pre-hook)
4. [Análisis de detectors.ts (Sistema de Activación)](#análisis-de-detectorsts-sistema-de-activación)
5. [Análisis de guardrails.ts (Sistema de Protección)](#análisis-de-guardrailsts-sistema-de-protección)
6. [Análisis de types.ts (Contratos)](#análisis-de-typests-contratos)
7. [Análisis de server.ts (Servidor HTTP)](#análisis-de-servertsservidor-http)
8. [Flujos de Comunicación](#flujos-de-comunicación)
9. [Dependencias y Servicios Externos](#dependencias-y-servicios-externos)

---

## 🎯 Visión General

El Router Package es el núcleo del sistema de activación de skills y post-processing. Proporciona:

- **Pre-invoke Hook**: Detecta y activa skills antes de que el modelo procese el prompt
- **Stop Hook**: Pipeline completo de calidad post-respuesta
- **Detectors**: Sistema de matching multi-señal para activación de skills
- **Guardrails**: Sistema multi-nivel de protección (SUGGEST → WARN → BLOCK)
- **HTTP Server**: API REST para integración externa

**Ubicación**: `packages/router/src/`

---

## 🔍 Análisis de stop.ts (Post-Hook Principal)

**Archivo**: `packages/router/src/stop.ts`  
**Líneas**: 500  
**Función Principal**: `stopHook(input: StopHookInput): Promise<StopHookOutput>`

### Pipeline de Ejecución

El pipeline se ejecuta en este orden estricto:

```299:499:packages/router/src/stop.ts
export async function stopHook(input: StopHookInput): Promise<StopHookOutput> {
  const editedFiles = input.editLog.map(e => e.file);
  const reposChanged = Array.from(input.reposChanged);

  // 0. Guardrails: Verificar multi-nivel ANTES de cualquier otra operación
  const guardrailCheck = await checkGuardrails(input.editLog, input.cwd);
```

#### Paso 0: Guardrails (Primero - Bloquea si es crítico)

```303:380:packages/router/src/stop.ts
  // 0. Guardrails: Verificar multi-nivel ANTES de cualquier otra operación
  const guardrailCheck = await checkGuardrails(input.editLog, input.cwd);

  // Mostrar sugerencias (no bloquean)
  if (guardrailCheck.suggestions.length > 0) {
    console.log('\n💡 SUGERENCIAS:\n');
    guardrailCheck.suggestions.forEach(v => {
      const location = v.line ? `${v.file}:${v.line}` : v.file;
      console.log(`  ${v.message}\n     → ${location}\n`);
    });
  }

  // Mostrar warnings (no bloquean, pero alertan)
  if (guardrailCheck.warnings.length > 0) {
    console.warn('\n⚠️  ADVERTENCIAS:\n');
    guardrailCheck.warnings.forEach(v => {
      const location = v.line ? `${v.file}:${v.line}` : v.file;
      console.warn(`  ${v.message}\n     → ${location}\n`);
    });

    await sendNotification(
      'warning',
      `${guardrailCheck.warnings.length} advertencia(s) de guardrail`,
      input.cwd
    );
  }

  // Bloqueos son críticos y detienen el flujo
  if (guardrailCheck.blocked) {
    const violationMessages = guardrailCheck.violations.map(v => {
      const location = v.line ? `${v.file}:${v.line}` : v.file;
      return `🚫 ${v.skillId}: ${v.message}\n   → ${location}`;
    });

    console.error('\n🚫 GUARDRAIL BLOQUEADO - Operación no permitida:\n');
    console.error(violationMessages.join('\n\n'));
    console.error('\nPor favor corrige las violaciones antes de continuar.');

    // Enviar notificación de error
    await sendNotification(
      'error',
      `Guardrail bloqueado: ${guardrailCheck.violations.length} violación(es) detectada(s)`,
      input.cwd
    );

    // Emit KPI de bloqueo
    const kpiEvent: KPIEvent = {
      ts: new Date().toISOString(),
      repo: reposChanged[0] || 'unknown',
      skills: guardrailCheck.violations.map(v => v.skillId),
      errors_ts: 0,
      auto_resolver_used: false,
      latency_ms: 0,
      zero_errors_left_behind: false,
      activated_by: {
        keywords: false,
        intent_regex: false,
        path_globs: false,
        content_patterns: false,
      },
      adherence: false,
      progressive_disclosure: {
        metadata_loaded: false,
        skill_md_loaded: false,
        resources_loaded: 0,
      },
    };

    await emitKPIEvent(kpiEvent, input.cwd);

    return {
      formatted: [],
      typecheck: [],
      hints: violationMessages,
      autoResolved: false,
      kpiEvent,
    };
  }
```

**Comportamiento**:
- **SUGGEST**: Solo muestra mensaje informativo
- **WARN**: Muestra advertencia y envía notificación, pero no bloquea
- **BLOCK**: Detiene todo el pipeline, emite KPI de bloqueo y retorna inmediatamente

#### Paso 1: Prettier (Formateo)

```31:44:packages/router/src/stop.ts
async function runPrettier(files: string[], cwd: string): Promise<string[]> {
  if (files.length === 0) return [];

  try {
    await execa('npx', ['prettier', '--write', ...files], {
      cwd,
      stdio: 'inherit',
    });
    return files;
  } catch (error) {
    console.warn('Prettier falló, continuando:', error);
    return [];
  }
}
```

**Características**:
- Formatea solo archivos en `editLog`
- No filtra por extensión (ejecuta en todos los archivos editados)
- Continúa aunque Prettier falle (no rompe el pipeline)
- Usa `stdio: 'inherit'` para mostrar output

**Gap Identificado**: No filtra por extensiones válidas (debería filtrar `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, etc.)

#### Paso 2: TypeCheck

```49:81:packages/router/src/stop.ts
async function runTypeCheck(
  repos: string[],
  cwd: string
): Promise<Array<{ repo: string; errors: number; output: string }>> {
  const results: Array<{ repo: string; errors: number; output: string }> = [];

  for (const repo of repos) {
    try {
      const repoPath = resolve(cwd, repo);
      const { stdout, stderr } = await execa('npx', ['tsc', '--noEmit'], {
        cwd: repoPath,
        reject: false,
      });

      // Contar errores en la salida
      const errorLines = (stdout + stderr).split('\n').filter(line => line.includes('error TS'));

      results.push({
        repo,
        errors: errorLines.length,
        output: stdout + stderr,
      });
    } catch (error) {
      results.push({
        repo,
        errors: -1,
        output: `Error ejecutando tsc: ${error}`,
      });
    }
  }

  return results;
}
```

**Características**:
- Ejecuta `tsc --noEmit` por cada repo modificado
- Cuenta errores filtrando líneas con `'error TS'`
- Maneja errores de ejecución graciosamente (errors: -1)
- No bloquea si un repo falla

**Gap Identificado**: No verifica si `tsconfig.json` existe antes de ejecutar tsc

#### Paso 3: Error Hints (Si 1-4 errores)

```192:223:packages/router/src/stop.ts
function generateErrorHints(
  typecheckResults: Array<{ repo: string; errors: number; output: string }>
): string[] {
  const hints: string[] = [];
  const totalErrors = typecheckResults.reduce((sum, r) => sum + Math.max(0, r.errors), 0);

  if (totalErrors >= 1 && totalErrors <= 4) {
    hints.push(`⚠️ Se detectaron ${totalErrors} error(es) TypeScript:`);

    for (const result of typecheckResults) {
      if (result.errors > 0) {
        hints.push(`  • ${result.repo}: ${result.errors} error(es)`);

        // Extraer primeros errores como hint
        const errorLines = result.output
          .split('\n')
          .filter(line => line.includes('error TS'))
          .slice(0, 2);

        errorLines.forEach(line => {
          hints.push(`    → ${line.trim()}`);
        });
      }
    }

    hints.push(
      '\n💡 Recordatorio: Manejo de errores en controladores/repos (logger/Sentry, BaseController, try/catch)'
    );
  }

  return hints;
}
```

**Comportamiento**:
- Solo se activa si hay 1-4 errores totales
- Muestra primeros 2 errores por repo
- Incluye recordatorio educativo
- No bloquea el flujo

#### Paso 4: Auto-resolver (Si ≥5 errores)

```116:187:packages/router/src/stop.ts
async function autoResolveTypeScriptErrors(
  errors: ParsedError[],
  cwd: string
): Promise<{ resolved: number; summary: string[] }> {
  const resolved: string[] = [];
  let resolvedCount = 0;

  // Agrupar errores por archivo
  const errorsByFile = new Map<string, ParsedError[]>();
  for (const error of errors) {
    const filePath = resolve(cwd, error.file);
    if (!errorsByFile.has(filePath)) {
      errorsByFile.set(filePath, []);
    }
    errorsByFile.get(filePath)!.push(error);
  }

  // Procesar cada archivo
  for (const [filePath, fileErrors] of errorsByFile.entries()) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      let fileModified = false;

      for (const error of fileErrors) {
        // Solo intentar corregir errores comunes y seguros
        // TS2307: Cannot find module
        if (error.code === 'TS2307') {
          const importMatch = error.message.match(/Cannot find module ['"](.+?)['"]/);
          if (importMatch && error.line <= lines.length) {
            const moduleName = importMatch[1];
            const line = lines[error.line - 1];
            
            // Verificar si es un import relativo que falta '.js'
            if (line.includes('from') && !moduleName.startsWith('.')) {
              // No auto-fixar imports externos - requiere conocimiento del proyecto
              continue;
            }
            
            // Para imports relativos, intentar agregar extensión .js si falta
            if (moduleName.startsWith('.') && !moduleName.endsWith('.js') && !moduleName.endsWith('.json')) {
              const newImport = line.replace(
                new RegExp(`['"]${moduleName}['"]`),
                `'${moduleName}.js'`
              );
              lines[error.line - 1] = newImport;
              fileModified = true;
              resolved.push(`${error.file}:${error.line} - Agregado .js al import: ${moduleName}`);
              resolvedCount++;
            }
          }
        }
        
        // TS2532: Object is possibly 'undefined'
        // TS2322: Type is not assignable
        // Estos requieren análisis más complejo, por ahora solo documentamos
      }

      if (fileModified) {
        await writeFile(filePath, lines.join('\n'), 'utf-8');
      }
    } catch (error) {
      // Silenciosamente ignorar errores al leer/escribir archivos
      continue;
    }
  }

  return {
    resolved: resolvedCount,
    summary: resolved,
  };
}
```

**Capacidades Actuales**:
- ✅ TS2307: Agrega `.js` a imports relativos faltantes
- ❌ TS2532: No implementado (requiere análisis más complejo)
- ❌ TS2322: No implementado (requiere análisis más complejo)

**Re-ejecución de TypeCheck**:
```417:429:packages/router/src/stop.ts
        // Re-ejecutar typecheck para verificar
        const recheck = await runTypeCheck(reposChanged, input.cwd);
        const remainingErrors = recheck.reduce((sum, r) => sum + Math.max(0, r.errors), 0);
        
        if (remainingErrors < totalErrors) {
          const fixed = totalErrors - remainingErrors;
          console.log(`✅ ${fixed} error(es) resuelto(s). ${remainingErrors} error(es) restante(s).\n`);
          
          await sendNotification(
            'info',
            `🔧 Auto-resolver corrigió ${fixed} error(es) TypeScript. ${remainingErrors} restante(s).`,
            input.cwd
          );
        }
```

#### Paso 5: KPI Emission

```228:234:packages/router/src/stop.ts
async function emitKPIEvent(event: KPIEvent, cwd: string): Promise<void> {
  const kpiDir = resolve(cwd, 'obs/kpi');
  await mkdir(kpiDir, { recursive: true });

  const kpiFile = resolve(kpiDir, 'events.jsonl');
  await appendFile(kpiFile, JSON.stringify(event) + '\n', 'utf-8');
}
```

**Características**:
- Crea directorio `obs/kpi/` si no existe
- Escribe en formato JSONL (JSON Lines)
- Append mode (no sobrescribe eventos previos)
- Formato: `JSON.stringify(event) + '\n'`

#### Paso 6: Notificaciones

```239:294:packages/router/src/stop.ts
async function sendNotification(
  type: 'info' | 'success' | 'warning' | 'error',
  message: string,
  cwd: string
): Promise<void> {
  try {
    // Intentar leer configuración de hooks
    const hooksConfigPath = resolve(cwd, '.cursor/hooks/hooks-config.json');
    let notifyEnabled = true;
    let notifyScriptPath = 'scripts/hooks/notify.sh';

    if (await pathExists(hooksConfigPath)) {
      try {
        const hooksConfig = JSON.parse(await readFile(hooksConfigPath, 'utf-8'));
        const stopConfig = hooksConfig.stop;
        if (stopConfig?.notifications) {
          notifyEnabled = stopConfig.notifications.enabled !== false;
          if (stopConfig.notifications.scriptPath) {
            notifyScriptPath = stopConfig.notifications.scriptPath;
          }

          // Verificar si este tipo de notificación está habilitado
          const typeMap: Record<string, string> = {
            success: 'onSuccess',
            warning: 'onWarning',
            error: 'onError',
          };
          const typeKey = typeMap[type];
          if (typeKey && stopConfig.notifications[typeKey] === false) {
            return; // Esta notificación está deshabilitada
          }
        }
      } catch {
        // Si hay error leyendo config, continuar con defaults
      }
    }

    if (!notifyEnabled) {
      return;
    }

    const notifyScript = resolve(cwd, notifyScriptPath);
    if (!(await pathExists(notifyScript))) {
      return; // Script no existe, continuar silenciosamente
    }

    // Ejecutar script de notificación
    await execa('bash', [notifyScript, type, message], {
      cwd,
      stdio: 'ignore', // No mostrar output del script de notificación
    });
  } catch (error) {
    // Silenciosamente fallar - las notificaciones no deben romper el hook
    // console.warn('Failed to send notification:', error);
  }
}
```

**Características**:
- Lee configuración desde `.cursor/hooks/hooks-config.json`
- Soporta tipos: `info`, `success`, `warning`, `error`
- Script configurable por `scriptPath`
- Puede deshabilitar por tipo (`onSuccess`, `onWarning`, `onError`)
- Falla silenciosamente si script no existe o falla

**Notificaciones Enviadas**:
- Success: Si `totalErrors === 0 && formatted.length > 0`
- Warning: Si `totalErrors > 0` o `guardrailCheck.warnings.length > 0`
- Error: Si `guardrailCheck.blocked`
- Info: Si auto-resolver corrigió errores

### Dependencias de stop.ts

**Internas**:
- `checkGuardrails()` desde `./guardrails.js`
- `KPIEvent` type desde `./types.js`

**Externas**:
- `execa`: Ejecución de comandos (Prettier, TypeScript)
- `fs/promises`: Operaciones de archivo (readFile, writeFile, appendFile, mkdir, access)
- `path`: Resolución de rutas (`resolve`)

### Gaps Identificados en stop.ts

1. **❌ NMLB (No-Mess-Left-Behind)**: No verifica `git status --porcelain` al final
2. **❌ ESLint Integration**: No ejecuta ESLint (solo Prettier y TypeCheck)
3. **❌ Bash Validator**: Configurado en hooks-config pero no integrado
4. **❌ Prettier Filter**: No filtra por extensiones válidas antes de ejecutar
5. **❌ Git Clean Check**: No verifica repo limpio al inicio
6. **⚠️ Auto-resolver Limitado**: Solo corrige TS2307, falta TS2532, TS2322

---

## 🔍 Análisis de pre-invoke.ts (Pre-Hook)

**Archivo**: `packages/router/src/pre-invoke.ts`  
**Líneas**: 427  
**Función Principal**: `userPromptSubmitHook(input: PreHookInput): Promise<PreHookOutput>`

### Flujo de Ejecución

```25:83:packages/router/src/pre-invoke.ts
export async function userPromptSubmitHook(input: PreHookInput): Promise<PreHookOutput> {
  let planCheck: { hasPlan: boolean; plan?: any; taskName?: string } | null = null;

  // Check for slash commands first (highest priority)
  if (slashCommandDetector && slashCommandDetector.isSlashCommand(input.prompt)) {
    const parsedCommand = slashCommandDetector.parse(input.prompt);
    if (parsedCommand) {
      return {
        injectedNote: `⚡ SLASH COMMAND DETECTED: /${parsedCommand.command}\n\nThis slash command will be processed by the slash commands system.\n\nAvailable slash commands: /dev-docs, /create-dev-docs, /dev-docs-update, /build-and-fix, /code-review, /route-research-for-testing, /test-route, /compact, /undo, /plugin\n\nUse "skills-cli / ${parsedCommand.command}" to execute, or add "--help" for usage: /${parsedCommand.command} --help`,
        activated: [],
        metadata: {
          scores: {},
          reasons: {},
          slashCommand: {
            detected: true,
            command: parsedCommand.command,
            args: parsedCommand.args,
            flags: parsedCommand.flags,
            options: parsedCommand.options
          }
        },
        blocked: false,
      };
    }
  }

  // Check planning mode gate second
  if (isPlanningModeEnabled()) {
    planCheck = await checkApprovedPlan(input.cwd);

    if (!planCheck.hasPlan) {
      return {
        injectedNote: undefined,
        activated: [],
        metadata: { scores: {}, reasons: {} },
        blocked: true,
        blockReason: `🚫 PLANNING MODE GATE: No approved plan found.\n\nTo proceed:\n  1. Create plan: skills plan create "<task description>"\n  2. Approve plan: skills plan approve <plan-id>\n  3. Save workflow: skills plan save <plan-id> --approve\n\nOr disable planning mode: SKILLS_PLANNING_MODE=false`,
      };
    }
  }

  // Continue with skill activation (paralelo con rules loading)
  const [rules] = await Promise.all([
    loadRules(input.cwd)
  ]);

  const threshold = parseFloat(process.env.SKILL_ACTIVATION_THRESHOLD || '0.6');
  const output = matchRulesFor(input, rules, threshold);

  // Enhanced daemon integration with caching and improved error handling
  await enhanceWithDaemonResults(input, output, threshold);

  // Add plan info if available (reutilizar planCheck)
  if (planCheck && planCheck.hasPlan && planCheck.plan) {
    output.injectedNote = `📋 ACTIVE PLAN: ${planCheck.plan.id} (${planCheck.taskName})\n\n${output.injectedNote || ''}`;
  }

  return output;
}
```

### Prioridades de Ejecución

1. **Slash Commands** (Mayor prioridad): Si detecta comando slash, retorna inmediatamente
2. **Planning Mode Gate**: Si está habilitado y no hay plan aprobado, bloquea
3. **Skill Activation**: Carga rules y hace matching
4. **Daemon Integration**: Consulta daemon para activaciones adicionales

### Integración con Daemon

```93:212:packages/router/src/pre-invoke.ts
async function enhanceWithDaemonResults(input: PreHookInput, output: PreHookOutput, threshold: number): Promise<void> {
  const enableDaemon = process.env.SKILLS_DAEMON_ENHANCED !== 'false';
  if (!enableDaemon) {
    return;
  }

  const startTime = Date.now();
  const maxRetries = parseInt(process.env.DAEMON_MAX_RETRIES || '2');
  const retryDelay = parseInt(process.env.DAEMON_RETRY_DELAY || '500');

  // Generate cache key based on prompt and context
  const cacheKey = generateCacheKey(input, threshold);

  // Check cache first
  const cached = getCachedResult(cacheKey);
  if (cached) {
    mergeDaemonResults(output, cached.data, 'cache');
    output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
    (output.metadata as any).cache = { hit: true, age: Date.now() - cached.timestamp };
    return;
  }

  // Get daemon URL with service discovery
  let daemonUrl = await getDaemonUrl(input.cwd);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        'x-router-cache-key': cacheKey
      };

      if (process.env.SF_API_KEY) {
        headers['x-api-key'] = String(process.env.SF_API_KEY);
      }

      // Enhanced request body with more context
      const body = {
        intent: input.prompt,
        context: {
          files: input.openFiles || [],
          activeFile: input.activeFile,
          activeFileContent: input.activeFileContent,
          workingDirectory: input.cwd,
          editor: input.editor || 'router',
          // Add file extensions for better signal processing
          fileExtensions: (input.openFiles || []).map(f => f.split('.').pop()),
          // Add project context
          projectType: await detectProjectType(input.cwd),
          // Add timestamp for cache busting if needed
          requestTime: Date.now()
        },
        options: {
          threshold,
          maxResults: 10, // Increased from 5 for better coverage
          includeSignals: true, // Request signal processing
          includeMetadata: true // Request detailed metadata
        }
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), parseInt(process.env.DAEMON_TIMEOUT || '3000'));

      const res = await fetch(`${daemonUrl}/activate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json() as any;

        // Cache successful response
        cacheResult(cacheKey, json);

        // Enhanced result processing
        if (json.results && Array.isArray(json.results)) {
          mergeDaemonResults(output, json, 'daemon', input);
          output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
          (output.metadata as any).daemon = {
            success: true,
            results: json.results.length,
            signals: json.signals,
            latency: Date.now() - startTime,
            url: daemonUrl,
            attempt: attempt + 1
          };
        }

        return; // Success, exit retry loop
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        // Log error but don't fail the entire hook
        if (process.env.SKILLS_DAEMON_DEBUG === 'true') {
          console.warn(`[Daemon] All ${maxRetries + 1} attempts failed:`, (error as Error).message);
        }

        output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
        (output.metadata as any).daemon = {
          success: false,
          error: (error as Error).message,
          attempts: attempt + 1,
          latency: Date.now() - startTime
        };
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }
}
```

**Características de Integración Daemon**:
- **Cache**: Cache en memoria con TTL de 60s (configurable)
- **Retry**: Hasta 2 reintentos con backoff exponencial
- **Service Discovery**: Soporte para selección dinámica de daemon
- **Sticky Routing**: Hash de `cwd` para routing consistente
- **Timeout**: 3s default (configurable)
- **API Key**: Soporte para autenticación con `SF_API_KEY`

**Request Body al Daemon**:
```typescript
{
  intent: string,                    // Prompt del usuario
  context: {
    files: string[],                 // Archivos abiertos
    activeFile?: string,             // Archivo activo
    activeFileContent?: string,     // Contenido del archivo (≤2KB)
    workingDirectory: string,        // CWD
    editor?: string,                 // Editor usado
    fileExtensions: string[],       // Extensiones de archivos
    projectType: string,            // Tipo detectado (react, node, etc.)
    requestTime: number             // Timestamp
  },
  options: {
    threshold: number,               // Umbral de activación (default 0.6)
    maxResults: number,             // Máximo de resultados (10)
    includeSignals: boolean,        // Procesar señales
    includeMetadata: boolean       // Incluir metadata detallada
  }
}
```

**Response del Daemon**:
```typescript
{
  results: Array<{
    skillId: string,
    confidence: number,
    signals?: {
      keywordMatches: number,
      fileMatches: number,
      contentMatches: number
    },
    metadata?: any
  }>,
  signals?: any,                    // Señales procesadas
  metadata?: any                    // Metadata adicional
}
```

### Service Discovery

```266:303:packages/router/src/pre-invoke.ts
async function getDaemonUrl(cwd?: string): Promise<string> {
  // Start with default URL
  let daemonUrl = process.env.DAEMON_URL || 'http://127.0.0.1:7727';

  // Use service discovery if enabled
  if (process.env.ROUTER_DISCOVERY === '1') {
    try {
      const discovery = process.env.DISCOVERY_URL || 'http://127.0.0.1:8877';

      // Sticky selection for consistent routing
      if (process.env.ROUTER_STICKY === '1' && cwd) {
        const list = await fetch(`${discovery}/services/sf-daemon?endpoints=true`).then(r => r.ok ? r.json() : null) as any;
        const eps: any[] = Array.isArray(list?.endpoints) ? list.endpoints : [];

        if (eps.length > 0) {
          // Consistent hash of cwd
          let hash = 0;
          for (let i = 0; i < cwd.length; i++) {
            hash = (hash * 31 + cwd.charCodeAt(i)) >>> 0;
          }
          const selected = eps[Math.abs(hash) % eps.length];
          if (selected?.url) daemonUrl = selected.url;
        }
      } else {
        // Round-robin or first available
        const ep = await fetch(`${discovery}/services/sf-daemon/endpoint`).then(r => r.ok ? r.json() : null) as any;
        if (ep?.success && ep.endpoint?.url) daemonUrl = ep.endpoint.url;
      }
    } catch (error) {
      // Service discovery failed, use default URL
      if (process.env.SKILLS_DAEMON_DEBUG === 'true') {
        console.warn('[Daemon] Service discovery failed:', (error as Error).message);
      }
    }
  }

  return daemonUrl;
}
```

**Modes de Discovery**:
- **Sticky**: Hash consistente de `cwd` → misma instancia siempre
- **Round-robin**: Selección rotativa de instancias disponibles
- **Fallback**: Si discovery falla, usa `DAEMON_URL` o default `http://127.0.0.1:7727`

### Mezcla de Resultados

```336:385:packages/router/src/pre-invoke.ts
function mergeDaemonResults(output: PreHookOutput, daemonData: any, source: 'cache' | 'daemon', input?: PreHookInput): void {
  if (!daemonData.results || !Array.isArray(daemonData.results)) return;

  const existingSkills = new Set(output.activated || []);
  const daemonSkills = daemonData.results
    .filter((r: any) => r?.skillId && !existingSkills.has(r.skillId))
    .map((r: any) => ({
      skillId: r.skillId,
      confidence: enhanceConfidence(r, input, source),
      reason: `${source}-match`,
      metadata: {
        source,
        originalConfidence: r.confidence || 0,
        signals: r.signals || {},
        ...(r.metadata || {})
      }
    }));

  // Merge skills, removing duplicates and sorting by confidence
  const allSkills = [
    ...(output.activated || []).map(skillId => ({
      skillId,
      confidence: 0.5, // Default confidence for router results
      reason: 'router-match'
    })),
    ...daemonSkills
  ];

  // Remove duplicates and sort by confidence
  const uniqueSkills = allSkills.reduce((acc: any[], skill: any) => {
    const existing = acc.find((s: any) => s.skillId === skill.skillId);
    if (!existing) {
      acc.push(skill);
    } else if (skill.confidence > existing.confidence) {
      // Keep the higher confidence result
      Object.assign(existing, skill);
    }
    return acc;
  }, [] as any[])
  .sort((a: any, b: any) => b.confidence - a.confidence);

  output.activated = uniqueSkills.map(s => s.skillId);

  // Update metadata with enhanced scoring
  output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
  uniqueSkills.forEach((skill: any) => {
    (output.metadata as any).scores[skill.skillId] = skill.confidence;
    (output.metadata as any).reasons[skill.skillId] = skill.reason;
  });
}
```

**Lógica de Merge**:
- Elimina duplicados (prioriza por confidence más alto)
- Ordena por confidence descendente
- Mantiene metadata de ambos sources (router y daemon)
- Enhanced confidence con boosts basados en señales

---

## 🔍 Análisis de detectors.ts (Sistema de Activación)

**Archivo**: `packages/router/src/detectors.ts`  
**Líneas**: 222  
**Funciones Principales**: `loadRules()`, `matchRulesFor()`

### Carga de Rules (loadRules)

```23:82:packages/router/src/detectors.ts
export async function loadRules(cwd: string = process.cwd()): Promise<SkillRules> {
  const now = Date.now();

  // Verificar cache válido
  if (rulesCache && (now - rulesCache.timestamp) < CACHE_TTL_MS) {
    return rulesCache.rules;
  }

  // Posibles ubicaciones para skill-rules.json
  const possiblePaths = [
    resolve(cwd, 'configs/skill-rules.json'), // Raíz del proyecto
    resolve(cwd, '../configs/skill-rules.json'), // Si estamos en packages/*
    resolve(cwd, '../../configs/skill-rules.json'), // Si estamos en packages/router/*
  ];

  // Buscar archivos en paralelo para mejorar velocidad
  const fileChecks = possiblePaths.map(async (rulesPath) => {
    try {
      const fileStat = await stat(rulesPath);
      return { path: rulesPath, exists: true, mtime: fileStat.mtime.getTime() };
    } catch {
      return { path: rulesPath, exists: false, mtime: 0 };
    }
  });

  const results = await Promise.all(fileChecks);
  const existingFile = results.find(r => r.exists);

  if (!existingFile) {
    console.warn(`No se encontró skill-rules.json en ninguna ubicación esperada, usando reglas vacías`);
    rulesCache = { rules: {}, timestamp: now, filePath: '' };
    return {};
  }

  // Verificar si el cache es válido basado en mtime del archivo
  if (rulesCache &&
      rulesCache.filePath === existingFile.path &&
      rulesCache.timestamp > existingFile.mtime) {
    return rulesCache.rules;
  }

  // Cargar y parsear el archivo
  try {
    const content = await readFile(existingFile.path, 'utf-8');
    const rules = JSON.parse(content) as SkillRules;

    // Actualizar cache
    rulesCache = {
      rules: Object.keys(rules).length > 0 ? rules : {},
      timestamp: now,
      filePath: existingFile.path
    };

    return rulesCache.rules;
  } catch (error) {
    console.error(`Error leyendo skill-rules.json desde ${existingFile.path}:`, error);
    rulesCache = { rules: {}, timestamp: now, filePath: existingFile.path };
    return {};
  }
}
```

**Características**:
- **Cache**: TTL de 60s, invalidación basada en `mtime` del archivo
- **Búsqueda Multi-path**: Busca en 3 ubicaciones posibles
- **Validación de Cache**: Compara `mtime` para detectar cambios
- **Fallback**: Retorna `{}` (reglas vacías) si no encuentra archivo

### Algoritmo de Matching (matchRulesFor)

```177:221:packages/router/src/detectors.ts
export function matchRulesFor(
  input: PreHookInput,
  rules: SkillRules,
  threshold: number = 0.6
): PreHookOutput {
  const activated: string[] = [];
  const scores: Record<string, number> = {};
  const reasons: Record<string, string[]> = {};
  const noteLines: string[] = [];

  for (const [skillId, rule] of Object.entries(rules)) {
    const { score, reasons: skillReasons } = calculateSkillScore(rule, input);

    scores[skillId] = score;
    if (skillReasons.length > 0) {
      reasons[skillId] = skillReasons;
    }

    if (score >= threshold) {
      activated.push(skillId);
      noteLines.push(`● ${skillId} (${rule.enforcement}/${rule.priority})`);

      // Añadir razones de activación
      if (skillReasons.length > 0) {
        noteLines.push(`  → reason: ${skillReasons.join(', ')}`);
      }

      // Añadir recursos si están definidos
      if (rule.resources && rule.resources.length > 0) {
        noteLines.push(`  → resources: ${rule.resources.length} disponible(s) (on-demand)`);
      }
    }
  }

  const injectedNote =
    activated.length > 0
      ? `🎯 SKILL ACTIVATION CHECK:\n\n${noteLines.join('\n')}\n\n→ Cargar SKILL.md (main) y recursos on-demand según referencias.`
      : undefined;

  return {
    injectedNote,
    activated,
    metadata: { scores, reasons },
  };
}
```

### Sistema de Scoring (calculateSkillScore)

```110:171:packages/router/src/detectors.ts
function calculateSkillScore(
  rule: SkillRule,
  input: PreHookInput
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Keywords match (20%)
  if (rule.promptTriggers?.keywords) {
    const lowerPrompt = input.prompt.toLowerCase();
    const keywordMatches = rule.promptTriggers.keywords.filter(kw =>
      lowerPrompt.includes(kw.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      score += 0.2;
      reasons.push(`keywords: ${keywordMatches.join(', ')}`);
    }
  }

  // Intent regex match (30%)
  if (rule.promptTriggers?.intentPatterns) {
    const intentMatches = rule.promptTriggers.intentPatterns.filter(pattern => {
      try {
        return new RegExp(pattern, 'i').test(input.prompt);
      } catch {
        return false;
      }
    });
    if (intentMatches.length > 0) {
      score += 0.3;
      reasons.push(`intent: ${intentMatches.length} pattern(s) matched`);
    }
  }

  // Path glob match (30%)
  if (rule.fileTriggers?.pathPatterns) {
    const pathMatches = rule.fileTriggers.pathPatterns.filter(glob =>
      input.openFiles.some(file => minimatchLike(file, glob))
    );
    if (pathMatches.length > 0) {
      score += 0.3;
      reasons.push(`path: ${pathMatches.join(', ')}`);
    }
  }

  // Content pattern match (20%)
  if (rule.fileTriggers?.contentPatterns && input.activeFileContent) {
    const contentMatches = rule.fileTriggers.contentPatterns.filter(pattern => {
      try {
        return new RegExp(pattern).test(input.activeFileContent!);
      } catch {
        return false;
      }
    });
    if (contentMatches.length > 0) {
      score += 0.2;
      reasons.push(`content: ${contentMatches.length} pattern(s) matched`);
    }
  }

  return { score, reasons };
}
```

**Weights del Scoring**:
- **Keywords**: 20% (0.2 puntos)
- **Intent Patterns**: 30% (0.3 puntos)
- **Path Patterns**: 30% (0.3 puntos)
- **Content Patterns**: 20% (0.2 puntos)
- **Total Máximo**: 1.0 (100%)

**Threshold Default**: 0.6 (60%)

---

## 🔍 Análisis de guardrails.ts (Sistema de Protección)

**Archivo**: `packages/router/src/guardrails.ts`  
**Líneas**: 376  
**Función Principal**: `checkGuardrails(editLog, cwd): Promise<GuardrailResult>`

### Carga de Patterns

```20:61:packages/router/src/guardrails.ts
async function loadGuardrailPatterns(cwd: string): Promise<{
  block: Map<string, string[]>;
  warn: Map<string, string[]>;
  suggest: Map<string, string[]>;
}> {
  const { loadRules } = await import('./detectors.js');
  const rules = await loadRules(cwd);
  const patterns = {
    block: new Map<string, string[]>(),
    warn: new Map<string, string[]>(),
    suggest: new Map<string, string[]>(),
  };

  for (const [skillId, rule] of Object.entries(rules)) {
    if (rule.type === 'guardrail' && rule.enforcement) {
      const contentPatterns = rule.fileTriggers?.contentPatterns || [];
      if (contentPatterns.length > 0) {
        // contentPatterns es string[], asegurar que todos sean strings
        const patternsArray: string[] = contentPatterns.filter((p): p is string => typeof p === 'string');
        
        if (patternsArray.length > 0) {
          const enforcement = rule.enforcement;
          // Usar switch para evitar problemas de inferencia de tipos
          switch (enforcement) {
            case 'block':
            case 'require':
              patterns.block.set(skillId, patternsArray);
              break;
            case 'warn':
              patterns.warn.set(skillId, patternsArray);
              break;
            case 'suggest':
              patterns.suggest.set(skillId, patternsArray);
              break;
          }
        }
      }
    }
  }

  return patterns;
}
```

**Lógica de Enforcement**:
- `block` o `require` → Mapa `block` (detiene el flujo)
- `warn` → Mapa `warn` (advertencia, no bloquea)
- `suggest` → Mapa `suggest` (sugerencia, no bloquea)

### Matching de Path Patterns

```67:159:packages/router/src/guardrails.ts
function matchesPathPatterns(filePath: string, pathPatterns: string[]): boolean {
  if (!pathPatterns || pathPatterns.length > 0) {
    return true; // Sin patterns = todos los archivos
  }

  // Normalizar path para comparación
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const pattern of pathPatterns) {
    // Procesar extensiones {ts,js} -> (ts|js)
    let processedPattern = pattern
      .replace(/\{([^}]+)\}/g, '($1)') // {ts,js} -> (ts,js)
      .replace(/,/g, '|'); // (ts,js) -> (ts|js)

    // Convertir glob pattern a regex
    let regexStr = processedPattern
      .replace(/\*\*/g, '__DOUBLESTAR__')
      .replace(/\*/g, '[^/]*')
      .replace('__DOUBLESTAR__', '.*')
      .replace(/\./g, '\\.');

    regexStr = regexStr.replace(/\\/g, '/');

    try {
      // Probar match completo
      if (new RegExp(`^${regexStr}$`).test(normalizedPath)) {
        return true;
      }
      // Probar si path contiene el pattern (match parcial) - importante para **
      if (new RegExp(regexStr).test(normalizedPath)) {
        return true;
      }
      // Probar si el path contiene segmentos clave del pattern (para casos como **/repository/**)
      // Esta es una heurística más flexible para glob patterns complejos
      const patternSegments = pattern
        .split('/')
        .filter(s => s && !s.includes('*') && !s.includes('{') && s.length > 0);
      if (patternSegments.length > 0) {
        const allSegmentsMatch = patternSegments.every(segment => normalizedPath.includes(segment));
        if (allSegmentsMatch) {
          // Verificar extensión también si está especificada
          const extPattern = pattern.match(/\{([^}]+)\}/);
          if (extPattern) {
            const exts = extPattern[1].split(',').map(e => e.trim());
            const fileExt = normalizedPath.split('.').pop()?.trim();
            if (fileExt && exts.includes(fileExt)) {
              return true;
            }
          } else if (pattern.includes('*.')) {
            // Pattern tiene extensión wildcard pero no {ts,js}, verificar que el archivo tenga extensión
            const hasExtension = normalizedPath.includes('.') && normalizedPath.split('.').length > 1;
            if (hasExtension) {
              return true;
            }
          } else {
            // Sin especificar extensión explícita, si todos los segmentos coinciden, aceptar
            return true;
          }
        }
      }
      
      // Método adicional: verificar si path contiene la estructura básica del pattern
      // Ejemplo: **/repository/** debería coincidir con cualquier path que tenga /repository/
      if (pattern.includes('**/') || pattern.startsWith('**')) {
        const corePath = pattern
          .replace(/^\*\*\//, '')
          .replace(/\/\*\*/g, '/')
          .replace(/\*/g, '')
          .replace(/\{[^}]+\}/g, '')
          .replace(/\/$/, '');
        
        if (corePath && normalizedPath.includes(corePath)) {
          // Verificar extensión si está especificada
          const extPattern = pattern.match(/\{([^}]+)\}/);
          if (extPattern) {
            const exts = extPattern[1].split(',').map(e => e.trim());
            const fileExt = normalizedPath.split('.').pop()?.trim();
            if (fileExt && exts.includes(fileExt)) {
              return true;
            }
          } else {
            return true;
          }
        }
      }
    } catch (error) {
      // Pattern inválido, continuar
      console.warn(`Pattern inválido: ${pattern}`, error);
    }
  }

  return false;
}
```

**Soporte de Glob Patterns**:
- `**` → `.*` (recursivo)
- `*` → `[^/]*` (single level)
- `{ts,js}` → `(ts|js)` (extensiones)
- Matching multi-método (exacto, parcial, por segmentos)

### Validación de Archivos

```164:246:packages/router/src/guardrails.ts
async function checkFileAgainstPatterns(
  filePath: string,
  patterns: string[],
  skillId: string,
  enforcement: 'suggest' | 'warn' | 'block'
): Promise<GuardrailViolation[]> {
  const violations: GuardrailViolation[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const pattern of patterns) {
      try {
        // Usar matchAll para evitar problemas con estado global de regex
        const regex = new RegExp(pattern, 'g');
        const matches: Array<{ index: number; text: string }> = [];

        // Usar matchAll si está disponible, sino usar exec manualmente con reset
        if (typeof content.matchAll === 'function') {
          const matchIterator = content.matchAll(regex);
          for (const match of matchIterator) {
            matches.push({ index: match.index!, text: match[0] });
          }
        } else {
          // Fallback para Node < 12: usar exec con reset explícito
          let match: RegExpExecArray | null;
          regex.lastIndex = 0; // Reset explícito
          while ((match = regex.exec(content)) !== null) {
            matches.push({ index: match.index, text: match[0] });
            // Safety check para evitar loops infinitos
            if (matches.length > 100) break;
          }
        }

        for (const matchItem of matches) {
          const lineNumber = content.substring(0, matchItem.index).split('\n').length;
          const line = lines[lineNumber - 1] || '';

          // Para deleteMany/updateMany/findMany, verificar que tenga where
          // El patrón puede ser complejo (con lookahead negativo), verificar contexto después del match
          if (
            pattern.includes('deleteMany') ||
            pattern.includes('updateMany') ||
            pattern.includes('findMany')
          ) {
            // Buscar contexto amplio alrededor y DESPUÉS del match (hasta encontrar el cierre de paréntesis o llave)
            const contextStart = Math.max(0, matchItem.index - 100);
            const contextEnd = Math.min(content.length, matchItem.index + matchItem.text.length + 300);
            const matchContext = content.substring(contextStart, contextEnd);

            // Buscar patrones de where explícito en el contexto (puede estar antes o después del match)
            // Verificar tanto 'where:' como 'where {' en el contexto del objeto
            if (/\bwhere\s*[:=]\s*\{/.test(matchContext) || /\bwhere\s*\{/.test(matchContext)) {
              continue; // Tiene where, no es violación
            }
            
            // Para findMany/updateMany/deleteMany, también verificar si el patrón ya excluía where
            // Si el pattern tiene lookahead negativo (?!.*where), ya fue filtrado
          }

          // Agregar violación con nivel de enforcement
          violations.push({
            skillId,
            file: filePath,
            line: lineNumber,
            pattern,
            message: getViolationMessage(skillId, pattern, line, enforcement),
            enforcement,
          });
        }
      } catch (error) {
        // Pattern regex inválido, continuar
        console.warn(`Pattern inválido para ${skillId}: ${pattern}`, error);
      }
    }
  } catch (error) {
    // Error leyendo archivo, continuar
    console.warn(`Error leyendo ${filePath}`, error);
  }

  return violations;
}
```

**Validaciones Especiales**:
- **Database Operations**: Verifica presencia de `where` para `deleteMany`, `updateMany`, `findMany`
- **Context Analysis**: Busca en 400 caracteres alrededor del match
- **Safety Limits**: Máximo 100 matches por pattern para evitar loops

### Función Principal checkGuardrails

```289:374:packages/router/src/guardrails.ts
export async function checkGuardrails(
  editLog: EditLogEntry[],
  cwd: string
): Promise<GuardrailResult> {
  const { block, warn, suggest } = await loadGuardrailPatterns(cwd);

  // Cargar rules para obtener pathPatterns
  const { loadRules } = await import('./detectors.js');
  const rules = await loadRules(cwd);

  const allBlocking: GuardrailViolation[] = [];
  const allWarnings: GuardrailViolation[] = [];
  const allSuggestions: GuardrailViolation[] = [];

  for (const entry of editLog) {
    // El entry.file puede ser relativo o absoluto
    let filePath: string;
    let relativeFile: string;

    if (entry.file.startsWith('/') || entry.file.match(/^[A-Z]:\\/)) {
      filePath = entry.file; // Ya es absoluto
      relativeFile = filePath.replace(cwd + '/', '').replace(/\\/g, '/');
    } else {
      filePath = resolve(cwd, entry.file);
      relativeFile = entry.file.replace(/\\/g, '/');
    }

    // Verificar bloqueos
    for (const [skillId, patterns] of block.entries()) {
      const rule = rules[skillId];
      let shouldCheck = true;

      if (rule?.fileTriggers?.pathPatterns && rule.fileTriggers.pathPatterns.length > 0) {
        const matchesRelative = matchesPathPatterns(relativeFile, rule.fileTriggers.pathPatterns);
        const matchesAbsolute = matchesPathPatterns(filePath, rule.fileTriggers.pathPatterns);
        shouldCheck = matchesRelative || matchesAbsolute;
      }

      if (shouldCheck) {
        const violations = await checkFileAgainstPatterns(filePath, patterns, skillId, 'block');
        allBlocking.push(...violations);
      }
    }

    // Verificar warnings
    for (const [skillId, patterns] of warn.entries()) {
      const rule = rules[skillId];
      let shouldCheck = true;

      if (rule?.fileTriggers?.pathPatterns && rule.fileTriggers.pathPatterns.length > 0) {
        const matchesRelative = matchesPathPatterns(relativeFile, rule.fileTriggers.pathPatterns);
        const matchesAbsolute = matchesPathPatterns(filePath, rule.fileTriggers.pathPatterns);
        shouldCheck = matchesRelative || matchesAbsolute;
      }

      if (shouldCheck) {
        const violations = await checkFileAgainstPatterns(filePath, patterns, skillId, 'warn');
        allWarnings.push(...violations);
      }
    }

    // Verificar sugerencias
    for (const [skillId, patterns] of suggest.entries()) {
      const rule = rules[skillId];
      let shouldCheck = true;

      if (rule?.fileTriggers?.pathPatterns && rule.fileTriggers.pathPatterns.length > 0) {
        const matchesRelative = matchesPathPatterns(relativeFile, rule.fileTriggers.pathPatterns);
        const matchesAbsolute = matchesPathPatterns(filePath, rule.fileTriggers.pathPatterns);
        shouldCheck = matchesRelative || matchesAbsolute;
      }

      if (shouldCheck) {
        const violations = await checkFileAgainstPatterns(filePath, patterns, skillId, 'suggest');
        allSuggestions.push(...violations);
      }
    }
  }

  return {
    blocked: allBlocking.length > 0,
    warnings: allWarnings,
    suggestions: allSuggestions,
    violations: allBlocking, // Mantener para compatibilidad
  };
}
```

**Procesamiento por Archivo**:
1. Resuelve path (relativo o absoluto)
2. Para cada nivel (block, warn, suggest):
   - Verifica si pathPatterns aplican
   - Si aplica, busca contentPatterns en el contenido
   - Agrega violaciones encontradas
3. Retorna resultado agregado

---

## 🔍 Análisis de types.ts (Contratos)

**Archivo**: `packages/router/src/types.ts`  
**Líneas**: 139  
**Contratos Definidos**: 7 interfaces principales

### StopHookInput/StopHookOutput

```51:70:packages/router/src/types.ts
export interface StopHookInput {
  editLog: EditLogEntry[];
  reposChanged: Set<string>;
  cwd: string;
}

export interface TypeCheckResult {
  repo: string;
  errors: number;
  output: string;
}

export interface StopHookOutput {
  formatted: string[]; // Archivos formateados
  typecheck: TypeCheckResult[];
  hints?: string[]; // Sugerencias de errores
  autoResolved: boolean; // Si se auto-resolvió
  autoResolveSummary?: string[]; // Resumen de errores auto-resueltos
  kpiEvent?: KPIEvent; // Evento JSONL
}
```

### PreHookInput/PreHookOutput

```24:43:packages/router/src/types.ts
export interface PreHookInput {
  prompt: string;
  openFiles: string[];
  activeFileContent?: string; // Snapshot ≤2KB
  cwd: string;
  activeFile?: string;
  editor?: string;
}

export interface PreHookOutput {
  injectedNote?: string; // "🎯 Skill Activation Check"
  activated: string[]; // Skills activados
  metadata: {
    scores: Record<string, number>; // Score de cada skill
    reasons: Record<string, string[]>; // Razones de activación
    [key: string]: any; // Allow additional metadata properties
  };
  blocked?: boolean; // Si está bloqueado por gate (plan, etc.)
  blockReason?: string; // Razón del bloqueo
}
```

### KPIEvent

```72:94:packages/router/src/types.ts
export interface KPIEvent {
  ts: string;
  repo: string;
  task?: string;
  skills: string[];
  activated_by: {
    keywords: boolean;
    intent_regex: boolean;
    path_globs: boolean;
    content_patterns: boolean;
  };
  adherence: boolean;
  errors_ts: number;
  auto_resolver_used: boolean;
  latency_ms: number;
  tokens_total?: number;
  zero_errors_left_behind: boolean;
  progressive_disclosure: {
    metadata_loaded: boolean;
    skill_md_loaded: boolean;
    resources_loaded: number;
  };
}
```

---

## 🔍 Análisis de server.ts (Servidor HTTP)

**Archivo**: `packages/router/src/server.ts`  
**Líneas**: 116  
**Función Principal**: `startServer()`

### Endpoints HTTP

```24:83:packages/router/src/server.ts
  // API routes for router functionality
  fastify.post('/pre-invoke', async (request: any, reply: any) => {
    try {
      const result = await userPromptSubmitHook(request.body);
      reply.send({ success: true, result });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.post('/stop', async (request: any, reply: any) => {
    try {
      const result = await stopHook(request.body);
      reply.send({ success: true, result });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.get('/rules', async (request: any, reply: any) => {
    try {
      const rules = await loadRules();
      reply.send({ success: true, rules });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.post('/match-rules', async (request: any, reply: any) => {
    try {
      const rules = await loadRules();
      const matches = await matchRulesFor(request.body.input, rules);
      reply.send({ success: true, matches });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  fastify.post('/guardrails', async (request: any, reply: any) => {
    try {
      const result = await checkGuardrails(request.body.editLog, request.body.cwd || process.cwd());
      reply.send({ success: true, result });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
```

**Endpoints Disponibles**:
- `POST /pre-invoke` - Ejecuta pre-invoke hook
- `POST /stop` - Ejecuta stop hook
- `GET /rules` - Obtiene todas las rules cargadas
- `POST /match-rules` - Hace matching de rules con input
- `POST /guardrails` - Verifica guardrails sin ejecutar pipeline completo

**Configuración**:
- Port: `PORT` env var o 3000 default
- Host: `HOST` env var o `127.0.0.1` default

---

## 📊 Flujos de Comunicación

### Flujo Pre-Invoke

```
Cursor IDE
  │
  ├─► .cursor/hooks/userPromptSubmit.mjs
  │     │
  │     └─► router.userPromptSubmitHook()
  │            │
  │            ├─► detectors.loadRules() ──► configs/skill-rules.json
  │            │
  │            ├─► detectors.matchRulesFor() ──► Scoring multi-señal
  │            │
  │            └─► enhanceWithDaemonResults()
  │                   │
  │                   └─► HTTP POST daemon/activate ──► Daemon (7727)
  │                         │
  │                         └─► Merge resultados router + daemon
  │
  └─► Return: injectedNote + activated skills
```

### Flujo Stop Hook

```
Cursor IDE
  │
  ├─► .cursor/hooks/stop.mjs (o scripts/hooks/stop.mjs)
  │     │
  │     ├─► Detecta cambios: git diff --name-only
  │     │
  │     └─► router.stopHook()
  │            │
  │            ├─► 0. guardrails.checkGuardrails()
  │            │     │
  │            │     ├─► detectors.loadRules()
  │            │     │
  │            │     └─► Verificar archivos contra patterns
  │            │
  │            ├─► 1. runPrettier() ──► npx prettier --write
  │            │
  │            ├─► 2. runTypeCheck() ──► npx tsc --noEmit
  │            │
  │            ├─► 3. generateErrorHints() (si 1-4 errores)
  │            │
  │            ├─► 4. autoResolveTypeScriptErrors() (si ≥5 errores)
  │            │
  │            ├─► 5. emitKPIEvent() ──► obs/kpi/events.jsonl
  │            │
  │            └─► 6. sendNotification() ──► scripts/hooks/notify.sh
  │
  └─► Return: formatted, typecheck, hints, autoResolved, kpiEvent
```

### Comunicación Router ↔ Daemon

**Pre-Invoke**:
- Router → Daemon: `POST /activate`
- Request: `{ intent, context, options }`
- Response: `{ results: Array<{ skillId, confidence, signals }> }`
- Caching: Cache en memoria router (60s TTL)
- Retry: Hasta 2 reintentos con backoff exponencial

**Stop Hook**:
- ❌ **NO HAY COMUNICACIÓN**: Stop hook no se comunica con daemon actualmente

---

## 🔗 Dependencias y Servicios Externos

### Dependencias NPM

- `execa`: Ejecución de comandos externos (Prettier, TypeScript)
- `fastify`: Servidor HTTP (solo en server.ts)

### Servicios Externos Ejecutados

1. **Prettier**: `npx prettier --write <archivos>`
2. **TypeScript Compiler**: `npx tsc --noEmit`
3. **Git**: `git diff --name-only` (en hooks wrapper, no en router)
4. **Bash Scripts**: `scripts/hooks/notify.sh` (notificaciones)

### Servicios HTTP Consultados

1. **Daemon**: `http://127.0.0.1:7727/activate` (pre-invoke only)
2. **Service Discovery**: `http://127.0.0.1:8877/services/sf-daemon` (opcional)

### Sistema de Archivos

- **Lectura**: `configs/skill-rules.json`, `.cursor/hooks/hooks-config.json`, archivos editados
- **Escritura**: `obs/kpi/events.jsonl`, archivos formateados (Prettier), archivos corregidos (auto-resolver)

---

## 📝 Resumen de Gaps Identificados

### P0 (Crítico)

1. **NMLB (No-Mess-Left-Behind)**: No verifica `git status --porcelain` al final
2. **ESLint Integration**: No ejecuta ESLint (solo Prettier y TypeCheck)
3. **Bash Validator**: Configurado pero no integrado en stopHook()

### P1 (Importante)

4. **Prettier Filter**: No filtra por extensiones antes de ejecutar
5. **Git Clean Check**: No verifica repo limpio al inicio
6. **Auto-resolver Mejorado**: Solo TS2307, falta TS2532, TS2322

### P2 (Mejoras Futuras)

7. **Daemon Integration en Stop**: Posible uso de daemon para validaciones distribuidas
8. **Cache de TypeCheck**: Evitar re-ejecuciones innecesarias
9. **Telemetría Avanzada**: Latencia por paso, success rates

---

**Última actualización**: 2025-11-01  
**Siguiente**: Análisis del Daemon Package

