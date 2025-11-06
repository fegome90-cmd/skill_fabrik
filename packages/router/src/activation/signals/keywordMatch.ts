import { type ScoreInput, type Signal } from '../types.js';

export class KeywordMatchSignal implements Signal {
  name = 'keywordMatch';
  private readonly keywords: string[];

  constructor(keywords: string[]) {
    this.keywords = keywords.map((k) => k.toLowerCase());
  }

  score({ prompt }: ScoreInput): number {
    if (!this.keywords.length) return 0;
    const p = prompt.toLowerCase();
    let hits = 0;
    for (const kw of this.keywords) {
      if (p.includes(kw)) hits += 1;
    }
    return Math.min(hits / Math.max(this.keywords.length, 1), 1);
  }
}


