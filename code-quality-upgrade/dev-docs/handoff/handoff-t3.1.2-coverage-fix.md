# Handoff: T3.1.2 Evidence Script Automation - Coverage Fix

**Fecha**: 17 de noviembre de 2025  
**Sesión**: Coverage Improvement for evidence-cli.ts  
**Estado**: NO_GO - 75.26% branch coverage (below 80% mandatory threshold)

## 📋 Contexto General

### Objetivo Principal

Alcanzar ≥80% de branch coverage en T3.1.2 Evidence Script Automation para cumplir con los `coreRules.testingRequirements.coverage` y `NEVER_CONTINUE_ON_BROKEN_QUALITY_GATES` del validator.

### Estado Actual de Validación

- **Lint**: ✅ PASSED
- **Build**: ✅ PASSED (TypeScript compilation)
- **Tests**: 186/186 PASSED (16 test suites)
- **Branch Coverage**: ❌ 75.26% (4.74% below mandatory 80%)

### Bloqueador Principal

`src/scripts/evidence-cli.ts` tiene solo 41.02% de branch coverage con líneas sin cubrir específicas.

## 🎯 Análisis Detallado de Cobertura

### Líneas Específicas Sin Cubrir en evidence-cli.ts

```
📍 Líneas 184-186: Links issues branch
   if (results.links?.issues?.length > 0) {
     results.links.issues.forEach((issue: any) => {
       console.log(`   - ${issue.file}: ${issue.issue}`);
     });
   }

📍 Líneas 193-195: Package issues branch
   if (results.package?.issues?.length > 0) {
     results.package.issues.forEach((issue: any) => {
       console.log(`   - ${issue.issue}`);
     });
   }

📍 Líneas 214-216: require.main condition
   if (require.main === module) {
     main().catch(error => {
       console.error('Fatal error:', error);
       process.exit(1);
     });
   }
```

### Cobertura Global Actual

```
File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------|---------|----------|---------|---------|--------------------------------------------------
All files                |   87.67 |    75.26 |   88.05 |   87.78 |
src/scripts             |   83.68 |    64.42 |   83.33 |   83.91 |
  evidence-cli.ts        |   64.86 |    41.02 |    64.7 |   64.86 | ...9,156,165-166,175-177,184-186,193-195,214-216
```

## 🧪 Estrategias de Testing Intentadas

### 1. Tests de Integración Directa

- **Archivo**: `test/unit/scripts/evidence-cli.final-coverage.test.ts`
- **Enfoque**: Ejecutar EvidenceCLI con diferentes escenarios
- **Resultado**: Tests pasan pero no cubren las ramas específicas

### 2. Mocking de require.main

- **Enfoque**: Intentar manipular `require.main` para probar la condition
- **Problema**: `require.main` es read-only, no se puede mock fácilmente
- **Resultado**: TypeScript errors y test failures

### 3. Tests Unitarios de Lógica Condicional

- **Enfoque**: Crear tests que simulen la lógica de las condiciones
- **Problema**: ESLint/TypeScript compatibility issues
- **Resultado**: Multiple lint errors previnieron ejecución exitosa

## 🔍 Root Cause Analysis

### Por Qué las Ramas Son Difíciles de Cubrir

1. **require.main === module**:
   - Es una condición específica de Node.js para ejecución directa de módulos
   - Solo se ejecuta cuando se corre el script directamente (no en test)
   - Mocking requiere manipulación del sistema de módulos de Node.js

2. **results.issues?.length > 0**:
   - Requiere escenarios específicos de fallas de validación
   - Depende de datos de prueba con issues específicos
   - Los mocks actuales no generan las condiciones correctas

3. **forEach Loops**:
   - Solo se ejecutan cuando las condiciones anteriores son true
   - Reieren arrays con datos específicos de issues

## 🛣️ Next Steps Recomendados

### Opción 1: Enfoque de Integration Testing (Recomendado)

1. **Crear archivos de prueba reales** que generen las condiciones específicas:
   - Archivos con links rotos (para branch 184-186)
   - Archivos package.json con issues (para branch 193-195)

