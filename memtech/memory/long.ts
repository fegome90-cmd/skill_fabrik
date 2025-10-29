export interface LongAdapter {
  store(rec: any): Promise<void>;
  search(q: string, k?: number): Promise<any[]>;
}

export class LongMemory {
  constructor(private adapter: LongAdapter) {}

  store(content: string, meta: any) {
    const ts = meta?.ts ?? Date.now();
    return this.adapter.store({ content, meta, ts });
  }

  search(q: string, k = 5) {
    return this.adapter.search(q, k);
  }
}
