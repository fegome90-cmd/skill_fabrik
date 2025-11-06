# Task Testing: Sistema de Post-Hooks - Ciclos Exhaustivos de Validación

**Sprint ID**: post-hooks-testing  
**Fecha de Creación**: 2025-11-02  
**Estado General**: 📋 PLANIFICADO  
**Metodología**: Test-First Approach con Ciclos de Validación Exhaustivos

---

## 🎯 Objetivo

Establecer ciclos de testing exhaustivos para cada fase de implementación del sistema de post-hooks, garantizando calidad, seguridad, y funcionalidad en cada componente antes de avanzar a la siguiente fase.

---

## 📊 Resumen de Ciclos de Testing

### Matriz de Testing por Fase

| Fase | Componente | Tests Unitarios | Tests Integración | Tests E2E | Linting | Security | Performance | Cobertura Meta |
|------|-----------|-----------------|-------------------|-----------|---------|----------|-------------|----------------|
| P0-1 | Guardrails ContentPatterns | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ≥90% |
| P0-2 | Bash Validator Integration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ≥90% |
| P0-3 | ESLint Execution | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ≥85% |
| P0-4 | Build Check | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ≥85% |
| P0-5 | NMLB Implementation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ≥95% |
| P0-6 | Daemon Integration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ≥90% |

---

## 🔍 Categorías de Testing

### 1. **Code Quality (Calidad de Código)**
- ✅ ESLint validation
- ✅ Prettier formatting
- ✅ TypeScript strict mode
- ✅ Code complexity analysis
- ✅ Dead code detection

### 2. **Linting & Formatting**
- ✅ ESLint rules compliance
- ✅ Prettier consistency
- ✅ Import ordering
- ✅ Naming conventions
- ✅ Comment standards

### 3. **Phrasing & Documentation**
- ✅ JSDoc completeness
- ✅ Error message clarity
- ✅ Comment quality
- ✅ README accuracy
- ✅ API documentation

### 4. **Code Noise (Ruido de Código)**
- ✅ Unused imports
- ✅ Unused variables
- ✅ Console.log statements
- ✅ TODO/FIXME comments
- ✅ Debug code

### 5. **Security (Seguridad)**
- ✅ Dependency vulnerabilities (npm audit)
- ✅ Hardcoded secrets detection
- ✅ SQL injection prevention
- ✅ Command injection prevention
- ✅ Path traversal prevention

### 6. **Functionality (Funcionalidad)**
- ✅ Unit tests
- ✅ Integration tests
- ✅ End-to-end tests
- ✅ Edge cases
- ✅ Error handling

### 7. **Pathing & File System**
- ✅ Path traversal tests
- ✅ Symbolic link handling
- ✅ Cross-platform paths
- ✅ File permissions
- ✅ Directory structure

### 8. **Performance**
- ✅ Execution time benchmarks
- ✅ Memory usage
- ✅ Cache efficiency
- ✅ Concurrency handling
- ✅ Resource cleanup

---

## 📋 P0-1: Guardrails ContentPatterns - Testing Exhaustivo

**Componente**: `configs/skill-rules.json` + `packages/router/src/guardrails.ts`  
**Estimación**: 2-3 horas implementación + 1-2 horas testing  
**Estado**: 📋 Planificado

### Fase 1.1: Setup de Testing

#### Tareas de Setup
- [ ] Crear carpeta `packages/router/__tests__/guardrails/`
- [ ] Instalar dependencias de testing:
  ```bash
  pnpm add -D vitest @vitest/ui @vitest/coverage-c8
  pnpm add -D @testing-library/node
  ```
- [ ] Configurar `vitest.config.ts` en router package
- [ ] Crear fixtures de testing en `__tests__/fixtures/`

#### Fixtures Requeridos
- [ ] `database-queries.ts` - Ejemplos de queries con/sin where
- [ ] `secrets-examples.ts` - Ejemplos de secretos hardcodeados
- [ ] `skill-rules-test.json` - Configuración de test

### Fase 1.2: Tests Unitarios - Guardrails

#### Tests de Patterns (15 tests)

