# Guía Práctica de Uso - Skills Fabric

## Sistema Fuzzy Matching + Contextual Boost v2.0 (95% Relevancia)

Esta guía práctica te permitirá dominar el sistema Skills Fabric en menos de 30 minutos. Todo lo que necesitas saber para usar el sistema de manera efectiva.

---

## 📋 Índice

1. [Sistema de Activación de Skills](#1-sistema-de-activación-de-skills)
2. [Guía de Prompts Efectivos](#2-guía-de-prompts-efectivos)
3. [Flujo Completo de Trabajo](#3-flujo-completo-de-trabajo)
4. [Prompt Builder v2 - Uso Avanzado](#4-prompt-builder-v2---uso-avanzado) (ver `/dev/prompt-builder/v2-complete/`)
5. [CLI Commands Esenciales](#5-cli-commands-esenciales)
6. [Verificación de Hooks](#6-verificación-de-hooks)
7. [No Mess Left Behind (NMLB)](#7-no-mess-left-behind-nmlb)
8. [Ejemplos Reales de Prompts](#8-ejemplos-reales-de-prompts)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Sistema de Activación de Skills

### 1.1 ¿Cómo Funciona?

El sistema Skills Fabric utiliza **Fuzzy Matching + Contextual Boost v2.0** para activar skills automáticamente basado en el contenido de tu prompt y contexto.

**Flujo de activación:**
```
Prompt → Fuzzy Matching (Jaro-Winkler) → Contextual Boosts → Threshold Check → Skill Activation
```

### 1.2 Componentes Clave

#### Fuzzy Matching Engine v1.0
- **Algoritmo**: Jaro-Winkler similarity
- **Threshold**: 0.7 (ajustable)
- **Cache**: Optimizado para rendimiento
- **Soporte**: Exact match + fuzzy match

#### Contextual Boost System v2.0
Four factors que aumentan la precisión en **42%**:

| Factor | Peso | Descripción |
|--------|------|-------------|
| **fileContext** | 0.15 | Contexto del archivo activo |
| **recentActivation** | 0.10 | Activaciones recientes (historial LRU) |
| **keywordDensity** | 0.05 | Densidad de keywords en prompt |
| **intentMatch** | 0.12 | Match de intent mejorado |

#### Threshold Dinámico
Basado en enforcement level:

```typescript
BLOCK → 0.2    // Guardrails críticos (alta sensibilidad)
REQUIRE → 0.4  // Obligatorios
WARN → 0.5     // Advertencias  
SUGGEST → 0.6  // Recomendaciones
```

---

## 2. Guía de Prompts Efectivos

### 2.1 Estructura de un Prompt Óptimo

Para maximizar la activación de skills, usa esta estructura:

```
[ACCIÓN] + [OBJETO] + [CONTEXTO] + [INTENCIÓN]

Ejemplo:
"Implementar endpoint de autenticación con JWT para API REST, siguiendo patrones backend"
```

### 2.2 Keywords Que Funcionan Mejor

#### ✨ High-Impact Keywords (activan múltiples skills)

**Backend/API:**
- `endpoint` → backend-dev-guidelines + api-design-and-testing
- `controller` → backend-dev-guidelines
- `repository` → backend-dev-guidelines + database-management
- `microservicio` → backend-dev-guidelines + backend-architecture-patterns

**Database:**
- `migrations` → database-management
- `schema` → database-management
- `prisma` → database-management
- `backup` → database-management

**Performance:**
- `optimizar` → performance-optimization
- `cache` → performance-optimization
- `lazy loading` → performance-optimization
- `benchmark` → performance-optimization

**Security:**
- `testing` → security-testing-guide
- `vulnerability` → security-testing-guide
- `penetration` → security-testing-guide
- `owasp` → security-testing-guide

#### 🎯 Medium-Impact Keywords

**Testing:**
- `test`, `testing`, `suite`, `e2e`, `integration`

**CI/CD:**
- `pipeline`, `deploy`, `github actions`, `workflow`

**Architecture:**
- `ddd`, `cqrs`, `hexagonal`, `clean architecture`

### 2.3 Ejemplos Antes/Después

#### ❌ ANTES - Prompt Genérico
```
"Hacer endpoint para usuarios"
```
**Resultado**: 0-1 skills activados

#### ✅ DESPUÉS - Prompt Optimizado
```
"Implementar endpoint POST /users con validación de schema, siguiendo patrones backend de rutas→controladores→servicios→repositorios"
```
**Resultado**: 3-4 skills activados (backend-dev-guidelines, api-design-and-testing, database-management)

#### ❌ ANTES - Prompt Vago
```
"Arreglar errores de base de datos"
```
**Resultado**: 0-1 skills activados

#### ✅ DESPUÉS - Prompt Específico
```
"Revisar y optimizar queries lentas en PostgreSQL, aplicar migración segura con rollback plan usando Prisma"
```
**Resultado**: 2-3 skills activados (database-management + guardrails)

### 2.4 Técnicas por Tipo de Tarea

#### 🔧 Feature Development
```
"[IMPLEMENTAR|CREAR|AGREGAR] [FUNCIONALIDAD] con [TECNOLOGÍA] siguiendo [PATRÓN]"
```
**Ejemplo**: "Implementar sistema de notificaciones con WebSocket siguiendo arquitectura hexagonal"

#### 🐛 Bug Fix
```
"[ARREGLAR|RESOLVER|FIX] [PROBLEMA] en [COMPONENTE] con [ANÁLISIS]"
```
**Ejemplo**: "Resolver memory leak en componente React con profiling y systematic debugging"

#### 🔄 Refactor
```
"[REFACTORIZAR|REESTRUCTURAR] [CÓDIGO] para [OBJETIVO] usando [PATRÓN]"
```
**Ejemplo**: "Refactorizar controladores para aplicar DDD con arquitectura limpia"

#### 🧪 Testing
```
"[IMPLEMENTAR|CREAR] [TIPO] tests para [COMPONENTE] con [HERRAMIENTA]"
```
**Ejemplo**: "Implementar tests de integración para API REST con Playwright y validación OWASP"

#### 🔒 Security
```
"[IMPLEMENTAR|REALIZAR] [TIPO] security testing para [APLICACIÓN] siguiendo [ESTÁNDAR]"
```
**Ejemplo**: "Realizar penetration testing para aplicación web siguiendo OWASP Top 10"

---

## 3. Flujo Completo de Trabajo

### 3.1 Secuencia Paso a Paso

```
┌─────────────────┐
│ 1. PLAN         │ ← Crear plan estructurado (opcional en modo planning)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. PROMPT       │ ← Escribir prompt optimizado
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. PRE-HOOK     │ ← Skill activation + planning mode check
│ (auto)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. SKILL LOAD   │ ← Cargar SKILL.md + recursos on-demand
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. EXECUTE      │ ← Claude procesa con skills activados
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. POST-HOOK    │ ← Pipeline de calidad (12 pasos)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. NMLB         │ ← Verificación final repositorio limpio
└─────────────────┘
```

### 3.2 Qué Verificar en Cada Paso

#### ✅ Paso 1: Plan (Opcional)
```bash
# Verificar si planning mode está habilitado
echo $SKILLS_PLANNING_MODE

# Crear plan
skills-cli plan create "Mi nueva feature"

# Aprobar plan
skills-cli plan approve <plan-id>
```

#### ✅ Paso 2: Prompt
- ✓ Usa keywords específicos
- ✓ Incluye contexto técnico
- ✓ Especifica tecnologías
- ✓ Menciona patrones/arquitecturas

#### ✅ Paso 3: Pre-Hook (Automático)
**Output esperado:**
```
🎯 SKILL ACTIVATION CHECK (v2.0 - CLOOP Optimized):

● backend-dev-guidelines (suggest/high) → threshold: 0.6
  → reason: keywords: 2 exact match(es), intent: 1 pattern(s) matched
  → contextual-boost: [file:+0.150, intent:+0.120]

● api-design-and-testing (suggest/high) → threshold: 0.55
  → reason: keywords: 1 exact match(es), intent: 1 pattern(s) matched
  
→ Cargar SKILL.md (main) y recursos on-demand según referencias.
→ Fuzzy matching + Contextual boosts activos.
```

#### ✅ Paso 4: Skill Load
- ✓ SKILL.md principal (< 400 líneas)
- ✓ Recursos on-demand (resources/*.md)
- ✓ Scripts disponibles (scripts/*.js)

#### ✅ Paso 5: Execute
- ✓ Claude procesa con contexto de skills
- ✓ Ejemplos y patrones aplicados
- ✓ Best practices incluidas

#### ✅ Paso 6: Post-Hook (12 Pasos)
```
Pipeline ejecutado:
  ✓ Git Clean Check
  ✓ File Watcher Integration
  ✓ Guardrails Check (BLOCK/WARN/SUGGEST)
  ✓ Bash Security Validation
  ✓ ESLint (daemon)
  ✓ Build Check (daemon)
  ✓ Prettier Format
  ✓ Typecheck
  ✓ Auto-Resolver (si ≥5 errores)
  ✓ Advanced Quality Gates
  ✓ NMLB Check
  ✓ KPI Emit
  ✓ Notifications
```

#### ✅ Paso 7: NMLB Verification
**Output esperado:**
```
✅ Pipeline completo exitoso
📊 Pipeline Performance Metrics:
   ⏱️ Total duration: 1247ms
   📈 Average step duration: 104ms
   🎯 Cache hits: 2/3 services (67%)
```

### 3.3 Verificación de Estado

```bash
# Verificar estado del repositorio
git status --porcelain

# Verificar skills activados
cat .sf/last-activation.json | jq '.skills'

# Verificar logs del hook
tail -f .sf/hooks.log
```

---

## 4. Prompt Builder v2 - Uso Avanzado

### 4.1 ¿Qué es Prompt Builder v2?

Sistema de optimización de prompts con **8 componentes** (C1-C8) y **TAGs system** para estructurar prompts de manera inteligente.

### 4.2 Estructura de Componentes (C1-C8)

```typescript
interface PromptComponents {
  C1: Context;           // Contexto del proyecto
  C2: Challenge;         // Desafío/problema
  C3: Constraints;       // Restricciones técnicas
  C4: Criteria;          // Criterios de éxito
  C5: Communication;     // Estilo de comunicación
  C6: Coordination;      // Workflows/collaboración
  C7: Continuity;        // Contexto histórico
  C8: Customization;     // Personalización específica
}
```

### 4.3 TAGs System

Tags automáticos que se aplican según contexto:

- **[K]** - Knowledge: Conocimiento técnico requerido
- **[C]** - Context: Contexto específico del proyecto
- **[U]** - Use Case: Caso de uso particular
- **[EVIDENCIA]** - Evidence: Pruebas/métricas
- **[PROPUESTA]** - Proposal: Propuesta de implementación

### 4.4 Uso del Prompt Builder

```bash
# Generar prompt optimizado para una tarea
skills-cli prompt-builder generate "implementar autenticación JWT" --v2

# Prompt generado:
---
[CONTEXT]
Aplicación backend con Express + Prisma + PostgreSQL

[PROBLEM]
Necesito implementar sistema de autenticación con JWT

[REQUIREMENTS]
- Login/logout
- Refresh tokens
- Validación de roles
- Tests unitarios

[ARCHITECTURE]
Seguir patrones backend: rutas→controladores→servicios→repositorios

[K] JWT, bcrypt, middleware
[C] Express + Prisma
[U] Auth system
[EVIDENCIA] Tests pasando
[PROPUESTA] Estructura completa con todos los archivos
---
```

### 4.5 Cómo las Keywords Afectan Activación

**Sin Prompt Builder:**
```
"Implementar login"
→ Skills: 1-2
```

**Con Prompt Builder v2:**
```
[K] authentication [C] backend [U] login system
→ Skills: 3-4 (backend-dev-guidelines + api-design-and-testing + security-testing-guide)
```

**Combinación optimizada:**
```bash
skills-cli skills check "implementar autenticación JWT" --v2
```
**Resultado**: Máximo engagement de skills (5-7 skills)

---

## 5. CLI Commands Esenciales

### 5.1 Comandos de Skills

#### Listar y Validar Skills
```bash
# Listar todos los skills disponibles
skills-cli skills list

# Validar skills con reglas estrictas
skills-cli skills lint ./skills --strict

# Indexar skills para activación rápida
skills-cli skills index ./skills --out ./registry/index.json

# Verificar qué skills se activarían para un prompt
skills-cli skills check "mi prompt aquí" --v2

# Ver detalles de un skill específico
skills-cli skills show database-management
```

**Output esperado:**
```
✓ 30 skills validados
✓ Registry actualizado: registry/index.json

Skills activados para "implementar autenticación":
  • backend-dev-guidelines (score: 0.72)
  • api-design-and-testing (score: 0.68)
  • security-testing-guide (score: 0.65)
```

### 5.2 Comandos de Planificación

```bash
# Crear nuevo plan
skills-cli plan create "Feature: Sistema de pagos"

# Listar planes
skills-cli plan list

# Aprobar plan
skills-cli plan approve PLAN-2024-001

# Guardar plan con snapshot
skills-cli plan save PLAN-2024-001 --approve

# Ver detalles del plan
skills-cli plan show PLAN-2024-001
```

**Output esperado:**
```
✓ Plan creado: PLAN-2024-001

📋 PLAN: Feature: Sistema de pagos
   Status: PENDING
   Created: 2024-11-02
   Owner: felipe
   
🎯 Objetivo:
   Implementar sistema completo de pagos con Stripe
   
📝 Tareas:
   1. Setup Stripe + webhooks
   2. Implementar payment controller
   3. Tests de integración
   4. Documentación API
```

### 5.3 Comandos de Dev Docs

```bash
# Crear documentación de desarrollo
skills-cli dev-docs create "payment-system"

# Actualizar documentación existente
skills-cli dev-docs update "payment-system"

# Listar documentación
skills-cli dev-docs list
```

### 5.4 Comandos de Sistema

```bash
# Health check de todos los servicios
skills-cli dashboard health

# Ver métricas KPI
skills-cli kpi show

# Ver logs del daemon
skills-cli daemon logs --lines 100

# Reiniciar servicios PM2
skills-cli pm2 restart all

# Estado de servicios
skills-cli pm2 status
```

**Output esperado:**
```
📊 Health Check
  ✓ Router (port 3000): OK (145ms)
  ✓ Daemon (port 7727): OK (89ms)
  ✓ Discovery (port 8877): OK (67ms)
  ✓ PostgreSQL: OK (23ms)
```

### 5.5 Comandos de Hooks

```bash
# Verificar configuración de hooks
skills-cli hooks config verify

# Probar activación de skills manualmente
skills-cli hooks test-activation "mi prompt"

# Ver historial de activaciones
skills-cli hooks activation-history

# Validar pre-hook
skills-cli hooks pre-invoke-test

# Validar stop-hook
skills-cli hooks stop-test
```

---

## 6. Verificación de Hooks

### 6.1 Pre-Invoke Hook (userPromptSubmit)

**¿Qué hace?**
1. Detecta slash commands
2. Verifica planning mode
3. Activa skills basado en fuzzy matching + contextual boost
4. Conecta con daemon para enhanced results

**¿Cómo verificar que funciona?**

#### ✓ Método 1: Activación Manual
```bash
# Probar activación
skills-cli hooks test-activation "implementar endpoint POST /users"

# Ver output esperado:
🎯 SKILL ACTIVATION CHECK (v2.0 - CLOOP Optimized):
● backend-dev-guidelines → threshold: 0.6
● api-design-and-testing → threshold: 0.55
● contextual-boost: [file:+0.150, recent:+0.100]
```

#### ✓ Método 2: Logs en Tiempo Real
```bash
# Ver logs del router
pm2 logs sf-router --lines 50

# Buscar activación
pm2 logs sf-router | grep "SKILL ACTIVATION"
```

#### ✓ Método 3: Verificar Cache
```bash
# Ver cache de fuzzy matching
ls -la .sf/cache/

# Limpiar cache si hay problemas
rm -rf .sf/cache/*
```

#### ✓ Método 4: Hooks Config
```bash
# Verificar configuración
cat .cursor/hooks/hooks-config.json | jq '.userPromptSubmit'

# Debe mostrar:
{
  "enabled": true,
  "fuzzyMatch": true,
  "contextualBoost": true,
  "threshold": 0.45
}
```

### 6.2 Stop Hook (Pipeline de Calidad)

**¿Qué hace?**
Ejecuta 12 pasos de calidad después de cada respuesta:
1. Git Clean Check
2. File Watcher Integration
3. Guardrails
4. Bash Security
5. ESLint
6. Build Check
7. Prettier
8. Typecheck
9. Auto-resolver
10. Advanced Quality Gates
11. NMLB
12. KPI + Notifications

**¿Cómo verificar que funciona?**

#### ✓ Método 1: Ejecutar Test Completo
```bash
# Crear archivo de prueba
echo "console.log('test')" > test.js

# Ejecutar stop hook manualmente
skills-cli hooks stop-test

# Ver output:
📄 Formateando 1 archivos con Prettier...
✓ Typecheck: 0 errors
✓ NMLB Check: Repositorio limpio
```

#### ✓ Método 2: Verificar Cada Paso

**Guardrails Check:**
```bash
# El guardrail de database debe bloquear operaciones inseguras
echo "await prisma.user.deleteMany();" > test-guardrail.js
# Al ejecutar, debe aparecer:
🚫 GUARDRAIL BLOQUEADO - deleteMany() sin where
```

**Build Check:**
```bash
# El build check debe validar compilation
skills-cli daemon exec "cd /repo && npm run build"
```

**Prettier Format:**
```bash
# Verificar que formatea
echo "const x={a:1}" > test-prettier.js
skills-cli daemon exec "npx prettier --write test-prettier.js"
# Debe convertirse a:
const x = { a: 1 };
```

#### ✓ Método 3: Logs Detallados
```bash
# Ver todos los pasos del pipeline
pm2 logs sf-router --lines 200 | grep -E "(Guardrails|ESLint|Build|NMLB)"

# Output esperado:
✓ Guardrails: 0 violations
✓ ESLint: 0 errors, 0 warnings
✓ Build: Success
✓ NMLB: Repositorio limpio
```

### 6.3 Troubleshooting Común

#### ❌ Problema: Hooks no se ejecutan
**Diagnóstico:**
```bash
# Verificar configuración
cat .cursor/hooks/hooks-config.json

# Verificar que están habilitados
jq '.userPromptSubmit.enabled, .stop.enabled' .cursor/hooks/hooks-config.json
```

**Solución:**
```bash
# Recrear configuración
skills-cli hooks config init

# Reiniciar router
pm2 restart sf-router
```

#### ❌ Problema: Skills no se activan
**Diagnóstico:**
```bash
# Verificar registry
cat registry/index.json | jq '.skills | length'
# Debe ser > 0

# Verificar skill-rules
cat configs/skill-rules.json | jq 'keys | length'
# Debe ser > 0
```

**Solución:**
```bash
# Reindexar skills
skills-cli skills index ./skills --out ./registry/index.json

# Limpiar cache
rm -rf .sf/cache/*

# Verificar manualmente
skills-cli skills check "mi prompt" --v2
```

#### ❌ Problema: Stop hook falla
**Diagnóstico:**
```bash
# Verificar daemon
curl http://127.0.0.1:7727/health

# Ver logs
pm2 logs sf-daemon --lines 100
```

**Solución:**
```bash
# Reiniciar daemon
pm2 restart sf-daemon

# O ejecutar sin daemon
export SKILLS_DAEMON_ENHANCED=false
```

---

## 7. No Mess Left Behind (NMLB)

### 7.1 ¿Qué es NMLB?

Sistema de verificación que **bloquea** si el repositorio queda en estado inconsistente después de una sesión.

**Objetivo**: Cero cambios sin commitear, cero archivos temporales, cero estados intermedios.

### 7.2 ¿Cuándo se Activa?

El stop hook verifica el estado del repositorio en el **Paso 10** (NMLB Check).

**Casos bloqueados:**
- ✓ Archivos staged sin commitear
- ✓ Archivos modificados sin commitear
- ✓ Archivos eliminados sin commitear
- ✓ Archivos untracked en repositorio sucio
- ✓ Stash entries pendientes

### 7.3 ¿Cómo Verificar que Funcionó?

#### ✓ Salida Exitosa:
```
✓ NMLB Check: Repositorio limpio
📊 Pipeline Performance Metrics:
   ⏱️ Total duration: 1247ms
```

#### ✗ Salida de Bloqueo:
```
🚫 NMLB BLOQUEADO - Repositorio en estado inconsistente:
  ✏️ 3 archivo(s) modificados
  ❓ 2 archivo(s) untracked
  
Detalles del estado del repositorio:
  • Modified: src/users/controller.ts
  • Modified: package.json
  • Untracked: test.js, temp.sql

Por favor limpia el estado del repositorio antes de continuar (git stash, git commit, git clean).
```

### 7.4 Opciones de Configuración

#### Deshabilitar NMLB (Solo para desarrollo/testing)
```bash
# Temporal (sesión actual)
export SKILLS_FABRIK_NMLB_DISABLE=true

# Permanente (.env)
echo "SKILLS_FABRIK_NMLB_DISABLE=true" >> .env

# Durante tests
NODE_ENV=test skills-cli dev-docs create "test"
```

#### Limpiar Estado Automáticamente
```bash
# Hacer stash de cambios
git stash push -m "Cambios auto-stashed by Skills Fabric"

# Commitear con mensaje automático
git add -A
git commit -m "chore: auto-commit by Skills Fabric - $(date)"

# Limpiar archivos untracked
git clean -fd
```

### 7.5 Flujo de Trabajo Correcto con NMLB

#### ✅ Opción 1: Commit Explícito
```bash
# Después de implementar cambios
git add -A
git commit -m "feat: implement authentication system"

# NMLB passes ✓
```

#### ✅ Opción 2: Stash Temporal
```bash
# Si necesitas cambiar de branch
git stash push -m "WIP: auth implementation"

# NMLB passes ✓
```

#### ❌ Opción 3: NO Hacer (Se Bloquea)
```bash
# Cambios sin commitear
git status
# M  src/controller.ts
# ?? temp.sql

# NMLB blocks 🚫
```

---

## 8. Ejemplos Reales de Prompts

### 8.1 Backend - API Development

#### Ejemplo 1: Endpoint REST
**Prompt:**
```
[K] REST API [C] Node.js + Express + Prisma [U] User management endpoint
Implementar endpoint POST /api/users con validación de schema Zod, siguiendo patrones backend de rutas→controladores→servicios→repositorios. Incluir manejo de errores consistente y tests unitarios.
```

**Skills Activados:**
- ✓ backend-dev-guidelines (score: 0.89)
- ✓ api-design-and-testing (score: 0.76)
- ✓ database-management (score: 0.65)

**Por qué funciona:**
- Keywords específicas: "endpoint", "controlador", "servicios", "repositorios"
- Intent patterns: "(crear|implementar).*(endpoint|controller)"
- Contexto técnico: "Express", "Prisma", "Zod"

---

#### Ejemplo 2: Microservicio
**Prompt:**
```
[K] Microservice [C] Node.js + TypeScript [U] Payment service
Diseñar arquitectura de microservicio de pagos con DDD, eventos de dominio y CQRS. Implementar patrón hexagonal con ports & adapters.
```

**Skills Activados:**
- ✓ backend-architecture-patterns (score: 0.92)
- ✓ api-design-and-testing (score: 0.68)
- ✓ database-management (score: 0.61)

**Por qué funciona:**
- Keywords técnicos: "DDD", "CQRS", "hexagonal", "microservicio"
- Contextual boost por arquitectura

---

### 8.2 Database & Migrations

#### Ejemplo 3: Migración Segura
**Prompt:**
```
[C] PostgreSQL + Prisma [K] Migration [U] Schema update
Crear migración segura para agregar tabla de audit_log con foreign keys. Incluir plan de rollback y backup automático.
```

**Skills Activados:**
- ✓ database-management (score: 0.88)
- ✓ database-verification (guardrail - BLOCK) (score: 0.94)

**Por qué funciona:**
- Keywords críticos: "migración", "backup", "rollback"
- Guardrail se activa automáticamente para operaciones de DB

---

#### Ejemplo 4: Query Optimization
**Prompt:**
```
[K] PostgreSQL [C] Prisma [U] Query performance
Optimizar consulta lenta que usa JOIN de 5 tablas sin índices. Aplicar estrategia de denormalización selectiva y caching.
```

**Skills Activados:**
- ✓ database-management (score: 0.81)
- ✓ performance-optimization (score: 0.73)

**Por qué funciona:**
- Keywords de performance: "optimizar", "JOIN", "índices", "caching"
- Intent patterns específicos de queries

---

### 8.3 Frontend - React & Performance

#### Ejemplo 5: Componente React
**Prompt:**
```
[K] React [C] TypeScript + Tailwind [U] Dashboard component
Crear componente de dashboard con lista virtualizada de 10k items, filtros con URL state y cache de datos con React Query.
```

**Skills Activados:**
- ✓ frontend-dev-guidelines (score: 0.79)
- ✓ performance-optimization (score: 0.84)

**Por qué funciona:**
- Keywords frontend: "componente", "React", "virtualizada"
- Performance keywords: "virtualizada", "cache"

---

#### Ejemplo 6: Hook Personalizado
**Prompt:**
```
[K] React Hook [C] Custom hook [U] Data fetching
Implementar hook personalizado useApi con retry logic, exponential backoff y cancellation. Seguir patrones de custom hooks.
```

**Skills Activados:**
- ✓ frontend-dev-guidelines (score: 0.72)
- ✓ performance-optimization (score: 0.61)

**Por qué funciona:**
- Keywords específicos: "custom hook", "retry", "exponential backoff"

---

### 8.4 Testing & Quality

#### Ejemplo 7: E2E Testing
**Prompt:**
```
[K] Playwright [C] E2E testing [U] User journey
Implementar tests E2E para flujo de checkout completo: login → selección productos → pago → confirmación. Con screenshots en failure.
```

**Skills Activados:**
- ✓ webapp-testing (score: 0.86)
- ✓ security-testing-guide (score: 0.64)

**Por qué funciona:**
- Keywords testing: "E2E", "Playwright", "checkout"
- Security aspects en payment flow

---

#### Ejemplo 8: Security Testing
**Prompt:**
```
[K] Security [C] OWASP [U] Web app security
Realizar security testing siguiendo OWASP Top 10: validar XSS, SQL injection, CSRF, authentication bypass. Con automated scanner.
```

**Skills Activados:**
- ✓ security-testing-guide (score: 0.93)
- ✓ webapp-testing (score: 0.71)

**Por qué funciona:**
- Security keywords: "OWASP", "XSS", "SQL injection", "CSRF"
- Intent patterns específicos de security

---

### 8.5 CI/CD & DevOps

#### Ejemplo 9: GitHub Actions
**Prompt:**
```
[K] CI/CD [C] GitHub Actions [U] Deployment pipeline
Configurar pipeline CI/CD con GitHub Actions: build → test → security scan → deploy a staging → approval → deploy producción.
```

**Skills Activados:**
- ✓ ci-cd-pipelines (score: 0.88)
- ✓ security-testing-guide (score: 0.67)

**Por qué funciona:**
- CI/CD keywords: "pipeline", "GitHub Actions", "deploy"
- Intent patterns de automation

---

#### Ejemplo 10: PM2 Monitoring
**Prompt:**
```
[K] PM2 [C] Process management [U] Node.js monitoring
Configurar PM2 para gestión de procesos con clustering, auto-restart, monitoring de memory/CPU y logs centralizados.
```

**Skills Activados:**
- ✓ pm2-monitor (score: 0.91)
- ✓ performance-optimization (score: 0.69)

**Por qué funciona:**
- Keywords específicos: "PM2", "clustering", "auto-restart"
- Monitoring keywords: "memory", "CPU", "logs"

---

### 8.6 Architecture & Patterns

#### Ejemplo 11: Event Sourcing
**Prompt:**
```
[K] Event Sourcing [C] Domain events [U] Audit trail
Implementar event sourcing para audit trail de cambios en entidades de dominio. Con event store y projections.
```

**Skills Activados:**
- ✓ backend-architecture-patterns (score: 0.94)
- ✓ database-management (score: 0.76)

**Por qué funciona:**
- Architecture keywords: "Event Sourcing", "event store", "projections"
- Domain-driven keywords

---

#### Ejemplo 12: Code Review Process
**Prompt:**
```
[K] Code Review [C] Quality assurance [U] Pull request process
Establecer proceso de code review con checklist automatizado: lint → tests → security scan → peer review → approval → merge.
```

**Skills Activados:**
- ✓ code-review-checklist (score: 0.87)
- ✓ security-testing-guide (score: 0.71)

**Por qué funciona:**
- Quality keywords: "code review", "checklist", "peer review"
- Automation keywords

---

### 8.7 Performance Optimization

#### Ejemplo 13: Frontend Performance
**Prompt:**
```
[K] Performance [C] React + Lighthouse [U] Core Web Vitals
Optimizar Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1. Implementar lazy loading, code splitting y image optimization.
```

**Skills Activados:**
- ✓ performance-optimization (score: 0.96)
- ✓ frontend-dev-guidelines (score: 0.73)

**Por qué funciona:**
- Performance keywords específicos: "LCP", "FID", "CLS", "lazy loading", "code splitting"
- Web Vitals terminology

---

#### Ejemplo 14: Database Performance
**Prompt:**
```
[K] Database [C] PostgreSQL [U] Query performance
Optimizar base de datos con connection pooling, query caching, índices compuestos y read replicas para 10k req/s.
```

**Skills Activados:**
- ✓ database-management (score: 0.89)
- ✓ performance-optimization (score: 0.82)

**Por qué funciona:**
- Database optimization: "connection pooling", "query caching", "read replicas"
- Performance metrics: "10k req/s"

---

### 8.8 Security & Compliance

#### Ejemplo 15: Authentication System
**Prompt:**
```
[K] Authentication [C] JWT + OAuth [U] Secure login
Implementar sistema de autenticación con JWT refresh tokens, OAuth2 Google/GitHub, rate limiting y protection contra brute force attacks.
```

**Skills Activados:**
- ✓ security-testing-guide (score: 0.91)
- ✓ backend-dev-guidelines (score: 0.79)
- ✓ api-design-and-testing (score: 0.68)

**Por qué funciona:**
- Security keywords: "JWT", "OAuth2", "rate limiting", "brute force"
- Comprehensive security approach

---

## 9. Troubleshooting

### 9.1 Problemas de Activación

#### ❌ Skills no se activan
**Síntomas:**
- Prompt específico pero 0 skills
- Score muy bajo (< 0.4)

**Diagnóstico:**
```bash
# 1. Verificar registry
cat registry/index.json | jq '.skills | length'

# 2. Verificar skill rules
cat configs/skill-rules.json | jq 'keys | length'

# 3. Test manual
skills-cli skills check "mi prompt específico" --v2
```

**Soluciones:**
```bash
# 1. Reindexar skills
skills-cli skills index ./skills --out ./registry/index.json

# 2. Ajustar threshold
export SKILL_ACTIVATION_THRESHOLD=0.35

# 3. Limpiar cache
rm -rf .sf/cache/*

# 4. Verificar keywords en skill-rules
jq '.["backend-dev-guidelines"].promptTriggers.keywords' configs/skill-rules.json
```

#### ❌ Score correcto pero skill no activa
**Causa**: Threshold dinámico muy alto

**Solución:**
```bash
# Verificar enforcement level
jq '.["database-verification"].enforcement' configs/skill-rules.json
# Si es "block", threshold es 0.2 (muy bajo, debería activar)

# Verificar threshold personalizado
jq '.["api-design-and-testing"].threshold // "default"' configs/skill-rules.json
```

### 9.2 Problemas de Hooks

#### ❌ Pre-hook no ejecuta
**Diagnóstico:**
```bash
# Verificar configuración
jq '.userPromptSubmit.enabled' .cursor/hooks/hooks-config.json

# Verificar logs
pm2 logs sf-router --lines 50 | grep "userPromptSubmit"

# Test manual
curl -X POST http://127.0.0.1:3000/hooks/pre-invoke \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","cwd":"/repo"}'
```

**Solución:**
```bash
# Reiniciar router
pm2 restart sf-router

# O recrear configuración
skills-cli hooks config init
```

#### ❌ Stop hook falla en build
**Diagnóstico:**
```bash
# Verificar daemon
curl http://127.0.0.1:7727/health

# Ejecutar build manualmente
cd /repo && npm run build

# Ver logs detallados
pm2 logs sf-daemon --lines 100
```

**Solución:**
```bash
# Sin daemon (más lento pero funciona)
export SKILLS_DAEMON_ENHANCED=false

# O arreglar build
cd /repo && npm install && npm run build
```

### 9.3 Problemas de Performance

#### ❌ Latencia alta (> 5s)
**Causas comunes:**
- Cache deshabilitado
- Daemon lento/inactivo
- Muchos skills a evaluar

**Solución:**
```bash
# 1. Verificar cache
echo $DAEMON_CACHE_TTL
# Debe ser 60000 (1 minuto)

# 2. Verificar daemon latency
curl -w "%{time_total}" http://127.0.0.1:7727/health

# 3. Reducir max skills
jq '.userPromptSubmit.maxSkills = 5' .cursor/hooks/hooks-config.json

# 4. Aumentar threshold
jq '.userPromptSubmit.threshold = 0.55' .cursor/hooks/hooks-config.json
```

#### ❌ Cache no funciona
**Diagnóstico:**
```bash
# Verificar Redis
redis-cli ping

# Verificar cache directory
ls -la .sf/cache/

# Verificar variables
env | grep -E "CACHE|TTL"
```

**Solución:**
```bash
# Limpiar cache
rm -rf .sf/cache/*

# Redis unavailable, usar local cache
export SKILLS_DAEMON_ENHANCED=false

# O instalar Redis
brew install redis
brew services start redis
```

### 9.4 Problemas de NMLB

#### ❌ NMLB bloquea siempre
**Diagnóstico:**
```bash
# Ver estado real
git status --porcelain

# Verificar si hay cambios reales o es cache
ls -la .git/index
```

**Soluciones:**
```bash
# 1. Commitear cambios pendientes
git add -A && git commit -m "chore: pending changes"

# 2. Hacer stash
git stash

# 3. Limpiar archivos untracked
git clean -fd

# 4. Deshabilitar temporalmente (solo testing)
export SKILLS_FABRIK_NMLB_DISABLE=true
```

#### ❌ NMLB pasa pero hay cambios
**Causa**: Archivos ignorados por .gitignore

**Solución:**
```bash
# Ver archivos ignorados
git status --ignored

# Agregar a .gitignore si es temporal
echo "temp/" >> .gitignore

# O remove si son temporales
rm -rf temp/
```

### 9.5 Logs y Debugging

#### Ver logs en tiempo real
```bash
# Router (pre-hook)
pm2 logs sf-router --lines 100 -f

# Daemon (stop-hook)
pm2 logs sf-daemon --lines 100 -f

# Filtrar por componente
pm2 logs sf-router | grep -E "(SKILL|ACTIVATION|BOOST)"
```

#### Debug mode
```bash
# Habilitar debug
export SKILLS_DAEMON_DEBUG=true
export ROUTER_DEBUG=true

# Ver todos los logs
pm2 logs sf-router --lines 200
```

#### Health check completo
```bash
# Script de verificación
cat > /tmp/health-check.sh << 'EOF'
#!/bin/bash
echo "=== Health Check ==="
echo "Router: $(curl -s http://127.0.0.1:3000/health || echo 'DOWN')"
echo "Daemon: $(curl -s http://127.0.0.1:7727/health || echo 'DOWN')"
echo "Discovery: $(curl -s http://127.0.0.1:8877/health || echo 'DOWN')"
echo "PostgreSQL: $(pg_isready -q || echo 'DOWN')"
echo "Redis: $(redis-cli ping 2>/dev/null || echo 'DOWN')"
echo "PM2: $(pm2 jlist | jq '. | length' 2>/dev/null || echo 'DOWN') processes"
EOF

bash /tmp/health-check.sh
```

---

## 📊 Resumen Ejecutivo

### Para Usar en < 30 Minutos

1. **Escribe prompts específicos** con keywords técnicos
2. **Verifica activación** con `skills-cli skills check "prompt" --v2`
3. **Ejecuta tu tarea** - hooks funcionan automáticamente
4. **Revisa output del stop-hook** - 12 pasos de calidad
5. **Limpia repositorio** antes de terminar (NMLB)

### Comandos Esenciales

```bash
# Verificar qué skills se activan
skills-cli skills check "tu prompt aquí" --v2

# Indexar skills
skills-cli skills index ./skills --out ./registry/index.json

# Health check completo
skills-cli dashboard health

# Ver métricas
skills-cli kpi show

# Limpiar cache
rm -rf .sf/cache/*
```

### Keywords de Alto Impacto

- **Backend**: endpoint, controller, repository, microservicio, DDD, CQRS
- **Database**: migrations, schema, prisma, backup, query, índices
- **Performance**: optimizar, cache, lazy loading, benchmarking, profiling
- **Security**: testing, vulnerability, OWASP, penetration, XSS, CSRF
- **Testing**: e2e, integration, unit, playwright, cypress
- **Architecture**: hexagonal, clean architecture, event sourcing, ports & adapters

---

## ✅ Checklist Final

Antes de considerar que dominas el sistema:

- [ ] Puedes activar 3-5 skills por prompt
- [ ] Entiendes fuzzy matching + contextual boost
- [ ] Has ejecutado el pipeline completo de 12 pasos
- [ ] Has verificado que NMLB funciona
- [ ] Has ajustado threshold según tus necesidades
- [ ] Puedes debuggear problemas comunes
- [ ] Usas keywords específicos en tus prompts
- [ ] Has creado al menos un plan aprobado

---

## 🎯 Casos de Uso Avanzados

### Optimización de Performance

Para obtener el máximo rendimiento del sistema:

```bash
# 1. Ajustar parámetros según tu proyecto
export SKILL_ACTIVATION_THRESHOLD=0.5
export DAEMON_CACHE_TTL=120000  # 2 minutos
export DAEMON_MAX_RETRIES=2

# 2. Usar modo optimizado para casos simples
export SKILLS_FABRIK_OPTIMIZE_SIMPLE=true

# 3. Pre-indexar todos los skills
skills-cli skills index ./skills --out ./registry/index.json
```

### Planning Mode (Para Equipos)

Si usas planning mode:

```bash
# 1. Habilitar
export SKILLS_PLANNING_MODE=true

# 2. Workflow completo
skills-cli plan create "Nueva feature"
# → Editar plan en dev/active/plan-*.md
skills-cli plan approve PLAN-2024-001
skills-cli skills check "implementar feature" --v2
# → Ejecutar con plan activo
skills-cli plan save PLAN-2024-001 --approve
```

### Desarrollo Multi-Package

Para monorepos:

```bash
# 1. Indexar todos los packages
skills-cli skills index ./skills --out ./registry/index.json

# 2. Verificar activation por package
cd packages/backend
skills-cli skills check "endpoint auth" --v2

cd ../frontend
skills-cli skills check "componente dashboard" --v2

# 3. Build y test de todos
skills-cli pm2 restart all
skills-cli dashboard health
```

---

## 📈 Métricas y KPIs

### KPIs que Puedes Monitorear

```bash
# Ver eventos KPI
skills-cli kpi show

# Filtrar por fecha
cat obs/kpi/events.jsonl | jq -r '.ts' | sort | uniq -c

# Calcular adherencia
cat obs/kpi/events.jsonl | jq '.adherence' | grep -c true

# Ver zero errors left behind
cat obs/kpi/events.jsonl | jq '.zero_errors_left_behind' | grep -c true
```

### Performance Benchmarks

Métricas esperadas en sistema optimizado:

- **Activación de skills**: < 500ms
- **Pipeline completo**: < 5 segundos
- **Cache hit rate**: > 60%
- **Adherencia**: > 90%
- **Zero errors left behind**: > 85%

---

## 🔧 Configuración Avanzada

### Customización de Skill Rules

```bash
# Editar reglas específicas
jq '.["mi-custom-skill"] = {
  "type": "guideline",
  "enforcement": "suggest",
  "priority": "high",
  "threshold": 0.6,
  "promptTriggers": {
    "keywords": ["custom", "keyword"],
    "intentPatterns": ["(custom|pattern)"]
  }
}' configs/skill-rules.json > tmp.json && mv tmp.json configs/skill-rules.json
```

### Hooks Personalizados

```bash
# Agregar hook personalizado
cat >> .cursor/hooks/hooks-config.json << 'EOF',
  "customHook": {
    "enabled": true,
    "scriptPath": "scripts/hooks/custom-hook.sh",
    "trigger": "post-stop"
  }
EOF
```

### Variables de Entorno

```bash
# Performance
export SKILLS_DAEMON_ENHANCED=true
export DAEMON_CACHE_TTL=60000
export DAEMON_MAX_RETRIES=2
export DAEMON_RETRY_DELAY=500

# Debug
export SKILLS_DAEMON_DEBUG=false
export ROUTER_DEBUG=false

# NMLB
export SKILLS_FABRIK_NMLB_DISABLE=false

# Threshold
export SKILL_ACTIVATION_THRESHOLD=0.45
```

---

## 🚀 Tips y Trucos

### 1. Prompts de Alto Rendimiento

**Usa estructura CLOOP en prompts:**
```
C - Context: "Backend Node.js con Express"
L - Layout: "Arquitectura de 3 capas: controller → service → repository"
O - Operate: "Implementar endpoint POST /users"
O - Observe: "Validar con tests unitarios"
P - Plan: "Plan detallado con 5 pasos"
```

### 2. Activación Múltiple de Skills

Para activar varios skills relacionados:
```
"Implementar API RESTful con tests de integración, usando arquitectura hexagonal y validación OWASP"
```
**Skills**: api-design + backend-guidelines + testing + architecture + security

### 3. Debugging Efectivo

```bash
# Logs en tiempo real con filtros
pm2 logs sf-router --lines 100 -f | grep -E "(ACTIVATION|BOOST|ERROR)"

# Ver scores detallados
cat .sf/last-activation.json | jq '{skills: .activated, scores: .metadata.scores, reasons: .metadata.reasons}'

# Test de matching específico
skills-cli skills check "tu prompt" --v2 | jq '.'
```

### 4. Optimización de Cache

```bash
# Pre-cargar skills hot
skills-cli skills check "endpoint" --v2
skills-cli skills check "database" --v2
skills-cli skills check "performance" --v2

# Ver cache hits
cat .sf/cache/* | grep "timestamp" | tail -5
```

### 5. Workflow Eficiente

```bash
# 1. Inicio de sesión
git pull && skills-cli dashboard health

# 2. Verificar plan activo
cat dev/active/plan-*.md | head -20

# 3. Ejecutar tarea
skills-cli skills check "mi prompt" --v2

# 4. Durante desarrollo
pm2 logs sf-router -f

# 5. Finalizar sesión
git add -A && git commit -m "feat: implement X"
pm2 logs sf-daemon --lines 20
```

---

## 📚 Recursos Adicionales

### Archivos de Configuración

- `.cursor/hooks/hooks-config.json` - Configuración de hooks
- `configs/skill-rules.json` - Reglas de activación de skills
- `registry/index.json` - Skills indexados para activación
- `.sf/` - Cache y archivos temporales del sistema

### Logs y Debugging

- `pm2 logs sf-router` - Logs del router (pre-hook)
- `pm2 logs sf-daemon` - Logs del daemon (post-hook)
- `.sf/hooks.log` - Log consolidado de hooks
- `.sf/last-activation.json` - Última activación de skills

### Documentación

- `docs/architecture/` - Arquitectura del sistema
- `docs/cli/` - Documentación CLI completa
- `skills/*/SKILL.md` - Documentación de cada skill
- `registry/index.json` - Catálogo de skills disponibles

### Scripts Útiles

- `scripts/hooks/pre-invoke.mjs` - Hook pre-invoke
- `scripts/hooks/stop.mjs` - Hook stop
- `scripts/hooks/notify.sh` - Sistema de notificaciones
- `scripts/hooks/bash-validator.py` - Validador de seguridad

---

**¡Listo! Ahora puedes usar Skills Fabric como un experto.** 🚀

### Próximos Pasos

1. **Practica** con los 15 ejemplos de prompts
2. **Experimenta** ajustando threshold y cache
3. **Personaliza** skill rules para tu proyecto
4. **Integra** con tu workflow existente
5. **Comparte** tus mejores prompts con el equipo

Para soporte:
- Revisa logs: `pm2 logs`
- Health check: `skills-cli dashboard health`
- Issues: `docs/troubleshooting.md`

**¡El sistema está listo para potenciar tu desarrollo!** 🎉
