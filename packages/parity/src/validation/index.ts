/**
 * Cross-Interface Validation Module
 *
 * Exports validation components for interface parity checking.
 */

export { CrossInterfaceValidator } from './CrossInterfaceValidator.js';
export type {
  InterfaceDefinition,
  OperationDefinition,
  ParameterDefinition,
  OperationExample,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ParityReport,
  CrossValidationConfig
} from './CrossInterfaceValidator.js';