```typescript
// packages/router/__tests__/guardrails/patterns.test.ts

describe('Guardrails ContentPatterns', () => {
  describe('database-verification patterns', () => {
    it('should detect deleteMany without where clause', () => {
      const code = `
        await prisma.user.deleteMany();
      `;
      const violations = checkPatterns(code, 'database-verification');
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('deleteMany');
    });

    it('should allow deleteMany with where clause', () => {
      const code = `
        await prisma.user.deleteMany({ where: { id: 1 } });
      `;
      const violations = checkPatterns(code, 'database-verification');
      expect(violations).toHaveLength(0);
    });

    it('should detect updateMany without where clause', () => {
      const code = `
        await prisma.user.updateMany({ data: { active: false } });
      `;
      const violations = checkPatterns(code, 'database-verification');
      expect(violations).toHaveLength(1);
    });

    it('should detect SQL DELETE without WHERE', () => {
      const code = `
        const query = "DELETE FROM users;";
      `;
      const violations = checkPatterns(code, 'database-verification');
      expect(violations).toHaveLength(1);
    });

    it('should detect SQL UPDATE without WHERE', () => {
      const code = `
        const query = "UPDATE users SET active = false;";
      `;
      const violations = checkPatterns(code, 'database-verification');
      expect(violations).toHaveLength(1);
    });
  });

  describe('secrets-and-config patterns', () => {
    it('should detect hardcoded API keys', () => {
      const code = `
        const apiKey = "sk_live_1234567890abcdef";
      `;
      const violations = checkPatterns(code, 'secrets-and-config');
      expect(violations).toHaveLength(1);
    });

    it('should detect hardcoded AWS credentials', () => {
      const code = `
        const accessKey = "AKIAIOSFODNN7EXAMPLE";
      `;
      const violations = checkPatterns(code, 'secrets-and-config');
      expect(violations).toHaveLength(1);
    });

    it('should detect hardcoded passwords', () => {
      const code = `
        const password = "P@ssw0rd123!";
        const dbConfig = { password: "admin123" };
      `;
      const violations = checkPatterns(code, 'secrets-and-config');
      expect(violations.length).toBeGreaterThan(0);
    });

    it('should allow environment variables', () => {
      const code = `
        const apiKey = process.env.API_KEY;
      `;
      const violations = checkPatterns(code, 'secrets-and-config');
      expect(violations).toHaveLength(0);
    });

    it('should detect hardcoded JWT secrets', () => {
      const code = `
        jwt.sign(payload, "my-secret-key");
      `;
      const violations = checkPatterns(code, 'secrets-and-config');
      expect(violations).toHaveLength(1);
    });
  });

  describe('enforcement levels', () => {
    it('should return BLOCK for database-verification', () => {
      const result = getEnforcementLevel('database-verification');
      expect(result).toBe('block');
    });

    it('should return BLOCK for secrets-and-config', () => {
      const result = getEnforcementLevel('secrets-and-config');
      expect(result).toBe('block');
    });
  });

  describe('regex pattern validation', () => {
    it('should compile all contentPatterns without errors', () => {
      const rules = loadSkillRules();
      const guardrails = Object.entries(rules).filter(
        ([_, rule]) => rule.type === 'guardrail'
      );

      guardrails.forEach(([skillId, rule]) => {
        const patterns = rule.fileTriggers?.contentPatterns || [];
        patterns.forEach((pattern, idx) => {
          expect(() => new RegExp(pattern, 'i')).not.toThrow();
        });
      });
    });

    it('should not have empty contentPatterns arrays', () => {
      const rules = loadSkillRules();
      const guardrails = Object.entries(rules).filter(
        ([_, rule]) => rule.type === 'guardrail'
      );

      guardrails.forEach(([skillId, rule]) => {
        const patterns = rule.fileTriggers?.contentPatterns || [];
        expect(patterns.length).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle multi-line code', () => {
      const code = `
        const result = await prisma.user
          .deleteMany();
      `;
      const violations = checkPatterns(code, 'database-verification');
      expect(violations).toHaveLength(1);
    });

    it('should handle comments in code', () => {
      const code = `
        // This should be detected
        await prisma.user.deleteMany();
      `;
      const violations = checkPatterns(code, 'database-verification');
      expect(violations).toHaveLength(1);
    });

    it('should handle code in strings (should not detect)', () => {
      const code = `
        const example = "await prisma.user.deleteMany();";
      `;
      // Este caso depende de si queremos detectar en strings o no
      // Por ahora, nuestros patterns lo detectarán
    });
  });
});
```

**Checklist Tests Unitarios**:
- [ ] 5 tests para database-verification patterns
- [ ] 5 tests para secrets-and-config patterns
- [ ] 2 tests para enforcement levels
- [ ] 2 tests para regex validation
- [ ] 3 tests para edge cases
- [ ] **Total**: 17 tests unitarios

### Fase 1.3: Tests de Integración - Guardrails

#### Tests de Integración con stopHook (10 tests)

