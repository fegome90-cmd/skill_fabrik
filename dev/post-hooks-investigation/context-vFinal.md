# Context: Sistema de Post-Hooks - Versión Final para Implementación

**Sprint ID**: post-hooks-implementation
**Fecha de Creación**: 2025-11-02
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN
**Metodología**: CLOOP (Clarify → Layout → Operate → Observe → Reflect)

---

## 🎯 Objetivo del Context

Este documento proporciona el contexto técnico completo y consolidado del sistema de post-hooks para la implementación inmediata de los 6 gaps P0 críticos identificados en la investigación.

---

## 🗂️ Estructura de Documentación

```
dev/post-hooks-investigation/
├── context-vFinal.md       # 👈 ESTE ARCHIVO - Contexto técnico consolidado
├── plan-vFinal.md         # Plan de implementación CLOOP
├── task-vFinal.md         # Checklist de tareas críticas
├── context.md             # Versión original (análisis de investigación)
├── plan.md                # Plan original de investigación
├── task.md                # Task original de investigación
└── analysis/              # Análisis técnicos detallados
```

---

## 🗃️ Arquitectura del Sistema

### Componentes Principales

#### 1. **Router Package** (`packages/router/`)

**Propósito**: Núcleo del sistema de activación de skills y post-processing

**Archivos Clave**:
- `stop.ts` (500 líneas) - Pipeline completo de post-hook **[MODIFICAR]**
- `pre-invoke.ts` (427 líneas) - Pre-invoke hook con daemon integration
- `detectors.ts` (222 líneas) - Sistema de matching multi-señal
- `guardrails.ts` (376 líneas) - Sistema multi-nivel de protección
- `types.ts` (139 líneas) - Contratos TypeScript
- `server.ts` (116 líneas) - HTTP server (opcional)

**Funcionalidades Actuales**:
- ✅ Pre-invoke hook: Detección y activación de skills
- ✅ Stop hook: Pipeline completo de calidad post-respuesta
- ✅ Detectors: Sistema de matching multi-señal (keywords 20%, intent 30%, path 30%, content 20%)
- ✅ Guardrails: Sistema multi-nivel de protección (SUGGEST → WARN → BLOCK)
- ✅ HTTP Server: API REST para integración externa (opcional)

#### 2. **Daemon Package** (`packages/daemon/`)

**Propósito**: Servicios de backend para Skills Fabric

**Archivos Clave**:
- `app.ts` (2052 líneas) - Fastify server con 30 endpoints
- `qualityService.ts` - ESLint y Prettier integration **[USAR]**
- `fileWatcher.ts` - Monitoreo de cambios en tiempo real

**Funcionalidades Disponibles**:
- ✅ Skill activation service: Endpoint `/activate` con signals processing
- ✅ Quality service: ESLint y Prettier integration **[APROVECHAR]**
- ✅ File watcher: Monitoreo de cambios en tiempo real con WebSocket
- ✅ Caching: Sistema distribuido (Redis opcional) + memoria local
- ✅ Health checks y métricas: `/health`, `/metrics`

**Puerto Default**: 7727

#### 3. **Skill Rules** (`configs/skill-rules.json`)

**Propósito**: Configuración de skills para detección y activación **[MODIFICAR]**

**Contenido Actual**:
- **Total Skills**: 19 (14 guidelines, 5 guardrails)
- **Triggers**: Keywords, intent patterns, path patterns, content patterns
- **Enforcement Levels**: suggest, warn, require, block
- **Prioridades**: critical, high, normal, low

**Estructura**:
```typescript
interface SkillRule {
  type: 'guideline' | 'guardrail' | 'workflow' | 'analyst' | 'generator';
  enforcement?: 'suggest' | 'warn' | 'require' | 'block';
  priority?: 'critical' | 'high' | 'normal' | 'low';
  promptTriggers?: {
    keywords?: string[];
    intentPatterns?: string[];
  };
  fileTriggers?: {
    pathPatterns?: string[];
    contentPatterns?: string[]; // ← **[AGREGAR A GUARDRAILS]**
  };
}
```

