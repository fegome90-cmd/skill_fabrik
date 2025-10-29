import { ShortMemory } from './short.js';
import { LongMemory } from './long.js';

export class Memory {
  constructor(adapter) {
    this.short = new ShortMemory();
    this.long = new LongMemory(adapter);
  }

  async injectContext(topic) {
    const shortResults = this.short.query(topic);
    const combinedResults = [...shortResults];

    if (combinedResults.length < 3) {
      try {
        const longResults = await this.long.search(topic, 5);
        for (const entry of longResults || []) {
          if (!entry || !entry.content) continue;
          combinedResults.push({
            content: entry.content,
            meta: {
              ts: entry.meta?.ts ?? entry.ts ?? Date.now(),
              source: entry.meta?.source ?? 'long_memory',
              tags: entry.meta?.tags,
            },
          });
        }
      } catch {
        // Si falla long memory, continuamos con short memory
      }
    }

    const contextText = combinedResults
      .map(result => result.content)
      .filter(Boolean)
      .join('\n');

    return contextText.slice(-16000);
  }
}

export { ShortMemory, LongMemory };
