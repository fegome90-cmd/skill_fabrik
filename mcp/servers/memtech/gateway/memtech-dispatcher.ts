/**
 * MEMTECH DISPATCHER - Orquestador de Consultas MCP
 * Ejecuta árbol de consultas basado en intents y políticas YAML
 */

import MemoryGuard, { MemoryContext } from './memory-guard';

interface IntentStep {
  call: string;
  with?: any;
  if?: string;
  hard_gate?: string;
  branch?: {
    when: string;
    then: IntentStep[];
    else?: IntentStep[];
  };
}

interface IntentConfig {
  match: string[];
  steps: IntentStep[];
}

interface PolicyConfig {
  version: number;
  defaults: {
    mcp_timeout_ms: number;
    max_steps: number;
    hard_block_if_memory_offline: boolean;
    checkpoint_on_start: boolean;
    circuit_breaker: {
      max_failures: number;
      reset_timeout_ms: number;
    };
  };
  intents: Record<string, IntentConfig>;
}

export class MemTechDispatcher {
  private guard: MemoryGuard;
  private policies: PolicyConfig;
  private logs: any[] = [];

  constructor(policies: PolicyConfig) {
    this.policies = policies;
    this.guard = new MemoryGuard(policies.defaults);
  }

  /**
   * EJECUTAR COMANDO /memtech con amarre obligatorio
   */
  async executeMemtechCommand(input: string): Promise<any> {
    const runId = this.generateRunId();
    const startTime = Date.now();

    try {
      // 1. ENFORCE MEMORY CONTEXT (amarre obligatorio)
      const memoryContext = await this.guard.enforceMemoryContext(input);

      // 2. CLASSIFY INTENT
      const intent = await this.classifyIntent(input);

      // 3. EXECUTE INTENT STEPS
      const results = await this.executeIntentSteps(intent, input, memoryContext);

      // 4. LOG SUCCESS
      this.logExecution(runId, input, intent, results, 'success', Date.now() - startTime);

      return {
        success: true,
        intent,
        memoryContext,
        results,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      // 5. LOG FAILURE
      this.logExecution(
        runId,
        input,
        'unknown',
        null,
        'error',
        Date.now() - startTime,
        error.message
      );

      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * CLASSIFY INTENT - Routing asistido por LLM
   */
  private async classifyIntent(input: string): Promise<string> {
    const rules = {
      'analyze.grafana': /(grafana|dashboard|panel|no data|métricas)/i,
      'dedupe.existence_check': /(ya existe|duplicado|repetido|ya está|crear.*adr)/i,
      'memory.health': /(memoria|redis|qdrant|postgres|health|conexión)/i,
      'analyze.postgresql': /(postgresql|postgres|base de datos|actividad|transacciones)/i,
      'analyze.memtech': /(memtech|memoria jerárquica|L0|L1|L2|L3)/i,
    };

    // Match por regex primero
    for (const [intent, regex] of Object.entries(rules)) {
      if (regex.test(input)) {
        return intent;
      }
    }

    // Fallback: buscar en políticas
    for (const [intent, config] of Object.entries(this.policies.intents)) {
      for (const pattern of config.match) {
        if (new RegExp(pattern, 'i').test(input)) {
          return intent;
        }
      }
    }

    return 'analyze.general';
  }

  /**
   * EXECUTE INTENT STEPS - Árbol de consultas
   */
  private async executeIntentSteps(
    intent: string,
    input: string,
    memoryContext: MemoryContext
  ): Promise<any> {
    const intentConfig = this.policies.intents[intent];
    if (!intentConfig) {
      throw new Error(`Intent '${intent}' not configured`);
    }

    const results: any = {};
    const maxSteps = this.policies.defaults.max_steps;
    let stepCount = 0;

    for (const step of intentConfig.steps) {
      if (stepCount >= maxSteps) {
        throw new Error(`Max steps (${maxSteps}) exceeded`);
      }

      try {
        // Check conditional execution
        if (step.if && !this.evaluateCondition(step.if, results)) {
          continue;
        }

        // Execute step
        const stepResult = await this.executeStep(step, input, memoryContext, results);
        results[step.call] = stepResult;

        // Check hard gate
        if (step.hard_gate && !this.evaluateCondition(step.hard_gate, results)) {
          throw new Error(`Hard gate failed: ${step.hard_gate}`);
        }

        // Handle branch
        if (step.branch) {
          const branchCondition = this.evaluateCondition(step.branch.when, results);
          const branchSteps = branchCondition ? step.branch.then : step.branch.else;

          if (branchSteps) {
            for (const branchStep of branchSteps) {
              const branchResult = await this.executeStep(
                branchStep,
                input,
                memoryContext,
                results
              );
              results[branchStep.call] = branchResult;
            }
          }
        }

        stepCount++;
      } catch (error) {
        console.error(`Step ${step.call} failed:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * EXECUTE SINGLE STEP
   */
  private async executeStep(
    step: IntentStep,
    input: string,
    memoryContext: MemoryContext,
    results: any
  ): Promise<any> {
    const params = this.interpolateParams(step.with || {}, input, memoryContext, results);

    // Simular llamada MCP (reemplazar con implementación real)
    return await this.simulateMCPCall(step.call, params);
  }

  /**
   * INTERPOLATE PARAMETERS
   */
  private interpolateParams(
    params: any,
    input: string,
    memoryContext: MemoryContext,
    results: any
  ): any {
    const interpolated = JSON.parse(JSON.stringify(params));

    // Replace ${input}
    const inputRegex = /\$\{input\}/g;
    const inputStr = JSON.stringify(interpolated);
    const inputReplaced = inputStr.replace(inputRegex, JSON.stringify(input));

    // Replace ${result.X}
    const resultRegex = /\$\{result\.([^}]+)\}/g;
    const resultReplaced = inputReplaced.replace(resultRegex, (match, path) => {
      const value = this.getNestedValue(results, path);
      return JSON.stringify(value);
    });

    return JSON.parse(resultReplaced);
  }

  /**
   * EVALUATE CONDITION
   */
  private evaluateCondition(condition: string, results: any): boolean {
    try {
      // Simple condition evaluation (extend as needed)
      const conditionRegex = /\$\{result\.([^}]+)\}/g;
      let evaluated = condition;

      evaluated = evaluated.replace(conditionRegex, (match, path) => {
        const value = this.getNestedValue(results, path);
        return JSON.stringify(value);
      });

      // Replace common operators
      evaluated = evaluated.replace(/===/g, '==');
      evaluated = evaluated.replace(/!==/g, '!=');

      return eval(evaluated);
    } catch (error) {
      console.warn('Condition evaluation failed:', condition, error);
      return false;
    }
  }

  /**
   * GET NESTED VALUE
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * MCP CALL usando gateway real
   */
  private async mcpCall(tool: string, params: any): Promise<any> {
    try {
      const { getMCPGateway } = await import('./mcp-gateway.js');
      const gateway = getMCPGateway();
      const result = await gateway.mcpCall(tool, params);

      if (!result.success) {
        throw new Error(result.error || 'MCP call failed');
      }

      return result.data;
    } catch (error) {
      console.error(`MCP call failed for ${tool}:`, error);
      throw error;
    }
  }

  /**
   * LOG EXECUTION
   */
  private logExecution(
    runId: string,
    input: string,
    intent: string,
    results: any,
    status: string,
    duration: number,
    error?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      runId,
      input,
      intent,
      status,
      duration,
      error,
      results: results ? Object.keys(results) : [],
    };

    this.logs.push(logEntry);
    console.log(`[MemTech] ${status.toUpperCase()}: ${intent} (${duration}ms)`, logEntry);
  }

  private generateRunId(): string {
    return `memtech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * GET LOGS
   */
  getLogs(): any[] {
    return this.logs;
  }
}

export default MemTechDispatcher;
