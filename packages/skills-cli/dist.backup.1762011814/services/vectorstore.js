export function InMemoryVectorStore() {
    const store = new Map();
    return {
        async upsert(ns, id, vector, payload) {
            const key = `${ns}:${id}`;
            store.set(key, { vector, payload });
        },
        async query(ns, vector, topK, _filter) {
            const results = [];
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
        async deleteByIds(ns, ids) {
            for (const id of ids) {
                store.delete(`${ns}:${id}`);
            }
        }
    };
}
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0)
        return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
//# sourceMappingURL=vectorstore.js.map