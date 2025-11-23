/**
 * Validation Types - T3.1.1 Evidence Validation
 *
 * Clean Architecture: Domain types for validation system
 * Dependencies: None (Pure TypeScript types)
 */

/**
 * Resultados de validación para diferentes tipos de evidencia
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'info' | 'low';
  location?: string;
  suggestion?: string;
}

export interface ValidationMetadata {
  timestamp: number;
  duration: number;
  itemsProcessed: number;
  validatorVersion: string;
}

/**
 * Tipos específicos de validación para T3.1.1
 */
export interface EncodingValidationResult extends ValidationResult {
  encoding: string;
  bomDetected: boolean;
  lineEndings: 'lf' | 'crlf' | 'mixed';
}

export interface LinkValidationResult extends ValidationResult {
  linksChecked: number;
  brokenLinks: BrokenLink[];
  externalLinks: ExternalLink[];
}

export interface BrokenLink {
  source: string;
  target: string;
  line: number;
  column: number;
  context: string;
}

export interface ExternalLink {
  url: string;
  status: 'valid' | 'invalid' | 'timeout';
  responseTime?: number;
}

export interface PackageValidationResult extends ValidationResult {
  packageJsonPath: string;
  dependencies: DependencyValidation;
  scripts: ScriptValidation;
  packageMetadata: PackageMetadataValidation;
}

export interface DependencyValidation {
  total: number;
  missing: string[];
  invalid: string[];
  outdated: OutdatedDependency[];
}

export interface OutdatedDependency {
  name: string;
  current: string;
  latest: string;
  severity: 'patch' | 'minor' | 'major';
}

export interface ScriptValidation {
  total: number;
  invalid: string[];
  warnings: string[];
}

export interface PackageMetadataValidation {
  nameValid: boolean;
  versionValid: boolean;
  descriptionMissing: boolean;
  keywordsMissing: boolean;
}

/**
 * Opciones de configuración para validadores
 */
export interface ValidationOptions {
  strict?: boolean;
  timeout?: number;
  includeWarnings?: boolean;
  maxFileSize?: number;
  excludedPaths?: string[];
  excludePatterns?: string[];
  verbose?: boolean;
}

// Alias for CLI integration
export type ProjectOptions = ValidationOptions;

/**
 * Tipos de archivo soportados para validación
 */
export type SupportedFileType =
  | 'typescript'
  | 'javascript'
  | 'json'
  | 'markdown'
  | 'text'
  | 'binary';

export interface FileInfo {
  path: string;
  type: SupportedFileType;
  size: number;
  encoding?: string;
  lastModified: number;
}
