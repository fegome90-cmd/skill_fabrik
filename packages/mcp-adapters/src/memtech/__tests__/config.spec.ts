/**
 * Tests for configuration validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { validateConfig, resetConfig } from '../config.js';

describe('Config Validation', () => {
  beforeEach(() => {
    resetConfig();
    // Clear env vars
    delete process.env.REDIS_URL_CORE;
    delete process.env.MEMTECH_REDIS_CORE_HOST;
    delete process.env.MEMTECH_REDIS_CORE_PORT;
  });

  it('should validate correct configuration', () => {
    process.env.REDIS_URL_CORE = 'redis://localhost:6381';
    resetConfig();

    const result = validateConfig();
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should detect missing Redis Core URL', () => {
    resetConfig();
    const result = validateConfig();
    
    // Should have errors for missing Redis Core
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('REDIS_URL_CORE') || e.includes('MEMTECH_REDIS_CORE_HOST'))).toBe(true);
  });

  it('should validate port ranges', () => {
    process.env.MEMTECH_REDIS_CORE_PORT = '99999'; // Invalid port
    resetConfig();

    const result = validateConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('port') && e.includes('65535'))).toBe(true);
  });

  it('should warn about missing password in production', () => {
    process.env.REDIS_URL_CORE = 'redis://localhost:6381';
    process.env.NODE_ENV = 'production';
    resetConfig();

    const result = validateConfig();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('password') && w.includes('production'))).toBe(true);
  });
});

