import { describe, it, expect } from 'vitest';
import type { PreHookInput } from '../types.js';
import { matchRulesFor } from '../detectors.js';

describe('Debug Fuzzy Matching', () => {
  it('should show exact match score', async () => {
    const rules = {
      testSkill: {
        type: 'guideline' as const,
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
    
    console.log('Activated:', result.activated);
    console.log('Scores:', result.metadata.scores);
    console.log('Reasons:', result.metadata.reasons);
    
    // Don't assert, just see what happens
  });
});
