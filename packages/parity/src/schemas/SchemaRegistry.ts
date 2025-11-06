/**
 * Schema Registry
 *
 * Manages frozen schemas for interface parity between CLI and editor
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { hash } from 'crypto';

export interface InterfaceSchema {
  /** Unique schema identifier */
  id: string;

  /** Schema name */
  name: string;

  /** Schema version */
  version: string;

  /** Interface type */
  interfaceType: 'cli' | 'editor' | 'shared';

  /** Schema definition */
  definition: {
    properties: Record<string, PropertyDefinition>;
    required?: string[];
    additionalProperties?: boolean;
  };

  /** Validation rules */
  validation: {
    strict: boolean;
    allowUnknown: boolean;
    stripUnknown: boolean;
  };

  /** Metadata */
  metadata: {
    description: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
    deprecated: boolean;
    deprecationMessage?: string;
  };

  /** Compatibility matrix */
  compatibility: {
    minVersion: string;
    maxVersion?: string;
    compatibleVersions: string[];
    breakingChanges: string[];
  };

  /** Checksum for integrity verification */
  checksum: string;
}

export interface PropertyDefinition {
  /** Property type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

  /** Whether property is required */
  required?: boolean;

  /** Default value */
  default?: any;

  /** Allowed values (for enum-like properties) */
  enum?: any[];

  /** Property format (for strings) */
  format?: string;

  /** Minimum/maximum values (for numbers) */
  minimum?: number;
  maximum?: number;

  /** Minimum/maximum length (for strings/arrays) */
  minLength?: number;
  maxLength?: number;

  /** Pattern (regex for strings) */
  pattern?: string;

  /** Nested schema (for objects) */
  properties?: Record<string, PropertyDefinition>;

  /** Item schema (for arrays) */
  items?: PropertyDefinition;

  /** Whether property is read-only */
  readOnly?: boolean;

  /** Whether property is write-only */
  writeOnly?: boolean;

  /** Property description */
  description?: string;

  /** Property examples */
  examples?: any[];
}

export interface SchemaValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: ValidationWarning[];

  /** Normalized data */
  normalized?: any;

  /** Validation timestamp */
  validatedAt: Date;
}

export interface ValidationError {
  /** Error path */
  path: string;

  /** Error message */
  message: string;

  /** Error code */
  code: string;

  /** Error severity */
  severity: 'error' | 'warning';

  /** Invalid value */
  value?: any;

  /** Expected value/type */
  expected?: any;
}

export interface ValidationWarning {
  /** Warning path */
  path: string;

  /** Warning message */
  message: string;

  /** Warning code */
  code: string;

  /** Warning value */
  value?: any;
}

export interface SchemaRegistryConfig {
  /** Registry storage path */
  storagePath: string;

  /** Enable schema versioning */
  enableVersioning: boolean;

  /** Enable schema validation */
  enableValidation: boolean;

  /** Enable compatibility checking */
  enableCompatibilityChecking: boolean;

  /** Auto-freeze schemas */
  autoFreeze: boolean;

  /** Strict validation mode */
  strictValidation: boolean;

  /** Cache compiled schemas */
  cacheCompiledSchemas: boolean;

  /** Schema retention policy */
  retention: {
    maxVersions: number;
    retentionPeriod: number; // ms
  };
}

/**
 * Registry for managing interface schemas with versioning and validation
 */
export class SchemaRegistry extends EventEmitter {
  private config: SchemaRegistryConfig;
  private schemas: Map<string, InterfaceSchema> = new Map();
  private compiledSchemas: Map<string, any> = new Map();
  private storagePath: string;

  constructor(config: Partial<SchemaRegistryConfig> = {}) {
    super();

    this.config = {
      storagePath: './schemas',
      enableVersioning: true,
      enableValidation: true,
      enableCompatibilityChecking: true,
      autoFreeze: true,
      strictValidation: true,
      cacheCompiledSchemas: true,
      retention: {
        maxVersions: 10,
        retentionPeriod: 90 * 24 * 60 * 60 * 1000 // 90 days
      },
      ...config
    };

    this.storagePath = this.config.storagePath;
    this.ensureStorageDirectory();
    this.loadSchemas();
  }