2. **CLI Execution Testing**:
   - Ejecutar evidence-cli como subprocess desde tests
   - Capturar output y verificar ramas ejecutadas

### Opción 2: Code Refactoring

1. **Extraer lógica condicional** a funciones separadas:

   ```typescript
   function displayLinksIssues(issues: ValidationIssue[]) { ... }
   function displayPackageIssues(issues: ValidationIssue[]) { ... }
   ```

2. **Hacer funciones más testables** independientemente del contexto CLI

### Opción 3: Mock Avanzado

1. **Jest isolateModules** para limpiar mocks entre tests
2. **Custom require implementation** para manipular require.main
3. **Test environment específico** para CLI execution

## 📁 Archivos Clave Existentes

### Tests Actuales

- `test/unit/scripts/evidence-cli.test.ts` - Tests principales
- `test/unit/scripts/evidence-cli.final-coverage.test.ts` - Intentos de cobertura
- `test/unit/config/eslint.config.coverage.test.ts` - Tests de configuración

### Configuración de Coverage

- `jest.config.js` - Configuración de Jest con thresholds
- `package.json` - Scripts de testing y coverage

### Validación

- `config/code-quality-rules.json` - Reglas de calidad (80% coverage mandatory)
- `scripts/validate-task-execution.ts` - Validador de tareas

## 🔧 Comandos de Validación

```bash
# Validación completa actual
npm run lint && npm test -- --coverage --silent && npm run build

# Coverage específico de evidence-cli
npm test -- --testPathPattern="evidence-cli" --coverage --coverageReporters=text

# Ver líneas específicas sin cubrir
npm test -- --coverage --coverageReporters=text --collectCoverageFrom="src/scripts/evidence-cli.ts"
```

## 📊 Métricas Actuales

### Quality Gates Status

```
✅ ESLint: Zero errors, zero warnings
✅ TypeScript: Zero compilation errors
✅ Tests: 186 passing, 0 failing
❌ Branch Coverage: 75.26% (target: 80%)
❌ Quality Gate: NEVER_CONTINUE_ON_BROKEN_QUALITY_GATES violated
```

### Coverage Target Analysis

- **Current**: 75.26% branch coverage
- **Target**: 80.00% branch coverage
- **Gap**: 4.74% (approximately 5 more branches needed)
- **Focus**: evidence-cli.ts (41.02% → target ~80%)

## 🚨 Critical Rules Enforcement

1. **config/code-quality-rules.json**:

   ```json
   "coreRules": {
     "testCoverage": 80,
     "criticalRule": "NEVER_CONTINUE_ON_BROKEN_QUALITY_GATES"
   }
   ```

2. **Jest Coverage Thresholds**:
   ```javascript
   coverageThreshold: {
     global: {
       branches: 80,
       functions: 80,
       lines: 80,
       statements: 80
     }
   }
   ```

## 🔄 Estado del Trabajo

### Completado

- ✅ Análisis completo de coverage gaps
- ✅ Identificación precisa de líneas sin cubrir
- ✅ Validación de pipeline components functionality
- ✅ Estrategias de testing diseñadas

### Pendiente

- ❌ Alcanzar 80% branch coverage
- ❌ Tests para líneas 184-186, 193-195, 214-216
- ❌ Validación final con GO status

## 📋 Para Próxima Sesión

1. **Prioridad Inmediata**: Implementar Opción 1 (Integration Testing)
2. **Archivos a modificar/crear**:
   - `test/integration/evidence-cli-integration.test.ts`
   - `test/fixtures/evidence-validation-failures/` (archivos de prueba)
   - `src/scripts/evidence-cli.ts` (posible refactor)

3. **Validation final**:

   ```bash
   npm run lint && npm test -- --coverage --silent && npm run build
   ```

4. **Target**: Alcanzar ≥80% branch coverage para pasar T3.1.2

---

**Next Session Goal**: Implementar tests de integración que cubran las ramas específicas y alcanzar el GO status para T3.1.2.

**Nota**: El trabajo actual está completamente funcional, solo falta cumplir con el quality gate de coverage obligatorio.
