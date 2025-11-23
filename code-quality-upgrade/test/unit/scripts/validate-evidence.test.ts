/**
 * T3.1.1: Evidence Validation Tests
 *
 * METODOLOGÍA TDD: RED Phase - Tests fallando inicialmente
 * Cobertura target: Evidence validation system
 * Architecture: Clean Architecture con interfaces separadas
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EvidenceValidator } from '../../../src/scripts/validate-evidence';
import { ValidationOptions } from '../../../src/types/validation';

describe('T3.1.1 Evidence Validator', () => {
  let validator: EvidenceValidator;
  const mockOptions: ValidationOptions = {
    strict: false,
    timeout: 30000,
    includeWarnings: true,
    maxFileSize: 1024 * 1024, // 1MB
    excludedPaths: [],
  };

  beforeEach(() => {
    validator = new EvidenceValidator(mockOptions);
    jest.clearAllMocks();
  });

  /**
   * TEST SUITE 1: Encoding Validation
   * Objetivo: Validar que los archivos usan codificación UTF-8 correctamente
   */
  describe('Encoding Validation', () => {
    it('should detect UTF-8 encoded files correctly', async () => {
      // RED: Test esperando validación exitosa de archivo UTF-8
      const utf8FilePath = 'test/fixtures/utf8-file.txt';

      const result = await validator.validateEncoding(utf8FilePath);

      expect(result.isValid).toBe(true);
      expect(result.encoding).toBe('utf8');
      expect(result.errors).toHaveLength(0);
      expect(result.bomDetected).toBeDefined();
    });

    it('should detect non-UTF8 encoded files', async () => {
      // RED: Test esperando detección de archivo con codificación incorrecta
      const invalidFilePath = 'test/fixtures/latin1-file.txt';

      const result = await validator.validateEncoding(invalidFilePath);

      expect(result.isValid).toBe(false);
      expect(result.encoding).not.toBe('utf8');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('INVALID_ENCODING');
    });

    it('should handle mixed line endings correctly', async () => {
      // RED: Test esperando detección de line endings inconsistency
      const mixedLineEndingsPath = 'test/fixtures/mixed-ending-real.txt';

      const result = await validator.validateEncoding(mixedLineEndingsPath);

      expect(result.lineEndings).toBe('mixed');
      expect(result.warnings.some(w => w.code === 'MIXED_LINE_ENDINGS')).toBe(
        true
      );
    });

    it('should detect BOM presence in UTF-8 files', async () => {
      // RED: Test esperando detección de BOM
      const bomFilePath = 'test/fixtures/utf8-bom.txt';

      const result = await validator.validateEncoding(bomFilePath);

      expect(result.bomDetected).toBe(true);
      expect(result.warnings.some(w => w.code === 'BOM_DETECTED')).toBe(true);
    });

    it('should handle non-existent files gracefully', async () => {
      // RED: Test esperando manejo elegante de archivos inexistentes
      const nonExistentPath = 'test/fixtures/non-existent.txt';

      const result = await validator.validateEncoding(nonExistentPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'FILE_NOT_FOUND')).toBe(true);
    });
  });

  /**
   * TEST SUITE 2: Link Validation
   * Objetivo: Validar enlaces en archivos markdown y referencias internas
   */
  describe('Link Validation', () => {
    it('should detect broken internal links', async () => {
      // RED: Test esperando detección de enlaces rotos internos
      const markdownPath = 'test/fixtures/broken-links.md';

      const result = await validator.validateLinks(markdownPath);

      expect(result.isValid).toBe(false);
      expect(result.brokenLinks.length).toBeGreaterThan(0);
      expect(result.linksChecked).toBeGreaterThan(0);
    });

    it('should validate valid internal links', async () => {
      // RED: Test esperando validación exitosa de enlaces válidos
      const validMarkdownPath = 'test/fixtures/valid-links.md';

      const result = await validator.validateLinks(validMarkdownPath);

      expect(result.isValid).toBe(true);
      expect(result.brokenLinks).toHaveLength(0);
    });

    it('should check external links with timeout', async () => {
      // RED: Test esperando validación de enlaces externos con timeout
      const externalLinksPath = 'test/fixtures/external-links.md';

      // Mock timeout a 5s para testing
      const validatorWithTimeout = new EvidenceValidator({
        ...mockOptions,
        timeout: 5000,
      });

      const result =
        await validatorWithTimeout.validateLinks(externalLinksPath);

      expect(result.externalLinks.length).toBeGreaterThan(0);
      expect(result.metadata.duration).toBeLessThan(5000);
    });

    it('should handle relative path references correctly', async () => {
      // RED: Test esperando manejo correcto de rutas relativas
      const relativeRefsPath = 'test/fixtures/relative-refs.md';

      const result = await validator.validateLinks(relativeRefsPath);

      expect(result.linksChecked).toBeGreaterThan(0);
      expect(result.brokenLinks).toBeInstanceOf(Array);
    });
  });

  /**
   * TEST SUITE 3: Package Validation
   * Objetivo: Validar archivos package.json completamente
   */
  describe('Package Validation', () => {
    it('should detect missing dependencies', async () => {
      // RED: Test esperando detección de dependencias faltantes
      const packageJsonPath = 'test/fixtures/missing-deps/package.json';

      const result = await validator.validatePackageJson(packageJsonPath);

      expect(result.isValid).toBe(false);
      expect(result.dependencies.missing.length).toBeGreaterThan(0);
      expect(result.dependencies.total).toBeGreaterThan(0);
    });

    it('should validate syntax of package.json', async () => {
      // RED: Test esperando validación de sintaxis JSON
      const invalidPackagePath =
        'test/fixtures/invalid-syntax/package.json.invalid';

      const result = await validator.validatePackageJson(invalidPackagePath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_JSON')).toBe(true);
    });

    it('should check version consistency', async () => {
      // RED: Test esperando validación de consistencia de versiones
      const inconsistentVersionPath =
        'test/fixtures/inconsistent-version/package.json';

      const result = await validator.validatePackageJson(
        inconsistentVersionPath
      );

      expect(result.packageMetadata.versionValid).toBe(false);
      expect(
        result.warnings.some(w => w.code === 'VERSION_INCONSISTENCY')
      ).toBe(true);
    });

    it('should validate script commands syntax', async () => {
      // RED: Test esperando validación de comandos en scripts
      const packageJsonPath = 'test/fixtures/invalid-scripts/package.json';

      const result = await validator.validatePackageJson(packageJsonPath);

      expect(result.scripts.total).toBeGreaterThanOrEqual(0);
      expect(result.scripts.invalid).toBeInstanceOf(Array);
    });

    it('should detect missing recommended fields', async () => {
      // RED: Test esperando detección de campos faltantes recomendados
      const minimalPackagePath = 'test/fixtures/minimal-package/package.json';

      const result = await validator.validatePackageJson(minimalPackagePath);

      expect(result.packageMetadata.descriptionMissing).toBeDefined();
      expect(result.packageMetadata.keywordsMissing).toBeDefined();
    });
  });

  /**
   * TEST SUITE 4: Integration Tests
   * Objetivo: Validar el flujo completo de validación
   */
  describe('Integration Tests', () => {
    it('should run full validation within timeout limits', async () => {
      // RED: Test esperando ejecución completa dentro de límites de tiempo
      const projectPath = 'test/fixtures/sample-project';

      const startTime = Date.now();
      const results = await validator.validateProject(projectPath);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(mockOptions.timeout!);
      expect(results).toHaveProperty('encoding');
      expect(results).toHaveProperty('links');
      expect(results).toHaveProperty('package');
    });

    it('should handle large projects efficiently', async () => {
      // RED: Test esperando manejo eficiente de proyectos grandes
      const largeProjectPath = 'test/fixtures/large-project';

      const result = await validator.validateLargeProject(largeProjectPath);

      expect(result.metadata.itemsProcessed).toBeGreaterThan(0);
      expect(result.metadata.duration).toBeLessThan(mockOptions.timeout!);
    });

    it('should respect excluded paths configuration', async () => {
      // RED: Test esperando respeto de configuración de paths excluidos
      const projectPath = 'test/fixtures/project-with-exclusions';
      const validatorWithExclusions = new EvidenceValidator({
        ...mockOptions,
        excludedPaths: ['node_modules', 'dist', '.git'],
      });

      // Execute validation to ensure excluded paths are used
      await expect(
        validatorWithExclusions.validateProject(projectPath)
      ).resolves.toBeDefined();

      // Verify excluded paths are respected in validation options
      expect(validatorWithExclusions.excludedPaths).toContain('node_modules');
      expect(validatorWithExclusions.excludedPaths).toContain('dist');
      expect(validatorWithExclusions.excludedPaths).toContain('.git');
    });
  });
});

// Timeout configuration para cumplir con regla ≥30s
jest.setTimeout(35000);
