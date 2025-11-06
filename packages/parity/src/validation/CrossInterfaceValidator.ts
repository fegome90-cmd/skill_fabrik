/**
 * Cross-Interface Validator
 *
 * Validates interface parity between CLI and editor implementations
 * to ensure consistent behavior across different interfaces.
 */

import { EventEmitter } from 'events';
import { InterfaceSchema, SchemaRegistry } from '../schemas/index.js';

export interface InterfaceDefinition {
  /** Interface identifier */
  id: string;

  /** Interface name */
  name: string;

  /** Interface type */
  type: 'cli' | 'editor' | 'shared';

  /** Interface version */
  version: string;

  /** Implementation details */
  implementation: {
    language: string;
    runtime: string;
    entryPoint: string;
    dependencies: string[];
  };

  /** Supported operations */
  operations: OperationDefinition[];

  /** Interface capabilities */
  capabilities: {
    inputFormats: string[];
    outputFormats: string[];
    features: string[];
    limitations: string[];
  };

  /** Test coverage information */
  testCoverage: {
    totalTests: number;
    coveredOperations: number;
    coveragePercentage: number;
    lastTestRun: Date;
  };

  /** Metadata */
  metadata: {
    description: string;
    createdAt: Date;
    updatedAt: Date;
    maintainers: string[];
    repository?: string;
    documentation?: string;
  };
}

export interface OperationDefinition {
  /** Operation identifier */
  id: string;

  /** Operation name */
  name: string;

  /** Operation description */
  description: string;

  /** Input schema reference */
  inputSchema: string;

  /** Output schema reference */
  outputSchema: string;

  /** Operation parameters */
  parameters: ParameterDefinition[];

  /** Operation examples */
  examples: OperationExample[];

  /** Implementation status */
  implementation: {
    implemented: boolean;
    tested: boolean;
    documented: boolean;
    deprecated: boolean;
    deprecationMessage?: string;
  };

  /** Performance characteristics */
  performance: {
    averageLatency?: number;
    maxLatency?: number;
    throughput?: number;
    memoryUsage?: number;
  };

  /** Error handling */
  errorHandling: {
    errorCodes: string[];
    retryPolicy?: string;
    fallbackBehavior?: string;
  };
}

export interface ParameterDefinition {
  /** Parameter name */
  name: string;

  /** Parameter type */
  type: string;

  /** Whether parameter is required */
  required: boolean;

  /** Default value */
  default?: any;

  /** Parameter description */
  description: string;

  /** Validation rules */
  validation?: {
    pattern?: string;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    enum?: any[];
  };
}

export interface OperationExample {
  /** Example description */
  description: string;

  /** Example input */
  input: any;

  /** Expected output */
  output: any;

  /** Example context */
  context?: Record<string, any>;

  /** Example tags */
  tags: string[];
}

export interface ValidationResult {
  /** Validation status */
  valid: boolean;

  /** Interface being validated */
  interfaceId: string;

  /** Validation type */
  validationType: 'schema' | 'operation' | 'behavior' | 'performance' | 'security';

  /** Validation details */
  details: {
    checkedItems: number;
    passedItems: number;
    failedItems: number;
    warnings: number;
  };

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: ValidationWarning[];

  /** Performance metrics */
  performance: {
    validationTime: number;
    memoryUsage: number;
    operationsTested: number;
  };

  /** Validation timestamp */
  validatedAt: Date;

  /** Validation environment */
  environment: {
    nodeVersion: string;
    platform: string;
    architecture: string;
  };
}

export interface ValidationError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error severity */
  severity: 'critical' | 'error' | 'warning';

  /** Affected component */
  component: string;

  /** Error location */
  location: {
    file?: string;
    line?: number;
    column?: number;
    operation?: string;
  };

  /** Suggested fix */
  suggestion?: string;

  /** Error context */
  context?: Record<string, any>;
}

export interface ValidationWarning {
  /** Warning code */
  code: string;

  /** Warning message */
  message: string;

  /** Warning component */
  component: string;

  /** Warning location */
  location: {
    operation?: string;
    parameter?: string;
  };

  /** Recommendation */
  recommendation?: string;
}