  /**
   * Register a new schema
   */
  public async registerSchema(schema: Omit<InterfaceSchema, 'id' | 'checksum' | 'metadata'>): Promise<InterfaceSchema> {
    const now = new Date();
    const schemaId = this.generateSchemaId(schema.name, schema.version);

    // Check if schema already exists
    if (this.schemas.has(schemaId)) {
      throw new Error(`Schema ${schemaId} already exists`);
    }

    // Validate schema definition
    if (this.config.enableValidation) {
      this.validateSchemaDefinition(schema);
    }

    // Create complete schema
    const completeSchema: InterfaceSchema = {
      ...schema,
      id: schemaId,
      checksum: this.calculateChecksum(schema),
      metadata: {
        description: schema.name,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        tags: [],
        deprecated: false
      }
    };

    // Store schema
    this.schemas.set(schemaId, completeSchema);

    // Compile schema if caching is enabled
    if (this.config.cacheCompiledSchemas) {
      this.compileSchema(completeSchema);
    }

    // Save to disk
    await this.saveSchema(completeSchema);

    // Emit event
    this.emit('schema-registered', { schema: completeSchema });

    return completeSchema;
  }

  /**
   * Update an existing schema
   */
  public async updateSchema(
    schemaId: string,
    updates: Partial<InterfaceSchema>
  ): Promise<InterfaceSchema> {
    const existingSchema = this.schemas.get(schemaId);
    if (!existingSchema) {
      throw new Error(`Schema ${schemaId} not found`);
    }

    // Create new version if versioning is enabled
    const newVersion = this.config.enableVersioning
      ? this.incrementVersion(existingSchema.version)
      : existingSchema.version;

    const updatedSchema: InterfaceSchema = {
      ...existingSchema,
      ...updates,
      id: this.generateSchemaId(existingSchema.name, newVersion),
      version: newVersion,
      checksum: this.calculateChecksum({ ...existingSchema, ...updates }),
      metadata: {
        ...existingSchema.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    };

    // Analyze breaking changes
    const breakingChanges = this.analyzeBreakingChanges(existingSchema, updatedSchema);
    updatedSchema.compatibility.breakingChanges = breakingChanges;

    // Validate updated schema
    if (this.config.enableValidation) {
      this.validateSchemaDefinition(updatedSchema);
    }

    // Store updated schema
    this.schemas.set(updatedSchema.id, updatedSchema);

    // Update compatibility matrix
    this.updateCompatibilityMatrix(existingSchema, updatedSchema);

    // Save to disk
    await this.saveSchema(updatedSchema);

    // Clean up old versions if needed
    await this.cleanupOldVersions(existingSchema.name);

    // Emit event
    this.emit('schema-updated', {
      oldSchema: existingSchema,
      newSchema: updatedSchema,
      breakingChanges
    });

    return updatedSchema;
  }

  /**
   * Get schema by ID
   */
  public getSchema(schemaId: string): InterfaceSchema | null {
    return this.schemas.get(schemaId) || null;
  }

  /**
   * Get schemas by name
   */
  public getSchemasByName(name: string): InterfaceSchema[] {
    return Array.from(this.schemas.values())
      .filter(schema => schema.name === name)
      .sort((a, b) => this.compareVersions(b.version, a.version));
  }

  /**
   * Get latest schema for a name
   */
  public getLatestSchema(name: string): InterfaceSchema | null {
    const schemas = this.getSchemasByName(name);
    return schemas.length > 0 ? schemas[0] : null;
  }

  /**
   * Get schemas by interface type
   */
  public getSchemasByType(interfaceType: InterfaceSchema['interfaceType']): InterfaceSchema[] {
    return Array.from(this.schemas.values())
      .filter(schema => schema.interfaceType === interfaceType);
  }

  /**
   * Validate data against a schema
   */
  public validate(
    schemaId: string,
    data: any,
    options: {
      strict?: boolean;
      allowUnknown?: boolean;
      stripUnknown?: boolean;
    } = {}
  ): SchemaValidationResult {
    const schema = this.schemas.get(schemaId);
    if (!schema) {
      throw new Error(`Schema ${schemaId} not found`);
    }

    const validationOptions = {
      strict: options.strict ?? this.config.strictValidation,
      allowUnknown: options.allowUnknown ?? !schema.validation.strict,
      stripUnknown: options.stripUnknown ?? schema.validation.stripUnknown
    };

    const result = this.performValidation(schema, data, validationOptions);

    // Emit validation event
    this.emit('validation-completed', {
      schemaId,
      valid: result.valid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length
    });

    return result;
  }

  /**
   * Check compatibility between schemas
   */
  public checkCompatibility(
    fromSchemaId: string,
    toSchemaId: string
  ): {
    compatible: boolean;
    breakingChanges: string[];
    warnings: string[];
    migrationRequired: boolean;
  } {
    const fromSchema = this.schemas.get(fromSchemaId);
    const toSchema = this.schemas.get(toSchemaId);

    if (!fromSchema || !toSchema) {
      throw new Error('One or both schemas not found');
    }

    const breakingChanges = this.analyzeBreakingChanges(fromSchema, toSchema);
    const warnings = this.analyzeCompatibilityWarnings(fromSchema, toSchema);
    const compatible = breakingChanges.length === 0;
    const migrationRequired = breakingChanges.length > 0 || warnings.length > 0;

    return {
      compatible,
      breakingChanges,
      warnings,
      migrationRequired
    };
  }

  /**
   * Generate migration script
   */
  public generateMigration(
    fromSchemaId: string,
    toSchemaId: string
  ): {
    script: string;
    steps: string[];
    requiresManualIntervention: boolean;
  } {
    const compatibility = this.checkCompatibility(fromSchemaId, toSchemaId);

    const steps: string[] = [];
    let script = '// Migration Script\n\n';
    let requiresManualIntervention = false;

    if (!compatibility.compatible) {
      script += '// Breaking changes detected\n';

      compatibility.breakingChanges.forEach(change => {
        steps.push(`Handle breaking change: ${change}`);
        script += `// TODO: ${change}\n`;
      });

      if (compatibility.breakingChanges.some(change =>
        change.includes('type') || change.includes('required')
      )) {
        requiresManualIntervention = true;
      }
    }

    if (compatibility.warnings.length > 0) {
      script += '\n// Warnings\n';
      compatibility.warnings.forEach(warning => {
        steps.push(`Review warning: ${warning}`);
        script += `// WARNING: ${warning}\n`;
      });
    }

    script += '\nexport const migration = {\n';
    script += '  version: "' + toSchemaId + '",\n';
    script += '  steps: ' + JSON.stringify(steps, null, 2) + ',\n';
    script += '  requiresManualIntervention: ' + requiresManualIntervention + '\n';
    script += '};\n';

    return {
      script,
      steps,
      requiresManualIntervention
    };
  }

  /**
   * Freeze a schema (prevent further modifications)
   */
  public freezeSchema(schemaId: string): void {
    const schema = this.schemas.get(schemaId);
    if (!schema) {
      throw new Error(`Schema ${schemaId} not found`);
    }

    if (schema.metadata.deprecated) {
      throw new Error(`Cannot freeze deprecated schema ${schemaId}`);
    }

    // In a real implementation, this would set a frozen flag
    // and prevent further modifications
    this.emit('schema-frozen', { schemaId });
  }

  /**
   * Deprecate a schema
   */
  public deprecateSchema(schemaId: string, message?: string): void {
    const schema = this.schemas.get(schemaId);
    if (!schema) {
      throw new Error(`Schema ${schemaId} not found`);
    }

    schema.metadata.deprecated = true;
    schema.metadata.deprecationMessage = message || 'Schema deprecated';

    this.saveSchema(schema);
    this.emit('schema-deprecated', { schemaId, message });
  }

  /**
   * Get registry statistics
   */
  public getStatistics(): {
    totalSchemas: number;
    schemasByType: Record<string, number>;
    schemasByVersion: Record<string, number>;
    deprecatedSchemas: number;
    latestVersions: number;
  } {
    const schemas = Array.from(this.schemas.values());

    const schemasByType = schemas.reduce((acc, schema) => {
      acc[schema.interfaceType] = (acc[schema.interfaceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const schemasByVersion = schemas.reduce((acc, schema) => {
      const majorVersion = schema.version.split('.')[0];
      acc[majorVersion] = (acc[majorVersion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const deprecatedSchemas = schemas.filter(s => s.metadata.deprecated).length;
    const latestVersions = new Set(schemas.map(s => s.name)).size;

    return {
      totalSchemas: schemas.length,
      schemasByType,
      schemasByVersion,
      deprecatedSchemas,
      latestVersions
    };
  }

  /**
   * Export schemas
   */
  public exportSchemas(filter?: {
    type?: InterfaceSchema['interfaceType'];
    name?: string;
    version?: string;
    includeDeprecated?: boolean;
  }): InterfaceSchema[] {
    let schemas = Array.from(this.schemas.values());

    if (filter) {
      if (filter.type) {
        schemas = schemas.filter(s => s.interfaceType === filter.type);
      }
      if (filter.name) {
        schemas = schemas.filter(s => s.name === filter.name);
      }
      if (filter.version) {
        schemas = schemas.filter(s => s.version === filter.version);
      }
      if (!filter.includeDeprecated) {
        schemas = schemas.filter(s => !s.metadata.deprecated);
      }
    }

    return schemas;
  }

  /**
   * Import schemas
   */
  public async importSchemas(schemas: InterfaceSchema[]): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const schema of schemas) {
      try {
        // Check if schema already exists
        if (this.schemas.has(schema.id)) {
          skipped++;
          continue;
        }

        // Validate schema
        if (this.config.enableValidation) {
          this.validateSchemaDefinition(schema);
        }

        // Store schema
        this.schemas.set(schema.id, schema);
        await this.saveSchema(schema);
        imported++;
      } catch (error) {
        errors.push(`Failed to import schema ${schema.id}: ${error.message}`);
      }
    }

    this.emit('schemas-imported', { imported, skipped, errors });

    return { imported, skipped, errors };
  }

  // Private methods

  private generateSchemaId(name: string, version: string): string {
    return `${name}@${version}`;
  }

  private calculateChecksum(schema: any): string {
    const schemaString = JSON.stringify(schema, Object.keys(schema).sort());
    return hash('sha256').update(schemaString).digest('hex');
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0');
    parts[2] = (patch + 1).toString();
    return parts.join('.');
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }

    return 0;
  }

  private validateSchemaDefinition(schema: InterfaceSchema): void {
    // Basic validation logic
    if (!schema.name || schema.name.trim() === '') {
      throw new Error('Schema name is required');
    }

    if (!schema.version || !/^\d+\.\d+\.\d+$/.test(schema.version)) {
      throw new Error('Invalid version format (expected x.y.z)');
    }

    if (!schema.definition || !schema.definition.properties) {
      throw new Error('Schema definition with properties is required');
    }

    // Validate property definitions
    this.validateProperties(schema.definition.properties);
  }

  private validateProperties(properties: Record<string, PropertyDefinition>, path = ''): void {
    for (const [propName, propDef] of Object.entries(properties)) {
      const currentPath = path ? `${path}.${propName}` : propName;

      if (!propDef.type) {
        throw new Error(`Property ${currentPath} must have a type`);
      }

      if (propDef.type === 'object' && propDef.properties) {
        this.validateProperties(propDef.properties, currentPath);
      }

      if (propDef.type === 'array' && propDef.items) {
        if (propDef.items.type === 'object' && propDef.items.properties) {
          this.validateProperties(propDef.items.properties, `${currentPath}[]`);
        }
      }
    }
  }

  private performValidation(
    schema: InterfaceSchema,
    data: any,
    options: any
  ): SchemaValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Simple validation implementation
    // In a real implementation, this would use a proper validation library
    this.validateObject(schema.definition.properties, data, '', errors, warnings, options);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date()
    };
  }

  private validateObject(
    properties: Record<string, PropertyDefinition>,
    data: any,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    options: any
  ): void {
    if (typeof data !== 'object' || data === null) {
      errors.push({
        path,
        message: 'Expected object',
        code: 'INVALID_TYPE',
        severity: 'error',
        value: data,
        expected: 'object'
      });
      return;
    }

    for (const [propName, propDef] of Object.entries(properties)) {
      const currentPath = path ? `${path}.${propName}` : propName;
      const value = data[propName];

      if (value === undefined) {
        if (propDef.required) {
          errors.push({
            path: currentPath,
            message: 'Required property is missing',
            code: 'REQUIRED_PROPERTY_MISSING',
            severity: 'error'
          });
        }
        continue;
      }

      this.validateProperty(propDef, value, currentPath, errors, warnings);
    }

    // Check for unknown properties
    if (!options.allowUnknown) {
      for (const propName of Object.keys(data)) {
        if (!properties[propName]) {
          warnings.push({
            path: path ? `${path}.${propName}` : propName,
            message: 'Unknown property',
            code: 'UNKNOWN_PROPERTY',
            value: data[propName]
          });
        }
      }
    }
  }

  private validateProperty(
    propDef: PropertyDefinition,
    value: any,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Type validation
    if (!this.validateType(propDef.type, value)) {
      errors.push({
        path,
        message: `Invalid type, expected ${propDef.type}`,
        code: 'INVALID_TYPE',
        severity: 'error',
        value,
        expected: propDef.type
      });
      return;
    }

    // Enum validation
    if (propDef.enum && !propDef.enum.includes(value)) {
      errors.push({
        path,
        message: `Invalid value, expected one of: ${propDef.enum.join(', ')}`,
        code: 'INVALID_ENUM_VALUE',
        severity: 'error',
        value,
        expected: propDef.enum
      });
    }

    // Range validation for numbers
    if (typeof value === 'number') {
      if (propDef.minimum !== undefined && value < propDef.minimum) {
        errors.push({
          path,
          message: `Value ${value} is less than minimum ${propDef.minimum}`,
          code: 'MINIMUM_VIOLATION',
          severity: 'error',
          value,
          expected: `>= ${propDef.minimum}`
        });
      }

      if (propDef.maximum !== undefined && value > propDef.maximum) {
        errors.push({
          path,
          message: `Value ${value} is greater than maximum ${propDef.maximum}`,
          code: 'MAXIMUM_VIOLATION',
          severity: 'error',
          value,
          expected: `<= ${propDef.maximum}`
        });
      }
    }

    // Length validation for strings and arrays
    if (typeof value === 'string' || Array.isArray(value)) {
      const length = value.length;

      if (propDef.minLength !== undefined && length < propDef.minLength) {
        errors.push({
          path,
          message: `Length ${length} is less than minimum ${propDef.minLength}`,
          code: 'MIN_LENGTH_VIOLATION',
          severity: 'error',
          value,
          expected: `length >= ${propDef.minLength}`
        });
      }

      if (propDef.maxLength !== undefined && length > propDef.maxLength) {
        errors.push({
          path,
          message: `Length ${length} is greater than maximum ${propDef.maxLength}`,
          code: 'MAX_LENGTH_VIOLATION',
          severity: 'error',
          value,
          expected: `length <= ${propDef.maxLength}`
        });
      }
    }

    // Pattern validation for strings
    if (typeof value === 'string' && propDef.pattern) {
      const regex = new RegExp(propDef.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String does not match pattern: ${propDef.pattern}`,
          code: 'PATTERN_VIOLATION',
          severity: 'error',
          value,
          expected: propDef.pattern
        });
      }
    }

    // Nested object validation
    if (propDef.type === 'object' && propDef.properties && typeof value === 'object') {
      this.validateObject(propDef.properties, value, path, errors, warnings, {});
    }

    // Array item validation
    if (propDef.type === 'array' && propDef.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        this.validateProperty(propDef.items!, item, `${path}[${index}]`, errors, warnings);
      });
    }
  }

  private validateType(expectedType: string, value: any): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return false;
    }
  }

  private analyzeBreakingChanges(
    fromSchema: InterfaceSchema,
    toSchema: InterfaceSchema
  ): string[] {
    const breakingChanges: string[] = [];

    // Check for removed properties
    const fromProps = Object.keys(fromSchema.definition.properties);
    const toProps = Object.keys(toSchema.definition.properties);

    fromProps.forEach(prop => {
      if (!toProps.includes(prop)) {
        breakingChanges.push(`Property '${prop}' was removed`);
      }
    });

    // Check for type changes
    toProps.forEach(prop => {
      if (fromProps.includes(prop)) {
        const fromType = fromSchema.definition.properties[prop].type;
        const toType = toSchema.definition.properties[prop].type;

        if (fromType !== toType) {
          breakingChanges.push(`Property '${prop}' type changed from ${fromType} to ${toType}`);
        }
      }
    });

    // Check for new required properties
    const fromRequired = fromSchema.definition.required || [];
    const toRequired = toSchema.definition.required || [];

    toRequired.forEach(prop => {
      if (!fromRequired.includes(prop)) {
        breakingChanges.push(`Property '${prop}' became required`);
      }
    });

    return breakingChanges;
  }

  private analyzeCompatibilityWarnings(
    fromSchema: InterfaceSchema,
    toSchema: InterfaceSchema
  ): string[] {
    const warnings: string[] = [];

    // Check for new optional properties
    const fromProps = Object.keys(fromSchema.definition.properties);
    const toProps = Object.keys(toSchema.definition.properties);

    toProps.forEach(prop => {
      if (!fromProps.includes(prop)) {
        warnings.push(`New optional property '${prop}' added`);
      }
    });

    return warnings;
  }

  private updateCompatibilityMatrix(
    oldSchema: InterfaceSchema,
    newSchema: InterfaceSchema
  ): void {
    // Update compatibility matrix for the new schema
    newSchema.compatibility.minVersion = oldSchema.version;
    newSchema.compatibility.compatibleVersions.push(oldSchema.version);
  }

  private compileSchema(schema: InterfaceSchema): void {
    // In a real implementation, this would compile the schema
    // for faster validation (e.g., using ajv)
    this.compiledSchemas.set(schema.id, schema);
  }

  private ensureStorageDirectory(): void {
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
  }

  private async saveSchema(schema: InterfaceSchema): Promise<void> {
    const filePath = join(this.storagePath, `${schema.id}.json`);
    const data = JSON.stringify(schema, null, 2);
    writeFileSync(filePath, data);
  }

  private loadSchemas(): void {
    if (!existsSync(this.storagePath)) {
      return;
    }

    // In a real implementation, this would load all schema files
    // from the storage directory
  }

  private async cleanupOldVersions(name: string): Promise<void> {
    const schemas = this.getSchemasByName(name);

    if (schemas.length > this.config.retention.maxVersions) {
      const schemasToRemove = schemas
        .slice(this.config.retention.maxVersions)
        .filter(schema => !schema.metadata.deprecated);

      for (const schema of schemasToRemove) {
        this.schemas.delete(schema.id);
        this.compiledSchemas.delete(schema.id);

        // Remove file
        const filePath = join(this.storagePath, `${schema.id}.json`);
        if (existsSync(filePath)) {
          // Delete file (would need fs.unlink in real implementation)
        }
      }
    }
  }
}