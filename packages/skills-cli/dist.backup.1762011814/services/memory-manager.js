import fs from 'fs';
import path from 'path';
import { InMemoryVectorStore } from './vectorstore.js';
import { BackendError } from '../core/errors.js';
import { Logger } from '../core/logger.js';
import { embed } from './embeddings.js';
export class MemoryManager {
    config;
    vectorStore;
    currentNamespace;
    constructor(configPath) {
        this.config = this.loadConfig(configPath);
        this.vectorStore = this.createVectorStore();
        this.currentNamespace = this.config.namespace || 'default';
    }
    loadConfig(configPath) {
        const defaultPath = path.resolve(process.cwd(), 'config', 'memory.yaml');
        const actualPath = configPath || defaultPath;
        if (fs.existsSync(actualPath)) {
            try {
                // Try YAML first, fallback to JSON
                const content = fs.readFileSync(actualPath, 'utf8');
                if (actualPath.endsWith('.yaml') || actualPath.endsWith('.yml')) {
                    // Simple YAML parsing (in production, use js-yaml)
                    const parsed = this.parseSimpleYAML(content);
                    return { ...this.getDefaultConfig(), ...parsed };
                }
                else {
                    return { ...this.getDefaultConfig(), ...JSON.parse(content) };
                }
            }
            catch (error) {
                Logger.warn('Error loading memory config, using defaults');
                return this.getDefaultConfig();
            }
        }
        return this.getDefaultConfig();
    }
    parseSimpleYAML(yaml) {
        const config = {};
        const lines = yaml.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const match = trimmed.match(/^(\w+):\s*(.+)$/);
                if (match) {
                    const key = match[1];
                    const value = match[2].replace(/^["']|["']$/g, '');
                    if (key === 'backend') {
                        config.backend = value;
                    }
                    else if (key === 'embeddingModel') {
                        config.embeddingModel = value;
                    }
                    else if (key === 'namespace') {
                        config.namespace = value;
                    }
                }
            }
        }
        return config;
    }
    getDefaultConfig() {
        return {
            backend: 'inmemory',
            embeddingModel: 'S-embed-v1',
            namespace: '${project}/${sprint}'
        };
    }
    createVectorStore() {
        switch (this.config.backend) {
            case 'inmemory':
                return InMemoryVectorStore();
            case 'qdrant':
                throw new BackendError('qdrant', 'Qdrant backend not yet implemented (stub)');
            case 'pinecone':
                throw new BackendError('pinecone', 'Pinecone backend not yet implemented (stub)');
            default:
                return InMemoryVectorStore();
        }
    }
    async setup() {
        Logger.info(`Setting up memory system (backend: ${this.config.backend})`);
        if ('initialize' in this.vectorStore && typeof this.vectorStore.initialize === 'function') {
            await this.vectorStore.initialize();
        }
        Logger.info('Memory system setup complete');
    }
    async getStatus() {
        Logger.info('Memory System Status:');
        console.log(`  Backend: ${this.config.backend}`);
        console.log(`  Model: ${this.config.embeddingModel}`);
        console.log(`  Namespace: ${this.currentNamespace}`);
    }
    async test() {
        Logger.info('Testing memory system...');
        const testText = 'hola mundo de prueba';
        const embedding = await embed(testText, 'text');
        const testId = 'test-doc-1';
        await this.vectorStore.upsert(this.currentNamespace, testId, embedding.vector, {
            text: testText,
            meta: {
                source: 'test',
                timestamp: Date.now()
            }
        });
        const results = await this.vectorStore.query(this.currentNamespace, embedding.vector, 3);
        console.log(`Query: "${testText}"`);
        console.log(`Results: ${results.length} found`);
        if (results.length > 0) {
            console.log(`Top result: "${results[0].text}" (score: ${results[0].score.toFixed(4)})`);
        }
        await this.vectorStore.deleteByIds(this.currentNamespace, [testId]);
        Logger.info('Test completed successfully');
    }
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=memory-manager.js.map