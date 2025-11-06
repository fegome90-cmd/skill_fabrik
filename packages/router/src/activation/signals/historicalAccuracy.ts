import { type ScoreInput, type Signal } from '../types.js';
import { type HistoricalDataProvider } from '../provider.js';

export class HistoricalAccuracySignal implements Signal {
  name = 'historicalAccuracy';
  private readonly provider?: HistoricalDataProvider;
  private cache: Map<string, number> = new Map();

  constructor(provider?: HistoricalDataProvider) {
    this.provider = provider;
  }

  async score({ skillName, context }: ScoreInput): Promise<number> {
    // Prefer accuracy from context if present
    const ctxAcc = context?.historical?.accuracy;
    if (typeof ctxAcc === 'number') return clamp01(ctxAcc);

    // Try cache/provider
    const cached = this.cache.get(skillName);
    if (typeof cached === 'number') return cached;

    if (this.provider) {
      const data = await this.provider.getHistoricalData(skillName);
      const acc = clamp01(data?.accuracy ?? 0.5);
      this.cache.set(skillName, acc);
      return acc;
    }

    // Neutral baseline
    return 0.5;
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}