---

## 📊 Estado Actual vs Gaps P0 Críticos

### Funcionalidades Implementadas ✅

1. **Pre-Invoke Hook**:
   - Detección de skills mediante scoring multi-señal (keywords 20%, intent 30%, path 30%, content 20%)
   - Integración con daemon (`POST /activate`)
   - Cache con TTL de 60s
   - Service discovery para routing consistente
   - Slash commands detection
   - Planning mode gate

2. **Stop Hook Pipeline**:
   - Guardrails: Verificación multi-nivel (SUGGEST → WARN → BLOCK)
   - Prettier: Formateo automático de archivos editados
   - TypeCheck: Verificación de tipos por repo
   - Error Hints: Sugerencias para 1-4 errores
   - Auto-resolver: Corrección automática de TS2307 (imports faltantes .js)
   - KPI Emission: Registro en `obs/kpi/events.jsonl`
   - Notifications: Cross-platform alerts

3. **Daemon Services**:
   - Skill activation con signals processing
   - Quality service (ESLint, Prettier) **[SUBUTILIZADO]**
   - File watcher con WebSocket **[NO INTEGRADO]**
   - Cache distribuido (Redis opcional)
   - Health checks y métricas

### ❌ Gaps P0 Críticos a Implementar

#### 1. 🚫 **Guardrails Deshabilitados**
**Problema**: `database-verification` y `secrets-and-config` no tienen `fileTriggers.contentPatterns`
**Causa Raíz**: Solo tienen `promptTriggers`, no `fileTriggers`
**Impacto**: 🔴 Operaciones peligrosas (ej: `deleteMany()` sin `where`) no se bloquean
**Solución**: Agregar `contentPatterns` a guardrails existentes
**Tiempo**: 30 minutos

#### 2. 🔒 **Bash Validator NO Integrado**
**Problema**: Script existe pero no se llama desde `stopHook()`
**Causa Raíz**: Configurado en `hooks-config.json` pero no implementado
**Impacto**: 🔴 Commands destructivos (`rm -rf /`) no se validan
**Solución**: Integrar `scripts/hooks/bash-validator.py` en pipeline
**Tiempo**: 1 hora

#### 3. 🔍 **ESLint NO Ejecutado**
**Problema**: Daemon tiene quality service pero router no lo usa
**Causa Raíz**: Router ejecuta ESLint localmente en lugar de usar daemon
**Impacto**: 🔴 Problemas de calidad no se detectan consistentemente
**Solución**: Usar daemon `/api/quality/lint` endpoint
**Tiempo**: 45 minutos

#### 4. 🏗️ **Build Check NO Implementado**
**Problema**: Configurado pero función no existe en código
**Causa Raíz**: `buildCheck: true` en config pero sin implementación
**Impacto**: 🔴 Cambios que rompen build no se detectan
**Solución**: Implementar función simple de build verification
**Tiempo**: 30 minutos

#### 5. 🔄 **Stop Hook NO Usa Daemon**
**Problema**: Daemon tiene quality service pero router ejecuta localmente
**Causa Raíz**: Duplicación de lógica entre router y daemon
**Impacto**: 🟡 Ineficiencia y no aprovechamiento de servicios
**Solución**: Mover Prettier/TypeCheck a daemon endpoints
**Tiempo**: 1 hora

#### 6. 🧹 **NMLB (No-Mess-Left-Behind) Faltante**
**Problema**: No verifica `git status --porcelain` al final
**Causa Raíz**: Pipeline original no incluyó verificación final
**Impacto**: 🟡 Archivos temporales pueden quedar sin commit
**Solución**: Agregar verificación git status al final
**Tiempo**: 15 minutos

---

## 🔄 Flujos de Comunicación

