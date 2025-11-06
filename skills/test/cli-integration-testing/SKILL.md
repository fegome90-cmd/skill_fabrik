---
id: cli-integration-testing
version: 0.1.0
type: workflow
summary: 'Implementa tests de integración comprehensivos para el CLI con cobertura de casos críticos y regresión visual.'
audience: engineers
when_to_use: 'Cuando necesites crear o mejorar tests de integración para el CLI de Skills Fabric.'
severity: critical
tags: [testing, cli, integration, automation]
---

# CLI Integration Testing Workflow

## Propósito
Este skill guía la implementación de tests de integración comprehensivos para el CLI, enfocándose en los comandos críticos (skills, plan, kpi) con manejo de errores y validación de output.

## Métrica de Éxito
- 90%+ coverage en comandos críticos
- Tests de regresión visual para output del CLI
- Manejo robusto de errores y edge cases
- Integración continua con CI/CD

## Implementación

### 1. Estructura de Tests
```bash
packages/skills-cli/test/integration/
├── commands/
│   ├── skills.test.ts
│   ├── plan.test.ts
│   └── kpi.test.ts
├── workflows/
│   ├── skill-packaging.test.ts
│   └── plan-creation.test.ts
├── visual/
│   └── output-regression.test.ts
└── utils/
    ├── test-helpers.ts
    └── mock-responses.ts
```

### 2. Tests de Integración Críticos

#### Skills Commands Testing
- `skills lint` con diferentes tipos de entrada
- `skills check` con umbrales y contextos variados
- `skills pack/verify/install` workflow completo
- Manejo de errores en archivos inválidos

#### Plan Commands Testing
- Creación de planes con diferentes complejidades
- Validación de planes guardados
- Integración con CLOOP methodology
- Recuperación de planes corruptos

#### KPI Commands Testing
- Generación de dashboards con diferentes rangos
- Procesamiento de eventos JSONL
- Manejo de datos vacíos o corruptos
- Formatos de output variados

### 3. Visual Regression Testing
```typescript
// Ejemplo de test de regresión visual
describe('CLI Output Regression', () => {
  test('skills lint output format', async () => {
    const output = await execAsync('skills-cli skills lint ./test-skills');
    expect(output.stdout).toMatchSnapshot('skills-lint-output');
  });
});
```

### 4. Error Handling Testing
- Validación de códigos de salida (0=success, 1=user error, 2=system error)
- Mensajes de error contextuales
- Recuperación de operaciones fallidas
- Validación de input inválido

### 5. Performance Testing
- Tiempo de respuesta para comandos grandes
- Memory usage en operaciones extensas
- Concurrent command execution
- Startup time optimization

## Scripts de Ejecución

```bash
# Ejecutar todos los tests de integración
pnpm test:integration

# Tests de comandos específicos
pnpm test:skills
pnpm test:plan
pnpm test:kpi

# Visual regression tests
pnpm test:visual

# Performance tests
pnpm test:performance
```

## Configuración de CI

```yaml
# .github/workflows/cli-integration-tests.yml
name: CLI Integration Tests
on: [push, pull_request]
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:integration
      - run: pnpm test:visual
```

## Validación

Para verificar que este skill funciona correctamente:

1. **Crear estructura de tests**: Implementar la estructura de directorios propuesta
2. **Escribir tests críticos**: Comenzar con skills, plan, y kpi commands
3. **Configurar CI**: Integrar tests en el pipeline de CI/CD
4. **Validar coverage**: Asegurar 90%+ coverage en comandos críticos
5. **Performance benchmarks**: Establecer baseline y monitor mejoras

## Recursos Adicionales
- [Jest Testing Framework](https://jestjs.io/)
- [CLI Testing Best Practices](https://github.com/sindresorhus/ava)
- [Visual Regression Testing](https://github.com/americanexpress/jest-image-snapshot)
- [Node.js Test Runner](https://nodejs.org/api/test.html)