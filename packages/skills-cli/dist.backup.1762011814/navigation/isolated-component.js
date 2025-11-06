import { SAFE_MODE_CONFIG } from '../core/safe-mode.js';
export class IsolatedComponent {
    componentName;
    isHealthy = true;
    errorCount = 0;
    maxErrors;
    constructor(name) {
        this.componentName = name;
        this.maxErrors = SAFE_MODE_CONFIG.componentMaxErrors;
    }
    async execute(operation) {
        if (!this.isHealthy) {
            throw new Error(`Component ${this.componentName} is unhealthy`);
        }
        try {
            const result = await this.withTimeout(operation, SAFE_MODE_CONFIG.componentTimeoutMs);
            this.resetErrorCount();
            return result;
        }
        catch (error) {
            this.incrementErrorCount();
            throw error;
        }
    }
    incrementErrorCount() {
        this.errorCount++;
        if (this.errorCount >= this.maxErrors) {
            this.isHealthy = false;
        }
    }
    resetErrorCount() {
        if (this.errorCount > 0) {
            this.errorCount = 0;
            if (!this.isHealthy) {
                this.isHealthy = true;
            }
        }
    }
    async withTimeout(operation, timeoutMs) {
        return Promise.race([
            operation(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), timeoutMs))
        ]);
    }
    get healthStatus() {
        return this.isHealthy;
    }
}
//# sourceMappingURL=isolated-component.js.map