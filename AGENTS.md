# Repository Guidelines

## Project Structure & Module Organization

The monorepo is driven by pnpm workspaces. Runtime packages live in `packages/` (`skills-cli`, `daemon`, `router`, `shared`). Skills belong in `skills/`, adapters in `adapters/`, and agent prompt assets in `agents/`. Automation scripts sit in `scripts/*.mjs`, schemas in `configs/`, generated registries in `registry/`, and seed data in `db/`. Tests stay close to their sources (`packages/*/test`, `packages/router/src/__tests__/`, system stories in `test-guardrails/`). Environment templates are versioned under `dev/`; copy them locally instead of committing secrets.

### Code Quality Infrastructure (2025Q4 Upgrade)

- **Location**: `code-quality-upgrade/` directory with unified ESLint/Prettier configuration
- **Quality Gates**: Pre-commit validation system with 8 comprehensive checks
- **TDD Framework**: Jest-based testing with TypeScript support
- **Documentation**: Complete implementation plan in `code-quality-upgrade/dev-docs/task.md` (89 tareas granulares)

## Build, Test, and Development Commands

- `pnpm install --frozen-lockfile` keeps dependency graphs reproducible.
- `pnpm dev` runs the CLI in watch mode for rapid iteration.
- `pnpm build` emits production bundles for the CLI and daemon, required before releasing artifacts.
- `pnpm test` executes the primary skills CLI suite; `pnpm test:phase3-quick` is the lightweight gate that chains build, lint, and schema verification.
- `pnpm lint` / `pnpm lint:fix` apply ESLint + Prettier; run the fix variant only when you are ready to accept formatting updates.
- `pnpm skills:lint --strict` validates every skill manifest before publishing to the registry.

### Code Quality Commands (from code-quality-upgrade/)

- `npm run qa:validate` - Execute 8 pre-task validations
- `npm run lint` - ESLint with TypeScript v8.46.4 support
- `npm run format` - Prettier v3.0.0 formatting
- `npm run test` - Jest TDD with 100% coverage thresholds
- `npm run build` - TypeScript compilation with strict mode

## Coding Style & Naming Conventions

Author TypeScript + ESM with 2-space indentation and rely on Prettier for formatting. ESLint enforces import hygiene and unused code rules; never suppress errors unless justified. Use kebab-case filenames (`prompt-builder.ts`), PascalCase classes, camelCase variables, and verb-based function names (`activateSkill`). Keep JSON configs deterministically sorted and place new automation logic in `scripts/` as `.mjs` modules.

### Quality Standards (2025Q4)

- **TypeScript**: v5.9.3 with strict mode enabled
- **ESLint**: v8.57.1 with TypeScript ESLint v8.46.4
- **Prettier**: v3.0.0 with unified configuration
- **Testing**: Jest v29.5.0 with 80% coverage minimum
- **Pre-commit**: 8 validation checks (rules, paths, config, environment, dependencies, workspace, backup, rollback)

## Testing Guidelines

Prefer Node's built-in test runner with colocated `*.spec.mjs` files. Router behavior relies on Jest specs in `packages/router/src/__tests__/`, and daemon flows often require parallel updates in `test-guardrails/` scenarios. When touching shared APIs, mirror coverage in each dependent package and rerun `pnpm build && pnpm lint && pnpm test && pnpm skills:lint --strict` before raising a PR.

### TDD Implementation (2025Q4)

- **Unit Tests**: All code must have corresponding `.test.ts` files
- **Coverage**: Minimum 80% across branches, functions, lines, statements
- **Test Structure**: Given-When-Then pattern with descriptive test names
- **Mock Strategy**: use `@jest/globals` and `jest.mock()` for external dependencies

## Commit & Pull Request Guidelines

Use Conventional Commits (`feat:`, `fix:`, `chore:`) enforced by Husky + commitlint; combine related work and avoid "WIP" prefixes. Each PR should summarize the change, link tracking issues, list the exact commands executed (with results), and include CLI output or screenshots for behavioral shifts. `pnpm pr` scaffolds the template if you prefer a guided flow.

### Quality Gate Compliance (2025Q4 - DEFINITIVA)

- **TypeScript Compilation Zero Errors**: npx tsc --noEmit MUST pass before ANY commit
- **Pre-commit Validation**: All commits must pass 8 validation checks
- **No Bypass**: Never use `git commit --no-verify` - violates quality standards
- **Blocking vs Cosmetic**: Distinguish errors CRITICAL vs improvements
- **Documentation Files**: Excluded from ESLint (`dev-docs/**/*`, `config/**/*`)
- **Rollback Available**: All configuration changes have automated rollback capability

### Zero Technical Debt Definition Final

**"ZERO = Literalmente cero errores que impidan funcionamiento del sistema":**

1. **🔴 NON-NEGOTIABLE:**
   - TypeScript compilation: 0 errores (npx tsc --noEmit)
   - Core functionality tests: ALL passing
   - ESLint compilation errors: 0
   - Validation system: 8/8 checks passing

2. **🟡 EVALUABLE POR COSTO-BENEFICIO:**
   - ESLint/ Sonar warnings (cosmetic vs functional)
   - Cognitive complexity (refactoring future)
   - Performance optimizations (when needed)

3. **🟢 PERMITIDOS DURANTE DESARROLLO:**
   - Work-in-progress features con gates funcionando
   - Temporary debug code con documentación

## Security & Configuration Tips

Never commit credentials. Populate `.env` files by copying from `dev/` templates, keep schema definitions inside `configs/`, and ensure any generated data lands in `registry/` or `db/` as appropriate. Always review diffs for secrets before pushing.

### Quality System Status (14 Nov 2025)

- **FASE 0**: ✅ Completed (12/12 tasks) - Environment setup and validation system
- **FASE 1**: 🔄 Ready to start - TypeScript interfaces for ESLint integration
- **Quality Gates**: ✅ All 8 validations passing
- **Test Coverage**: ✅ 9 tests passing, 80% coverage threshold active
- **Configuration**: ✅ ESLint v8.46.4 + TypeScript v5.9.3 compatibility resolved

## 🛡️ Protocolo de Seguridad y Auditoría (2025)

**Instrucciones Críticas para Agentes:**
Se requiere realizar verificaciones periódicas de seguridad en este repositorio para mitigar amenazas de cadena de suministro y vulnerabilidades conocidas.

### 1. Detección de Paquetes Maliciosos

Buscar proactivamente dependencias conocidas por contener malware (robo de credenciales SSH, inyección de código):

- `warbeast2000`
- `kodiak2k`
- `lottie-player` (versiones comprometidas)

**Comando de verificación:**

```bash
npm list warbeast2000 kodiak2k || pnpm list warbeast2000 kodiak2k
```

### 2. Vulnerabilidades Críticas (React/Next.js)

Verificar versiones vulnerables a RCE (Remote Code Execution):

- **React:** Versiones 19.0, 19.1, 19.2 son vulnerables. Usar v18.3.1 o superior parcheada.
- **Next.js:** Versiones 15.x, 16.x y canaries recientes pueden ser vulnerables.

### 3. Mantenimiento Preventivo

- **Lockfiles:** Asegurar que `package-lock.json` o `pnpm-lock.yaml` estén siempre versionados.
- **Auditoría:** Ejecutar `npm audit` o `pnpm audit` regularmente.
