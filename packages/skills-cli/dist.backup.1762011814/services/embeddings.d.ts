export interface Embedding {
    vector: number[];
    dim: number;
    model: string;
    ts: number;
}
export declare function embed(input: string, kind?: 'text' | 'code' | 'doc'): Promise<Embedding>;
//# sourceMappingURL=embeddings.d.ts.map