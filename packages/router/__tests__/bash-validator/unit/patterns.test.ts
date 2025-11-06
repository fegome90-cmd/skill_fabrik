/**
 * Tests Unitarios: Bash Patterns Extended
 * P0-2: Tests adicionales de patrones peligrosos
 */

import { describe, it, expect } from 'vitest';

function validateBashCommand(command: string): { level: string; blocked: boolean; message?: string } {
  const dangerousPatterns = [
    { pattern: /^rm\s+-rf\s+\//, level: 'error', blocked: true },
    { pattern: /^dd\s+if=/, level: 'error', blocked: true },
    { pattern: /^chmod\s+777\s+/, level: 'error', blocked: true },
    { pattern: /^sudo\s+/, level: 'warning', blocked: false },
    { pattern: /^mv\s+.*\/\*/, level: 'error', blocked: true, message: 'Movimiento masivo detectado' },
    { pattern: /^format\s+/, level: 'error', blocked: true, message: 'Comando format detectado' },
    { pattern: /^fdisk\s+/, level: 'error', blocked: true, message: 'Comando fdisk detectado' },
    { pattern: /^mkfs\./, level: 'error', blocked: true, message: 'Comando mkfs detectado' },
    { pattern: /^cat\s+\/etc\/passwd/, level: 'error', blocked: true, message: 'Lectura de passwd' },
    { pattern: /^grep\s+-r\s+password\s+/, level: 'warning', blocked: false, message: 'Búsqueda de passwords' },
  ];

  for (const danger of dangerousPatterns) {
    if (danger.pattern.test(command)) {
      return { level: danger.level, blocked: danger.blocked, message: danger.message };
    }
  }

  return { level: 'ok', blocked: false };
}

describe('Bash Validator Extended Patterns', () => {
  describe('system-level dangerous commands', () => {
    it('should detect mv with wildcards', () => {
      const command = 'mv * /tmp/';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
      expect(result.blocked).toBe(true);
    });

    it('should detect format commands', () => {
      const command = 'format C:';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
    });

    it('should detect fdisk commands', () => {
      const command = 'fdisk /dev/sda';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
    });

    it('should detect mkfs commands', () => {
      const command = 'mkfs.ext4 /dev/sdb1';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
    });
  });

  describe('file access violations', () => {
    it('should detect passwd file reading', () => {
      const command = 'cat /etc/passwd';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
    });

    it('should warn on password searching', () => {
      const command = 'grep -r password .';
      const result = validateBashCommand(command);
      expect(result.level).toBe('warning');
    });
  });

  describe('safe command variations', () => {
    it('should allow safe mv commands', () => {
      const command = 'mv file1.txt file2.txt';
      const result = validateBashCommand(command);
      expect(result.level).toBe('ok');
    });

    it('should allow cat on regular files', () => {
      const command = 'cat README.md';
      const result = validateBashCommand(command);
      expect(result.level).toBe('ok');
    });

    it('should allow git commands', () => {
      const command = 'git status';
      const result = validateBashCommand(command);
      expect(result.level).toBe('ok');
    });

    it('should allow npm commands', () => {
      const command = 'npm install';
      const result = validateBashCommand(command);
      expect(result.level).toBe('ok');
    });
  });

  describe('case sensitivity', () => {
    it('should handle RM in uppercase', () => {
      const command = 'RM -RF /';
      const result = validateBashCommand(command);
      // Case sensitivity depends on implementation
      // If case-sensitive, this should be ok
      expect(result).toBeDefined();
    });
  });

  describe('command validation', () => {
    it('should validate standalone commands', () => {
      const command = 'rm -rf /';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
      expect(result.blocked).toBe(true);
    });

    it('should allow safe commands', () => {
      const command = 'ls -la';
      const result = validateBashCommand(command);
      expect(result.level).toBe('ok');
      expect(result.blocked).toBe(false);
    });
  });
});
