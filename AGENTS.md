# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by pnpm. Runtime code in `packages/`:
  - `packages/skills-cli` (CLI), `packages/daemon` (activation engine), `packages/router` (TS router + e2e harness), `packages/shared` (utilities).
- Skills live in `skills/`, adapters in `adapters/`, and agent prompts in `agents/`.
- Automation scripts: `scripts/*.mjs`. Schemas: `configs/`. Generated assets: `registry/`.
- Tests sit beside sources (e.g., `packages/*/test`, `packages/router/src/__tests__/`). System scenarios: `test-guardrails/`.
- Environment templates: `dev/`. Seed data: `db/`. Never commit secrets.

## Build, Test, and Development Commands
- `pnpm install --frozen-lockfile` — reproducible installs.
- `pnpm dev` — start the CLI in watch mode.
- `pnpm build` — compile CLI and daemon bundles (required before publishing/artifacts).
- `pnpm test` — run the skills CLI suite.
- `pnpm test:phase3-quick` — minimal release gate (build, lint, schema guard).
- `pnpm lint` / `pnpm lint:fix` — Prettier + ESLint (fix issues automatically with `:fix`).
- `pnpm skills:lint --strict` — validate all skill manifests.

## Coding Style & Naming Conventions
- Language: TypeScript + ESM; use 2-space indents. Let Prettier format everything.
- Lint with ESLint; run `pnpm lint` before pushing.
- Filenames: kebab-case (e.g., `prompt-builder.ts`). Classes: PascalCase. Functions/commands: verbs (e.g., `activateSkill`).
- Keep configuration JSON deterministically sorted. Limit inline comments to parsers that allow them.
- New automation lives in `scripts/` as `.mjs` files.

## Testing Guidelines
- Prefer Node’s built-in test runner with `*.spec.mjs` colocated with code.
- Router logic uses Jest under `packages/router/src/__tests__/`.
- When touching daemon or router flows, update those suites and any e2e stories in `test-guardrails/`.
- Before opening a PR: `pnpm build && pnpm lint && pnpm test && pnpm skills:lint --strict`.

## Commit & Pull Request Guidelines
- Conventional Commits enforced by Husky + commitlint (e.g., `feat:`, `fix:`, `chore:`). Squash unrelated work; avoid WIP language.
- PRs include: concise summary, linked issues, exact commands executed, and CLI output/screenshots for behavior changes.
- Use `pnpm pr` if you want a scaffolded PR template.

## Security & Configuration Tips
- Do not commit secrets. Copy from `dev/` templates into local `.env` files.
- Put schema configs in `configs/`; generated registry artifacts in `registry/`; database fixtures in `db/`.
- Review diffs for accidental credentials before pushing.