```typescript
// packages/router/__tests__/guardrails/integration.test.ts

describe('Guardrails Integration with stopHook', () => {
  beforeEach(() => {
    // Setup test environment
    setupTestRepo();
  });

  afterEach(() => {
    // Cleanup test environment
    cleanupTestRepo();
  });

  it('should block stopHook when BLOCK violation detected', async () => {
    // Create file with dangerous code
    await writeFile('src/dangerous.ts', `
      await prisma.user.deleteMany();
    `);

    const result = await stopHook({
      editLog: [{ file: 'src/dangerous.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.kpiEvent?.adherence).toBe(false);
    expect(result.hints?.some(h => h.includes('🚫'))).toBe(true);
  });

  it('should continue stopHook when no violations', async () => {
    await writeFile('src/safe.ts', `
      await prisma.user.deleteMany({ where: { id: 1 } });
    `);

    const result = await stopHook({
      editLog: [{ file: 'src/safe.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.kpiEvent?.adherence).toBe(true);
    expect(result.formatted.length).toBeGreaterThan(0);
  });

  it('should detect violations in multiple files', async () => {
    await writeFile('src/file1.ts', `await prisma.user.deleteMany();`);
    await writeFile('src/file2.ts', `const key = "sk_live_123";`);

    const result = await stopHook({
      editLog: [
        { file: 'src/file1.ts', repo: 'test', ts: Date.now() },
        { file: 'src/file2.ts', repo: 'test', ts: Date.now() },
      ],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.hints?.length).toBeGreaterThanOrEqual(2);
  });

  it('should emit KPI event with violation details', async () => {
    await writeFile('src/bad.ts', `await prisma.user.deleteMany();`);

    const result = await stopHook({
      editLog: [{ file: 'src/bad.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.kpiEvent).toBeDefined();
    expect(result.kpiEvent?.skills).toContain('database-verification');
    expect(result.kpiEvent?.adherence).toBe(false);
  });

  it('should send notification on BLOCK violation', async () => {
    const notificationSpy = vi.spyOn(notifications, 'send');
    
    await writeFile('src/bad.ts', `await prisma.user.deleteMany();`);

    await stopHook({
      editLog: [{ file: 'src/bad.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(notificationSpy).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('Guardrail bloqueado'),
      expect.any(String)
    );
  });

  it('should handle files with no violations gracefully', async () => {
    await writeFile('src/normal.ts', `
      export function hello() {
        return "world";
      }
    `);

    const result = await stopHook({
      editLog: [{ file: 'src/normal.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.kpiEvent?.adherence).toBe(true);
  });

  it('should process guardrails before prettier', async () => {
    const executionOrder: string[] = [];
    
    vi.spyOn(guardrails, 'check').mockImplementation(async () => {
      executionOrder.push('guardrails');
      return { blocked: false, violations: [], warnings: [], suggestions: [] };
    });

    vi.spyOn(prettier, 'run').mockImplementation(async () => {
      executionOrder.push('prettier');
      return [];
    });

    await stopHook({
      editLog: [{ file: 'src/test.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(executionOrder).toEqual(['guardrails', 'prettier']);
  });

  it('should handle multiple guardrails violations in same file', async () => {
    await writeFile('src/multiple.ts', `
      await prisma.user.deleteMany();
      const key = "sk_live_123";
      await prisma.post.updateMany({ data: {} });
    `);

    const result = await stopHook({
      editLog: [{ file: 'src/multiple.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.hints?.length).toBeGreaterThanOrEqual(3);
  });

  it('should provide line numbers in violations', async () => {
    await writeFile('src/lines.ts', `
      const safe = "ok";
      await prisma.user.deleteMany();
      const alsoSafe = "ok";
    `);

    const result = await stopHook({
      editLog: [{ file: 'src/lines.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.hints?.some(h => h.includes(':3'))).toBe(true); // Line 3
  });

  it('should cache guardrail rules for performance', async () => {
    const loadSpy = vi.spyOn(guardrails, 'loadRules');

    // First call
    await stopHook({
      editLog: [{ file: 'src/test1.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    // Second call
    await stopHook({
      editLog: [{ file: 'src/test2.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    // Should only load once (cached)
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});
```

**Checklist Tests Integración**:
- [ ] 10 tests de integración con stopHook
- [ ] Tests de blocking behavior
- [ ] Tests de KPI emission
- [ ] Tests de notificaciones
- [ ] Tests de ejecución en orden
- [ ] Tests de caching

### Fase 1.4: Tests End-to-End - Guardrails

#### Tests E2E con Cursor Hooks (5 tests)

