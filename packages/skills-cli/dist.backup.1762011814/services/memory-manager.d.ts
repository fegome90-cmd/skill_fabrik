export interface MemoryConfig {
    backend: 'inmemory' | 'qdrant' | 'pinecone';
    embeddingModel: string;
    namespace: string;
    qdrant?: {
        url: string;
        collection: string;
        vectorSize: number;
        distance: 'Cosine' | 'Euclid' | 'Dot';
    };
}
export declare class MemoryManager {
    private config;
    private vectorStore;
    private currentNamespace;
    constructor(configPath?: string);
    private loadConfig;
    private parseSimpleYAML;
    private getDefaultConfig;
    private createVectorStore;
    setup(): Promise<void>;
    getStatus(): Promise<void>;
    test(): Promise<void>;
    getConfig(): MemoryConfig;
}
//# sourceMappingURL=memory-manager.d.ts.map