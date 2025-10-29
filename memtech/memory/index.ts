import { ShortMemory } from './short';
import { LongMemory, type LongAdapter } from './long';

export class Memory {
  short = new ShortMemory();
  long: LongMemory;

  constructor(adapter: LongAdapter) {
    this.long = new LongMemory(adapter);
  }

  async injectContext(topic: string) {
    const shortMatches = this.short.query(topic);
    const combined = [...shortMatches];

    if (combined.length < 3) {
      try {
        const longMatches = await this.long.search(topic, 5);
        for (const entry of longMatches ?? []) {
          if (!entry?.content) continue;
          combined.push({
            content: entry.content,
            meta: {
              ts: entry.meta?.ts ?? entry.ts ?? Date.now(),
              source: entry.meta?.source ?? 'long_memory',
              tags: entry.meta?.tags,
            },
          });
        }
      } catch {
        // Si la búsqueda en long memory falla, continuamos con short memory
      }
    }

    const contextText = combined
      .map(r => r.content)
      .filter(Boolean)
      .join('\n');

    return contextText.slice(-16000);
  }
}

export { ShortMemory } from './short';
export { LongMemory } from './long';
