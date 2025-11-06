import { describe, it, expect, beforeEach } from 'vitest';
import type { PreHookInput } from '../types.js';
import { matchRulesFor, loadRules, fuzzyCache, FUZZY_MATCH_THRESHOLD } from '../detectors.js';

// Mock environment variable
process.env.FUZZY_MATCH_THRESHOLD = '0.7';

describe('Fuzzy Matching Engine', () => {
  beforeEach(() => {
    // Clear fuzzy cache between tests
    fuzzyCache.clear();
  });

  describe('Jaro-Winkler Algorithm', () => {
    it('should return 1.0 for exact matches', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['authentication']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'I need authentication for the login system',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      expect(result.activated).toContain('testSkill');
    });

    it('should detect fuzzy matches above threshold', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['authenticating']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'I need to authenticate the user login',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      // Should activate due to fuzzy match (authenticating ~ authenticate)
      expect(result.activated).toContain('testSkill');
      expect(result.metadata.reasons.testSkill).toContain('fuzzy');
    });

    it('should not match below threshold', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['database']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'I need to configure the data lake system',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      // Should not activate (database ~ data lake has low similarity)
      expect(result.activated).not.toContain('testSkill');
    });

    it('should handle multiple keywords with mixed exact and fuzzy', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['login', 'authenticating', 'security']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'Need login system with security measures',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      // login: exact match, security: exact match
      expect(result.activated).toContain('testSkill');
      
      const reasons = result.metadata.reasons.testSkill;
      expect(reasons.some(r => r.includes('exact'))).toBe(true);
    });

    it('should prefer exact matches over fuzzy', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['user', 'auth']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'user authentication system',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      expect(result.activated).toContain('testSkill');
      
      const reasons = result.metadata.reasons.testSkill;
      const exactReason = reasons.find(r => r.includes('exact'));
      expect(exactReason).toBeDefined();
    });

    it('should handle very short strings with fallback', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['db']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'configure the database connection',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      // Should match due to short string fallback
      expect(result.activated).toContain('testSkill');
    });

    it('should use configurable threshold', async () => {
      // Set higher threshold
      process.env.FUZZY_MATCH_THRESHOLD = '0.9';
      
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['testing']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'need to test the application',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      // Should not activate with higher threshold (0.9)
      expect(result.activated).not.toContain('testSkill');
      
      // Restore default
      process.env.FUZZY_MATCH_THRESHOLD = '0.7';
    });
  });

  describe('Performance and Caching', () => {
    it('should cache fuzzy scores for performance', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['performance']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'optimize performance',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      // First call
      const result1 = matchRulesFor(input, rules);
      
      // Second call (should use cache)
      const result2 = matchRulesFor(input, rules);
      
      expect(result1.activated).toEqual(result2.activated);
    });

    it('should handle many keywords efficiently', async () => {
      const keywords = Array.from({ length: 100 }, (_, i) => `keyword${i}`);
      
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'keyword50 is the match',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const start = Date.now();
      const result = matchRulesFor(input, rules);
      const duration = Date.now() - start;
      
      expect(result.activated).toContain('testSkill');
      expect(duration).toBeLessThan(100); // Should be fast even with many keywords
    });
  });

  describe('Integration with Existing System', () => {
    it('should work with intent patterns', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['creat', 'make'], // Fuzzy keywords
            intentPatterns: ['create.*user']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'I want to create a new user account',
        openFiles: [],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      // Should activate due to intent pattern
      expect(result.activated).toContain('testSkill');
    });

    it('should work with path triggers', async () => {
      const rules = {
        testSkill: {
          type: 'guideline' as const,
            enforcement: 'block' as const,
promptTriggers: {
            keywords: ['auth']
          },
          fileTriggers: {
            pathPatterns: ['**/*auth*']
          }
        }
      };

      const input: PreHookInput = {
        prompt: 'need authentication help',
        openFiles: ['src/auth/auth.service.ts'],
        activeFileContent: undefined,
        cwd: '/test'
      };

      const result = matchRulesFor(input, rules);
      
      expect(result.activated).toContain('testSkill');
    });
  });
});