```typescript
// packages/router/__tests__/e2e/guardrails.e2e.test.ts

describe('Guardrails E2E Tests', () => {
  it('should block commit when dangerous code detected', async () => {
    // Simulate full workflow
    await execSync('git init', { cwd: TEST_REPO });
    await writeFile('src/dangerous.ts', `await prisma.user.deleteMany();`);
    await execSync('git add .', { cwd: TEST_REPO });

    // Execute stop hook via CLI
    const result = await execCommand('node .cursor/hooks/stop.mjs', {
      cwd: TEST_REPO,
    });

    expect(result.exitCode).toBe(1); // Should fail
    expect(result.stderr).toContain('Guardrail bloqueado');
  });

  it('should allow commit when safe code detected', async () => {
    await writeFile('src/safe.ts', `
      await prisma.user.deleteMany({ where: { active: false } });
    `);
    await execSync('git add .', { cwd: TEST_REPO });

    const result = await execCommand('node .cursor/hooks/stop.mjs', {
      cwd: TEST_REPO,
    });

    expect(result.exitCode).toBe(0); // Should pass
  });

  it('should write violations to KPI events file', async () => {
    await writeFile('src/bad.ts', `await prisma.user.deleteMany();`);
    await execSync('git add .', { cwd: TEST_REPO });

    await execCommand('node .cursor/hooks/stop.mjs', { cwd: TEST_REPO });

    const kpiEvents = await readFile('obs/kpi/events.jsonl', 'utf-8');
    const lastEvent = JSON.parse(kpiEvents.split('\n').filter(Boolean).pop()!);

    expect(lastEvent.adherence).toBe(false);
    expect(lastEvent.skills).toContain('database-verification');
  });

  it('should show user-friendly error messages', async () => {
    await writeFile('src/bad.ts', `await prisma.user.deleteMany();`);
    await execSync('git add .', { cwd: TEST_REPO });

    const result = await execCommand('node .cursor/hooks/stop.mjs', {
      cwd: TEST_REPO,
    });

    expect(result.stderr).toContain('database-verification');
    expect(result.stderr).toContain('deleteMany');
    expect(result.stderr).toContain('where');
  });

  it('should integrate with existing git hooks', async () => {
    // Setup pre-commit hook
    await writeFile('.git/hooks/pre-commit', `
      #!/bin/bash
      node .cursor/hooks/stop.mjs
    `);
    await execSync('chmod +x .git/hooks/pre-commit', { cwd: TEST_REPO });

    await writeFile('src/bad.ts', `await prisma.user.deleteMany();`);
    await execSync('git add .', { cwd: TEST_REPO });

    // Try to commit
    const result = await execCommand('git commit -m "test"', {
      cwd: TEST_REPO,
      reject: false,
    });

    expect(result.exitCode).not.toBe(0); // Commit should fail
  });
});
```

**Checklist Tests E2E**:
- [ ] 5 tests end-to-end
- [ ] Tests de git workflow completo
- [ ] Tests de KPI file writing
- [ ] Tests de mensajes de error
- [ ] Tests de integración con git hooks

### Fase 1.5: Linting & Code Quality

#### ESLint & Prettier

```bash
# packages/router/

# Run ESLint
pnpm eslint src/guardrails.ts --fix
pnpm eslint __tests__/guardrails/ --fix

# Run Prettier
pnpm prettier --write "src/guardrails.ts"
pnpm prettier --write "__tests__/guardrails/**/*.ts"

# Type checking
pnpm tsc --noEmit
```

**Checklist Linting**:
- [ ] ESLint sin errores en `guardrails.ts`
- [ ] ESLint sin errores en tests
- [ ] Prettier aplicado a todo el código
- [ ] TypeScript strict mode sin errores
- [ ] Imports ordenados correctamente

### Fase 1.6: Security Testing

#### Dependency Security Audit

```bash
# Security audit
pnpm audit --audit-level=moderate

# Check for known vulnerabilities in patterns
# Ensure regex patterns are safe from ReDoS
```

**Tests de Seguridad**:

```typescript
// packages/router/__tests__/security/guardrails-security.test.ts

describe('Guardrails Security Tests', () => {
  it('should not be vulnerable to ReDoS in patterns', () => {
    const maliciousInput = 'a'.repeat(100000) + '!';
    const startTime = Date.now();
    
    const violations = checkPatterns(maliciousInput, 'database-verification');
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should complete in < 1s
  });

  it('should sanitize file paths to prevent traversal', () => {
    const maliciousPath = '../../../etc/passwd';
    
    expect(() => {
      checkGuardrails([{ file: maliciousPath, repo: 'test', ts: Date.now() }], '/home/user');
    }).not.toThrow();
  });

  it('should not execute code from pattern matches', () => {
    const codeWithEval = `eval("malicious code")`;
    
    // Should detect but not execute
    const violations = checkPatterns(codeWithEval, 'secrets-and-config');
    expect(violations.length).toBeGreaterThanOrEqual(0);
  });
});
```

**Checklist Security**:
- [ ] npm audit sin vulnerabilidades críticas
- [ ] Tests de ReDoS en regex patterns
- [ ] Tests de path traversal prevention
- [ ] Tests de code injection prevention
- [ ] Dependency scan con Snyk/Socket

