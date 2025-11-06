# Code Review Checklist - Lista Completa

## Checklist Principal

### Funcionalidad (Functional)
- [ ] **¿El código hace lo que se supone que debe hacer?**
  - [ ] Matches requirements del issue/PR
  - [ ] Handles happy path correctly
  - [ ] Manages edge cases
  - [ ] No obvious logic errors

- [ ] **¿Los tests validan el comportamiento correcto?**
  - [ ] Unit tests para critical logic
  - [ ] Integration tests covering flows
  - [ ] Edge cases tested
  - [ ] Test coverage ≥80% for new code
  - [ ] Tests are maintainable

- [ ] **¿Se handles correctamente el error handling?**
  - [ ] All async operations wrapped
  - [ ] Try-catch blocks where needed
  - [ ] Appropriate error messages
  - [ ] No unhandled rejections
  - [ ] Validation of external inputs

### Estructura y Arquitectura (Structure)

- [ ] **¿La estructura del código es clara y lógica?**
  - [ ] Files organized logically
  - [ ] Functions have single responsibility
  - [ ] Classes/modules appropriately sized
  - [ ] Clear separation of concerns

- [ ] **¿Se siguen los patrones arquitectónicos establecidos?**
  - [ ] Consistent with codebase patterns
  - [ ] Appropriate use of design patterns
  - [ ] Layers properly separated
  - [ ] Dependencies go in correct direction

- [ ] **¿El código es modular y reusable?**
  - [ ] No hard-coded values
  - [ ] Constants properly defined
  - [ ] DRY principle applied
  - [ ] Reusable components/functions

### Código y Estilo (Code Quality)

- [ ] **¿El código es readable y self-documenting?**
  - [ ] Clear variable/function names
  - [ ] Complex logic commented
  - [ ] Intention-revealing names
  - [ ] Appropriate abstraction level

- [ ] **¿Sigue las coding standards del proyecto?**
  - [ ] ESLint passing (no errors)
  - [ ] Prettier formatting applied
  - [ ] Consistent indentation
  - [ ] Consistent naming conventions

- [ ] **¿Hay código duplicado?**
  - [ ] No copy-pasted blocks
  - [ ] Shared logic extracted
  - [ ] Constants/variables shared
  - [ ] Helper functions created

### Performance (Performance)

- [ ] **¿El código es eficiente?**
  - [ ] No unnecessary loops
  - [ ] Appropriate data structures
  - [ ] Lazy loading where applicable
  - [ ] No N+1 query problems

- [ ] **¿Se consideran las implicaciones de performance?**
  - [ ] Large datasets handled properly
  - [ ] Database queries optimized
  - [ ] Caching strategy implemented
  - [ ] Memory usage acceptable

- [ ] **¿Se midió el impacto de performance?**
  - [ ] Benchmarks included
  - [ ] Load testing passed
  - [ ] No performance regressions
  - [ ] Meets SLA requirements

### Seguridad (Security)

- [ ] **¿Hay vulnerabilidades de security?**
  - [ ] Input validation present
  - [ ] No SQL injection possible
  - [ ] XSS protection implemented
  - [ ] CSRF tokens for forms

- [ ] **¿Se manejan secrets/credentials correctamente?**
  - [ ] No secrets in code
  - [ ] No credentials in comments
  - [ ] Environment variables used
  - [ ] API keys secured

- [ ] **¿Se siguen best practices de security?**
  - [ ] Authentication implemented
  - [ ] Authorization checks present
  - [ ] Data encryption when needed
  - [ ] Logging doesn't expose sensitive data

### Database y Datos (Data)

- [ ] **¿Las queries de database son correctas?**
  - [ ] No raw SQL without sanitization
  - [ ] Appropriate indexes exist
  - [ ] Efficient query plans
  - [ ] No SELECT *

- [ ] **¿Se maneja la integridad de datos?**
  - [ ] Foreign keys enforced
  - [ ] Required fields validated
  - [ ] Unique constraints present
  - [ ] Data types appropriate

- [ ] **¿Migration strategy es safe?**
  - [ ] Backward compatible changes
  - [ ] Migration rollback plan
  - [ ] Zero-downtime approach
  - [ ] Data migration tested

### Testing (Testing)

- [ ] **¿Adecuate test coverage?**
  - [ ] Critical paths covered
  - [ ] Edge cases tested
  - [ ] Integration tests present
  - [ ] E2E tests for key flows