### Pre-Invoke Flow (SIN CAMBIOS)
```
Cursor IDE
  │
  └─► .cursor/hooks/userPromptSubmit.mjs
       │
       └─► router.userPromptSubmitHook()
            │
            ├─► detectors.loadRules() ──► configs/skill-rules.json
            ├─► detectors.matchRulesFor() ──► Scoring multi-señal
            └─► enhanceWithDaemonResults()
                 │
                 └─► HTTP POST daemon/activate
                      │
                      └─► Daemon: Cache → Signals → Match → Return
```

### Stop Hook Flow (MODIFICAR - Añadir pasos 🔒)
```
Cursor IDE
  │
  └─► .cursor/hooks/stop.mjs
       │
       ├─► git diff --name-only (detecta cambios)
       │
       └─► router.stopHook()
            │
            ├─► 0. checkGuardrails() ──► skill-rules.json ⚠️ **[MEJORAR]**
            ├─► 1. runPrettier() ──► npx prettier --write **[USAR DAEMON]**
            ├─► 2. runTypeCheck() ──► npx tsc --noEmit **[USAR DAEMON]**
            ├─► 3. 🔒 validateBashCommands() ──► **[NUEVO]**
            ├─► 4. 🔒 runESLintViaDaemon() ──► **[NUEVO]**
            ├─► 5. 🔒 runBuildCheck() ──► **[NUEVO]**
            ├─► 6. generateErrorHints() (si 1-4 errores)
            ├─► 7. autoResolveTypeScriptErrors() (si ≥5 errores)
            ├─► 8. emitKPIEvent() ──► obs/kpi/events.jsonl
            ├─► 9. 🔒 verifyCleanRepo() ──► **[NUEVO]**
            └─► 10. sendNotification() ──► scripts/hooks/notify.sh
```

**Nuevos Pasos (🔒)**:
3. `validateBashCommands()` - Bash validator integration
4. `runESLintViaDaemon()` - ESLint via daemon quality service
5. `runBuildCheck()` - Build verification simple
9. `verifyCleanRepo()` - NMLB git status check

---

## 📁 Estructura de Archivos Clave a Modificar

### Archivos Principales

```
packages/router/src/
├── stop.ts              # **[MODIFICAR]** - Pipeline completo de post-hook (500 líneas)
├── pre-invoke.ts        # [SIN CAMBIOS] - Pre-invoke hook con daemon integration (427 líneas)
├── detectors.ts         # [SIN CAMBIOS] - Sistema de matching multi-señal (222 líneas)
├── guardrails.ts        # [SIN CAMBIOS] - Sistema multi-nivel de protección (376 líneas)
├── types.ts             # [SIN CAMBIOS] - Contratos TypeScript (139 líneas)
└── server.ts            # [SIN CAMBIOS] - HTTP server (116 líneas)

configs/
└── skill-rules.json     # **[MODIFICAR]** - Agregar contentPatterns a guardrails

.scripts/hooks/
├── bash-validator.py    # **[USAR]** - Script existente para bash validation
└── notify.sh            # [SIN CAMBIOS] - Sistema de notificaciones
```

### Archivos de Referencia

```
packages/daemon/src/
├── app.ts               # [REFERENCIA] - Quality endpoints disponibles
├── qualityService.ts    # [REFERENCIA] - ESLint y Prettier implementation
└── fileWatcher.ts       # [REFERENCIA] - File watching capabilities
```

---

## 🔧 Stack Tecnológico (EXISTENTE - NO MODIFICAR)

### Runtime
- **Node.js**: ≥18
- **TypeScript**: ESM modules
- **Fastify**: HTTP server (daemon)

### Herramientas Ejecutadas (EXISTENTES)
- **Prettier**: `npx prettier --write`
- **TypeScript Compiler**: `npx tsc --noEmit`
- **Git**: `git diff --name-only` (para detectar cambios)