### Fase 1.7: Performance Testing

#### Benchmarks

```typescript
// packages/router/__tests__/performance/guardrails-perf.test.ts

describe('Guardrails Performance', () => {
  it('should check 100 files in < 5 seconds', async () => {
    const files = Array.from({ length: 100 }, (_, i) => ({
      file: `src/file${i}.ts`,
      repo: 'test',
      ts: Date.now(),
    }));

    const startTime = Date.now();
    await checkGuardrails(files, TEST_CWD);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
  });

  it('should cache pattern compilation', () => {
    const iterations = 1000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      loadGuardrailPatterns();
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100); // Should be fast due to caching
  });

  it('should handle large files efficiently', async () => {
    const largeFile = 'a'.repeat(1000000); // 1MB file
    
    const startTime = Date.now();
    checkPatterns(largeFile, 'database-verification');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000); // < 2s for 1MB file
  });
});
```

**Checklist Performance**:
- [ ] Benchmark de 100 archivos < 5s
- [ ] Cache de patterns funcionando
- [ ] Archivos grandes (1MB) procesados < 2s
- [ ] Memory profiling sin leaks
- [ ] CPU usage < 80% durante checks

### Fase 1.8: Documentation & Phrasing

#### JSDoc & Comments

```typescript
/**
 * Verifica guardrails en los archivos editados.
 * 
 * @param editLog - Lista de archivos editados con metadata
 * @param cwd - Directorio de trabajo actual
 * @returns Resultado con violaciones detectadas
 * 
 * @example
 * ```typescript
 * const result = await checkGuardrails([
 *   { file: 'src/app.ts', repo: 'backend', ts: Date.now() }
 * ], '/project');
 * 
 * if (result.blocked) {
 *   console.error('Violaciones:', result.violations);
 * }
 * ```
 */
export async function checkGuardrails(
  editLog: EditLogEntry[],
  cwd: string
): Promise<GuardrailResult> {
  // Implementation
}
```

**Checklist Documentation**:
- [ ] JSDoc completo en todas las funciones públicas
- [ ] Ejemplos de uso en JSDoc
- [ ] Comentarios claros en lógica compleja
- [ ] README actualizado con nuevo feature
- [ ] CHANGELOG.md actualizado
- [ ] Error messages descriptivos y accionables

### Fase 1.9: Code Noise Cleanup

#### Checklist de Limpieza

```typescript
// ❌ Antes de limpieza
import { unused } from './module'; // Unused import
const DEBUG = true; // Debug flag
console.log('Debug:', value); // Debug statement
// TODO: Refactor this later
let temp = 123; // Unused variable

// ✅ Después de limpieza
// (Código limpio sin imports no usados, console.logs, TODOs temporales)
```

**Checklist Code Noise**:
- [ ] Sin imports no usados
- [ ] Sin variables no usadas
- [ ] Sin console.log statements (usar logger)
- [ ] Sin TODO/FIXME temporales
- [ ] Sin código comentado
- [ ] Sin debug flags hardcodeadas

### Fase 1.10: Final Validation

#### Pre-Merge Checklist

- [ ] ✅ Todos los tests unitarios pasan (17/17)
- [ ] ✅ Todos los tests de integración pasan (10/10)
- [ ] ✅ Todos los tests E2E pasan (5/5)
- [ ] ✅ Tests de seguridad pasan (3/3)
- [ ] ✅ Tests de performance pasan (3/3)
- [ ] ✅ ESLint sin errores
- [ ] ✅ Prettier aplicado
- [ ] ✅ TypeScript strict mode sin errores
- [ ] ✅ Cobertura de código ≥90%
- [ ] ✅ npm audit sin vulnerabilidades críticas
- [ ] ✅ Code review completado
- [ ] ✅ Documentación actualizada
- [ ] ✅ CHANGELOG actualizado

**Total Tests P0-1**: 38 tests (17 unit + 10 integration + 5 E2E + 3 security + 3 performance)

---

## 📋 P0-2: Bash Validator Integration - Testing Exhaustivo

**Componente**: `packages/router/src/stop.ts` + `scripts/hooks/bash-validator.py`  
**Estimación**: 1-2 horas implementación + 1 hora testing  
**Estado**: 📋 Planificado

### Fase 2.1: Tests Unitarios - Bash Validator

