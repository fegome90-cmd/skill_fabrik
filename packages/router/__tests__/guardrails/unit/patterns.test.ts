/**
 * Tests Unitarios: Guardrails ContentPatterns
 * P0-1: Testing exhaustivo de detección de patrones
 */

import { describe, it, expect } from 'vitest';
import { DANGEROUS_QUERIES, SAFE_QUERIES } from '../../fixtures/database-queries.js';
import { DANGEROUS_SECRETS, SAFE_SECRETS } from '../../fixtures/secrets-examples.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock de la función checkPatterns (será implementada)
function checkPatterns(code: string, skillId: string): Array<{message: string, line?: number}> {
  const violations: Array<{message: string, line?: number}> = [];

  // Patrones para database-verification
  if (skillId === 'database-verification') {
    // deleteMany sin where
    if (/\.deleteMany\(\s*\)/.test(code)) {
      violations.push({ message: 'deleteMany() sin cláusula WHERE', line: code.split('\n').findIndex(l => l.includes('.deleteMany')) + 1 });
    }

    // updateMany sin where
    if (/\.updateMany\([^)]*\)/.test(code) && !/where:/i.test(code)) {
      violations.push({ message: 'updateMany() sin cláusula WHERE', line: code.split('\n').findIndex(l => l.includes('.updateMany')) + 1 });
    }

    // findMany sin parámetros
    if (/\.findMany\(\s*\)/.test(code)) {
      violations.push({ message: 'findMany() sin parámetros de filtrado' });
    }

    // SQL DELETE sin WHERE
    if (/DELETE\s+FROM\s+\w+\s*;/.test(code) && !/WHERE/i.test(code)) {
      violations.push({ message: 'SQL DELETE sin cláusula WHERE' });
    }

    // SQL UPDATE sin WHERE
    if (/UPDATE\s+\w+\s+SET/i.test(code) && !/WHERE/i.test(code)) {
      violations.push({ message: 'SQL UPDATE sin cláusula WHERE' });
    }
  }

  // Patrones para secrets-and-config
  if (skillId === 'secrets-and-config') {
    // API Keys hardcodeadas
    if (/"sk_live_[a-zA-Z0-9]+"/.test(code) || /AKIA[A-Z0-9]{16}/.test(code)) {
      violations.push({ message: 'API Key hardcodeada detectada' });
    }

    // Passwords hardcodeados
    if (/password\s*[:=]\s*['"][^'"]+['"]/.test(code)) {
      violations.push({ message: 'Password hardcodeado detectado' });
    }

    // Secrets hardcodeados
    if (/\bsecret\s*[:=]\s*['"][^'"]+['"]/.test(code)) {
      violations.push({ message: 'Secret hardcodeado detectado' });
    }

    // JWT secrets
    if (/sign\([^)]*,\s*"[a-zA-Z0-9_-]{10,}"/.test(code) || /secret.*["'][a-zA-Z0-9_-]{10,}["']/.test(code)) {
      violations.push({ message: 'Posible JWT secret hardcodeado' });
    }
  }

  return violations;
}

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

    it('should detect in string context', () => {
      const code = `
        const example = "await prisma.user.deleteMany();";
      `;
      const violations = checkPatterns(code, 'database-verification');
      // Nuestros patterns lo detectarán incluso en strings
      expect(violations.length).toBeGreaterThan(0);
    });
  });
});
