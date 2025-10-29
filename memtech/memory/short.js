export class ShortMemory {
  constructor(cap = 500, ttlMs = 30 * 24 * 60 * 60 * 1000, buf = []) {
    this.cap = cap;
    this.ttlMs = ttlMs;
    this.buf = buf;
  }

  push(record) {
    this.buf.push(record);
    if (this.buf.length > this.cap) {
      this.buf.shift();
    }
  }

  query(q) {
    const now = Date.now();
    return this.buf.filter(
      entry => entry?.content && now - entry.meta?.ts <= this.ttlMs && entry.content.includes(q)
    );
  }
}