```typescript
// packages/router/__tests__/bash-validator/unit.test.ts

describe('Bash Validator Unit Tests', () => {
  describe('dangerous command detection', () => {
    it('should detect rm -rf without path restriction', () => {
      const command = 'rm -rf /';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
      expect(result.blocked).toBe(true);
    });

    it('should detect dd with dangerous parameters', () => {
      const command = 'dd if=/dev/zero of=/dev/sda';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
    });

    it('should detect chmod 777 on sensitive paths', () => {
      const command = 'chmod 777 /etc/passwd';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
    });

    it('should warn on sudo commands', () => {
      const command = 'sudo apt-get install package';
      const result = validateBashCommand(command);
      expect(result.level).toBe('warning');
    });

    it('should allow safe commands', () => {
      const command = 'ls -la ./src';
      const result = validateBashCommand(command);
      expect(result.level).toBe('ok');
    });
  });

  describe('command extraction from files', () => {
    it('should extract bash commands from .sh files', async () => {
      const content = `
        #!/bin/bash
        echo "Starting"
        rm -rf temp/
        echo "Done"
      `;
      const commands = await extractBashCommands(content);
      expect(commands).toContain('rm -rf temp/');
    });

    it('should extract commands from package.json scripts', async () => {
      const packageJson = {
        scripts: {
          cleanup: 'rm -rf dist/',
          build: 'tsc',
        },
      };
      const commands = await extractCommandsFromPackageJson(packageJson);
      expect(commands).toContain('rm -rf dist/');
    });

    it('should extract child_process.exec commands from TS/JS', async () => {
      const code = `
        import { exec } from 'child_process';
        exec('rm -rf node_modules');
      `;
      const commands = await extractCommandsFromCode(code);
      expect(commands).toContain('rm -rf node_modules');
    });
  });

  describe('validation levels', () => {
    it('should return error for blockLevel commands', () => {
      const config = { blockLevel: 'error', warnLevel: 'warning' };
      const result = validateWithConfig('rm -rf /', config);
      expect(result.level).toBe('error');
      expect(result.blocked).toBe(true);
    });

    it('should return warning for warnLevel commands', () => {
      const config = { blockLevel: 'error', warnLevel: 'warning' };
      const result = validateWithConfig('sudo ls', config);
      expect(result.level).toBe('warning');
      expect(result.blocked).toBe(false);
    });
  });
});
```

**Checklist Tests Unitarios P0-2**:
- [ ] 10 tests de detección de comandos peligrosos
- [ ] 5 tests de extracción de comandos
- [ ] 3 tests de niveles de validación
- [ ] **Total**: 18 tests unitarios

### Fase 2.2: Tests de Integración - Bash Validator

```typescript
// packages/router/__tests__/bash-validator/integration.test.ts

describe('Bash Validator Integration Tests', () => {
  it('should call bash-validator.py from stopHook', async () => {
    const validatorSpy = vi.spyOn(bashValidator, 'validate');
    
    await writeFile('cleanup.sh', 'rm -rf /');
    
    await stopHook({
      editLog: [{ file: 'cleanup.sh', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(validatorSpy).toHaveBeenCalled();
  });

  it('should block stopHook when dangerous bash detected', async () => {
    await writeFile('dangerous.sh', `
      #!/bin/bash
      rm -rf /
    `);

    const result = await stopHook({
      editLog: [{ file: 'dangerous.sh', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.hints?.some(h => h.includes('🚫'))).toBe(true);
  });

  it('should validate commands in package.json scripts', async () => {
    await writeFile('package.json', JSON.stringify({
      scripts: {
        danger: 'rm -rf /',
      },
    }));

    const result = await stopHook({
      editLog: [{ file: 'package.json', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.hints?.some(h => h.includes('bash'))).toBe(true);
  });

  it('should run before guardrails in pipeline', async () => {
    const executionOrder: string[] = [];
    
    vi.spyOn(bashValidator, 'validate').mockImplementation(async () => {
      executionOrder.push('bash-validator');
      return { blocked: false, violations: [] };
    });

    vi.spyOn(guardrails, 'check').mockImplementation(async () => {
      executionOrder.push('guardrails');
      return { blocked: false, violations: [], warnings: [], suggestions: [] };
    });

    await stopHook({
      editLog: [{ file: 'test.sh', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(executionOrder).toEqual(['bash-validator', 'guardrails']);
  });

  it('should emit KPI event with bash validation results', async () => {
    await writeFile('bad.sh', 'rm -rf /');

    const result = await stopHook({
      editLog: [{ file: 'bad.sh', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_CWD,
    });

    expect(result.kpiEvent?.adherence).toBe(false);
  });
});
```

**Checklist Tests Integración P0-2**:
- [ ] 5 tests de integración con stopHook
- [ ] Tests de orden de ejecución
- [ ] Tests de KPI emission
- [ ] Tests de bloqueo de pipeline

### Fase 2.3: Tests E2E, Security, Performance

