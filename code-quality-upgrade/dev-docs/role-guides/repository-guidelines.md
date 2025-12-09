# Repository Guidelines

This repository centralizes the code-quality-upgrade initiative for the Skills Fabrik monorepo. Use the structure and commands below to keep every change aligned with the 2025Q4 quality gates.

## Project Structure & Module Organization

- Runtime packages live in `packages/` (`skills-cli`, `daemon`, `router`, `shared`), skills in `skills/`, adapters in `adapters/`, and prompt assets in `agents/`.
- Quality automation sits in `code-quality-upgrade/` (unified ESLint/Prettier config, Jest, docs in `dev-docs/`), while scripts belong in `scripts/*.mjs`, schemas in `configs/`, registries in `registry/`, and seeds in `db/`.
- Tests stay close to sources (`packages/*/test`, `packages/router/src/__tests__/`, `test-guardrails/` for integration stories). Generated env templates reside in `dev/`; copy locally instead of committing secrets.

## Build, Test, and Development Commands

- `pnpm install --frozen-lockfile` – reproduce the workspace graph exactly.
- `pnpm dev` for CLI watch mode, `pnpm build` to emit production bundles.
- `pnpm test` for the primary suite; `pnpm test:phase3-quick` chains build, lint, schema checks; `pnpm skills:lint --strict` validates skill manifests.
- From `code-quality-upgrade/`: `npm run qa:validate` (8 pre-task checks), `npm run lint`, `npm run format`, `npm run test` (Jest w/ TS), `npm run build` (strict tsc).

## Coding Style & Naming Conventions

- TypeScript 5.9.3 in strict mode, ESM modules, and 2-space indentation.
- Prettier v3.0.0 handles formatting; ESLint v8.57.1 + TypeScript ESLint 8.46.4 enforce import hygiene and unused code rules.
- Use kebab-case filenames (`prompt-builder.ts`), PascalCase classes, camelCase variables, and verb-first functions (`activateSkill`). Keep JSON deterministically sorted; place automation logic in `scripts/*.mjs`.

## Testing Guidelines

- Jest 29.5.0 drives TDD with `.test.ts` colocated next to sources. Follow Given-When-Then naming (`"given invalid manifest when lint runs then it throws"`).
- Maintain ≥80% coverage for branches/functions/lines/statements; use `npm run test -- --coverage` when validating CI parity.
- Mock external dependencies via `@jest/globals` and `jest.mock`. Mirror router/daemon changes in `packages/router/src/__tests__/` and `test-guardrails/`.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) enforced by Husky + commitlint; never bypass hooks (`git commit --no-verify` is prohibited).
- Each PR summarizes behavior changes, links tracking issues, and lists all verification commands (`pnpm build && pnpm lint && pnpm test && pnpm skills:lint --strict`). Include CLI output or screenshots when behavior shifts.

## Security & Configuration Tips

- Never commit credentials; copy `.env` templates from `dev/` and keep secrets local.
- Schemas stay inside `configs/`, generated data under `registry/` or `db/`. Review diffs for accidental secrets before pushing.

## Current Quality Snapshot (2025-11-23)

- Tests: 195/195 passing (latest run `npm test -- --coverage`).
- Coverage: 94.95% statements / 89.47% branches (global gates ≥80% cumplidos).
- `evidence-cli.ts`: 100% reportado con exclusiones `istanbul ignore` para el guard `require.main` y fallback de timeout (documentado como riesgo bajo).
- Lint/Build: `npm run lint` y `npm run build` verdes.
- Mantén Conventional Commits; no bypass a hooks (`pre-commit` activo).
