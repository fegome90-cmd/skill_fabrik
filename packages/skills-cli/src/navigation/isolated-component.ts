import { SAFE_MODE_CONFIG } from '../core/safe-mode.js';

export class IsolatedComponent {
  private componentName: string;
  private isHealthy: boolean = true;
  private errorCount: number = 0;
  private maxErrors: number;

  constructor(name: string) {
    this.componentName = name;
    this.maxErrors = SAFE_MODE_CONFIG.componentMaxErrors;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.isHealthy) {
      throw new Error(`Component ${this.componentName} is unhealthy`);
    }

    try {
      const result = await this.withTimeout(operation, SAFE_MODE_CONFIG.componentTimeoutMs);
      this.resetErrorCount();
      return result;
    } catch (error) {
      this.incrementErrorCount();
      throw error;
    }
  }

  private incrementErrorCount(): void {
    this.errorCount++;
    if (this.errorCount >= this.maxErrors) {
      this.isHealthy = false;
    }
  }

  private resetErrorCount(): void {
    if (this.errorCount > 0) {
      this.errorCount = 0;
      if (!this.isHealthy) {
        this.isHealthy = true;
      }
    }
  }

  private async withTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      )
    ]);
  }

  get healthStatus(): boolean {
    return this.isHealthy;
  }
}