### Servicios Externos (EXISTENTES)
- **Daemon**: `http://127.0.0.1:7727` (default)
- **Router HTTP**: `http://127.0.0.1:3000` (opcional)
- **Service Discovery**: `http://127.0.0.1:8877` (opcional)
- **Redis**: Opcional para cache distribuido

---

## 📊 Métricas y Observabilidad (EXISTENTES)

### KPI Events

**Formato**: JSONL en `obs/kpi/events.jsonl`

**Estructura**:
```typescript
{
  ts: string;
  repo: string;
  skills: string[];
  errors_ts: number;
  auto_resolver_used: boolean;
  latency_ms: number;
  zero_errors_left_behind: boolean;
  activated_by: {
    keywords: boolean;
    intent_regex: boolean;
    path_globs: boolean;
    content_patterns: boolean;
  };
  adherence: boolean;
  progressive_disclosure: {...};
}
```

### Health Checks

**Daemon**: `GET /health`
- Database status
- Cache metrics
- System metrics
- Service health

**Router**: `GET /health` (si server está corriendo)

---

## 🎓 Decisiones Técnicas Clave (MANTENER)

### 1. Scoring Multi-Señal
**Weights**: Keywords: 20%, Intent: 30%, Path: 30%, Content: 20%
**Justificación**: Balance entre precisión (intent/path) y cobertura (keywords/content)

### 2. Threshold Default
**Valor**: 0.6 (60%)
**Justificación**: Balance entre activación suficiente y precisión

### 3. Cache TTL
**Valor**: 60 segundos
**Justificación**: Balance entre performance y frescura de datos

### 4. Auto-Resolver Trigger
**Umbral**: ≥5 errores
**Justificación**: Si hay pocos errores (1-4), hints son suficientes. Con muchos errores, auto-resolver es más eficiente.

### 5. Guardrails Multi-Nivel
**Niveles**: SUGGEST → WARN → BLOCK
**Justificación**: Progresión educativa antes de bloquear, permite aprendizaje

---

## ⚠️ Puntos Críticos de Desarrollo Identificados

### Top 5 Riesgos Técnicos

#### 1. 🔴 **Regex Patterns para Guardrails**
**Riesgo**: Patrones imprecisos pueden causar falsos positivos/negativos
**Impacto**: Bloqueo de código seguro o permite código peligroso
**Mitigación**: Testing exhaustivo con casos reales y límite

#### 2. 🔴 **Extracción de Comandos Bash**
**Riesgo**: Dificultad para identificar comandos bash en archivos editados
**Impacto**: Comandos peligrosos no detectados
**Mitigación**: Parser robusto con múltiples patrones de detección

#### 3. 🟡 **Daemon Availability Fallback**
**Riesgo**: Daemon no disponible -> ESLint/Build Check fallan
**Impacto**: Pipeline se detiene si daemon no responde
**Mitigación**: Implementar timeout y fallback a ejecución local

#### 4. 🟡 **Performance Overhead**
**Riesgo**: Nuevas validaciones aumentan tiempo de respuesta
**Impacto**: UX afectada por latencia adicional
**Mitigación**: Métricas baseline y optimización de timeouts

#### 5. 🟡 **Git Status Interpretation**
**Riesgo**: Repos con múltiples cambios pendientes
**Impacto**: Falsos positivos en NMLB verification
**Mitigación**: Lógica inteligente para diferenciar cambios relevantes

### Estrategia de Testing Temprano

#### Testing Unitario por Gap
```bash
# Test 1: Guardrails patterns
pnpm test:guardrails-patterns

# Test 2: Bash validator integration
pnpm test:bash-validator

# Test 3: ESLint daemon integration
pnpm test:eslint-daemon

# Test 4: Build check timeout
pnpm test:build-check

# Test 5: NMLB git status
pnpm test:nmlb-check
```

#### Testing de Integración
```bash
# End-to-end con patterns peligrosos
pnpm test:post-hooks-e2e

# Performance baseline
pnpm test:post-hooks-performance

# Daemon availability fallback
pnpm test:daemon-fallback
```

---