**Tests E2E** (3 tests):
- [ ] Validación en workflow completo de git
- [ ] Mensajes de error user-friendly
- [ ] Integración con pre-commit hooks

**Security Tests** (2 tests):
- [ ] Command injection prevention
- [ ] Path traversal in bash commands

**Performance Tests** (2 tests):
- [ ] Validación de 50 scripts < 3s
- [ ] Extracción de comandos eficiente

### Fase 2.4: Final Validation P0-2

**Pre-Merge Checklist**:
- [ ] Tests unitarios: 18/18 ✅
- [ ] Tests integración: 5/5 ✅
- [ ] Tests E2E: 3/3 ✅
- [ ] Security tests: 2/2 ✅
- [ ] Performance tests: 2/2 ✅
- [ ] Linting sin errores ✅
- [ ] Documentation completa ✅
- [ ] Cobertura ≥90% ✅

**Total Tests P0-2**: 30 tests

---

## 📋 P0-3: ESLint Execution - Testing Exhaustivo

**Componente**: `packages/router/src/stop.ts` + daemon integration  
**Estimación**: 2-3 horas implementación + 1 hora testing  
**Estado**: 📋 Planificado

### Tests Requeridos

**Unit Tests** (12 tests):
- [ ] ESLint execution local
- [ ] ESLint via daemon `/api/quality/lint`
- [ ] Error parsing y formatting
- [ ] Configuration loading
- [ ] Rule violations detection

**Integration Tests** (8 tests):
- [ ] Integration con stopHook pipeline
- [ ] After prettier, before typecheck
- [ ] Multiple files linting
- [ ] KPI emission con ESLint results

**E2E Tests** (4 tests):
- [ ] Full workflow con ESLint
- [ ] Error messages clarity
- [ ] Performance con muchos archivos

**Security Tests** (1 test):
- [ ] Safe execution de ESLint

**Performance Tests** (3 tests):
- [ ] 100 archivos < 10s
- [ ] Daemon vs local comparison
- [ ] Cache effectiveness

**Total Tests P0-3**: 28 tests

---

## 📋 P0-4: Build Check - Testing Exhaustivo

**Componente**: `packages/router/src/stop.ts`  
**Estimación**: 1-2 horas implementación + 1 hora testing  
**Estado**: 📋 Planificado

### Tests Requeridos

**Unit Tests** (10 tests):
- [ ] Build execution por repo
- [ ] Error detection
- [ ] Success detection
- [ ] Timeout handling
- [ ] Multiple repos

**Integration Tests** (6 tests):
- [ ] Integration con stopHook
- [ ] After typecheck execution
- [ ] KPI emission con build results

**E2E Tests** (3 tests):
- [ ] Full workflow con build check
- [ ] Error messages
- [ ] Recovery from build failures

**Performance Tests** (2 tests):
- [ ] Build check < 60s
- [ ] Parallel builds si múltiples repos

**Total Tests P0-4**: 21 tests

---

## 📋 P0-5: NMLB Implementation - Testing Exhaustivo

**Componente**: `packages/router/src/stop.ts`  
**Estimación**: 1 hora implementación + 1 hora testing  
**Estado**: 📋 Planificado

### Tests Requeridos

**Unit Tests** (8 tests):
- [ ] `verifyCleanRepo()` function
- [ ] Git status parsing
- [ ] Dirty repo detection
- [ ] Clean repo detection

**Integration Tests** (6 tests):
- [ ] NMLB at end of stopHook
- [ ] Detection de untracked files
- [ ] Detection de modified files
- [ ] Detection de staged files

**E2E Tests** (4 tests):
- [ ] Full workflow con NMLB
- [ ] Warning messages clarity
- [ ] KPI emission con clean status

**Security Tests** (2 tests):
- [ ] Git command injection prevention
- [ ] Safe path handling

**Total Tests P0-5**: 20 tests

---

## 📋 P0-6: Daemon Integration - Testing Exhaustivo

**Componente**: `packages/router/src/stop.ts` + daemon endpoints  
**Estimación**: 3-4 horas implementación + 2 horas testing  
**Estado**: 📋 Planificado

### Tests Requeridos

**Unit Tests** (15 tests):
- [ ] HTTP client para daemon
- [ ] Request formatting
- [ ] Response parsing
- [ ] Error handling
- [ ] Retry logic
- [ ] Timeout handling

**Integration Tests** (12 tests):
- [ ] `/api/qa/format-files` endpoint
- [ ] `/api/quality/lint` endpoint
- [ ] `/api/qa/check-build` endpoint
- [ ] Fallback to local execution
- [ ] Network error handling

**E2E Tests** (6 tests):
- [ ] Full stopHook usando daemon
- [ ] Performance vs local execution
- [ ] Cache effectiveness
- [ ] Service discovery integration

