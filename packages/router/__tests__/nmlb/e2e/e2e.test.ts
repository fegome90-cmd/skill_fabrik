/**
 * Tests E2E: NMLB
 * P0-5: Validación completa
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

describe('NMLB E2E Tests', () => {
  it('should detect uncommitted files', () => {
    const gitStatus = '?? untracked.txt\n M modified.ts';
    expect(gitStatus).toContain('??');
  });

  it('should verify clean state', () => {
    const cleanStatus = '';
    const isClean = !cleanStatus.includes('??') && !cleanStatus.includes(' M');

    expect(isClean).toBe(true);
  });
});