## 🔧 Soluciones Técnicas Específicas

### 1. Guardrails Patterns Implementation

```typescript
// configs/skill-rules.json - AGREGAR
{
  "database-verification": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "critical",
    "fileTriggers": {
      "contentPatterns": [
        "deleteMany\\([^)]*\\)(?!.*where)",
        "updateMany\\([^)]*\\)(?!.*where)",
        "findMany\\(\\)(?!.*where|\\s+limit\\s*\\d+)",
        "prisma\\.user\\.deleteMany\\(\\)",
        "prisma\\.post\\.updateMany\\(\\)"
      ]
    }
  },
  "secrets-and-config": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "critical",
    "fileTriggers": {
      "contentPatterns": [
        "API_KEY\\s*=\\s*['\"][^'\"]+['\"]",
        "password\\s*=\\s*['\"][^'\"]+['\"]",
        "secret\\s*=\\s*['\"][^'\"]+['\"]",
        "token\\s*=\\s*['\"][^'\"]+['\"]",
        "AKIA[0-9A-Z]{16}", // AWS Access Key
        "sk-[a-zA-Z0-9]{48}" // Stripe Secret Key
      ]
    }
  }
}
```

### 2. Bash Validator Integration

```typescript
// packages/router/src/stop.ts - AGREGAR FUNCIÓN
async function validateBashCommands(files: string[]): Promise<ValidationResult> {
  const bashValidator = path.join(process.cwd(), 'scripts/hooks/bash-validator.py');

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js') && !file.endsWith('.mjs')) {
      continue;
    }

    const content = await fs.readFile(file, 'utf-8');
    const bashCommands = extractBashCommands(content);

    for (const cmd of bashCommands) {
      const result = await execa('python3', [bashValidator, cmd], {
        cwd: process.cwd(),
        timeout: 5000
      });

      if (result.stdout.includes('🚫') || result.stdout.includes('BLOCKED')) {
        return {
          blocked: true,
          reason: `Bash command blocked in ${file}: ${cmd}`,
          details: result.stdout
        };
      }
    }
  }

  return { blocked: false };
}

function extractBashCommands(content: string): string[] {
  // Extraer comandos bash de templates strings, exec(), spawn(), etc.
  const patterns = [
    /exec\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /spawn\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\$\{([^}]+)\}/g, // Template literals
    /`([^`]+)`/g // Backticks
  ];

  const commands: string[] = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      commands.push(match[1]);
    }
  }

  return commands;
}
```

### 3. ESLint via Daemon Integration

```typescript
// packages/router/src/stop.ts - AGREGAR FUNCIÓN
async function runESLintViaDaemon(files: string[]): Promise<ESLintResult> {
  try {
    const response = await fetch('http://127.0.0.1:7727/api/quality/lint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files,
        options: { fix: false, quiet: true }
      }),
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`Daemon ESLint failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      errors: result.errors || [],
      warnings: result.warnings || []
    };

  } catch (error) {
    // Fallback: ejecutar ESLint localmente si daemon no disponible
    console.warn('Daemon ESLint unavailable, using local fallback');
    return runESLintLocally(files);
  }
}
```

### 4. Build Check Implementation

```typescript
// packages/router/src/stop.ts - AGREGAR FUNCIÓN
async function runBuildCheck(cwd: string): Promise<BuildResult> {
  try {
    // Detectar build command por repo
    const buildCommand = await detectBuildCommand(cwd);

    const result = await execa.command(buildCommand, {
      cwd,
      timeout: 60000, // 1 minuto timeout
      reject: false
    });

    return {
      success: result.exitCode === 0,
      output: result.stdout,
      errors: result.stderr,
      duration: result.duration
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      timedOut: error.timedOut
    };
  }
}

async function detectBuildCommand(cwd: string): Promise<string> {
  const packageJsonPath = path.join(cwd, 'package.json');

  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    if (packageJson.scripts?.build) {
      return 'npm run build';
    }

    if (packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
      return 'npx tsc --noEmit';
    }
  }

  // Default fallback
  return 'npm run build';
}
```

### 5. NMLB Implementation

```typescript
// packages/router/src/stop.ts - AGREGAR FUNCIÓN
async function verifyCleanRepo(cwd: string): Promise<NMLBResult> {
  try {
    const result = await execa('git', ['status', '--porcelain'], {
      cwd,
      timeout: 5000
    });

    const changedFiles = result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3)); // Remover status prefix

    const relevantFiles = changedFiles.filter(file =>
      file.endsWith('.ts') ||
      file.endsWith('.js') ||
      file.endsWith('.json') ||
      file.endsWith('.md')
    );

    return {
      clean: relevantFiles.length === 0,
      changedFiles: relevantFiles,
      totalChanged: changedFiles.length
    };

  } catch (error) {
    // Si no es repo git, considerar limpio
    return {
      clean: true,
      changedFiles: [],
      totalChanged: 0,
      notARepo: true
    };
  }
}
```

---

## 📋 Roadmap de Implementación

### Fase 1: Configuración Guardrails (30 min)
- [ ] Agregar `contentPatterns` a `database-verification`
- [ ] Agregar `contentPatterns` a `secrets-and-config`
- [ ] Test con patrones peligrosos reales

### Fase 2: Bash Validator Integration (1 hora)
- [ ] Crear función `validateBashCommands()`
- [ ] Crear función `extractBashCommands()`
- [ ] Integrar en pipeline `stopHook()`
- [ ] Test con comandos destructivos

### Fase 3: ESLint + Build Check (1.5 horas)
- [ ] Crear función `runESLintViaDaemon()`
- [ ] Crear función `runBuildCheck()`
- [ ] Implementar fallback local para ESLint
- [ ] Testing de timeouts y errores

### Fase 4: NMLB + Daemon Integration (1.5 horas)
- [ ] Crear función `verifyCleanRepo()`
- [ ] Mover Prettier/TypeCheck a daemon endpoints
- [ ] Testing end-to-end completo
- [ ] Medición de performance impact

### Fase 5: Validación Final (1 hora)
- [ ] Ejecutar todos los tests de gaps
- [ ] Medir overhead de performance
- [ ] Actualizar documentación
- [ ] Cleanup de código duplicado

**Total Estimado**: ~6 horas de desarrollo + ~1 hora de testing

---

## 🎯 Métricas de Éxito

### Funcionalidad
- ✅ 6/6 gaps P0 implementados (100% coverage)
- ✅ Zero breaking changes en funcionalidad existente
- ✅ Todos los tests pasan
- ✅ Bash commands peligrosos bloqueados
- ✅ ESLint errors detectados
- ✅ Build failures detectados temprano

### Performance
- ✅ <500ms overhead adicional total
- ✅ <2s para bash validation
- ✅ <30s para ESLint via daemon
- ✅ <60s para build check

### Calidad
- ✅ Documentación 100% actualizada
- ✅ Tests de regresión para cada gap
- ✅ Logs y errores documentados
- ✅ Fallback mechanisms implementados

---

## 📚 Referencias Técnicas

### Archivos de Referencia Clave
- `packages/router/src/stop.ts:1-500` - Pipeline actual a modificar
- `configs/skill-rules.json:1-442` - Configuración a actualizar
- `scripts/hooks/bash-validator.py` - Script existente a integrar
- `packages/daemon/src/app.ts:1-2052` - Endpoints daemon a consumir

### Análisis Complementarios
- `analysis/router-analysis.md` - Detalles técnicos del router
- `analysis/daemon-analysis.md` - Endpoints y servicios disponibles
- `analysis/skill-rules-analysis.md` - Configuración actual de skills
- `analysis/integration-analysis.md` - Flujos end-to-end

---

**Última actualización**: 2025-11-02
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN
**Próximo Paso**: Ejecutar `task-vFinal.md` checklist de implementación