- [ ] **¿Tests son reliable y maintainable?**
  - [ ] Tests are deterministic
  - [ ] No flaky tests
  - [ ] Tests run in reasonable time
  - [ ] Test data properly isolated

- [ ] **¿Tests siguen good practices?**
  - [ ] Clear test descriptions
  - [ ] Arrange-Act-Assert pattern
  - [ ] No test interdependencies
  - [ ] Proper setup/teardown

### Documentación (Documentation)

- [ ] **¿La documentación está actualizada?**
  - [ ] README updated if needed
  - [ ] API docs current
  - [ ] Inline comments for complex logic
  - [ ] Changelog entry present

- [ ] **¿Es la documentation helpful?**
  - [ ] Clear explanations
  - [ ] Examples provided
  - [ ] Installation/setup instructions
  - [ ] Known limitations documented

### Dependencies y Compatibility (Dependencies)

- [ ] **¿Las dependencies son apropiadas?**
  - [ ] Necessary packages only
  - [ ] Versions compatible
  - [ ] No vulnerable dependencies
  - [ ] Bundle size impact acceptable

- [ ] **¿Se considera backward compatibility?**
  - [ ] No breaking changes (unless major version)
  - [ ] Deprecation warnings added
  - [ ] Migration path documented
  - [ ] Old code marked as deprecated

### UX y UI (User Experience)

- [ ] **¿Los cambios de UI/UX son apropiados?**
  - [ ] Consistent with design system
  - [ ] Accessible (WCAG compliance)
  - [ ] Mobile-responsive
  - [ ] Loading states handled

- [ ] **¿Se considera la user experience?**
  - [ ] Clear error messages
  - [ ] Appropriate feedback
  - [ ] Intuitive interactions
  - [ ] Performance acceptable

---

## Checklist por Tipo de Cambio

### Nueva Feature
- [ ] All checklist items above
- [ ] Feature flag configured
- [ ] Analytics/tracking added
- [ ] Documentation created
- [ ] Changelog entry added

### Bug Fix
- [ ] Root cause identified
- [ ] Fix doesn't introduce new bugs
- [ ] Edge cases handled
- [ ] Tests added for bug scenario
- [ ] Regression testing completed

### Refactoring
- [ ] No functional changes
- [ ] Improved code readability
- [ ] Reduced complexity
- [ ] Better performance (or same)
- [ ] No breaking changes

### Performance
- [ ] Measurements before/after
  - [ ] Benchmark results documented
  - [ ] Regression tests passed
  - [ ] Performance targets met
  - [ ] No new bottlenecks created

### Security
- [ ] Vulnerability assessed
- [ ] Fix validated
  - [ ] Security tests passing
  - [ ] Penetration testing if needed
  - [ ] Compliance requirements met

### Database Migration
- [ ] Rollback plan defined
- [ ] Data integrity verified
  - [ ] Backup created
  - [ ] Migration tested on staging
  - [ ] Zero-downtime approach validated

---

## Priority Levels

### 🔴 CRITICAL (Block - Must Fix)
- Security vulnerabilities
- Data loss/corruption risk
- Breaks production
- No tests for critical paths
- Performance regression >50%

### 🟡 IMPORTANT (Warn - Should Fix)
- Logic errors in edge cases
- Code maintainability issues
- Missing error handling
- Performance regression 20-50%
- Inconsistent with patterns

### 🟢 DESIRABLE (Suggest - Nice to Have)
- Minor optimizations
- Better variable names
- Additional documentation
- Code style inconsistencies
- Performance regression <20%

---

## Quick Reference

### Before You Approve, Verify:
1. ✅ Tests pass locally y in CI
2. ✅ Code follows project standards
3. ✅ No security red flags
4. ✅ Performance acceptable
5. ✅ Documentation updated
6. ✅ Review comments addressed
7. ✅ Team member approves (2+ for critical)

### Red Flags (Automatic Reject):
- ❌ Secrets/credentials in code
- ❌ Hardcoded passwords/API keys
- ❌ No input validation
- ❌ SQL injection vulnerability
- ❌ eval() or dangerous functions
- ❌ Infinite loops
- ❌ Missing error handling
- ❌ No tests for critical logic
- ❌ Breaking changes without major version bump

---

**Estado**: Checklist completa y validada
**Usage**: Usar antes de approve/reject
**Update**: Revisar quarterly para best practices