export interface ParityReport {
  /** Report metadata */
  metadata: {
    generatedAt: Date;
    environment: string;
    validationVersion: string;
  };

  /** Executive summary */
  summary: {
    totalInterfaces: number;
    compatibleInterfaces: number;
    incompatibleInterfaces: number;
    overallParityScore: number; // 0-100
    criticalIssues: number;
  };

  /** Interface-by-interface analysis */
  interfaces: {
    [interfaceId: string]: {
      interface: InterfaceDefinition;
      validationResult: ValidationResult;
      parityScore: number;
      compatibilityMatrix: {
        [otherInterfaceId: string]: {
          compatible: boolean;
          issues: string[];
          confidence: number;
        };
      };
    };
  };

  /** Cross-cutting concerns */
  crossCutting: {
    schemaConsistency: {
      consistent: boolean;
      issues: string[];
    };
    operationalParity: {
      consistent: boolean;
      missingOperations: Array<{
        operation: string;
        missingIn: string[];
      }>;
    };
    performanceParity: {
      withinThresholds: boolean;
      outliers: Array<{
        interface: string;
        metric: string;
        value: number;
        threshold: number;
      }>;
    };
  };

  /** Recommendations */
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'compatibility' | 'performance' | 'security' | 'documentation';
    description: string;
    affectedInterfaces: string[];
    estimatedEffort: string;
  }>;
}

export interface CrossValidationConfig {
  /** Validation strictness level */
  strictness: 'strict' | 'moderate' | 'lenient';

  /** Performance thresholds */
  performanceThresholds: {
    maxLatency: number;
    maxMemoryUsage: number;
    minThroughput: number;
  };

  /** Validation scope */
  scope: {
    validateSchemas: boolean;
    validateOperations: boolean;
    validateBehavior: boolean;
    validatePerformance: boolean;
    validateSecurity: boolean;
  };

  /** Comparison settings */
  comparison: {
    exactMatch: boolean;
    allowSuperset: boolean;
    ignoreOptionalFields: boolean;
    versionTolerance: number; // number of minor versions to tolerate
  };

  /** Reporting settings */
  reporting: {
    includeWarnings: boolean;
    includeRecommendations: boolean;
    includePerformanceMetrics: boolean;
    generateDetailedReport: boolean;
  };

  /** Cache settings */
  cache: {
    enabled: boolean;
    ttl: number; // time to live in milliseconds
    maxSize: number;
  };
}

/**
 * Validates cross-interface parity between CLI and editor implementations
 */
export class CrossInterfaceValidator extends EventEmitter {
  private config: CrossValidationConfig;
  private schemaRegistry: SchemaRegistry;
  private interfaces: Map<string, InterfaceDefinition> = new Map();
  private validationCache: Map<string, ValidationResult> = new Map();

  constructor(
    schemaRegistry: SchemaRegistry,
    config: Partial<CrossValidationConfig> = {}
  ) {
    super();

    this.schemaRegistry = schemaRegistry;
    this.config = {
      strictness: 'moderate',
      performanceThresholds: {
        maxLatency: 5000, // 5 seconds
        maxMemoryUsage: 512 * 1024 * 1024, // 512MB
        minThroughput: 10 // operations per second
      },
      scope: {
        validateSchemas: true,
        validateOperations: true,
        validateBehavior: true,
        validatePerformance: true,
        validateSecurity: false
      },
      comparison: {
        exactMatch: false,
        allowSuperset: true,
        ignoreOptionalFields: true,
        versionTolerance: 1
      },
      reporting: {
        includeWarnings: true,
        includeRecommendations: true,
        includePerformanceMetrics: true,
        generateDetailedReport: true
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 100
      },
      ...config
    };
  }

  /**
   * Register an interface for validation
   */
  public registerInterface(interfaceDef: InterfaceDefinition): void {
    this.interfaces.set(interfaceDef.id, interfaceDef);
    this.emit('interface-registered', { interfaceId: interfaceDef.id });
  }

  /**
   * Unregister an interface
   */
  public unregisterInterface(interfaceId: string): void {
    this.interfaces.delete(interfaceId);
    this.validationCache.delete(interfaceId);
    this.emit('interface-unregistered', { interfaceId });
  }

