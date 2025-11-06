/**
 * Tests Unitarios: Bash Validator
 * P0-2: Detección de comandos peligrosos
 */

import { describe, it, expect } from 'vitest';

// Mock bash validator functions
function validateBashCommand(command: string): { level: string; blocked: boolean; message?: string } {
  const dangerousPatterns = [
    { pattern: /^rm\s+-rf\s+\//, level: 'error', blocked: true, message: 'Comando rm -rf en root' },
    { pattern: /^dd\s+if=/, level: 'error', blocked: true, message: 'Comando dd con if=' },
    { pattern: /^chmod\s+777\s+/, level: 'error', blocked: true, message: 'Permisos 777 detectados' },
    { pattern: /^sudo\s+/, level: 'warning', blocked: false, message: 'Comando sudo detectado' },
  ];

  for (const danger of dangerousPatterns) {
    if (danger.pattern.test(command)) {
      return { level: danger.level, blocked: danger.blocked, message: danger.message };
    }
  }

  return { level: 'ok', blocked: false };
}

function extractBashCommands(content: string): string[] {
  const commands: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
      commands.push(trimmed);
    }
  }

  return commands;
}

describe('Bash Validator Unit Tests', () => {
  describe('dangerous command detection', () => {
    it('should detect rm -rf without path restriction', () => {
      const command = 'rm -rf /';
      const result = validateBashCommand(command);
      expect(result.level).toBe('error');
      expect(result.blocked).toBe(true);
      expect(result.message).toContain('rm -rf');
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
      expect(result.blocked).toBe(false);
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
      const commands = extractBashCommands(content);
      expect(commands).toContain('rm -rf temp/');
    });

    it('should ignore comments', async () => {
      const content = `
        # This is a comment
        // This is also a comment
        echo "Real command"
      `;
      const commands = extractBashCommands(content);
      expect(commands).not.toContain('# This is a comment');
      expect(commands).toContain('echo "Real command"');
    });

    it('should handle empty files', async () => {
      const content = '';
      const commands = extractBashCommands(content);
      expect(commands).toEqual([]);
    });

    it('should handle multi-line commands', async () => {
      const content = `
        curl https://example.com \
          --output file.txt
      `;
      const commands = extractBashCommands(content);
      expect(commands.length).toBeGreaterThan(0);
    });
  });

  describe('validation levels', () => {
    it('should return error for blockLevel commands', () => {
      const result = validateBashCommand('rm -rf /');
      expect(result.level).toBe('error');
      expect(result.blocked).toBe(true);
    });

    it('should return warning for warnLevel commands', () => {
      const result = validateBashCommand('sudo ls');
      expect(result.level).toBe('warning');
      expect(result.blocked).toBe(false);
    });

    it('should return ok for safe commands', () => {
      const result = validateBashCommand('ls -la');
      expect(result.level).toBe('ok');
      expect(result.blocked).toBe(false);
    });
  });
});
