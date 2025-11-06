---
id: code-review-checklist
version: 0.1.0
type: guideline
summary: 'Proceso estructurado para code reviews efectivos: checklist completo, flujo de revisión, automation, y criterios de calidad. Mejora calidad del código y collaboration en equipo.'
description: 'Implementa proceso estructurado para code reviews efectivos. Aplica checklist completo, establece flujo de revisión, configura automation, y define criterios de calidad. Mejora calidad del código y collaboration en equipo de forma sistemática.'
audience: developers, tech-leads, reviewers
when_to_use: 'Para cada PR/push a main/develop. Usa en revisiones de código para asegurar calidad, consistency, security y maintainability antes de merge.'
provides: 'Code reviews efectivos, calidad consistente, detección temprana de bugs, knowledge sharing, y improved team collaboration.'
resources:
  - resources/checklist.md
  - resources/process.md
  - resources/examples.md
  - resources/automation.md
scripts:
  - name: init-review
    run: touch .github/pull_request_template.md && git config --local core.hooksPath .git-hooks
    note: Configura templates y hooks para code review
  - name: setup-github
    run: gh pr create --fill --body "$(cat pr-template.md)"
    note: Crea PR con template preenchido
  - name: validate-changes
    run: git diff --stat $(git merge-base HEAD~1 HEAD) && echo "Changed files reviewed ✓"
    note: Valida changed files antes de review
  - name: generate-report
    run: 'echo "Code Review Report: $(date)" > review-report.md && echo "Files: $(git diff --name-only)" >> review-report.md'
    note: Genera reporte de revisión
limits: 'Requiere discipline y tiempo dedicado. No es substitute de testing. Puede slow down development si no se establece good practices.'
---

## Objetivo

Establecer un **proceso estructurado de code review** para garantizar calidad consistente, detectar bugs temprano, y mejorar collaboration en el equipo.

**Cuándo usar**:
- Cada PR antes del merge
- Cambios críticos o high-risk
- Nuevos developers contribuyendo
- Codebase changes significativos
- Security-sensitive modifications

**Cuándo NO usar**: Para hotfixes urgentes o experiments de bajo riesgo (con approval explícita).

**Qué problema resuelve**: Inconsistencias, bugs, security issues, technical debt, knowledge silos, y poor code quality.

## Procedimiento (resumen)

### Pre-Review
1. **Validar PR** - Check title, description, scope
2. **Run tests** - Automated validation
3. **Understand context** - Business logic y requirements

### Review
1. **Code structure** - Architecture, patterns
2. **Logic** - Correctness, edge cases
3. **Security** - Vulnerabilities, best practices
4. **Performance** - Efficiency, bottlenecks

### Post-Review
1. **Document feedback** - Clear, actionable
2. **Track changes** - Updates y fixes
3. **Final approval** - Sign-off criteria met

## Criterios de Calidad

### Críticos (BLOCK - Must Fix)
- ✅ Funciona correctamente (tests passing)
- ✅ No introduce security vulnerabilities
- ✅ No degrada performance significativamente
- ✅ Follow coding standards
- ✅ Adequate test coverage (≥80% critical paths)
- ✅ Error handling robusto
- ✅ No secrets or credentials exposed

### Importantes (WARN - Should Fix)
- ✅ Code is readable y self-documenting
- ✅ No duplicated code
- ✅ Appropriate abstractions
- ✅ Consistent naming conventions
- ✅ Commented complex logic
- ✅ Optimized for maintainability

### Deseables (SUGGEST - Nice to Have)
- ✅ Code can be simplified
- ✅ Improved variable names
- ✅ Additional edge case handling
- ✅ Documentation improvements
- ✅ Minor refactoring opportunities

## Roles y Responsabilidades

### Author
- **Prepara PR** - Clear description, related issues
- **Responde feedback** - Address comments promptly
- **Actualiza PR** - Make requested changes
- **Final review** - Ensure all criteria met

### Reviewer
- **Revisa PR** - Thorough code examination
- **Proporciona feedback** - Specific, actionable
- **Sugiere mejoras** - Constructive criticism
- **Aprueba o Rechaza** - Clear decision

### Tech Lead (Optional)
- **Arquitectural decisions** - High-level review
- **Cross-team impact** - Dependencies check
- **Standards enforcement** - Guidelines adherence
- **Mentoring** - Guide reviewers

## Flujo de Trabajo

### Antes del Review
1. **Crear PR** con description clara
2. **Link to issue** - JIRA/GitHub issue reference
3. **Add screenshots** - UI changes visible
4. **Self-review** - Author checks own code
5. **Run tests** - Local validation complete

