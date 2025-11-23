# Índice de Tests — code-quality-upgrade

Este documento consolida todas las suites de tests del subproyecto `code-quality-upgrade/` para facilitar las auditorías TDD y verificar cobertura en cada fase.

## Unit Tests
| Archivo | Descripción |
| --- | --- |
| `test/unit/example.test.ts` | Cobertura básica de las utilidades demo (`saludar`, `calcularAreaCirculo`, `validarEmail`). Sirve como sanity-check para Jest y patrones de aserciones. |
| `test/unit/config/eslint.basic.test.ts` | Verifica la generación mínima de `createESLintConfig` (parser, extends, versión). |
| `test/unit/config/eslint.config.coverage.test.ts` | Suite exhaustiva que fuerza cobertura del generador de configuración unificada (reglas, overrides, integración TypeScript/Prettier). |
| `test/unit/monitoring/performance-monitor.test.ts` | Pruebas estructurales de los tipos y contratos del módulo `src/monitoring/types.ts`. |
| `test/unit/monitoring/performance-monitor.tdd.test.ts` | Suite RED→GREEN→REFACTOR que ejercita la clase `PerformanceMonitor` real (ciclo start/end, fases, archivos, memoria, health checks). Debido a sus dependencias temporales, es la referencia para validar la implementación T1.2.0. |

## Integration Tests
| Archivo | Descripción |
| --- | --- |
| `test/integration/eslint-migration.test.ts` | Valida el flujo completo del script de migración ESLint (estructura del output, campos obligatorios, overrides TypeScript). |
| `test/integration/migration-options.test.ts` | Cubre la CLI con banderas (`--dry-run`, `--custom-rules`, `--no-backup`, etc.) garantizando que la configuración se respete end-to-end. |
| `test/integration/migration-interactive.test.ts` | Exercita el modo interactivo (inquirer) asegurando prompts, confirmaciones y timeouts controlados. |

## E2E / Otros
- `test/e2e/`: reservado para escenarios end-to-end (actualmente sin suites activas).  
- `test/setup.ts`: bootstrap compartido para Jest (mocks, temporizadores, configuración global).

## Uso durante Auditorías
1. Antes de cada auditoría, cruza esta lista con las tareas del plan (p.ej. T1.1.8 opciones → `migration-options.test.ts`).  
2. Si agregas una nueva suite, actualiza este índice en el mismo commit para mantener la trazabilidad TDD.  
3. Cuando se registren auditorías cada 3 tareas, referencia este documento para justificar cobertura mínima y detectar huecos pendientes.
