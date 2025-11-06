/**
 * Tests Unitarios: NMLB (No-Mess-Left-Behind)
 * P0-5: Validación de repositorio limpio
 */

import { describe, it, expect } from 'vitest';

function verifyCleanRepo(status: string): { clean: boolean; message?: string } {
  if (status.includes('??') || status.includes(' M ') || status.includes('A ')) {
    return { clean: false, message: 'Repository has uncommitted changes' };
  }
  return { clean: true };
}

function checkGitStatus(files: string[]): { clean: boolean; untracked: number; modified: number } {
  let untracked = 0;
  let modified = 0;

  for (const file of files) {
    if (file.startsWith('??')) untracked++;
    if (file.startsWith(' M')) modified++;
  }

  return {
    clean: untracked === 0 && modified === 0,
    untracked,
    modified,
  };
}

describe('NMLB Unit Tests', () => {
  it('should detect clean repository', () => {
    const status = '';
    const result = verifyCleanRepo(status);
    expect(result.clean).toBe(true);
  });

  it('should detect uncommitted changes', () => {
    const status = ' M src/test.ts';
    const result = verifyCleanRepo(status);
    expect(result.clean).toBe(false);
  });

  it('should detect untracked files', () => {
    const status = '?? new-file.txt';
    const result = verifyCleanRepo(status);
    expect(result.clean).toBe(false);
  });

  it('should count untracked files', () => {
    const files = ['?? file1.txt', '?? file2.txt', 'src/test.ts'];
    const result = checkGitStatus(files);
    expect(result.untracked).toBe(2);
    expect(result.clean).toBe(false);
  });

  it('should count modified files', () => {
    const files = [' M src/modified.ts', 'src/test.ts'];
    const result = checkGitStatus(files);
    expect(result.modified).toBe(1);
  });

  it('should verify clean status', () => {
    const files: string[] = [];
    const result = checkGitStatus(files);
    expect(result.clean).toBe(true);
  });
});
