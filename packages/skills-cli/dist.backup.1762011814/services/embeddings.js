import crypto from 'crypto';
import { Cache } from '../utils/cache.js';
const embeddingCache = new Cache({
    enabled: true,
    maxSize: 1000,
    defaultTtl: 3600000 // 1 hour
});
// Placeholder for real embedding model
async function callEmbeddingModel(input, kind = 'text') {
    // Generate deterministic embedding for now
    const dimension = 1536;
    const hash = crypto.createHash('sha256').update(`${kind}:${input}`).digest('hex');
    // Convert hash to vector deterministically
    const vector = Array.from({ length: dimension }, (_, i) => {
        const byteIndex = i % 32;
        const byte = parseInt(hash.substring(byteIndex * 2, byteIndex * 2 + 2), 16);
        return (byte - 128) / 128; // Normalize to [-1, 1]
    });
    return {
        vector,
        dim: dimension,
        model: 'S-embed-v1',
        ts: Date.now()
    };
}
export async function embed(input, kind = 'text') {
    const key = crypto.createHash('sha256').update(`${kind}:${input}`).digest('hex');
    // Try cache first
    const cached = embeddingCache.get(key);
    if (cached) {
        return cached;
    }
    // Generate embedding
    const embedding = await callEmbeddingModel(input, kind);
    // Cache it
    embeddingCache.set(key, embedding);
    return embedding;
}
//# sourceMappingURL=embeddings.js.map