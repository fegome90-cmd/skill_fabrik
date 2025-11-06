# Análisis del Sistema de Post-Hooks (Stop Hook)

**Fecha**: 2025-11-01  
**Sprint**: daemon-infalible-sprint  
**Archivos Analizados**: `packages/router/src/stop.ts`, `.cursor/hooks/hooks-config.json`, `packages/router/src/guardrails.ts`, `scripts/hooks/stop.mjs`

---

## 📋 Índice

1. [¿Qué hace el post-hook?](#qué-hace-el-post-hook)
2. [Activación y Flujo](#activación-y-flujo)
3. [Componentes que Activa](#componentes-que-activa)
4. [Comunicación entre Componentes](#comunicación-entre-componentes)
5. [Comparación con el Ejemplo de Referencia](#comparación-con-el-ejemplo-de-referencia)
6. [Estado Actual vs Objetivo NMLB](#estado-actual-vs-objetivo-nmlb)
7. [Recomendaciones](#recomendaciones)

---

## 1. ¿Qué hace el post-hook?

El post-hook (`stopHook`) es ejecutado **justo después de que el modelo termina de generar una respuesta** y antes de dar por cerrado el ciclo de interacción. Su objetivo principal es garantizar **calidad automática y guardrails de seguridad** (Zero Errors Left Behind).

### Flujo General del Post-Hook

```mermaid
┌─────────────────────────────────────────────┐
│  Cursor IDE / Editor                        │
│  Genera respuesta del modelo                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  .cursor/hooks/stop.mjs                    │
│  (Script wrapper instalado por CLI)        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  packages/router/src/stop.ts                │
│  stopHook() - Función principal            │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Guardrails   │  │ Prettier    │
│ (Primero)    │  │ (Segundo)   │
└──────────────┘  └──────────────┘
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ TypeCheck    │  │ Auto-resolver│
│ (Tercero)    │  │ (Si ≥5 errs) │
└──────────────┘  └──────────────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  KPI Emission                               │
│  obs/kpi/events.jsonl                       │
└─────────────────────────────────────────────┘
```

### Pipeline de Ejecución (Orden Crítico)

**0. Guardrails (ANTES de todo)**
- Verificación multi-nivel: SUGGEST → WARN → BLOCK
- Si hay bloqueos, **detiene el flujo inmediatamente**
- Fuente: `packages/router/src/guardrails.ts`

**1. Prettier**
- Formatea **solo archivos editados** (`editLog`)
- Filtra por extensión: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, `.mdx`, `.yaml`, `.yml`, `.css`, `.scss`, `.html`
- Ejecuta: `npx prettier --write <archivos>`

**2. TypeCheck**
- Verifica tipos por **repo modificado** (`reposChanged`)
- Ejecuta: `npx tsc --noEmit` en cada repo
- Cuenta errores: `output.split('\n').filter(line => line.includes('error TS')).length`

**3. Error Hints (Si 1-4 errores)**
- Genera sugerencias educativas
- Muestra primeros 2 errores por repo
- No bloquea, solo informa

**4. Auto-resolver (Si ≥5 errores)**
- Intenta corregir automáticamente errores comunes (TS2307: imports faltantes `.js`)
- Re-ejecuta typecheck para verificar
- Muestra resumen de correcciones aplicadas

**5. KPI Emission**
- Registra evento en `obs/kpi/events.jsonl`
- Incluye: errores, latencia, auto-resolver usado, adherence

**6. Notificaciones (Cross-platform)**
- Ejecuta script: `scripts/hooks/notify.sh`
- Tipos: `success`, `warning`, `error`, `info`
- Configurable por tipo en `hooks-config.json`

---

## 2. Activación y Flujo

### ¿Cómo se Activa?

El post-hook se activa desde **Cursor IDE** mediante el sistema de hooks configurado en `.cursor/hooks/hooks-config.json`.

**Configuración Actual:**
```json
{
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

**Instalación del Hook:**
- Comando: `skills-cli hooks` (instala script en `.cursor/hooks/stop.mjs`)
- El script wrapper (`packages/skills-cli/src/commands/hooks.ts`) genera un script Node.js que:
  1. Detecta cambios usando `git diff --name-only`
  2. Construye `editLog` y `reposChanged`
  3. Llama a `stopHook()` del router

**Flujo de Activación:**

```12:14:packages/skills-cli/src/commands/hooks.ts
async function installStopHook(
  hooksDir: string,
  _config: {
```

```299:499:packages/router/src/stop.ts
export async function stopHook(input: StopHookInput): Promise<StopHookOutput> {
  const editedFiles = input.editLog.map(e => e.file);
  const reposChanged = Array.from(input.reposChanged);

  // 0. Guardrails: Verificar multi-nivel ANTES de cualquier otra operación
  const guardrailCheck = await checkGuardrails(input.editLog, input.cwd);
```

### Entrada (Input)

```typescript
interface StopHookInput {
  editLog: EditLogEntry[];      // [{ file: "src/app.ts", repo: "backend", ts: 123456 }]
  reposChanged: Set<string>;     // Set(["backend", "frontend"])
  cwd: string;                   // Directorio de trabajo
}
```

### Salida (Output)

```typescript
interface StopHookOutput {
  formatted: string[];              // Archivos formateados
  typecheck: TypeCheckResult[];      // Resultados por repo
  hints?: string[];                  // Sugerencias si 1-4 errores
  autoResolved: boolean;             // Si se auto-resolvió
  autoResolveSummary?: string[];     // Resumen de correcciones
  kpiEvent?: KPIEvent;               // Evento registrado
}
```

---

## 3. Componentes que Activa

### 3.1 Guardrails (checkGuardrails)

**Ubicación**: `packages/router/src/guardrails.ts`

**¿Qué hace?**
- Carga patterns desde `configs/skill-rules.json`
- Verifica archivos editados contra patterns peligrosos
- Niveles de enforcement:
  - **BLOCK**: Detiene el flujo (ej: `deleteMany()` sin `where`)
  - **WARN**: Muestra advertencia (ej: `updateMany()` sin `where`)
  - **SUGGEST**: Muestra sugerencia (ej: `findMany()` sin `where`)

**Ejemplos de Patterns:**
- `deleteMany\(\)(?!.*where)` → BLOCK
- `updateMany\(\)(?!.*where)` → WARN
- `findMany\(\)(?!.*where)` → SUGGEST
- Secrets hardcodeados → BLOCK

**Comunicación:**
- Lee: `configs/skill-rules.json`
- Escribe: Console (violaciones)
- Notifica: Si hay bloqueos, envía notificación `error`

### 3.2 Prettier (runPrettier)

**Ubicación**: `packages/router/src/stop.ts:31-44`

**¿Qué hace?**
- Formatea archivos editados automáticamente
- Filtra por extensión válida
- Ejecuta: `npx prettier --write <archivos>`

**Comunicación:**
- Ejecuta: `execa('npx', ['prettier', '--write', ...files])`
- Escribe: Archivos modificados directamente

### 3.3 TypeCheck (runTypeCheck)

**Ubicación**: `packages/router/src/stop.ts:49-81`

**¿Qué hace?**
- Ejecuta `npx tsc --noEmit` por cada repo modificado
- Cuenta errores TypeScript
- Genera output con errores parseables

**Comunicación:**
- Ejecuta: `execa('npx', ['tsc', '--noEmit'], { cwd: repoPath })`
- Lee: Salida stdout/stderr de tsc
- Escribe: Resultados en `typecheck` array

### 3.4 Auto-resolver (autoResolveTypeScriptErrors)

**Ubicación**: `packages/router/src/stop.ts:116-187`

**¿Qué hace?**
- Parsea errores TypeScript del output
- Intenta corregir automáticamente:
  - **TS2307**: Agrega `.js` a imports relativos faltantes
  - Futuro: TS2532, TS2322 (requiere análisis más complejo)

**Comunicación:**
- Lee: Archivos con errores
- Escribe: Archivos corregidos
- Re-ejecuta: TypeCheck para verificar

### 3.5 KPI Emission (emitKPIEvent)

**Ubicación**: `packages/router/src/stop.ts:228-234`

**¿Qué hace?**
- Registra evento en `obs/kpi/events.jsonl` (formato JSONL)
- Incluye métricas: errores, latencia, auto-resolver, adherence

**Comunicación:**
- Escribe: `obs/kpi/events.jsonl`
- Formato: JSON por línea (JSONL)

**Ejemplo de Evento:**
```json
{
  "ts": "2025-11-01T10:30:00Z",
  "repo": "backend",
  "skills": [],
  "errors_ts": 2,
  "auto_resolver_used": false,
  "latency_ms": 0,
  "zero_errors_left_behind": false,
  "activated_by": { "keywords": false, "intent_regex": false, "path_globs": false, "content_patterns": false },
  "adherence": false,
  "progressive_disclosure": { "metadata_loaded": false, "skill_md_loaded": false, "resources_loaded": 0 }
}
```

### 3.6 Notificaciones (sendNotification)

**Ubicación**: `packages/router/src/stop.ts:239-294`

**¿Qué hace?**
- Ejecuta script de notificación cross-platform
- Tipos: `success`, `warning`, `error`, `info`
- Configurable por tipo en `hooks-config.json`

**Comunicación:**
- Lee: `.cursor/hooks/hooks-config.json`
- Ejecuta: `scripts/hooks/notify.sh <type> <message>`
- Soporta: macOS (`notify-macos.sh`), Linux (`notify-linux.sh`), Windows (`notify-windows.ps1`)

### 3.7 Bash Validator (No Implementado en stop.ts)

**Estado**: Configurado en `hooks-config.json` pero **NO integrado en `stopHook()`**

**Ubicación Script**: `scripts/hooks/bash-validator.py`

**¿Qué debería hacer?**
- Validar comandos bash/shell generados por el agente
- Bloquear comandos destructivos (`rm -rf /`, `dd if=/dev/zero`, etc.)
- Niveles: `block` (error), `warn` (warning)

**Recomendación**: Integrar en `stopHook()` antes de guardrails o después de Prettier.

---

## 4. Comunicación entre Componentes

### Diagrama de Comunicación

```
┌─────────────────────────────────────────────────────────────┐
│                    Cursor IDE                                │
│  (Editor ejecuta .cursor/hooks/stop.mjs)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         packages/router/src/stop.ts                         │
│         stopHook() - Orquestador principal                  │
└─┬───────────────────────────────────────────────────────────┘
  │
  ├─► checkGuardrails() ──► packages/router/src/guardrails.ts
  │                          ├─► Lee: configs/skill-rules.json
  │                          └─► Escribe: Console (violaciones)
  │
  ├─► runPrettier() ──────────► execa('npx prettier')
  │                               └─► Modifica archivos directamente
  │
  ├─► runTypeCheck() ─────────► execa('npx tsc --noEmit')
  │                               └─► Lee stdout/stderr
  │
  ├─► autoResolveTypeScriptErrors()
  │   ├─► Lee: Archivos con errores
  │   └─► Escribe: Archivos corregidos
  │
  ├─► emitKPIEvent() ────────► obs/kpi/events.jsonl
  │                              └─► Escribe: JSONL event
  │
  └─► sendNotification() ────► scripts/hooks/notify.sh
                                 └─► Ejecuta script externo
```

### Componentes Externos

**1. Daemon (NO usado actualmente en stopHook)**
- El stop-hook **NO se comunica con el daemon**
- El daemon solo se usa en pre-invoke (`userPromptSubmitHook`)
- Potencial futuro: stop-hook podría consultar daemon para validaciones distribuidas

**2. Service Discovery (NO usado)**
- No hay integración actual
- Potencial: usar para validaciones distribuidas en cluster

**3. Redis (NO usado)**
- No hay integración actual
- Potencial: cache de resultados de typecheck para evitar re-ejecuciones

**4. PostgreSQL (NO usado)**
- No hay integración actual
- Potencial: persistir KPIs directamente (actualmente solo JSONL)

---

## 5. Comparación con el Ejemplo de Referencia

### Ejemplo de Referencia (Reddit Post)

El ejemplo proporcionado describe un sistema más avanzado con:

**✅ Implementado en nuestro sistema:**
- Prettier en archivos editados
- TypeCheck por repo
- Error hints (1-4 errores)
- Auto-resolver (≥5 errores, básico)
- KPI emission (JSONL)
- Notificaciones cross-platform

**❌ NO Implementado (diferencia clave):**
- **No-Mess-Left-Behind (NMLB)**: No hay verificación final de `git status --porcelain`
- **Autocommit automático**: No hay opción `AUTO_COMMIT` para commitear cambios de Prettier
- **Patch generation**: No genera `.posthook.patch` si `AUTO_COMMIT=false`
- **ESLint integration**: No ejecuta ESLint (solo TypeCheck)
- **Git verification**: No verifica que el repo esté limpio al inicio

### Diferencia Principal: NMLB (No-Mess-Left-Behind)

**Ejemplo de Referencia:**
```bash
# Gate final
if [[ -n "$(git status --porcelain)" ]]; then
  echo "⛔ NMLB: aún hay diffs. Revisa ignorados/artefactos."; exit 1
fi
```

**Estado Actual:**
- ✅ Prettier modifica archivos directamente
- ❌ No verifica que `git status` quede limpio después
- ❌ No hay autocommit de cambios de Prettier
- ❌ No hay patch generation como fallback

### Recomendación: Implementar NMLB

Agregar al final de `stopHook()`:

```typescript
// 7. No-Mess-Left-Behind (NMLB)
const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: input.cwd });
if (stdout.trim()) {
  const autoCommit = process.env.AUTO_COMMIT !== 'false';
  
  if (autoCommit) {
    await execa('git', ['add', '-A'], { cwd: input.cwd });
    await execa('git', ['commit', '-m', 'chore(fmt): posthook prettier+lint (auto)'], { cwd: input.cwd });
  } else {
    await execa('git', ['diff'], { cwd: input.cwd }).then(r => 
      writeFile(resolve(input.cwd, '.posthook.patch'), r.stdout)
    );
    await execa('git', ['checkout', '--', '.'], { cwd: input.cwd });
    throw new Error('NMLB: cambios movidos a .posthook.patch (AUTO_COMMIT=false)');
  }
  
  // Verificación final
  const check = await execa('git', ['status', '--porcelain'], { cwd: input.cwd });
  if (check.stdout.trim()) {
    throw new Error('NMLB: repo aún sucio tras autocommit');
  }
}
```

---

## 6. Estado Actual vs Objetivo NMLB

### Estado Actual ✅

| Componente | Estado | Detalles |
|------------|--------|----------|
| Guardrails | ✅ Funcional | Multi-nivel (SUGGEST/WARN/BLOCK) |
| Prettier | ✅ Funcional | Solo archivos editados |
| TypeCheck | ✅ Funcional | Por repo, cuenta errores |
| Error Hints | ✅ Funcional | Si 1-4 errores |
| Auto-resolver | ✅ Parcial | Solo TS2307 (imports .js) |
| KPI Emission | ✅ Funcional | JSONL en `obs/kpi/events.jsonl` |
| Notificaciones | ✅ Funcional | Cross-platform scripts |

### Faltante para NMLB ❌

| Componente | Estado | Prioridad |
|------------|--------|-----------|
| Git status verification | ❌ No implementado | P0 |
| Autocommit de cambios | ❌ No implementado | P0 |
| Patch generation | ❌ No implementado | P1 |
| ESLint integration | ❌ No implementado | P1 |
| Bash validator integration | ❌ Configurado pero no usado | P1 |
| Git clean check (inicio) | ❌ No implementado | P2 |

---

## 7. Recomendaciones

### Prioridad P0 (Crítico)

1. **Implementar NMLB Gate Final**
   - Verificar `git status --porcelain` al final
   - Opción `AUTO_COMMIT` (default: `true`)
   - Generar `.posthook.patch` si `AUTO_COMMIT=false`

2. **Integrar Bash Validator**
   - Ejecutar antes de guardrails o después de Prettier
   - Validar comandos generados por el agente
   - Bloquear comandos destructivos

### Prioridad P1 (Importante)

3. **Integrar ESLint**
   - Ejecutar después de Prettier
   - `npx eslint --cache --fix --max-warnings=0`
   - Solo en archivos editados `.ts`, `.tsx`, `.js`, `.jsx`

4. **Mejorar Auto-resolver**
   - Soporte para más errores TypeScript comunes
   - TS2532: Object is possibly 'undefined'
   - TS2322: Type is not assignable

5. **Git Clean Check (Inicio)**
   - Verificar que el repo esté limpio antes de empezar
   - Advertir si hay cambios pendientes

### Prioridad P2 (Mejoras)

6. **Integración con Daemon**
   - Opcional: consultar daemon para validaciones distribuidas
   - Cache de resultados de typecheck en Redis

7. **Mejoras de Performance**
   - Cache de resultados de Prettier/TypeCheck
   - Ejecución paralela de typecheck por repo

8. **Telemetría Avanzada**
   - Medir latencia de cada paso
   - Tracking de auto-resolver success rate

---

## 📊 Resumen Ejecutivo

**Estado Actual**: ✅ Pipeline funcional con 7 componentes activos  
**Faltante Crítico**: ❌ NMLB (No-Mess-Left-Behind) - verificación final de git status  
**Próximo Paso**: Implementar NMLB gate final con autocommit/patch generation

**Comparación con Referencia**:
- ✅ 85% implementado (Prettier, TypeCheck, Hints, Auto-resolver, KPIs, Notificaciones)
- ❌ 15% faltante (NMLB, ESLint, Bash validator integrado)

---

**Última actualización**: 2025-11-01  
**Autor**: Análisis automático del sistema  
**Referencias**: 
- `packages/router/src/stop.ts`
- `.cursor/hooks/hooks-config.json`
- `packages/router/src/guardrails.ts`
- Ejemplo de referencia (Reddit post sobre post-hooks)