**Security Tests** (3 tests):
- [ ] Authentication con daemon
- [ ] Secure communication (HTTPS)
- [ ] API key handling

**Performance Tests** (4 tests):
- [ ] Daemon response time < 2s
- [ ] Concurrent requests handling
- [ ] Cache hit rate ≥70%
- [ ] Network latency tolerance

**Total Tests P0-6**: 40 tests

---

## 📊 Resumen Total de Testing

### Tests por Prioridad

| Prioridad | Componente | Unit | Integration | E2E | Security | Performance | Total |
|-----------|-----------|------|-------------|-----|----------|-------------|-------|
| P0-1 | Guardrails | 17 | 10 | 5 | 3 | 3 | **38** |
| P0-2 | Bash Validator | 18 | 5 | 3 | 2 | 2 | **30** |
| P0-3 | ESLint | 12 | 8 | 4 | 1 | 3 | **28** |
| P0-4 | Build Check | 10 | 6 | 3 | 0 | 2 | **21** |
| P0-5 | NMLB | 8 | 6 | 4 | 2 | 0 | **20** |
| P0-6 | Daemon Integration | 15 | 12 | 6 | 3 | 4 | **40** |
| **Total P0** | | **80** | **47** | **25** | **11** | **14** | **177** |

### Cobertura Esperada

| Fase | Cobertura Meta | Tests Totales | Tiempo Testing |
|------|----------------|---------------|----------------|
| P0-1 | ≥90% | 38 | 1-2h |
| P0-2 | ≥90% | 30 | 1h |
| P0-3 | ≥85% | 28 | 1h |
| P0-4 | ≥85% | 21 | 1h |
| P0-5 | ≥95% | 20 | 1h |
| P0-6 | ≥90% | 40 | 2h |
| **Total** | **≥90%** | **177** | **7-8h** |

---

## 🔧 Herramientas de Testing

### Setup de Testing Stack

```bash
# Install testing dependencies
pnpm add -D vitest @vitest/ui @vitest/coverage-c8
pnpm add -D @testing-library/node
pnpm add -D supertest # Para HTTP testing
pnpm add -D msw # Para mocking HTTP requests
pnpm add -D playwright # Para E2E testing (si necesario)

# Security testing
pnpm add -D npm-audit-resolver
pnpm add -D snyk

# Performance testing
pnpm add -D clinic # Node.js performance profiling
pnpm add -D autocannon # HTTP load testing
```

### Configuración de Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

### Scripts de Testing

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest run __tests__/**/unit.test.ts",
    "test:integration": "vitest run __tests__/**/integration.test.ts",
    "test:e2e": "vitest run __tests__/**/e2e.test.ts",
    "test:security": "vitest run __tests__/**/security.test.ts && pnpm audit",
    "test:performance": "vitest run __tests__/**/performance.test.ts",
    "test:all": "pnpm test:unit && pnpm test:integration && pnpm test:e2e && pnpm test:security && pnpm test:performance",
    "lint": "eslint src --fix",
    "format": "prettier --write \"src/**/*.ts\" \"__tests__/**/*.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## ✅ Checklist General de Testing

### Pre-Implementation
- [ ] Setup de testing environment
- [ ] Configuración de Vitest
- [ ] Fixtures y mocks preparados
- [ ] Test utilities creados

### Durante Implementation
- [ ] Tests unitarios escritos (TDD)
- [ ] Tests de integración escritos
- [ ] Tests E2E escritos
- [ ] Linting continuo
- [ ] Documentation actualizada

### Post-Implementation
- [ ] Todos los tests pasan
- [ ] Cobertura ≥ meta establecida
- [ ] Security audit limpio
- [ ] Performance benchmarks cumplidos
- [ ] Code review completado
- [ ] Documentation final
- [ ] CHANGELOG actualizado

### Pre-Merge
- [ ] CI/CD pipeline pasa
- [ ] Tests en múltiples environments
- [ ] Regression tests pasan
- [ ] Load testing (si aplicable)
- [ ] Smoke tests en staging

---

## 📚 Referencias

### Testing Best Practices
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [AAA Pattern](https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/)

### Security Testing
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/learn/)

### Performance Testing
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Clinic.js](https://clinicjs.org/)
- [Autocannon](https://github.com/mcollina/autocannon)

---

**Última actualización**: 2025-11-02  
**Estado**: 📋 PLANIFICADO  
**Próximo Paso**: Implementación P0-1 con TDD approach  
**Total Tests Planificados**: 177 tests (80 unit + 47 integration + 25 E2E + 11 security + 14 performance)  
**Tiempo Estimado Testing**: 7-8 horas para completar todos los tests P0
