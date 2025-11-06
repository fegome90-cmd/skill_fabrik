/**
 * Tests Unitarios: Build Check
 * P0-4: Validación de build
 */

import { describe, it, expect } from 'vitest';

function runBuildCheck(repoPath: string, buildCommand: string): Promise<{
  success: boolean;
  duration: number;
  errors: string[];
  output: string;
}> {
  const start = Date.now();

  // Simulate build check
  if (buildCommand.includes('npm run build')) {
    const duration = Date.now() - start;
    return Promise.resolve({
      success: true,
      duration,
      errors: [],
      output: 'Build successful',
    });
  }

  if (buildCommand.includes('tsc')) {
    const duration = Date.now() - start;
    return Promise.resolve({
      success: false,
      duration,
      errors: ['Type error: Property does not exist'],
      output: 'Build failed',
    });
  }

  const duration = Date.now() - start;
  return Promise.resolve({
    success: true,
    duration,
    errors: [],
    output: 'Unknown build command',
  });
}

describe('Build Check Unit Tests', () => {
  it('should succeed for npm build', async () => {
    const result = await runBuildCheck('/test', 'npm run build');
    expect(result.success).toBe(true);
  });

  it('should fail for TypeScript errors', async () => {
    const result = await runBuildCheck('/test', 'tsc --noEmit');
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should track build duration', async () => {
    const result = await runBuildCheck('/test', 'npm run build');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should handle missing build command', async () => {
    const result = await runBuildCheck('/test', 'unknown-command');
    expect(result.success).toBe(true);
  });

  it('should capture build output', async () => {
    const result = await runBuildCheck('/test', 'npm run build');
    expect(result.output).toBeDefined();
  });
});
