import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { CLIHelper } from '../utils/test-helpers';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync } from 'fs';

describe('CLI Skills Commands Integration Tests', () => {
  const testSkillsDir = join(__dirname, '../../../test-temp-skills');

  beforeAll(() => {
    mkdirSync(testSkillsDir, { recursive: true });

    // Create a valid test skill
    const validSkill = `---
id: test-valid-skill
version: 0.1.0
type: guideline
summary: 'Test skill for integration testing'
audience: engineers
when_to_use: 'For testing purposes'
---

# Test Valid Skill

This is a valid test skill for integration testing.

## Usage
Use this skill to verify CLI functionality.
`;

    writeFileSync(join(testSkillsDir, 'valid-skill.md'), validSkill);

    // Create an invalid test skill (missing metadata)
    const invalidSkill = `
# Invalid Skill

This skill is missing required metadata.
`;

    writeFileSync(join(testSkillsDir, 'invalid-skill.md'), invalidSkill);
  });

  afterAll(() => {
    rmSync(testSkillsDir, { recursive: true, force: true });
  });

  describe('skills lint command', () => {
    test('should validate skills directory successfully', async () => {
      const result = await CLIHelper.skillsCommand('lint', [testSkillsDir, '--strict']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✓');
      expect(result.stderr).toBe('');
    });

    test('should fail on invalid skills directory', async () => {
      const result = await CLIHelper.skillsCommand('lint', ['/nonexistent/directory', '--strict']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('error');
    });

    test('should show warnings for non-strict mode', async () => {
      const result = await CLIHelper.skillsCommand('lint', [testSkillsDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('valid-skill');
    });
  });

  describe('skills check command', () => {
    test('should check intent matching with threshold', async () => {
      const result = await CLIHelper.skillsCommand('check', [
        'implement user authentication',
        '--threshold', '0.6'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Checking intent');
    });

    test('should work with v2 enhanced checking', async () => {
      const result = await CLIHelper.skillsCommand('check', [
        'create comprehensive test suite',
        '--v2'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Checking intent');
    });

    test('should handle no matching skills gracefully', async () => {
      const result = await CLIHelper.skillsCommand('check', [
        'very specific unique query that matches nothing',
        '--threshold', '0.9'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('⚠️');
    });
  });

  describe('skills rules command', () => {
    test('should display current skill rules', async () => {
      const result = await CLIHelper.skillsCommand('rules');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Current skill rules');
    });
  });

  describe('skills index command', () => {
    test('should generate skills registry index', async () => {
      const tempRegistry = join(testSkillsDir, 'temp-registry.json');
      const result = await CLIHelper.skillsCommand('index', [
        './skills',
        '--out', tempRegistry
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Indexed');
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle empty skills directory', async () => {
      const emptyDir = join(testSkillsDir, 'empty');
      mkdirSync(emptyDir);

      const result = await CLIHelper.skillsCommand('lint', [emptyDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No skills found');
    });

    test('should handle malformed YAML in skill metadata', async () => {
      const malformedSkill = `---
id: malformed-skill
version: 0.1.0
type: guideline
summary: 'unclosed quote
audience: engineers
---

# Malformed Skill

This skill has malformed YAML.
`;

      writeFileSync(join(testSkillsDir, 'malformed-skill.md'), malformedSkill);

      const result = await CLIHelper.skillsCommand('lint', [testSkillsDir]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('error');
    });

    test('should handle skill with very long content', async () => {
      const longContent = '# Long Content Skill\n\n' + 'This is a very long content. '.repeat(1000);
      writeFileSync(join(testSkillsDir, 'long-content-skill.md'), longContent);

      const result = await CLIHelper.skillsCommand('lint', [testSkillsDir]);

      // Should handle gracefully without crashing
      expect(result.exitCode).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance tests', () => {
    test('should handle large skills directory efficiently', async () => {
      const largeDir = join(testSkillsDir, 'large');
      mkdirSync(largeDir);

      // Create many small skill files
      for (let i = 0; i < 50; i++) {
        const skill = `---
id: test-skill-${i}
version: 0.1.0
type: guideline
summary: 'Test skill ${i}'
audience: engineers
---

# Test Skill ${i}

Content for skill ${i}.
`;
        writeFileSync(join(largeDir, `skill-${i}.md`), skill);
      }

      const startTime = Date.now();
      const result = await CLIHelper.skillsCommand('lint', [largeDir]);
      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);
      // Should complete within reasonable time (5 seconds for 50 skills)
      expect(duration).toBeLessThan(5000);
    });
  });
});