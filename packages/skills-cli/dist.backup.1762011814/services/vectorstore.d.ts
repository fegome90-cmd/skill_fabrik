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
export declare function InMemoryVectorStore(): VectorStore;
//# sourceMappingURL=vectorstore.d.ts.map