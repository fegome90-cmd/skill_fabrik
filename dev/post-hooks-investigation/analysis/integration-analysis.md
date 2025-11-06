# Análisis de Integraciones: Cursor Hooks, CLI y Flujos End-to-End

**Fecha**: 2025-11-01  
**Componentes**: Cursor hooks, CLI installation, flujos de comunicación

---

## 📋 Índice

1. [Configuración de Hooks](#configuración-de-hooks)
2. [Pre-Invoke Hook (userPromptSubmit)](#pre-invoke-hook-userpromptsubmit)
3. [Stop Hook](#stop-hook)
4. [CLI Installation](#cli-installation)
5. [Flujos End-to-End](#flujos-end-to-end)
6. [Comunicación entre Componentes](#comunicación-entre-componentes)
7. [Gaps Identificados](#gaps-identificados)

---

## ⚙️ Configuración de Hooks

**Archivo**: `.cursor/hooks/hooks-config.json`

```json
{
  "userPromptSubmit": {
    "enabled": true,
    "skillRulesPath": "registry/index.json"
  },
  "stop": {
    "enabled": true,
    "buildCheck": true,
    "prettier": true,
    "kpiEmit": true,
    "notifications": {
      "enabled": true,
      "onSuccess": true,
      "onWarning": true,
      "onError": true,
      "scriptPath": "scripts/hooks/notify.sh"
    },
    "bashValidator": {
      "enabled": true,
      "scriptPath": "scripts/hooks/bash-validator.py",
      "blockLevel": "error",
      "warnLevel": "warning"
    }
  }
}
```

### Configuración Pre-Invoke

- **enabled**: `true` (activo)
- **skillRulesPath**: `registry/index.json` (ruta a rules compiladas)

### Configuración Stop Hook

- **buildCheck**: `true` (habilitado, pero no implementado en router)
- **prettier**: `true` (habilitado, implementado)
- **kpiEmit**: `true` (habilitado, implementado)
- **notifications**: Configurado pero script debe existir
- **bashValidator**: **Configurado pero NO integrado en stop hook**

---

## 🔄 Pre-Invoke Hook (userPromptSubmit)

### Ubicación de Scripts

1. **Generado por CLI**: `.cursor/hooks/userPromptSubmit.mjs`
2. **Universal Script**: `scripts/hooks/pre-invoke.mjs` (si existe)

### Script Generado (CLI)

**Generado por**: `packages/skills-cli/src/commands/hooks.ts::installUserPromptSubmitHook()`

```javascript
#!/usr/bin/env node
import { userPromptSubmitHook } from '../../packages/router/dist/index.js';

async function main() {
  const prompt = process.argv[2] || '';
  const openFilesArg = process.argv[3] || '[]';
  
  // Get active file content (max 2KB)
  let activeFileContent = '';
  if (openFiles.length > 0) {
    const firstFile = resolve(process.cwd(), openFiles[0]);
    const content = await readFile(firstFile, { encoding: 'utf-8' });
    activeFileContent = content.substring(0, 2048);
  }
  
  // Call router hook
  const result = await userPromptSubmitHook({
    prompt,
    openFiles: Array.isArray(openFiles) ? openFiles : [],
    activeFileContent,
    cwd: process.cwd(),
  });
  
  // Output injected note if skills activated
  if (result.injectedNote) {
    console.log(result.injectedNote);
  }
}
```

### Flujo de Ejecución

```
Cursor IDE
  │
  ├─► Detecta usuario escribiendo prompt
  │
  └─► Ejecuta .cursor/hooks/userPromptSubmit.mjs
       │
       ├─► Lee prompt desde argv[2]
       ├─► Lee openFiles desde argv[3]
       ├─► Lee contenido de archivo activo (≤2KB)
       │
       └─► Llama router.userPromptSubmitHook()
            │
            ├─► Detecta slash commands (prioridad)
            ├─► Verifica planning mode gate
            ├─► Carga rules desde configs/skill-rules.json
            ├─► Ejecuta detectors.matchRulesFor()
            ├─► Enhance con daemon (POST /activate)
            └─► Return: injectedNote + activated skills
```

### Integración con Daemon

**Request al Daemon**:
```typescript
POST http://127.0.0.1:7727/activate
{
  intent: string,
  context: {
    files: string[],
    activeFile?: string,
    activeFileContent?: string,
    workingDirectory: string,
    editor?: string,
    fileExtensions: string[],
    projectType: string,
    requestTime: number
  },
  options: {
    threshold: number,
    maxResults: number,
    includeSignals: boolean,
    includeMetadata: boolean
  }
}
```

**Response del Daemon**:
```typescript
{
  success: boolean,
  results: Array<{
    skillId: string,
    score: number,
    reason: string,
    confidence: number,
    signals: {...}
  }>,
  cache?: { hit: boolean, age?: number },
  latency_ms: number
}
```

---

## 🛑 Stop Hook

### Ubicación de Scripts

1. **Generado por CLI**: `.cursor/hooks/stop.mjs`
2. **Universal Script**: `scripts/hooks/stop.mjs` (más completo)

### Script Universal (scripts/hooks/stop.mjs)

**Características**:
- Soporta múltiples modos: `direct`, `http`, `cli`, `auto`
- Auto-detección de cambios con `git diff`
- Fallback graceful si un modo falla

**Modes**:
1. **direct**: Import directo de router package (más rápido)
2. **http**: HTTP POST a router service (puerto 3000)
3. **cli**: Fallback básico sin router

### Script Generado (CLI)

**Generado por**: `packages/skills-cli/src/commands/hooks.ts::installStopHook()`

```javascript
#!/usr/bin/env node
import { stopHook } from '../../packages/router/dist/index.js';

async function getEditLog() {
  try {
    const output = execSync('git diff --name-only', { encoding: 'utf-8' }).trim();
    const files = output.split('\n').filter(Boolean);
    
    const editLog = files.map(file => {
      const parts = file.split('/');
      const packagesIndex = parts.indexOf('packages');
      const repo = packagesIndex !== -1 && parts.length > packagesIndex + 1
        ? parts[packagesIndex + 1]
        : 'root';
      
      return { file, repo, ts: Date.now() };
    });
    
    return editLog;
  } catch {
    return [];
  }
}

async function main() {
  const editLog = await getEditLog();
  const reposChanged = new Set(editLog.map(e => e.repo));
  
  if (editLog.length === 0) {
    process.exit(0);
  }
  
  const result = await stopHook({
    editLog,
    reposChanged,
    cwd: process.cwd(),
  });
  
  // Display hints
  if (result.hints && result.hints.length > 0) {
    console.log('\n' + result.hints.join('\n'));
  }
  
  // Check if blocked
  const blocked = result.typecheck.some(tc => tc.errors < 0) || 
                  result.hints?.some(h => h.includes('🚫'));
  
  if (blocked) {
    console.error('\n⚠️  Blocked by guardrails or errors detected');
    process.exit(1);
  }
  
  process.exit(0);
}
```

### Flujo de Ejecución

```
Cursor IDE (después de respuesta del modelo)
  │
  └─► Ejecuta .cursor/hooks/stop.mjs (o scripts/hooks/stop.mjs)
       │
       ├─► Detecta cambios: git diff --name-only
       │
       └─► Llama router.stopHook()
            │
            ├─► 0. checkGuardrails() ──► skill-rules.json
            │     │
            │     ├─► Carga guardrails con contentPatterns
            │     ├─► Verifica archivos editados
            │     └─► Retorna: blocked, warnings, suggestions
            │
            ├─► 1. runPrettier() ──► npx prettier --write
            │
            ├─► 2. runTypeCheck() ──► npx tsc --noEmit
            │
            ├─► 3. generateErrorHints() (si 1-4 errores)
            │
            ├─► 4. autoResolveTypeScriptErrors() (si ≥5 errores)
            │
            ├─► 5. emitKPIEvent() ──► obs/kpi/events.jsonl
            │
            └─► 6. sendNotification() ──► scripts/hooks/notify.sh
```

### Gaps en Stop Hook

1. **❌ Bash Validator NO integrado**:
   - Configurado en `hooks-config.json`
   - Script existe: `scripts/hooks/bash-validator.py`
   - **NO se llama desde stopHook()**

2. **❌ Build Check NO implementado**:
   - Configurado en `hooks-config.json` (`buildCheck: true`)
   - **NO se ejecuta en stopHook()**

3. **❌ ESLint NO ejecutado**:
   - Daemon tiene quality service con ESLint
   - Router no ejecuta ESLint
   - No hay endpoint consultado para ESLint

---

## 🔧 CLI Installation

**Archivo**: `packages/skills-cli/src/commands/hooks.ts`

### Comando

```bash
skills-cli hooks [--hook-name <name>] [-v, --verbose]
```

### Funciones de Instalación

#### installUserPromptSubmitHook()

**Genera**: `.cursor/hooks/userPromptSubmit.mjs`

**Características**:
- Lee prompt desde `process.argv[2]`
- Lee openFiles desde `process.argv[3]` (JSON)
- Lee contenido de archivo activo (≤2KB)
- Llama `router.userPromptSubmitHook()`
- Output: `injectedNote` si skills activados

#### installStopHook()

**Genera**: `.cursor/hooks/stop.mjs`

**Características**:
- Detecta cambios con `git diff --name-only`
- Detecta repos desde paths (`packages/<repo>/...`)
- Llama `router.stopHook()`
- Verifica si está bloqueado
- Exit code: 1 si bloqueado, 0 si OK

### Configuración Guardada

**Ubicación**: `.cursor/hooks/hooks-config.json`

**Fuente**: 
- `configs/templates/hooks.json` (si existe)
- Default configuration (si no existe template)

---

## 🔄 Flujos End-to-End

### Flujo Completo: Usuario Escribe Prompt

```
1. Usuario escribe prompt en Cursor
   │
2. Cursor ejecuta .cursor/hooks/userPromptSubmit.mjs
   │
3. Script lee prompt, openFiles, activeFileContent
   │
4. Llama router.userPromptSubmitHook()
   │
   ├─► Detecta slash commands (si aplica)
   ├─► Verifica planning mode gate (si habilitado)
   ├─► Carga rules desde configs/skill-rules.json
   ├─► Ejecuta detectors.matchRulesFor() (scoring multi-señal)
   │
   └─► Enhance con daemon (POST /activate)
       │
       ├─► Cache check (local + distribuido)
       ├─► Compute signals (keywords, intent, path, content)
       ├─► Match rules (scoring con weights)
       └─► Return: results + signals + metadata
   │
5. Router merge resultados (router + daemon)
   │
6. Return injectedNote con skills activados
   │
7. Cursor muestra injectedNote al modelo
   │
8. Modelo genera respuesta usando skills activados
```

### Flujo Completo: Post-Respuesta (Stop Hook)

```
1. Modelo genera respuesta y edita archivos
   │
2. Cursor ejecuta .cursor/hooks/stop.mjs
   │
3. Script detecta cambios: git diff --name-only
   │
   ├─► Si no hay cambios → exit 0 (silent)
   │
   └─► Si hay cambios → continúa
        │
4. Llama router.stopHook()
   │
   ├─► 0. checkGuardrails()
   │     │
   │     ├─► Carga guardrails desde skill-rules.json
   │     ├─► Filtra por type === 'guardrail' + contentPatterns
   │     ├─► Verifica archivos editados contra patterns
   │     │
   │     └─► Return: blocked, warnings, suggestions
   │          │
   │          ├─► Si blocked → exit 1, emite KPI, notifica error
   │          └─► Si no blocked → continúa
   │
   ├─► 1. runPrettier()
   │     │
   │     └─► npx prettier --write <archivos>
   │
   ├─► 2. runTypeCheck()
   │     │
   │     └─► npx tsc --noEmit (por repo)
   │
   ├─► 3. generateErrorHints() (si 1-4 errores)
   │
   ├─► 4. autoResolveTypeScriptErrors() (si ≥5 errores)
   │     │
   │     └─► Corrige TS2307 (agrega .js a imports)
   │
   ├─► 5. emitKPIEvent()
   │     │
   │     └─► Escribe a obs/kpi/events.jsonl
   │
   └─► 6. sendNotification()
        │
        └─► Ejecuta scripts/hooks/notify.sh <type> <message>
```

---

## 🔗 Comunicación entre Componentes

### Diagrama de Comunicación

```
┌─────────────┐
│  Cursor IDE │
└──────┬──────┘
       │
       ├─► Pre-Invoke Hook
       │   └─► Router Package (direct import)
       │       ├─► configs/skill-rules.json (read)
       │       └─► Daemon: POST /activate
       │
       └─► Stop Hook
           └─► Router Package (direct import)
               ├─► configs/skill-rules.json (read)
               ├─► npx prettier (exec)
               ├─► npx tsc (exec)
               ├─► obs/kpi/events.jsonl (write)
               └─► scripts/hooks/notify.sh (exec)
```

### Componentes NO Comunicados

**Stop Hook NO se comunica con**:
- ❌ Daemon (`/api/quality/*` endpoints)
- ❌ File Watcher Service
- ❌ Quality Service del daemon
- ❌ Bash Validator (configurado pero no llamado)

---

## ❌ Gaps Identificados

### P0 (Crítico)

1. **Bash Validator NO integrado**:
   - Configurado en `hooks-config.json`
   - Script existe: `scripts/hooks/bash-validator.py`
   - **NO se llama desde stopHook()**

2. **Build Check NO implementado**:
   - Configurado como `buildCheck: true`
   - **NO existe en stopHook()**

3. **ESLint NO ejecutado**:
   - Daemon tiene `/api/quality/lint` endpoint
   - Router no ejecuta ESLint en absoluto

4. **Stop Hook NO usa daemon**:
   - Daemon tiene quality service completo
   - Router ejecuta Prettier/TypeCheck localmente
   - No consulta `/api/quality/*` endpoints

### P1 (Importante)

5. **File Watcher NO integrado**:
   - Daemon tiene file watcher service
   - Router no consume eventos del file watcher

6. **Guardrails deshabilitados**:
   - Ningún guardrail en skill-rules.json tiene `contentPatterns`
   - Sistema de guardrails funcionalmente deshabilitado

### P2 (Mejoras Futuras)

7. **NMLB (No-Mess-Left-Behind) faltante**:
   - No verifica `git status --porcelain` al final
   - No garantiza repo limpio después de post-hook

8. **Cache no compartido**:
   - Router tiene cache propio para pre-invoke
   - Daemon tiene cache propio
   - No comparten cache

---

## 📊 Resumen de Integraciones

| Componente | Integración | Estado |
|------------|-------------|--------|
| Pre-Invoke → Router | ✅ Direct import | Funcional |
| Pre-Invoke → Daemon | ✅ HTTP POST /activate | Funcional |
| Stop Hook → Router | ✅ Direct import | Funcional |
| Stop Hook → Daemon | ❌ No integrado | **Gap crítico** |
| Stop Hook → Bash Validator | ❌ Configurado pero no llamado | **Gap crítico** |
| Stop Hook → ESLint | ❌ No ejecutado | **Gap crítico** |
| Stop Hook → Build Check | ❌ No implementado | **Gap crítico** |
| File Watcher → Router | ❌ No integrado | Gap importante |
| Cache Router ↔ Daemon | ❌ No compartido | Gap futuro |

---

**Última actualización**: 2025-11-01  
**Siguiente**: Creación de dev-docs (context.md, plan.md, task.md)

