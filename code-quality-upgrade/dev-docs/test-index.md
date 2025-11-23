# Test Index – Code Quality Upgrade

This registry tracks every Jest suite that enforces the 2025Q4 Zero Technical Debt goals. Update this file whenever you add, move, or remove tests so validators can audit TDD coverage quickly. Run suites with `npm test -- --runTestsByPath <path>` or the full gate `npm test -- --coverage`.

## Unit Suites

| Path                                                   | Main Subject                                     | Focus & Notes                                                                                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/unit/config/eslint.basic.test.ts`                | `createESLintConfig` (GREEN baseline)            | Smoke test that ensures the generated ESLint config keeps version `1.0.0`, uses the TS parser, and extends `eslint:recommended`.                                                                          |
| `test/unit/config/eslint.config.coverage.test.ts`      | ESLint config factory (coverage push)            | Exercises async/sync builders, prettier overrides, env/parser options, and edge cases to lift coverage above 80 % (lines 132–306 in `src/config/eslint.config.ts`).                                       |
| `test/unit/example.test.ts`                            | `saludar`, `calcularAreaCirculo`, `validarEmail` | Sample RED→GREEN references that validate CLI example utilities and guard against invalid inputs.                                                                                                         |
| `test/unit/monitoring/performance-monitor.test.ts`     | `PerformanceMonitor` types                       | TDD RED specs defining the shape of `PerformanceMetrics`, bottleneck detection, migration profiles, and regression flags before implementation.                                                           |
| `test/unit/monitoring/performance-monitor.tdd.test.ts` | `PerformanceMonitor` lifecycle                   | GREEN/REFACTOR suite verifying `trackPhase`, async timing, memory/cpu stats, and overall `end()` aggregation. Includes helper promises to satisfy the ≥80 % coverage gate.                                |
| `test/unit/monitoring/quality-alerts.test.ts`          | `QualityAlerts`                                  | Covers `evaluateAlerts`, `sendAlert`, and `escalateAlert` with LOW→CRITICAL gating thresholds for failure rate, ESLint error rate, and runtime metrics.                                                   |
| `test/unit/monitoring/quality-dashboard.test.ts`       | `QualityDashboard`                               | Ensures report generation, scoring, technical debt classification, and recommendations respect the metrics contract in `src/types/quality.ts`.                                                            |
| `test/unit/scripts/quality-system-cli.test.ts`         | `quality-system-cli.ts` (T2.2.4)                 | Validates CLI commands functionality: `generateQualityReport()`, `checkQualityAlerts()`, `qualitySystemStatus()`, and integration with QualityDashboard/QualityAlerts.                                    |
| `test/unit/scripts/quality-cli-main.test.ts`           | `quality-cli-main.ts` (T2.2.4)                   | Tests CLI entry point including command parsing (`--generate-report`, `--check-alerts`, `--system-status`, `--help`) and main function execution.                                                         |
| `test/unit/scripts/validate-evidence.test.ts`          | `validate-evidence.ts` (T3.1.1)                  | Tests evidence validation system including UTF-8 encoding detection, markdown link validation, and package.json consistency checks for foren analysis.                                                    |
| `test/unit/scripts/evidence-cli.test.ts`               | `evidence-cli.ts` (T3.1.2)                       | Tests CLI wrapper automation for validate-evidence.ts including Commander.js integration, argument parsing, error handling, and performance monitoring. **Coverage: 100% (with ignores on boilerplate).** |
| `test/unit/scripts/validate-metrics.test.ts`           | `validate-metrics.ts` (T3.2.1)                   | Tests MetricsValidator class including structure validation, consistency checks (rates sum to 1, gate counts match), and multi-metrics aggregation for quality reporting.                                 |

## Integration Suites

| Path                                             | Scenario                           | Focus & Notes                                                                                                                                                                                 |
| ------------------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/integration/eslint-migration.test.ts`      | Migration scripts baseline         | Validates the existence, permissions, and structural markers of `scripts/migrate-eslint.sh` and `scripts/migrate-eslint-portable.sh`, plus fragment-to-unified config migration expectations. |
| `test/integration/migration-options.test.ts`     | CLI options support (T1.1.8)       | Spins up a temp project to exercise `--custom-rules`, backup toggles, dry-run mode, and ensures the portable script preserves custom ESLint rules.                                            |
| `test/integration/migration-interactive.test.ts` | Interactive confirmations (T1.1.9) | Creates sandbox projects to validate inquirer-driven flows, script copying, and full user prompts for destructive operations.                                                                 |

## CLI Suites (T2.2.4)

| Path                                           | Scenario                    | Focus & Notes                                                                                                                                                                   |
| ---------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/unit/scripts/quality-system-cli.test.ts` | CLI Commands functionality  | Tests the three main CLI commands (`generateQualityReport`, `checkQualityAlerts`, `qualitySystemStatus`) and their integration with QualityDashboard and QualityAlerts systems. |
| `test/unit/scripts/quality-cli-main.test.ts`   | CLI Entry Point integration | Validates command line argument parsing, help display, and overall CLI interface structure for all supported commands.                                                          |

### Upcoming Suites

- `test/integration/quality-system-integration.test.ts` – COMPLETED in T2.2.3 to cover QualityDashboard ↔ QualityAlerts flows.

## Maintenance Rules

- Always pair new code with tests in the closest scope (unit → module, integration → feature, e2e → workflow).
- Update this index with a short description, the owning feature/task ID, and how to run the suite.
- Keep coverage ≥80 % overall (unit ≥90 %, integration ≥80 %, e2e ≥70 %) per `config/code-quality-rules.json`.
- When a suite is deprecated, note the reason and removal date so auditors can reconcile historical coverage.