  /**
   * Validate a single interface
   */
  public async validateInterface(interfaceId: string): Promise<ValidationResult> {
    const interfaceDef = this.interfaces.get(interfaceId);
    if (!interfaceDef) {
      throw new Error(`Interface ${interfaceId} not found`);
    }

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.validationCache.get(interfaceId);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }
    }

    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checkedItems = 0;
    let passedItems = 0;
    let failedItems = 0;

    // Validate schemas
    if (this.config.scope.validateSchemas) {
      const schemaResult = await this.validateSchemas(interfaceDef);
      errors.push(...schemaResult.errors);
      warnings.push(...schemaResult.warnings);
      checkedItems += schemaResult.checkedItems;
      passedItems += schemaResult.passedItems;
      failedItems += schemaResult.failedItems;
    }

    // Validate operations
    if (this.config.scope.validateOperations) {
      const operationResult = await this.validateOperations(interfaceDef);
      errors.push(...operationResult.errors);
      warnings.push(...operationResult.warnings);
      checkedItems += operationResult.checkedItems;
      passedItems += operationResult.passedItems;
      failedItems += operationResult.failedItems;
    }

    // Validate behavior
    if (this.config.scope.validateBehavior) {
      const behaviorResult = await this.validateBehavior(interfaceDef);
      errors.push(...behaviorResult.errors);
      warnings.push(...behaviorResult.warnings);
      checkedItems += behaviorResult.checkedItems;
      passedItems += behaviorResult.passedItems;
      failedItems += behaviorResult.failedItems;
    }

    // Validate performance
    if (this.config.scope.validatePerformance) {
      const performanceResult = await this.validatePerformance(interfaceDef);
      errors.push(...performanceResult.errors);
      warnings.push(...performanceResult.warnings);
      checkedItems += performanceResult.checkedItems;
      passedItems += performanceResult.passedItems;
      failedItems += performanceResult.failedItems;
    }

    const validationTime = Date.now() - startTime;

    const result: ValidationResult = {
      valid: errors.length === 0,
      interfaceId,
      validationType: 'behavior', // Combined validation
      details: {
        checkedItems,
        passedItems,
        failedItems,
        warnings: warnings.length
      },
      errors,
      warnings,
      performance: {
        validationTime,
        memoryUsage: 0, // Would need actual memory measurement
        operationsTested: interfaceDef.operations.filter(op => op.implementation.tested).length
      },
      validatedAt: new Date(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      }
    };

    // Cache result
    if (this.config.cache.enabled) {
      this.validationCache.set(interfaceId, result);
    }

    this.emit('interface-validated', { interfaceId, result });

    return result;
  }

  /**
   * Validate cross-interface parity
   */
  public async validateParity(): Promise<ParityReport> {
    const startTime = Date.now();
    const interfaceIds = Array.from(this.interfaces.keys());

    // Validate all interfaces
    const validationResults = new Map<string, ValidationResult>();
    for (const interfaceId of interfaceIds) {
      try {
        const result = await this.validateInterface(interfaceId);
        validationResults.set(interfaceId, result);
      } catch (error) {
        this.emit('validation-error', { interfaceId, error });
      }
    }

    // Generate compatibility matrix
    const interfaces: ParityReport['interfaces'] = {};
    const compatibilityMatrix = this.generateCompatibilityMatrix(interfaceIds, validationResults);

    for (const [interfaceId, interfaceDef] of this.interfaces.entries()) {
      const validationResult = validationResults.get(interfaceId);
      const parityScore = this.calculateParityScore(interfaceDef, validationResult);

      interfaces[interfaceId] = {
        interface: interfaceDef,
        validationResult: validationResult || this.createEmptyResult(interfaceId),
        parityScore,
        compatibilityMatrix: compatibilityMatrix[interfaceId] || {}
      };
    }

    // Analyze cross-cutting concerns
    const crossCutting = this.analyzeCrossCuttingConcerns(interfaceIds, validationResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(interfaces, crossCutting);

    // Calculate summary metrics
    const totalInterfaces = interfaceIds.length;
    const compatibleInterfaces = Object.values(interfaces).filter(i => i.validationResult.valid).length;
    const incompatibleInterfaces = totalInterfaces - compatibleInterfaces;
    const overallParityScore = Object.values(interfaces).reduce((sum, i) => sum + i.parityScore, 0) / totalInterfaces;
    const criticalIssues = Object.values(interfaces).reduce((sum, i) =>
      sum + i.validationResult.errors.filter(e => e.severity === 'critical').length, 0);

    const report: ParityReport = {
      metadata: {
        generatedAt: new Date(),
        environment: `${process.platform}-${process.arch}`,
        validationVersion: '1.0.0'
      },
      summary: {
        totalInterfaces,
        compatibleInterfaces,
        incompatibleInterfaces,
        overallParityScore,
        criticalIssues
      },
      interfaces,
      crossCutting,
      recommendations
    };

    this.emit('parity-report-generated', { report, generationTime: Date.now() - startTime });

    return report;
  }

  /**
   * Compare two interfaces for compatibility
   */
  public async compareInterfaces(
    interfaceId1: string,
    interfaceId2: string
  ): Promise<{
    compatible: boolean;
    compatibilityScore: number;
    issues: Array<{
      type: 'schema' | 'operation' | 'performance' | 'behavior';
      severity: 'critical' | 'error' | 'warning';
      description: string;
      suggestion?: string;
    }>;
    recommendations: string[];
  }> {
    const [interface1, interface2] = [
      this.interfaces.get(interfaceId1),
      this.interfaces.get(interfaceId2)
    ];

    if (!interface1 || !interface2) {
      throw new Error('One or both interfaces not found');
    }

    const issues: any[] = [];
    let compatibilityScore = 100;

    // Compare operations
    const operations1 = new Map(interface1.operations.map(op => [op.id, op]));
    const operations2 = new Map(interface2.operations.map(op => [op.id, op]));

    // Check for missing operations
    for (const [opId, op] of operations1.entries()) {
      if (!operations2.has(opId)) {
        issues.push({
          type: 'operation',
          severity: 'error',
          description: `Operation ${opId} missing in ${interfaceId2}`,
          suggestion: `Implement ${opId} operation in ${interfaceId2}`
        });
        compatibilityScore -= 10;
      }
    }

    for (const [opId, op] of operations2.entries()) {
      if (!operations1.has(opId)) {
        issues.push({
          type: 'operation',
          severity: 'warning',
          description: `Operation ${opId} missing in ${interfaceId1}`,
          suggestion: `Consider implementing ${opId} operation in ${interfaceId1}`
        });
        compatibilityScore -= 5;
      }
    }

    // Compare common operations
    const commonOperations = Array.from(operations1.keys()).filter(id => operations2.has(id));
    for (const opId of commonOperations) {
      const op1 = operations1.get(opId)!;
      const op2 = operations2.get(opId)!;

      // Compare input/output schemas
      if (op1.inputSchema !== op2.inputSchema) {
        issues.push({
          type: 'schema',
          severity: 'error',
          description: `Input schema mismatch for operation ${opId}`,
          suggestion: 'Standardize input schemas across interfaces'
        });
        compatibilityScore -= 5;
      }

      if (op1.outputSchema !== op2.outputSchema) {
        issues.push({
          type: 'schema',
          severity: 'error',
          description: `Output schema mismatch for operation ${opId}`,
          suggestion: 'Standardize output schemas across interfaces'
        });
        compatibilityScore -= 5;
      }

      // Compare parameters
      const params1 = new Map(op1.parameters.map(p => [p.name, p]));
      const params2 = new Map(op2.parameters.map(p => [p.name, p]));

      for (const [paramName, param1] of params1.entries()) {
        const param2 = params2.get(paramName);
        if (!param2) {
          issues.push({
            type: 'operation',
            severity: 'warning',
            description: `Parameter ${paramName} missing in ${interfaceId2} for operation ${opId}`,
            suggestion: 'Add missing parameter or make it optional'
          });
          compatibilityScore -= 2;
        } else if (param1.type !== param2.type) {
          issues.push({
            type: 'operation',
            severity: 'error',
            description: `Parameter ${paramName} type mismatch for operation ${opId}`,
            suggestion: 'Align parameter types across interfaces'
          });
          compatibilityScore -= 3;
        }
      }
    }

    // Compare capabilities
    const capabilities1 = new Set(interface1.capabilities.features);
    const capabilities2 = new Set(interface2.capabilities.features);

    const missingCapabilities = Array.from(capabilities1).filter(cap => !capabilities2.has(cap));
    if (missingCapabilities.length > 0) {
      issues.push({
        type: 'behavior',
        severity: 'warning',
        description: `Missing capabilities in ${interfaceId2}: ${missingCapabilities.join(', ')}`,
        suggestion: 'Implement missing capabilities for full parity'
      });
      compatibilityScore -= missingCapabilities.length * 2;
    }

    // Generate recommendations
    const recommendations = issues
      .filter(issue => issue.suggestion)
      .map(issue => issue.suggestion!);

    const compatible = compatibilityScore >= 80 && issues.every(issue => issue.severity !== 'critical');

    return {
      compatible,
      compatibilityScore: Math.max(0, compatibilityScore),
      issues,
      recommendations
    };
  }

  /**
   * Get registered interfaces
   */
  public getInterfaces(): InterfaceDefinition[] {
    return Array.from(this.interfaces.values());
  }

  /**
   * Get validation cache statistics
   */
  public getCacheStatistics(): {
    size: number;
    hitRate: number;
    missRate: number;
    entries: Array<{
      interfaceId: string;
      timestamp: Date;
      valid: boolean;
    }>;
  } {
    return {
      size: this.validationCache.size,
      hitRate: 0, // Would need to track hits/misses
      missRate: 0,
      entries: Array.from(this.validationCache.entries()).map(([id, result]) => ({
        interfaceId: id,
        timestamp: result.validatedAt,
        valid: result.valid
      }))
    };
  }

  /**
   * Clear validation cache
   */
  public clearCache(): void {
    this.validationCache.clear();
    this.emit('cache-cleared');
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CrossValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }

  // Private methods

  private async validateSchemas(interfaceDef: InterfaceDefinition): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checkedItems: number;
    passedItems: number;
    failedItems: number;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checkedItems = 0;
    let passedItems = 0;
    let failedItems = 0;

    // Validate operation schemas
    for (const operation of interfaceDef.operations) {
      checkedItems++;

      // Check input schema exists
      if (!operation.inputSchema) {
        errors.push({
          code: 'MISSING_INPUT_SCHEMA',
          message: `Operation ${operation.id} missing input schema`,
          severity: 'error',
          component: 'schema',
          location: { operation: operation.id },
          suggestion: 'Define input schema for operation'
        });
        failedItems++;
        continue;
      }

      // Check output schema exists
      if (!operation.outputSchema) {
        errors.push({
          code: 'MISSING_OUTPUT_SCHEMA',
          message: `Operation ${operation.id} missing output schema`,
          severity: 'error',
          component: 'schema',
          location: { operation: operation.id },
          suggestion: 'Define output schema for operation'
        });
        failedItems++;
        continue;
      }

      // Validate schemas exist in registry
      try {
        const inputSchema = this.schemaRegistry.getSchema(operation.inputSchema);
        const outputSchema = this.schemaRegistry.getSchema(operation.outputSchema);

        if (!inputSchema) {
          errors.push({
            code: 'SCHEMA_NOT_FOUND',
            message: `Input schema ${operation.inputSchema} not found in registry`,
            severity: 'error',
            component: 'schema',
            location: { operation: operation.id },
            suggestion: 'Register schema in registry'
          });
          failedItems++;
        }

        if (!outputSchema) {
          errors.push({
            code: 'SCHEMA_NOT_FOUND',
            message: `Output schema ${operation.outputSchema} not found in registry`,
            severity: 'error',
            component: 'schema',
            location: { operation: operation.id },
            suggestion: 'Register schema in registry'
          });
          failedItems++;
        }

        if (inputSchema && outputSchema) {
          passedItems++;
        }
      } catch (error) {
        errors.push({
          code: 'SCHEMA_VALIDATION_ERROR',
          message: `Schema validation error for operation ${operation.id}: ${error.message}`,
          severity: 'error',
          component: 'schema',
          location: { operation: operation.id }
        });
        failedItems++;
      }
    }

    return { errors, warnings, checkedItems, passedItems, failedItems };
  }

  private async validateOperations(interfaceDef: InterfaceDefinition): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checkedItems: number;
    passedItems: number;
    failedItems: number;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checkedItems = 0;
    let passedItems = 0;
    let failedItems = 0;

    for (const operation of interfaceDef.operations) {
      checkedItems++;

      // Check implementation status
      if (!operation.implementation.implemented) {
        errors.push({
          code: 'OPERATION_NOT_IMPLEMENTED',
          message: `Operation ${operation.id} is not implemented`,
          severity: 'critical',
          component: 'operation',
          location: { operation: operation.id },
          suggestion: 'Implement operation'
        });
        failedItems++;
        continue;
      }

      // Check test coverage
      if (!operation.implementation.tested) {
        warnings.push({
          code: 'OPERATION_NOT_TESTED',
          message: `Operation ${operation.id} is not tested`,
          component: 'operation',
          location: { operation: operation.id },
          recommendation: 'Add tests for operation'
        });
      }

      // Check documentation
      if (!operation.implementation.documented) {
        warnings.push({
          code: 'OPERATION_NOT_DOCUMENTED',
          message: `Operation ${operation.id} is not documented`,
          component: 'operation',
          location: { operation: operation.id },
          recommendation: 'Add documentation for operation'
        });
      }

      // Check for examples
      if (!operation.examples || operation.examples.length === 0) {
        warnings.push({
          code: 'NO_EXAMPLES',
          message: `Operation ${operation.id} has no examples`,
          component: 'operation',
          location: { operation: operation.id },
          recommendation: 'Add usage examples for operation'
        });
      }

      // Check error handling
      if (!operation.errorHandling.errorCodes || operation.errorHandling.errorCodes.length === 0) {
        warnings.push({
          code: 'NO_ERROR_CODES',
          message: `Operation ${operation.id} has no error codes defined`,
          component: 'operation',
          location: { operation: operation.id },
          recommendation: 'Define error codes for operation'
        });
      }

      passedItems++;
    }

    return { errors, warnings, checkedItems, passedItems, failedItems };
  }

  private async validateBehavior(interfaceDef: InterfaceDefinition): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checkedItems: number;
    passedItems: number;
    failedItems: number;
  }> {
    // In a real implementation, this would run behavioral tests
    // For now, return placeholder result
    return {
      errors: [],
      warnings: [],
      checkedItems: interfaceDef.operations.length,
      passedItems: interfaceDef.operations.length,
      failedItems: 0
    };
  }

  private async validatePerformance(interfaceDef: InterfaceDefinition): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checkedItems: number;
    passedItems: number;
    failedItems: number;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checkedItems = 0;
    let passedItems = 0;
    let failedItems = 0;

    for (const operation of interfaceDef.operations) {
      if (!operation.performance) {
        continue; // Skip if no performance data
      }

      checkedItems++;

      // Check latency
      if (operation.performance.averageLatency !== undefined) {
        if (operation.performance.averageLatency > this.config.performanceThresholds.maxLatency) {
          errors.push({
            code: 'HIGH_LATENCY',
            message: `Operation ${operation.id} has high latency: ${operation.performance.averageLatency}ms`,
            severity: 'error',
            component: 'performance',
            location: { operation: operation.id },
            suggestion: 'Optimize operation performance'
          });
          failedItems++;
        } else {
          passedItems++;
        }
      }

      // Check memory usage
      if (operation.performance.memoryUsage !== undefined) {
        if (operation.performance.memoryUsage > this.config.performanceThresholds.maxMemoryUsage) {
          warnings.push({
            code: 'HIGH_MEMORY_USAGE',
            message: `Operation ${operation.id} has high memory usage: ${operation.performance.memoryUsage} bytes`,
            component: 'performance',
            location: { operation: operation.id },
            recommendation: 'Optimize memory usage'
          });
        }
      }

      // Check throughput
      if (operation.performance.throughput !== undefined) {
        if (operation.performance.throughput < this.config.performanceThresholds.minThroughput) {
          warnings.push({
            code: 'LOW_THROUGHPUT',
            message: `Operation ${operation.id} has low throughput: ${operation.performance.throughput} ops/sec`,
            component: 'performance',
            location: { operation: operation.id },
            recommendation: 'Improve operation throughput'
          });
        }
      }
    }

    return { errors, warnings, checkedItems, passedItems, failedItems };
  }

  private generateCompatibilityMatrix(
    interfaceIds: string[],
    validationResults: Map<string, ValidationResult>
  ): Record<string, Record<string, any>> {
    const matrix: Record<string, Record<string, any>> = {};

    for (const interfaceId of interfaceIds) {
      matrix[interfaceId] = {};

      for (const otherInterfaceId of interfaceIds) {
        if (interfaceId === otherInterfaceId) {
          continue;
        }

        // In a real implementation, this would compare interfaces
        // For now, use placeholder logic
        const result1 = validationResults.get(interfaceId);
        const result2 = validationResults.get(otherInterfaceId);

        matrix[interfaceId][otherInterfaceId] = {
          compatible: (result1?.valid || false) && (result2?.valid || false),
          issues: [],
          confidence: 0.8
        };
      }
    }

    return matrix;
  }

  private calculateParityScore(
    interfaceDef: InterfaceDefinition,
    validationResult?: ValidationResult
  ): number {
    if (!validationResult) {
      return 0;
    }

    let score = 100;

    // Deduct points for errors
    score -= validationResult.errors.length * 10;

    // Deduct points for warnings
    score -= validationResult.warnings.length * 2;

    // Bonus points for test coverage
    const testCoverage = interfaceDef.testCoverage.coveragePercentage;
    score += (testCoverage / 100) * 5;

    // Bonus points for implementation completeness
    const implementedOps = interfaceDef.operations.filter(op => op.implementation.implemented).length;
    const totalOps = interfaceDef.operations.length;
    const implementationRatio = implementedOps / totalOps;
    score += implementationRatio * 10;

    return Math.max(0, Math.min(100, score));
  }

  private analyzeCrossCuttingConcerns(
    interfaceIds: string[],
    validationResults: Map<string, ValidationResult>
  ): ParityReport['crossCutting'] {
    // Placeholder implementation
    return {
      schemaConsistency: {
        consistent: true,
        issues: []
      },
      operationalParity: {
        consistent: true,
        missingOperations: []
      },
      performanceParity: {
        withinThresholds: true,
        outliers: []
      }
    };
  }

  private generateRecommendations(
    interfaces: ParityReport['interfaces'],
    crossCutting: ParityReport['crossCutting']
  ): ParityReport['recommendations'] {
    const recommendations: ParityReport['recommendations'] = [];

    // Analyze each interface for issues
    for (const [interfaceId, data] of Object.entries(interfaces)) {
      if (!data.validationResult.valid) {
        recommendations.push({
          priority: 'high',
          category: 'compatibility',
          description: `Fix validation errors in interface ${interfaceId}`,
          affectedInterfaces: [interfaceId],
          estimatedEffort: '1-2 days'
        });
      }

      if (data.parityScore < 80) {
        recommendations.push({
          priority: 'medium',
          category: 'compatibility',
          description: `Improve parity score for interface ${interfaceId}`,
          affectedInterfaces: [interfaceId],
          estimatedEffort: '3-5 days'
        });
      }
    }

    // Add cross-cutting recommendations
    if (!crossCutting.schemaConsistency.consistent) {
      recommendations.push({
        priority: 'high',
        category: 'compatibility',
        description: 'Resolve schema consistency issues across interfaces',
        affectedInterfaces: Object.keys(interfaces),
        estimatedEffort: '2-3 days'
      });
    }

    return recommendations;
  }

  private isCacheValid(result: ValidationResult): boolean {
    const age = Date.now() - result.validatedAt.getTime();
    return age < this.config.cache.ttl;
  }

  private createEmptyResult(interfaceId: string): ValidationResult {
    return {
      valid: false,
      interfaceId,
      validationType: 'behavior',
      details: {
        checkedItems: 0,
        passedItems: 0,
        failedItems: 0,
        warnings: 0
      },
      errors: [{
        code: 'VALIDATION_FAILED',
        message: 'Validation could not be completed',
        severity: 'error',
        component: 'system'
      }],
      warnings: [],
      performance: {
        validationTime: 0,
        memoryUsage: 0,
        operationsTested: 0
      },
      validatedAt: new Date(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      }
    };
  }
}