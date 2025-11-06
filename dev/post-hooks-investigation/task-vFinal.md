# Task: Implementación del Sistema de Post-Hooks - Checklist Crítico

**Sprint ID**: post-hooks-implementation
**Fecha de Inicio**: 2025-11-02
**Estado General**: 🔄 EN PROGRESO
**Progreso Total**: ████ 20% (Documentation Complete)

---

## 📊 Resumen Ejecutivo

**Objetivo**: Implementar 6 gaps P0 críticos del sistema de post-hooks con estrategia minimalista y anti-sobreingeniería.

**Métricas Actuales**:
- **Documentation**: 100% consolidada ✅
- **Implementation**: 0% iniciada ⏳
- **Puntos Críticos Identificados**: 5 riesgos técnicos principales
- **Timeline Estimado**: 9-11 horas totales

---

## 🎯 Puntos Críticos de Desarrollo (Top 5 Riesgos)

### 🔴 1. Regex Patterns para Guardrails
**Riesgo**: Patrones imprecisos → falsos positivos/negativos
**Impacto**: Bloqueo de código seguro o permite código peligroso
**Mitigación**: Testing exhaustivo con casos reales antes de producción

### 🔴 2. Extracción de Comandos Bash
**Riesgo**: Detección incompleta de comandos peligrosos
**Impacto**: Commands destructivos no detectados
**Mitigación**: Multiple patterns y parser robusto con fallback

### 🟡 3. Daemon Availability Fallback
**Riesgo**: Daemon no responde → pipeline se detiene
**Impacto**: ESLint/Build Check fallan completamente
**Mitigación**: Timeout configurado + fallback local implementado

### 🟡 4. Performance Overhead
**Riesgo**: Validaciones adicionales → UX afectada
**Impacto**: Tiempos de respuesta >500ms adicionales
**Mitigación**: Ejecución paralela donde sea posible + timeouts óptimos

### 🟡 5. Git Status Interpretation
**Riesgo**: Repo con múltiples cambios → falsos positivos NMLB
**Impacto**: Notificaciones excesivas o cambios relevantes ignorados
**Mitigación**: Filtrado inteligente por tipo de archivo y relevancia

---

## 📋 Checklist de Implementación

### Fase 0: Setup y Validación (30 min)

**Precondiciones Críticas**:
- [ ] Daemon services running en puerto 7727
- [ ] Bash validator script exists en `scripts/hooks/bash-validator.py`
- [ ] Router package build exitoso
- [ ] Performance baseline medido (<100ms actual)
- [ ] Git repo limpio para testing

**Validaciones**:
```bash
# 1. Verificar daemon
curl http://127.0.0.1:7727/health

# 2. Verificar bash validator
python3 scripts/hooks/bash-validator.py "rm -rf /"

# 3. Verificar router build
pnpm --filter @skills-fabrik/router build

# 4. Medir baseline actual
time node packages/router/dist/stop.js --test
```

**Status**: ⏳ Pendiente

---

### Fase 1: Configuración Guardrails (45 min)

#### 1.1 Modificar skill-rules.json
- [ ] **Backup**: Copiar `configs/skill-rules.json` a `.backup`
- [ ] **Database Patterns**: Agregar contentPatterns a `database-verification`
  ```json
  "fileTriggers": {
    "contentPatterns": [
      "deleteMany\\([^)]*\\)(?!.*where)",
      "updateMany\\([^)]*\\)(?!.*where)",
      "findMany\\(\\)(?!.*where|\\s+limit\\s*\\d+)"
    ]
  }
  ```
- [ ] **Secrets Patterns**: Agregar contentPatterns a `secrets-and-config`
  ```json
  "fileTriggers": {
    "contentPatterns": [
      "API_KEY\\s*=\\s*['\"][^'\"]+['\"]",
      "password\\s*=\\s*['\"][^'\"]+['\"]",
      "AKIA[0-9A-Z]{16}"
    ]
  }
  ```
- [ ] **Validación**: Verificar sintaxis JSON
- [ ] **Reload**: Reiniciar services para cargar nueva configuración

#### 1.2 Testing de Guardrails
- [ ] **Test Positivo**: Crear archivo con `prisma.user.deleteMany()` → debe bloquear
- [ ] **Test Negativo**: Crear archivo con `prisma.user.deleteMany({where: ...})` → debe permitir
- [ ] **Test Secrets**: Crear archivo con `API_KEY = "sk_test_..."` → debe bloquear
- [ ] **Test Falsos Positivos**: Crear archivo con `delete_many_safe()` → debe permitir