### Durante el Review
1. **Checklist completion** - Use code-review-checklist
2. **Leave comments** - Specific, constructive
3. **Ask questions** - Clarify intent
4. **Suggest improvements** - Alternative approaches
5. **Track suggestions** -标记 resolved/unresolved

### Después del Review
1. **Address feedback** - Implement changes
2. **Respond to comments** - Explain decisions
3. **Re-request review** - Mark ready
4. **Final approval** - Two approvals for critical changes
5. **Merge** - Squash commits, delete branch

## Herramientas y Automation

### GitHub/GitLab
- **Required reviews** - Minimum 2 approvals
- **Code owners** - Auto-assign reviewers
- **Protected branches** - Main/develop protection
- **Status checks** - Tests must pass

### CI/CD Integration
- **Automated tests** - Unit, integration, e2e
- **Security scanning** - SAST, secrets detection
- **Performance checks** - Regression tests
- **Coverage reports** - Test coverage tracking

### Linters y Formatters
- **ESLint/TSLint** - Code quality
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks
- **SonarQube** - Code analysis

## Métricas y KPIs

### Review Metrics
- **Time to review** - Target: <24h para normal, <4h para critical
- **Comments per PR** - Quality indicator
- **Review rounds** - Should be ≤2 para typical changes
- **Approval time** - Time from PR ready to approval

### Quality Metrics
- **Bug rate** - Bugs post-merge (target: <5%)
- **Security issues** - Zero tolerance para critical
- **Coverage** - Maintain ≥80% critical paths
- **Debt ratio** - Technical debt accumulation

### Team Metrics
- **Participation** - Review frequency per dev
- **Knowledge sharing** - Cross-team reviews
- **Consistency** - Standards adherence rate
- **Velocity** - Review throughput

## Common Pitfalls to Avoid

### ❌ Wrong Approach
- **Perfectionism** - Seeking perfect code over progress
- ** bikeshedding** - Focusing on style over substance
- **Rubber stamping** - Blind approvals sin review
- **Personal attacks** - Critiquing person, not code
- **Long reviews** - Trying to review too much at once
- **No feedback** - Silent disapprovals

### ✅ Right Approach
- **Pragmatism** - Good enough para ship
- **Substance focus** - Logic, security, performance
- **Thoroughness** - Dedicated review time
- **Constructive** - Respectful, educational
- **Incremental** - Small, manageable PRs
- **Communication** - Clear, actionable feedback

## Escalation Process

### Nível 1: Reviewer-Author
- **Discussion** - Direct resolution
- **Brainstorming** - Alternative solutions
- **Compromise** - Middle ground approach

### Nível 2: Tech Lead
- **Arbitration** - Final decision
- **Standards** - Enforcement
- **Training** - Best practices guidance

### Nível 3: Architecture Team
- **Design approval** - High-level decisions
- **Cross-team impact** - Broader implications
- **Strategy** - Long-term alignment

## Communication Guidelines

### Giving Feedback
- **Be specific** - Point to exact code
- **Be constructive** - Offer solutions
- **Be respectful** - Professional tone
- **Be timely** - Respond within SLA

### Receiving Feedback
- **Be open** - Consider all suggestions
- **Ask questions** - Clarify requirements
- **Explain decisions** - Justify approach
- **Be grateful** - Appreciate time invested

## Templates

### PR Description Template
```markdown
## What
Brief description of changes

## Why
Business/context justification

## How
Implementation approach

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Self-reviewed code
- [ ] Added comments for complex logic
- [ ] Updated documentation
- [ ] No breaking changes
```

### Review Comment Template
```markdown
**Issue:** [What needs fixing]

**Why:** [Impact or concern]

**Suggestion:** [How to fix or improve]

**Priority:** [Critical/Important/Nice-to-have]
```

## Success Criteria

Para considerar un PR aprobado:

✅ **Functional**
- [ ] Code meets requirements
- [ ] Tests passing
- [ ] No obvious bugs
- [ ] Edge cases considered

✅ **Quality**
- [ ] Readable y maintainable
- [ ] No code duplication
- [ ] Appropriate abstractions
- [ ] Good naming conventions

✅ **Security**
- [ ] No vulnerabilities
- [ ] Input validation
- [ ] Secure defaults
- [ ] No secrets exposed

✅ **Performance**
- [ ] No regressions
- [ ] Efficient algorithms
- [ ] Appropriate complexity
- [ ] Resource usage acceptable

## Recursos Adicionales

Para dive deeper, consulta:
- `resources/checklist.md` - Checklist detallada por área
- `resources/process.md` - Proceso paso a paso
- `resources/examples.md` - Ejemplos de buenas/malas prácticas
- `resources/automation.md` - Setup y automation tools

---

**Estado**: Code review process establecido
**Next**: Implement checklist automation y metrics tracking
**Review**: Usar checklist en cada PR antes del merge
