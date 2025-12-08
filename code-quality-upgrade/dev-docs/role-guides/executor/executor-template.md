# Executor Operations Template

Use this template whenever actives tasked work inside `code-quality-upgrade/`. It aligns with `dev-docs/plan.md`, `dev-docs/task.md` (89 tareas), and `dev-docs/context.md` so every executor keeps Zero Technical Debt during the 2025Q4 upgrade.

> **Regla crítica de documentación**: Como executor **no debes modificar directamente** archivos dentro de `dev-docs/` (`task.md`, `plan.md`, `context.md`, `test-index.md`, handoffs). Toda actualización de estado, métricas o decisiones debe registrarse en la conversación o en el handoff activo; el validador es quien integra esos cambios en la documentación oficial. Esto evita sobrescribir el historial completo de tareas por accidente.

## 1. Mission Alignment

- **Reference**: Capture task ID + section link from `dev-docs/task.md` and confirm it is authorized in the latest handoff.
- **Scope Guardrails**: Stay inside the directories defined in `plan.md` (e.g., `src/`, `test/`, `scripts/`, `dev-docs/`). Flag any drift immediately.
- **Time & Size**: One session ≤120 minutes and ≤8 subtasks (see `config/code-quality-rules.json`).

## 2. Inputs Checklist

1. Task objective + acceptance criteria from `task.md`.
2. Dependencies or prerequisites closed (mark in `task.md` if not).
3. Expected files to touch (list upfront).
4. Tooling aligned with `tsconfig.json` at repo root; ensure workspace clean (`git status`).

## 3. Pre-Task Baseline (Zero TD)

Run in `code-quality-upgrade/` and paste outputs into your worklog:

```bash
npm run qa:validate
npm run lint
npm test -- --coverage
npm run build
```

Stop immediately if any command fails (rule: `NEVER_CONTINUE_ON_BROKEN_QUALITY_GATES`).

## 4. Execution Framework

- **TDD Required**: RED → GREEN → REFACTOR. Start with failing tests (`*.test.ts`) colocated near code.
- **Coverage Targets**: ≥90 % unit, ≥80 % integration, ≥70 % e2e, ≥80 % overall statements/branches/functions/lines.
- **Clean Architecture**: Follow interfaces and layers in `plan.md` (core/gates/config/scripts/types). No circular deps, keep single responsibility.
- **Timeout Policy**: Integration specs must enforce ≥30 s timeout (per `code-quality-rules.json.testingRequirements.integrationTestTimeout`).

## 5. Implementation Checklist

- No magic numbers / hardcoded paths; route config through shared constants or task-scoped inputs.
- Keep 2-space indentation, TypeScript + ESM modules, deterministic JSON ordering.
- Ban `console.log`; rely on logger utilities.
- Respect backup hygiene: ≤3 dirs under `backup/`, never commit `node_modules` there.
- When touching router/daemon/shared APIs ensure mirrored tests in dependent packages (see `context.md` testing guidelines).

## 6. Validation & Evidence

After implementation re-run the baseline commands plus any task-specific scripts, then capture:

- Lint/test/build statuses with timestamps.
- Coverage table (`Statements/Branches/Functions/Lines`).
- Files created/modified (relative paths).
- Git diff summary (no unrelated files).

## 7. Documentation & Handoff

- No edites `dev-docs/task.md` ni `dev-docs/test-index.md` directamente. En su lugar:
  - Documenta en tu respuesta: task ID, estado, métricas (coverage, tests, lint/build) y comandos ejecutados.
  - Si añades tests, incluye en la conversación la ruta del archivo, el propósito de la suite y cómo ejecutarla. El validador usará esa información para actualizar `dev-docs/test-index.md`.
- Summarize findings + blockers inside the active handoff (e.g., `validador-handoff-*.md`) before requesting validation.

## 8. Critical Rules Snapshot (from config/code-quality-rules.json)

- **Zero Debt Mandatory**: 0 ESLint errors, 0 TypeScript errors, all tests green before every handoff.
- **Quality Gates Integrity**: Validate the validators—never trust VS Code diagnostics over CLI outputs.
- **Change Management**: Follow plan references, avoid destructive moves, document approvals before emergency actions.
- **Security & Performance**: No secrets or credentials; keep scripts ≤300 s runtime and ≤512 MB memory, prefer promise-based CLI patterns.
- **Evidence Discipline**: Stop on validation failures, investigate root causes, and record remediation steps in the docs.

## 9. Escalation Protocol

If you cannot meet any rule above (coverage dip, lint failure, backup pollution, timeout needs, etc.), pause the task, document the issue in `dev-docs/task.md`, and request validator guidance—do not proceed until a GO decision references the fix.
