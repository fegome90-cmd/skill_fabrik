---
id: cli-compilation-fixes
version: 0.1.0
type: guideline
summary: 'Repara errores de compilación del CLI relacionados con colors/chalk y Spinner API changes.'
description: 'Guía para reparar errores de compilación del CLI. Implementa fixes para problemas con colors/chalk y Spinner API changes. Proporciona solutions para resolved compilation errors rápidamente.'
audience: engineers
when_to_use: 'Cuando el CLI falla al compilar por problemas con colors, chalk, o Spinner APIs.'
---

# CLI Compilation Fixes Guideline

## Problema Identificado
El CLI está fallando en la compilación con múltiples errores relacionados con:
1. `chalk` colors que no existen (header, command, number)
2. `Spinner` métodos que han cambiado (succeed, fail, stop)
3. `ProgressBar` métodos obsoletos
4. Parámetros incorrectos en funciones de UI

## Soluciones Inmediatas

### 1. Fix Colors System
Reemplazar colores inexistentes con colores válidos:

```typescript
// ANTES (incorrecto)
chalk.header
chalk.command
chalk.number

// DESPUÉS (correcto)
colors.primary.bold
colors.command
colors.number
```

### 2. Fix Spinner API
Actualizar los métodos del Spinner:

```typescript
// ANTES (obsoleto)
spinner.succeed()
spinner.fail()
spinner.stop()

// DESPUÉS (correcto)
spinner.succeed('Message')
spinner.fail('Message')
spinner.stop()
```

### 3. Fix ProgressBar API
Corregir uso de ProgressBar:

```typescript
// ANTES (incorrecto)
progressBar.stop()

// DESPUÉS (correcto)
progressBar.update(1, { completed: true })
```

### 4. Fix Box/Border Parameters
Corregir parámetros de Box:

```typescript
// ANTES (incorrecto)
Box('content', { borderColor: 'borderColor' })

// DESPUÉS (correcto)
Box('content', { borderColor: colors.primary })
```

## Implementación Paso a Paso

### Paso 1: Actualizar imports y colors
```typescript
import { colors } from '../utils/colors';

// Usar colors.system en lugar de chalk directamente
const chalk = colors.system;
```

### Paso 2: Reemplazar colores inexistentes
Buscar y reemplazar:
- `chalk.header` → `colors.primary.bold`
- `chalk.command` → `colors.command`
- `chalk.number` → `colors.number`

### Paso 3: Actualizar Spinner calls
Buscar y actualizar:
- `spinner.succeed()` → `spinner.succeed('Message')`
- `spinner.fail()` → `spinner.fail('Message')`

### Paso 4: Actualizar ProgressBar
Buscar y reemplazar:
- `progressBar.stop()` → `progressBar.update(1, { completed: true })`

### Paso 5: Fix Box parameters
Actualizar llamadas a Box:
- Reemplazar objetos de borderColor con strings de colores

## Archivos Afectados Principales
- `src/cli/commands/mem.ts`
- `src/cli/commands/nav.ts`
- `src/commands/skills.ts`
- `src/core/config-manager.ts`
- `src/core/state-manager.ts`
- `src/utils/cache.ts`
- `src/utils/progress.ts`

## Validación

1. **Compilar CLI**: `pnpm --filter @skills-fabrik/skills-cli build`
2. **Ejecutar tests**: `pnpm test:integration`
3. **Verificar commands**: `skills-cli --help`

## Prevención Futura

1. **Type checking estricto**: Habilitar `strict: true` en tsconfig
2. **Linting rules**: Agregar reglas para detectar APIs obsoletas
3. **Tests de compilación**: Agregar tests que verify compiles exitosamente
4. **Documentation updates**: Mantener documentación de APIs actualizada

## Comandos de Verificación

```bash
# Verificar compilación
pnpm --filter @skills-fabrik/skills-cli build

# Verificar que no hay errores de TypeScript
npx tsc --noEmit

# Ejecutar tests de integración
pnpm test:integration

# Verificar funcionamiento del CLI
skills-cli --help
```

## Métricas de Éxito
- ✅ CLI compila sin errores
- ✅ Todos los tests de integración pasan
- ✅ Comandos críticos funcionan correctamente
- ✅ 0 errores de TypeScript en compilation