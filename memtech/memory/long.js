export class LongMemory {
  constructor(adapter) {
    this.adapter = adapter;
  }

  store(content, meta) {
    const ts = meta?.ts ?? Date.now();
    return this.adapter.store({ content, meta, ts });
  }

  search(query, limit = 5) {
    return this.adapter.search(query, limit);
  }
}
