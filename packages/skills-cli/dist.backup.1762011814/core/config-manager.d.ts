/**
 * Secrets and Config Security Management
 * Applied with secrets-and-config skill - Template v1.1.0
 */
export interface SecretReference {
    name: string;
    source: 'env' | 'file' | 'vault' | 'aws' | 'azure' | 'gcp';
    path?: string;
    required: boolean;
    description?: string;
}
export interface SecurityConfig {
    encryptionEnabled: boolean;
    secretValidation: boolean;
    auditLogging: boolean;
    maxSecretAge: number;
    allowedSecretSources: string[];
}
export interface CliConfig {
    memory: {
        defaultBackend: 'inmemory' | 'qdrant' | 'pinecone';
        embeddingModel: string;
        defaultNamespace: string;
    };
    navigation: {
        mode: 'safe' | 'normal' | 'advanced';
        enableFallbacks: boolean;
        enableAutoRecovery: boolean;
        maxIntegrations: number;
    };
    safe: {
        componentTimeoutMs: number;
        maxFileSize: number;
        maxFilesToIndex: number;
    };
    paths: {
        projectRoot: string;
        configDir: string;
        stateDir: string;
        templatesDir: string;
    };
    security: SecurityConfig;
    secrets: {
        references: SecretReference[];
        encryptedValues: Record<string, string>;
    };
}
export declare class ConfigManager {
    private configPath;
    private config;
    constructor(configPath?: string);
    private loadConfig;
    private getDefaultConfig;
    private detectProjectRoot;
    get<K extends keyof CliConfig>(key: K): CliConfig[K];
    set<K extends keyof CliConfig>(key: K, value: CliConfig[K]): void;
    update<K extends keyof CliConfig>(key: K, updates: Partial<CliConfig[K]>): void;
    private saveConfig;
    getConfigPath(): string;
    getAllConfig(): CliConfig;
    reset(): void;
    validatePaths(): {
        valid: boolean;
        missing: string[];
    };
    /**
     * Secrets and Config Security Management Methods
     * Applied with secrets-and-config skill - Template v1.1.0
     */
    /**
     * Add secret reference without embedding the secret
     */
    addSecretReference(reference: SecretReference): void;
    /**
     * Get secret value from secure source
     */
    getSecretValue(name: string): Promise<string | null>;
    /**
     * Validate all secret references
     */
    validateSecrets(): Promise<{
        valid: boolean;
        missing: string[];
        invalid: string[];
    }>;
    /**
     * Remove secret reference
     */
    removeSecretReference(name: string): void;
    /**
     * Show security dashboard
     */
    showSecurityDashboard(): void;
    /**
     * Run security audit
     */
    runSecurityAudit(): Promise<{
        valid: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    /**
     * Private helper methods
     */
    private readSecretFromFile;
    private encryptSecret;
    private logSecurityEvent;
}
//# sourceMappingURL=config-manager.d.ts.map