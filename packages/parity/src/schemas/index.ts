/**
 * Schema Management Module
 *
 * Exports schema registry and related components for interface parity.
 */

export { SchemaRegistry } from './SchemaRegistry.js';
export type {
  InterfaceSchema,
  PropertyDefinition,
  SchemaValidationResult,
  ValidationError,
  ValidationWarning,
  SchemaRegistryConfig
} from './SchemaRegistry.js';