# Validator Execution Template

## 1. Before You Start

- Open the repository at `code-quality-upgrade/`.
- Ensure you are on the correct branch and the working tree is clean.
- Confirm that VS Code / tooling points to `code-quality-upgrade/tsconfig.json` to avoid cross-project warnings.

## 2. Inputs Required

- **Plan reference**: link or section in `dev-docs/task.md`.
- **Target sub-task** (e.g., `T2.2.3`).
- **Scope of files** expected to change.

## 3. Validation Checklist

1. **Documentation Sync**
   - Verify `dev-docs/task.md` lists the sub-task with objectives, tests, and success metrics.
   - Confirm any prerequisite tasks are marked completed.
2. **Zero Technical Debt Baseline**
   - Run sequentially:
     ```bash
     npm run lint
     npm test -- --coverage
     npm run build
     ```
   - Record outputs. All must pass before implementation begins.
3. **Change Review**
   - Inspect files under `src/`, `test/`, `scripts/`, `dev-docs/` touched by the sub-task.
   - Ensure no work occurs outside the authorized scope.
4. **Post-Implementation Gates**
   - Re-run the lint/test/build trio.
   - Capture coverage summary (statements, branches, functions, lines).
   - Confirm Zero TD: no ESLint warnings, 100 % tests passing, coverage ≥80 %, TypeScript build clean.
5. **Documentation Update**
   - Append command outputs and metrics to `dev-docs/task.md`.
   - Note any new files/tests in `dev-docs/test-index.md` if applicable.

## 4. Handoff Package (per sub-task)

- **Summary**: one-paragraph status (done / blocked / pending approval).
- **Metrics Table**: lint/test/build status + coverage percentages.
- **File List**: created/modified paths.
- **Next Step**: what to request authorization for next (e.g., `T2.2.4`).

## 5. Approval Flow

1. Validator reviews evidence (plan section + command logs).
2. Before replying to the executor, re-read the relevant sections in `config/code-quality-rules.json` and `dev-docs/task.md` to ensure the decision aligns with current rules and objectives.
3. If everything matches the checklist, respond with `decision: GO`.
4. If gaps exist, respond with `decision: NO_GO` plus required fixes and reference rule IDs from `config/code-quality-rules.json`.

> Use this template whenever you, as validator, need to approve or reject a sub-task. Keep it in sync with future process changes.