**Métricas de Éxito**:
- ✅ 3/3 tests positivos bloquean correctamente
- ✅ 2/2 tests negativos permiten correctamente
- ✅ 0 falsos positivos en tests básicos

**Status**: ⏳ Pendiente

---

### Fase 2: Bash Validator Integration (1.5 horas)

#### 2.1 Implementar validateBashCommands()
**Archivo**: `packages/router/src/stop.ts`

- [ ] **Import Required**: Importar `execa`, `fs`, `path`
- [ ] **Function Signature**:
  ```typescript
  async function validateBashCommands(files: string[]): Promise<{
    blocked: boolean;
    reason?: string;
    details?: string;
  }>
  ```
- [ ] **File Filtering**: Procesar solo `.ts`, `.js`, `.mjs` files
- [ ] **Command Extraction**: Llamar a `extractBashCommands()`
- [ ] **Script Execution**: Ejecutar bash validator para cada comando
- [ ] **Timeout Handling**: 5s timeout por comando
- [ ] **Result Parsing**: Detectar `🚫` o `BLOCKED` en output
- [ ] **Error Handling**: Capturar errores del script

#### 2.2 Implementar extractBashCommands()
- [ ] **Pattern Detection**: Multiple regex patterns
  ```typescript
  const patterns = [
    /exec\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /spawn\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\$\{([^}]+)\}/g,
    /`([^`]+)`/g
  ];
  ```
- [ ] **Command Extraction**: Iterar sobre todos los patterns
- [ ] **Deduplication**: Remover comandos duplicados
- [ ] **Filtering**: Excluir comandos obviamente seguros (`echo`, `ls`, etc.)

#### 2.3 Integrar en Pipeline
- [ ] **Insertion Point**: Después de `checkGuardrails()` existente
- [ ] **Blocking Logic**: Si `blocked: true`, detener pipeline con error claro
- [ ] **Error Message**: Mensaje explicativo con archivo y comando bloqueado
- [ ] **Logging**: Loggear intentos bloqueados para auditoría

#### 2.4 Testing de Bash Validator
- [ ] **Test Blocking**: Archivo con `rm -rf /` → debe bloquear
- [ ] **Test Safe**: Archivo con `console.log('hello')` → debe permitir
- [ ] **Test Extraction**: Archivo con múltiples comandos en diferentes patterns
- [ ] **Test Edge Cases**: Archivo con comandos en comentarios → debe ignorar
- [ ] **Test Performance**: 10 comandos en un archivo → <2s processing

**Métricas de Éxito**:
- ✅ Comandos peligrosos bloqueados (rm -rf, sudo, etc.)
- ✅ Comandos seguros permitidos
- ✅ <2s processing para 10 comandos
- ✅ 0 falsos positivos en commands seguros

**Status**: ⏳ Pendiente

---

### Fase 3: ESLint + Build Check (2 horas)

#### 3.1 Implementar runESLintViaDaemon()
- [ ] **Function Signature**:
  ```typescript
  async function runESLintViaDaemon(files: string[]): Promise<{
    success: boolean;
    errors: Array<{file: string, line: number, message: string}>;
    warnings: Array<{file: string, line: number, message: string}>;
    usedDaemon: boolean;
  }>
  ```
- [ ] **Daemon Request**: POST a `http://127.0.0.1:7727/api/quality/lint`
- [ ] **Request Body**: `{files, options: {fix: false, quiet: true}}`
- [ ] **Timeout**: 30s timeout global
- [ ] **Response Parsing**: Extraer errors y warnings
- [ ] **Fallback Implementation**: Llamar a ESLint local si daemon falla
- [ ] **Retry Logic**: 1 retry con 5s delay

#### 3.2 Implementar runBuildCheck()
- [ ] **Function Signature**:
  ```typescript
  async function runBuildCheck(cwd: string): Promise<{
    success: boolean;
    output?: string;
    errors?: string;
    duration?: number;
    timedOut?: boolean;
  }>
  ```
- [ ] **Build Detection**:
  ```typescript
  async function detectBuildCommand(cwd: string): Promise<string> {
    // 1. Check package.json scripts.build
    // 2. Check TypeScript config → npx tsc --noEmit
    // 3. Default: npm run build
  }
  ```
- [ ] **Execution**: Ejecutar comando detectado
- [ ] **Timeout**: 60s timeout
- [ ] **Error Capture**: Capturar stdout y stderr
- [ ] **Duration Tracking**: Medir tiempo de ejecución

#### 3.3 Integrar en Pipeline
- [ ] **ESLint Integration**: Reemplazar ESLint local con daemon call
- [ ] **Build Check**: Agregar después de ESLint
- [ ] **Error Handling**: Continuar pipeline con warnings, detener con errores
- [ ] **Performance**: Paralelizar donde sea posible

#### 3.4 Testing de Quality Services
- [ ] **Test ESLint Daemon**: Archivo con errores ESLint → debe detectar
- [ ] **Test ESLint Fallback**: Daemon caído → usa ESLint local
- [ ] **Test Build Check**: Archivo con errores TypeScript → build falla
- [ ] **Test Build Timeout**: Build >60s → timeout graceful
- [ ] **Test Performance**: 5 archivos → <10s total

**Métricas de Éxito**:
- ✅ ESLint errors detectados vía daemon
- ✅ Fallback local funciona cuando daemon caído
- ✅ Build failures detectados <60s
- ✅ Performance <10s para 5 archivos

**Status**: ⏳ Pendiente

---

### Fase 4: NMLB + Final Integration (1.5 horas)

#### 4.1 Implementar verifyCleanRepo()
- [ ] **Function Signature**:
  ```typescript
  async function verifyCleanRepo(cwd: string): Promise<{
    clean: boolean;
    changedFiles: string[];
    totalChanged: number;
    notARepo?: boolean;
  }>
  ```
- [ ] **Git Status**: Ejecutar `git status --porcelain`
- [ ] **File Filtering**: Solo `.ts`, `.js`, `.json`, `.md` files
- [ ] **Not a Repo**: Si git falla, retornar `clean: true, notARepo: true`
- [ ] **File Count**: Contar archivos relevantes cambiados

#### 4.2 Optimizar Pipeline Completo
- [ ] **Review Pipeline**: Analizar orden actual de ejecución
- [ ] **Parallel Execution**: Identificar operaciones paralelizables
  ```typescript
  // Potencialmente paralelo:
  const [eslintResult, buildResult] = await Promise.all([
    runESLintViaDaemon(files),
    runBuildCheck(cwd)
  ]);
  ```
- [ ] **Early Exit**: Optimizar para detenerse temprano en errores críticos
- [ ] **Logging Improvement**: Agregar logs estructurados por fase
- [ ] **Error Aggregation**: Juntar múltiples errores en un solo reporte

#### 4.3 Testing End-to-End
- [ ] **Complete Gap Test**: Archivo con todos los gaps P0
  - `prisma.user.deleteMany()` → Guardrails bloqueo
  - `rm -rf /` → Bash validator bloqueo
  - ESLint errors → Detectados
  - TypeScript errors → Build fail
  - Git changes → NMLB detectado
- [ ] **Performance Test**: Pipeline completo <500ms overhead
- [ ] **Real World Test**: Archivos de proyecto real → sin breaking changes
- [ ] **Error Recovery**: Cada error individual → recovery correcto

**Métricas de Éxito**:
- ✅ Todos los gaps P0 detectados en un solo archivo
- ✅ Pipeline completo <500ms overhead
- ✅ Zero breaking changes en proyectos existentes
- ✅ Recovery correcto para cada tipo de error

**Status**: ⏳ Pendiente

---

### Fase 5: Validación y Documentation (1 hora)

#### 5.1 Testing de Regresión Completo
- [ ] **Unit Tests**: Cada función nueva aislada
  ```bash
  pnpm test:guardrails-patterns
  pnpm test:bash-validator
  pnpm test:eslint-daemon
  pnpm test:build-check
  pnpm test:nmlb-check
  ```
- [ ] **Integration Tests**: Comunicación con daemon services
  ```bash
  pnpm test:post-hooks-integration
  ```
- [ ] **End-to-End Tests**: Pipeline completo
  ```bash
  pnpm test:post-hooks-e2e
  ```

#### 5.2 Medición de Performance Final
- [ ] **Baseline Comparison**: Medir vs baseline original
- [ ] **Individual Phase Times**: Desglose por cada validación
- [ ] **Memory Usage**: Verificar no memory leaks
- [ ] **Concurrent Execution**: Test con múltiples archivos

#### 5.3 Documentation Update
- [ ] **Task Final Status**: Actualizar este archivo con resultados finales
- [ ] **Lessons Learned**: Documentar lecciones de implementación
- [ ] **Known Issues**: Documentar limitaciones o trade-offs
- [ ] **Future Improvements**: Identificar P1/P2 gaps para futuro

#### 5.4 Cleanup Final
- [ ] **Code Review**: Revisar código implementado
- [ ] **Remove Debug**: Remover logs y código de debugging
- [ ] **Optimize Imports**: Limpiar imports no utilizados
- [ ] **Add Comments**: Documentar funciones complejas

**Métricas de Éxito**:
- ✅ Todos los tests pasando (100%)
- ✅ Performance <500ms overhead validado
- ✅ Documentación 100% actualizada
- ✅ Code review completado sin issues críticos

**Status**: ⏳ Pendiente

---

## 📊 Métricas de Progreso

### Progreso por Fase
```
Fase 0 (Setup):          ████ 100% ✅ Documentation Complete
Fase 1 (Guardrails):     ░░░░   0%  ⏳ Not Started
Fase 2 (Bash Validator):  ░░░░   0%  ⏳ Not Started
Fase 3 (ESLint+Build):    ░░░░   0%  ⏳ Not Started
Fase 4 (NMLB+Final):      ░░░░   0%  ⏳ Not Started
Fase 5 (Validation):      ░░░░   0%  ⏳ Not Started
Total Progress:          ████ 20%   🔄 Documentation Complete
```

### Métricas Acumuladas
- **Documentation**: 3/3 archivos consolidados ✅
- **Critical Risks**: 5 identificados con mitigación ✅
- **Implementation Tasks**: 0/35 tareas completadas ⏳
- **Estimated Time**: 0/9 horas utilizadas ⏳

---

## ⚠️ Bloqueadores y Dependencies

### Dependencies Externas
- **Daemon Services**: Debe estar corriendo en puerto 7727
- **Node.js ≥18**: Requerido para funciones modernas
- **pnpm**: Para ejecución de build commands

### Dependencies Internas
- **Fase 0**: Setup completo antes de Fase 1
- **Fase 1**: Guardrails funcionando antes de bash validator
- **Fase 2**: Bash validator antes de ESLint integration
- **Fase 3**: Quality services antes de NMLB
- **Fase 4**: Todo implementado antes de validación final

### Potential Blockers
- **Daemon no disponible**: Fallback implementado
- **Bash script incompatible**: Adaptación requerida
- **Performance >500ms**: Optimización durante implementación
- **Git no disponible**: NMLB gracefully handle

---

## 🎯 Criterios de Aceptación

### Funcionales (Must Have)
- ✅ 6/6 gaps P0 implementados y funcionando
- ✅ Zero breaking changes en funcionalidad existente
- ✅ Todos los tests de seguridad pasando
- ✅ Comandos bash peligrosos bloqueados
- ✅ ESLint errors detectados vía daemon
- ✅ Build failures detectados temprano

### Performance (Must Have)
- ✅ <500ms overhead total del pipeline
- ✅ <30s timeout para ESLint daemon
- ✅ <60s timeout para build check
- ✅ <2s para bash validation (10 comandos)
- ✅ Memory usage estable (no leaks)

### Calidad (Must Have)
- ✅ Tests unitarios para cada función nueva
- ✅ Integration tests con daemon services
- ✅ End-to-end tests con gaps reales
- ✅ Error handling robusto implementado
- ✅ Logging adecuado para debugging

### Documentation (Should Have)
- ✅ Task.md actualizado con resultados finales
- ✅ Lessons learned documentadas
- ✅ Known issues identificados
- ✅ Future improvements roadmap

---

## 📞 Contacto y Soporte

### Referencias Rápidas
- **Contexto Técnico**: `context-vFinal.md`
- **Plan de Implementación**: `plan-vFinal.md`
- **Análisis Original**: `context.md` (investigación)
- **Scripts de Referencia**: `scripts/hooks/bash-validator.py`

### Comunicación de Bloqueos
- Si daemon no disponible: Verificar servicios PM2
- Si tests fallan: Revisar patterns y timeouts
- Si performance >500ms: Habilitar debug logging
- Si breaking changes: Revertir cambios y analizar causa

---

**Última actualización**: 2025-11-02
**Próxima Acción**: Iniciar Fase 1 - Configuración Guardrails
**Timeline Restante**: 9-11 horas de implementación
**Status**: 🔄 READY FOR EXECUTION