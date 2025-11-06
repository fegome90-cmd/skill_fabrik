import { ActivationEngine } from '../activation/ActivationEngine.js';
import { KeywordMatchSignal } from '../activation/signals/keywordMatch.js';

describe('ActivationEngine', () => {
  const skillName = 'plan-architect';

  test('denied by denyList even if score is high', async () => {
    const signals = [new KeywordMatchSignal(['plan'])];
    const engine = new ActivationEngine(signals, {
      threshold: 0.5,
      allowList: [],
      denyList: ['forbidden'],
      weights: { keywordMatch: 1 }
    });
    const res = await engine.evaluate(skillName, 'please plan this feature (forbidden)', {});
    expect(res.activate).toBe(false);
    expect(res.reason).toBe('denyList');
  });

  test('allowed by allowList even if score is low', async () => {
    const signals = [new KeywordMatchSignal(['x'])];
    const engine = new ActivationEngine(signals, {
      threshold: 0.8,
      allowList: ['/plan'],
      denyList: [],
      weights: { keywordMatch: 1 }
    });
    const res = await engine.evaluate(skillName, 'run /plan quickly', {});
    expect(res.activate).toBe(true);
    expect(res.reason).toBe('allowList');
  });

  test('threshold governs activation with weighted signals', async () => {
    const signals = [new KeywordMatchSignal(['plan', 'roadmap'])];
    const engine = new ActivationEngine(signals, {
      threshold: 0.5,
      allowList: [],
      denyList: [],
      weights: { keywordMatch: 1 }
    });
    const res1 = await engine.evaluate(skillName, 'please plan it', {});
    const res2 = await engine.evaluate(skillName, 'please plan the roadmap', {});
    expect(res1.activate).toBe(true); // 1/2 keywords => 0.5 meets threshold
    expect(res2.activate).toBe(true); // 2/2 keywords => 1 >= threshold
  });
});


