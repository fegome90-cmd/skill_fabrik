export interface VecDoc {
  id: string;
  ns: string;
  text: string;
  score?: number;
  meta?: Record<string, unknown>;
}

export interface VecHit {
  id: string;
  text: string;
  score: number;
  meta?: Record<string, unknown>;
}

export interface VectorStore {
  upsert(ns: string, id: string, vector: number[], payload: Omit<VecDoc, 'id' | 'ns'>): Promise<void>;
  query(ns: string, vector: number[], topK: number, filter?: Record<string, unknown>): Promise<VecHit[]>;
  deleteByIds(ns: string, ids: string[]): Promise<void>;
}

export function InMemoryVectorStore(): VectorStore {
  const store = new Map<string, { vector: number[]; payload: Omit<VecDoc, 'id' | 'ns'> }>();

  return {
    async upsert(ns: string, id: string, vector: number[], payload: Omit<VecDoc, 'id' | 'ns'>): Promise<void> {
      const key = `${ns}:${id}`;
      store.set(key, { vector, payload });
    },

    async query(ns: string, vector: number[], topK: number, _filter?: Record<string, unknown>): Promise<VecHit[]> {
      const results: Array<{ id: string; text: string; score: number; meta?: Record<string, unknown> }> = [];

      for (const [key, entry] of store.entries()) {
        if (key.startsWith(`${ns}:`)) {
          const score = cosineSimilarity(vector, entry.vector);
          const id = key.split(':')[1];
          results.push({
            id,
            text: entry.payload.text || '',
            score,
            meta: entry.payload.meta
          });
        }
      }

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    },

    async deleteByIds(ns: string, ids: string[]): Promise<void> {
      for (const id of ids) {
        store.delete(`${ns}:${id}`);
      }
    }
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
