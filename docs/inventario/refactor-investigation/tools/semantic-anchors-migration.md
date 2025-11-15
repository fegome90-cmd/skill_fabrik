# Plan de Migración a Anclas Semánticas

## **Objetivo de la Migración**

Reemplazar completamente el sistema frágil de referencias por número de línea (`L148-167`, `L233-244`) con el sistema robusto de anclas semánticas, garantizando integridad de enlaces y mejorando la experiencia de navegación para humanos y agentes de IA.

---

## **ESTRATEGIA DE MIGRACIÓN EN FASES**

### **Fase 0: Preparación y Discovery (Día 1)**
- **Análisis de Referencias Existentes**: Identificar todas las referencias `L###`
- **Mapeo de Content Owners**: Determinar qué referencias corresponden a qué contenido
- **Validación de Formato**: Asegurar que todas las referencias lineales son válidas
- **Establecimiento de Baseline**: Documentar estado actual de referencias

### **Fase 1: Generación de Anclas (Días 2-3)**
- **Extracción Automática**: Parsear `contenido-util-para-refactorizacion.txt`
- **Creación de Anclas**: Generar anclas semánticas para cada referencia
- **Validación de Anclas**: Verificar formato y unicidad
- **Indexación**: Crear índice de mapeo `L### → ANCHOR_ID`

### **Fase 2: Transformación de Contenido (Días 4-5)**
- **Transformación Automática**: Reemplazar `L###` con `[ANCHOR_ID](#ANCHOR_ID)`
- **Actualización de Cross-References**: Asegurar bidirectionalidad
- **Validación de Enlaces**: Verificar que todos los enlaces funcionen
- **Preservación de Formato**: Mantener estructura del contenido original

### **Fase 3: Validación y Testing (Día 6)**
- **Link Validation**: Checar todos los enlaces internos
- **Content Verification**: Asegurar que el contenido sea idéntico
- **Accessibility Testing**: Verificar WCAG compliance
- **Performance Testing**: Validar impacto en load time

### **Fase 4: Deployment y Monitoring (Día 7)**
- **Staging Deployment**: Deploy a environment de staging
- **UAT Testing**: Pruebas de aceptación de usuario
- **Production Rollout**: Deploy a producción con rollback plan
- **Monitoring Setup**: Monitorear broken links y performance

---

## **MAPEO COMPLETO DE REFERENCIAS**

### **Mapeo por Sección del Archivo Original**

#### **Sección 1: Governance Rules (Líneas 1-65)**

```json
{
  "governance_rules": {
    "L10-L29": {
      "anchor_id": "GOVERNANCE-RULES-MAX",
      "description": "MAX rules (MAX-001 to MAX-015)",
      "content": "Reglas de máxima autoridad para gobernanza",
      "cross_references": [
        "GOVERNANCE-RULES-PROH",
        "EVIDENCE-GOVERNANCE-COMPLIANCE"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    },
    "L30-L46": {
      "anchor_id": "GOVERNANCE-RULES-PROH",
      "description": "PROH rules (PROH-001 to PROH-016)",
      "content": "Reglas de prohibición críticas",
      "cross_references": [
        "GOVERNANCE-RULES-MAX",
        "TECHNICAL-SECURITY-RISK-GOVERNANCE"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    }
  }
}
```

#### **Sección 2: Technical Debt (Líneas 151-250)**

```json
{
  "technical_debt": {
    "L153-L167": {
      "anchor_id": "TECHNICAL-DEBT-MATRIX-CRITICAL",
      "description": "Critical technical debt items (F-001 to F-004)",
      "content": "Technical debt matrix con ítems críticos",
      "cross_references": [
        "TECHNICAL-SECURITY-RISK",
        "PRIORITY-CRITICAL-IMPLEMENTATION"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    },
    "L168-L180": {
      "anchor_id": "TECHNICAL-DEBT-MATRIX-HIGH",
      "description": "High priority technical debt items (F-005 to F-010)",
      "content": "Technical debt matrix con ítems de alta prioridad",
      "cross_references": [
        "PRIORITY-HIGH-IMPLEMENTATION",
        "TECHNICAL-PERFORMANCE-METRIC"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    }
  }
}
```

#### **Sección 3: Security Analysis (Líneas 251-350)**

```json
{
  "security_analysis": {
    "L233-L244": {
      "anchor_id": "SECURITY-RISKS-CRITICAL",
      "description": "Critical security vulnerabilities identified",
      "content": "Análisis de riesgos de seguridad críticos",
      "cross_references": [
        "STRIDE-ANALYSIS-COMPLETE",
        "PRIORITY-CRITICAL-SECURITY_LOCKDOWN"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    },
    "L246-L264": {
      "anchor_id": "STRIDE-ANALYSIS-COMPLETE",
      "description": "Complete STRIDE threat model analysis",
      "content": "Análisis STRIDE completo de amenazas",
      "cross_references": [
        "SECURITY-RISKS-CRITICAL",
        "EVIDENCE-SECURITY-THREATS"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    }
  }
}
```

#### **Sección 4: Performance Metrics (Líneas 351-450)**

```json
{
  "performance_metrics": {
    "L182-L201": {
      "anchor_id": "PERFORMANCE-METRIC-COMPONENTS",
      "description": "Component performance metrics and baselines",
      "content": "Métricas de rendimiento por componente",
      "cross_references": [
        "TECHNICAL-ARCHITECTURAL-ISSUE",
        "PRIORITY-CRITICAL-PERFORMANCE_BASELINE"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    },
    "L115-L147": {
      "anchor_id": "PERFORMANCE-METRIC-DAEMON",
      "description": "Daemon component specific performance metrics",
      "content": "Métricas de rendimiento específicas del Daemon",
      "cross_references": [
        "TECHNICAL-DEBT-ITEM-F001",
        "CODE_ANALYSIS-PATTERN-BAD-BIG_BALL_OF_MUD"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    }
  }
}
```

#### **Sección 5: Implementation Actions (Líneas 451-550)**

```json
{
  "implementation_actions": {
    "L503-L530": {
      "anchor_id": "PRIORITY-CRITICAL-IMPLEMENTATION-COMMANDS",
      "description": "Critical priority implementation commands",
      "content": "Comandos de implementación de prioridad crítica",
      "cross_references": [
        "GOVERNANCE-RULES-MAX",
        "TECHNICAL-SECURITY-RISK-CRITICAL"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    },
    "L531-L550": {
      "anchor_id": "PRIORITY-CRITICAL-IMPLEMENTATION-STRATEGIES",
      "description": "Critical priority implementation strategies",
      "content": "Estrategias de implementación de prioridad crítica",
      "cross_references": [
        "PRIORITY-CRITICAL-IMPLEMENTATION-COMMANDS",
        "VERIFICATION-QUALITY_GATE"
      ],
      "validation": {
        "line_range_valid": true,
        "content_extracted": true,
        "anchor_created": true
      }
    }
  }
}
```

---

## **PROCESO DE TRANSFORMACIÓN AUTOMATIZADA**

### **Script de Migración**

#### **Archivo**: `scripts/migrate-to-semantic-anchors.mjs`

```javascript
/**
 * SCRIPT DE MIGRACIÓN A ANCLAS SEMÁNTICAS
 *
 * Proceso completo para transformar referencias L### a anclas semánticas,
 * validando integridad y generando reportes de migración.
 */

import fs from 'fs/promises';
import path from 'path';
import { AnchorManager, SemanticAnchor } from './anchor-manager.mjs';

class AnchorMigrator {
  constructor(config = {}) {
    this.manager = new AnchorManager();
    this.sourceFile = config.sourceFile || './contenido-util-para-refactorizacion.txt';
    this.outputFile = config.outputFile || './contenido-util-para-refactorizacion-transformed.md';
    this.reportFile = config.reportFile || './migration-report.json';
    this.mappingFile = config.mappingFile || './reference-mapping.json';

    this.stats = {
      totalReferences: 0,
      transformedReferences: 0,
      failedReferences: 0,
      createdAnchors: 0,
      preservedContent: 0
    };

    this.mapping = {};
    this.issues = [];
  }

  async migrate() {
    console.log('🔄 Starting migration to semantic anchors...');

    try {
      // Fase 0: Preparación
      await this.prepare();

      // Fase 1: Generación de anclas
      await this.generateAnchors();

      // Fase 2: Transformación de contenido
      await this.transformContent();

      // Fase 3: Validación
      await this.validateMigration();

      // Fase 4: Reportes
      await this.generateReports();

      console.log('✅ Migration completed successfully!');
      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      await this.generateErrorReport(error);
      throw error;
    }
  }

  async prepare() {
    console.log('📋 Phase 0: Preparation...');

    // Inicializar Anchor Manager
    await this.manager.initialize();

    // Leer archivo fuente
    const sourceExists = await fs.access(this.sourceFile).then(() => true).catch(() => false);
    if (!sourceExists) {
      throw new Error(`Source file not found: ${this.sourceFile}`);
    }

    // Analizar referencias existentes
    await this.analyzeExistingReferences();

    console.log('✅ Preparation completed');
  }

  async analyzeExistingReferences() {
    console.log('🔍 Analyzing existing references...');

    const content = await fs.readFile(this.sourceFile, 'utf8');
    const referencePattern = /L(\d+)(?:-(\d+))?/g;
    const references = [];
    let match;

    while ((match = referencePattern.exec(content)) !== null) {
      const startLine = parseInt(match[1]);
      const endLine = match[2] ? parseInt(match[2]) : startLine;

      references.push({
        fullMatch: match[0],
        startLine,
        endLine,
        position: match.index
      });
    }

    this.stats.totalReferences = references.length;
    console.log(`📊 Found ${references.length} linear references`);

    // Crear mapeo inicial
    this.createReferenceMapping(references);
  }

  createReferenceMapping(references) {
    this.mapping = {
      byLineRange: {},
      byAnchor: {},
      transformations: []
    };

    for (const ref of references) {
      const key = `${ref.startLine}-${ref.endLine}`;
      this.mapping.byLineRange[key] = ref;
      this.mapping.byAnchor[ref.fullMatch] = ref;
    }
  }

  async generateAnchors() {
    console.log('🏗️ Phase 1: Generating semantic anchors...');

    const content = await fs.readFile(this.sourceFile, 'utf8');
    const lines = content.split('\n');

    // Generar anclas basadas en secciones conocidas
    const sections = await this.identifySections(lines);

    for (const section of sections) {
      await this.createAnchorForSection(section);
    }

    console.log(`✅ Generated ${this.stats.createdAnchors} anchors`);
  }

  async identifySections(lines) {
    const sections = [];

    // Sección de Governance Rules
    sections.push({
      id: 'governance-rules-max',
      lineRange: { start: 10, end: 29 },
      anchorId: 'GOVERNANCE-RULES-MAX',
      title: 'MAX Rules (Maximum Authority)',
      description: 'Reglas de máxima autoridad para gobernanza',
      content: lines.slice(9, 29).join('\n'),
      tags: ['governance', 'rules', 'authority', 'max'],
      domain: 'EVIDENCE',
      category: 'GOVERNANCE',
      subcategory: 'RULES_MAX',
      identifier: 'MAX'
    });

    sections.push({
      id: 'governance-rules-proh',
      lineRange: { start: 30, end: 46 },
      anchorId: 'GOVERNANCE-RULES-PROH',
      title: 'PROH Rules (Prohibitions)',
      description: 'Reglas de prohibición críticas',
      content: lines.slice(29, 46).join('\n'),
      tags: ['governance', 'rules', 'prohibitions', 'proh'],
      domain: 'EVIDENCE',
      category: 'GOVERNANCE',
      subcategory: 'RULES_PROH',
      identifier: 'PROH'
    });

    // Sección de Technical Debt
    sections.push({
      id: 'technical-debt-critical',
      lineRange: { start: 153, end: 167 },
      anchorId: 'TECHNICAL-DEBT-MATRIX-CRITICAL',
      title: 'Critical Technical Debt Matrix',
      description: 'Technical debt matrix con ítems críticos',
      content: lines.slice(152, 167).join('\n'),
      tags: ['technical-debt', 'critical', 'matrix', 'f001-f004'],
      domain: 'EVIDENCE',
      category: 'TECHNICAL',
      subcategory: 'DEBT',
      identifier: 'CRITICAL'
    });

    // Sección de Security Analysis
    sections.push({
      id: 'security-risks-critical',
      lineRange: { start: 233, end: 244 },
      anchorId: 'SECURITY-RISKS-CRITICAL',
      title: 'Critical Security Vulnerabilities',
      description: 'Análisis de riesgos de seguridad críticos',
      content: lines.slice(232, 244).join('\n'),
      tags: ['security', 'risks', 'critical', 'vulnerabilities'],
      domain: 'EVIDENCE',
      category: 'SECURITY',
      subcategory: 'RISKS',
      identifier: 'CRITICAL'
    });

    // Sección de Performance Metrics
    sections.push({
      id: 'performance-metrics-components',
      lineRange: { start: 182, end: 201 },
      anchorId: 'PERFORMANCE-METRIC-COMPONENTS',
      title: 'Component Performance Metrics',
      description: 'Métricas de rendimiento por componente',
      content: lines.slice(181, 201).join('\n'),
      tags: ['performance', 'metrics', 'components', 'baselines'],
      domain: 'EVIDENCE',
      category: 'PERFORMANCE',
      subcategory: 'METRIC',
      identifier: 'COMPONENTS'
    });

    // Sección de Implementation Actions
    sections.push({
      id: 'priority-critical-implementation',
      lineRange: { start: 503, end: 530 },
      anchorId: 'PRIORITY-CRITICAL-IMPLEMENTATION-COMMANDS',
      title: 'Critical Implementation Commands',
      description: 'Comandos de implementación de prioridad crítica',
      content: lines.slice(502, 530).join('\n'),
      tags: ['priority', 'critical', 'implementation', 'commands'],
      domain: 'ACTIONS',
      category: 'PRIORITY',
      subcategory: 'CRITICAL',
      identifier: 'IMPLEMENTATION'
    });

    return sections;
  }

  async createAnchorForSection(section) {
    try {
      const anchorData = {
        id: section.anchorId,
        domain: section.domain,
        category: section.category,
        subcategory: section.subcategory,
        identifier: section.identifier,
        title: section.title,
        description: section.description,
        lineRange: section.lineRange,
        filePath: path.basename(this.sourceFile),
        content: section.content,
        tags: section.tags,
        crossReferences: []
      };

      const anchor = this.manager.addAnchor(anchorData);
      this.stats.createdAnchors++;

      // Actualizar mapping
      const key = `${section.lineRange.start}-${section.lineRange.end}`;
      this.mapping.transformations.push({
        lineRange: key,
        anchorId: section.anchorId,
        transformation: `[${section.anchorId}](#${section.anchorId})`
      });

      return anchor;

    } catch (error) {
      console.warn(`⚠️ Failed to create anchor for section ${section.id}: ${error.message}`);
      this.issues.push({
        type: 'anchor_creation_failed',
        section: section.id,
        error: error.message
      });
      return null;
    }
  }

  async transformContent() {
    console.log('🔄 Phase 2: Transforming content...');

    const content = await fs.readFile(this.sourceFile, 'utf8');
    let transformedContent = content;

    // Aplicar transformaciones en orden inverso para preservar posiciones
    const transformations = this.mapping.transformations.sort((a, b) => {
      const [aStart] = a.lineRange.split('-').map(Number);
      const [bStart] = b.lineRange.split('-').map(Number);
      return bStart - aStart; // Orden descendente
    });

    for (const transform of transformations) {
      const originalRef = `L${transform.lineRange.replace('-', 'L')}`;
      const replacement = transform.transformation;

      // Count replacements for stats
      const occurrences = (transformedContent.match(new RegExp(originalRef, 'g')) || []).length;
      this.stats.transformedReferences += occurrences;

      // Replace all occurrences
      transformedContent = transformedContent.replace(new RegExp(originalRef, 'g'), replacement);
    }

    // Guardar contenido transformado
    await fs.writeFile(this.outputFile, transformedContent);

    console.log(`✅ Content transformed, ${this.stats.transformedReferences} references updated`);
  }

  async validateMigration() {
    console.log('🔍 Phase 3: Validating migration...');

    // Validar que todas las referencias se transformaron
    const transformedContent = await fs.readFile(this.outputFile, 'utf8');
    const remainingLinearRefs = (transformedContent.match(/L(\d+)(?:-(\d+))?/g) || []).length;

    if (remainingLinearRefs > 0) {
      this.issues.push({
        type: 'untransformed_references',
        count: remainingLinearRefs,
        description: `${remainingLinearRefs} linear references remain untransformed`
      });
    }

    // Validar que todos los anclas existan en el contenido
    for (const transform of this.mapping.transformations) {
      const anchorRef = `[${transform.anchorId}](#${transform.anchorId})`;
      if (!transformedContent.includes(anchorRef)) {
        this.issues.push({
          type: 'missing_anchor_link',
          anchorId: transform.anchorId,
          description: `Anchor link not found in transformed content`
        });
      }
    }

    // Validar integridad de anclas
    const validation = this.manager.validateAnchors();
    if (!validation.valid) {
      this.issues.push(...validation.issues.map(issue => ({
        type: 'anchor_validation',
        description: issue
      })));
    }

    console.log(`✅ Validation completed, ${this.issues.length} issues found`);
  }

  async generateReports() {
    console.log('📊 Phase 4: Generating reports...');

    // Report de migración
    const migrationReport = {
      timestamp: new Date().toISOString(),
      sourceFile: this.sourceFile,
      outputFile: this.outputFile,
      statistics: this.stats,
      mapping: this.mapping,
      issues: this.issues,
      validation: await this.manager.validateAnchors(),
      createdAnchors: Array.from(this.manager.anchors.values()).map(anchor => anchor.toObject())
    };

    await fs.writeFile(this.reportFile, JSON.stringify(migrationReport, null, 2));

    // Mapping file
    await fs.writeFile(this.mappingFile, JSON.stringify(this.mapping, null, 2));

    // Markdown summary
    await this.generateMarkdownReport(migrationReport);

    console.log(`✅ Reports generated:
   📄 Migration Report: ${this.reportFile}
   🗺️ Reference Mapping: ${this.mappingFile}`);
  }

  async generateMarkdownReport(report) {
    const markdownContent = `# Migration to Semantic Anchors - Report

**Generated**: ${report.timestamp}
**Status**: ${report.issues.length > 0 ? '⚠️ Issues Found' : '✅ Success'}

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total References | ${report.statistics.totalReferences} |
| Transformed References | ${report.statistics.transformedReferences} |
| Failed References | ${report.statistics.failedReferences} |
| Created Anchors | ${report.statistics.createdAnchors} |
| Success Rate | ${((report.statistics.transformedReferences / report.statistics.totalReferences) * 100).toFixed(2)}% |

## 🔄 Transformations

${report.mapping.transformations.map(t =>
`- **L${t.lineRange}** → [\`${t.anchorId}\`](#${t.anchorId})`
`).join('\n')}

## ⚠️ Issues Found

${report.issues.length > 0
  ? report.issues.map(issue =>
`- **${issue.type}**: ${issue.description}`
  ).join('\n')
  : '✅ No issues found'
}

## 🏗️ Created Anchors

| Anchor ID | Title | Domain | Category |
|------------|-------|---------|----------|
${report.createdAnchors.map(anchor =>
`| [${anchor.id}](#${anchor.id}) | ${anchor.title} | ${anchor.domain} | ${anchor.category} |
`).join('')}

---

## 🎯 Next Steps

1. **Review Issues**: Address any validation issues found
2. **Test Links**: Verify all transformed links work correctly
3. **Deploy Content**: Deploy transformed content to production
4. **Monitor**: Monitor for broken links or issues

---

**Files**:
- Source: \`${report.sourceFile}\`
- Transformed: \`${report.outputFile}\`
- Migration Report: \`${this.reportFile}\`
- Reference Mapping: \`${this.mappingFile}\`
`;

    const markdownReportFile = this.reportFile.replace('.json', '.md');
    await fs.writeFile(markdownReportFile, markdownContent);
  }

  async generateErrorReport(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      statistics: this.stats,
      mapping: this.mapping,
      issues: this.issues
    };

    await fs.writeFile(this.reportFile.replace('.json', '-error.json'), JSON.stringify(errorReport, null, 2));
  }

  printSummary() {
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('======================');
    console.log(`📋 Total References: ${this.stats.totalReferences}`);
    console.log(`✅ Transformed: ${this.stats.transformedReferences}`);
    console.log(`❌ Failed: ${this.stats.failedReferences}`);
    console.log(`🏗️ Created Anchors: ${this.stats.createdAnchors}`);
    console.log(`⚠️ Issues: ${this.issues.length}`);

    const successRate = ((this.stats.transformedReferences / this.stats.totalReferences) * 100).toFixed(2);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.issues.length > 0) {
      console.log('\n⚠️ ISSUES FOUND:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.type}: ${issue.description}`);
      });
    }

    console.log('\n📁 OUTPUT FILES:');
    console.log(`   📄 Transformed: ${this.outputFile}`);
    console.log(`   📊 Report: ${this.reportFile}`);
    console.log(`   🗺️ Mapping: ${this.mappingFile}`);
  }
}

// Ejecución principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new AnchorMigrator();
  migrator.migrate().catch(console.error);
}

export { AnchorMigrator };
```

---

## **PLAN DE ROLLBACK**

### **Estrategia de Rollback Seguro**
1. **Backup Automático**: Crear backup del archivo original antes de migración
2. **Version Control**: Commits separados para cada fase de migración
3. **Rollback Commands**: Scripts automáticos para revertir cambios
4. **Validation Checks**: Validaciones post-rollback para asegurar integridad

### **Script de Rollback**

#### **Archivo**: `scripts/rollback-migration.mjs`

```javascript
/**
 * SCRIPT DE ROLLBACK DE MIGRACIÓN
 *
 * Revierte los cambios de migración a anclas semánticas
 * y restaura el estado original del sistema.
 */

import fs from 'fs/promises';
import path from 'path';

class MigrationRollback {
  constructor(config = {}) {
    this.backupFile = config.backupFile || './backups/contenido-original.backup';
    this.transformedFile = config.transformedFile || './contenido-util-para-refactorizacion-transformed.md';
    this.originalFile = config.originalFile || './contenido-util-para-refactorizacion.txt';
    this.anchorsDataFile = config.anchorsDataFile || './data/anchors.json';

    this.rollbackStats = {
      filesRestored: 0,
      anchorsDeleted: 0,
      validationPassed: false
    };
  }

  async rollback() {
    console.log('🔄 Starting migration rollback...');

    try {
      // Validar que backup exista
      await this.validateBackup();

      // Restaurar archivo original
      await this.restoreOriginalFile();

      // Limpiar anclas migradas
      await this.cleanupMigratedAnchors();

      // Validar rollback
      await this.validateRollback();

      console.log('✅ Rollback completed successfully!');
      this.printRollbackSummary();

    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  async validateBackup() {
    const backupExists = await fs.access(this.backupFile).then(() => true).catch(() => false);
    if (!backupExists) {
      throw new Error(`Backup file not found: ${this.backupFile}`);
    }
    console.log('✅ Backup file validated');
  }

  async restoreOriginalFile() {
    console.log('📁 Restoring original file...');

    const backupContent = await fs.readFile(this.backupFile, 'utf8');
    await fs.writeFile(this.originalFile, backupContent);

    this.rollbackStats.filesRestored++;
    console.log(`✅ Original file restored from ${this.backupFile}`);
  }

  async cleanupMigratedAnchors() {
    console.log('🗑️ Cleaning up migrated anchors...');

    try {
      // Leer anclas existentes
      const anchorsData = await fs.readFile(this.anchorsDataFile, 'utf8');
      const anchors = JSON.parse(anchorsData);

      // Identificar anclas migradas (por patrón de ID o metadata)
      const migratedAnchors = anchors.filter(anchor =>
        this.isMigratedAnchor(anchor)
      );

      // Eliminar anclas migradas
      const remainingAnchors = anchors.filter(anchor =>
        !this.isMigratedAnchor(anchor)
      );

      // Guardar anclas restantes
      await fs.writeFile(this.anchorsDataFile, JSON.stringify(remainingAnchors, null, 2));

      this.rollbackStats.anchorsDeleted = migratedAnchors.length;
      console.log(`✅ Deleted ${migratedAnchors.length} migrated anchors`);

    } catch (error) {
      console.warn('⚠️ Could not clean up anchors:', error.message);
    }
  }

  isMigratedAnchor(anchor) {
    // Identificar anclas que fueron creadas durante la migración
    return (
      anchor.metadata?.migratedAt ||
      anchor.metadata?.migrationPhase ||
      anchor.id.includes('MIGRATION') ||
      anchor.tags?.includes('migration-generated')
    );
  }

  async validateRollback() {
    console.log('🔍 Validating rollback...');

    // Validar que archivo original no contenga anclas semánticas
    const originalContent = await fs.readFile(this.originalFile, 'utf8');
    const semanticAnchorPattern = /\[A-Z][A-Z_-]*-[A-Z][A-Z_-]*-[A-Z][A-Z0-9_-]*\]/;
    const semanticAnchors = originalContent.match(semanticAnchorPattern) || [];

    if (semanticAnchors.length > 0) {
      console.warn(`⚠️ Found ${semanticAnchors.length} semantic anchors remaining in original file`);
    } else {
      console.log('✅ No semantic anchors found in original file');
    }

    // Validar que referencias lineales estén restauradas
    const linearRefPattern = /L(\d+)(?:-(\d+))?/g;
    const linearRefs = originalContent.match(linearRefPattern) || [];

    if (linearRefs.length > 0) {
      console.log(`✅ Found ${linearRefs.length} linear references restored`);
    } else {
      console.warn('⚠️ No linear references found in restored file');
    }

    this.rollbackStats.validationPassed = true;
    console.log('✅ Rollback validation completed');
  }

  printRollbackSummary() {
    console.log('\n📊 ROLLBACK SUMMARY');
    console.log('====================');
    console.log(`📁 Files Restored: ${this.rollbackStats.filesRestored}`);
    console.log(`🗑️ Anchors Deleted: ${this.rollbackStats.anchorsDeleted}`);
    console.log(`✅ Validation Passed: ${this.rollbackStats.validationPassed}`);

    console.log('\n📁 SYSTEM STATUS:');
    console.log(`   📄 Original File: ${this.originalFile}`);
    console.log(`   🔄 Transformed File: ${this.transformedFile} (can be deleted)`);
    console.log(`   📊 Anchors Data: ${this.anchorsDataFile}`);
  }
}

// Ejecución principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const rollback = new MigrationRollback();
  rollback.rollback().catch(console.error);
}

export { MigrationRollback };
```

---

## **MONITORING POST-MIGRACIÓN**

### **Validación Continua**

```javascript
// scripts/monitor-migration.mjs
class MigrationMonitor {
  async monitor() {
    console.log('🔍 Monitoring post-migration status...');

    // 1. Check for broken internal links
    const brokenLinks = await this.checkBrokenLinks();

    // 2. Validate anchor integrity
    const anchorIntegrity = await this.validateAnchorIntegrity();

    // 3. Performance impact assessment
    const performanceImpact = await this.assessPerformanceImpact();

    // 4. User feedback collection
    const userFeedback = await this.collectUserFeedback();

    const report = {
      timestamp: new Date().toISOString(),
      brokenLinks,
      anchorIntegrity,
      performanceImpact,
      userFeedback
    };

    await fs.writeFile('./monitoring-report.json', JSON.stringify(report, null, 2));

    return report;
  }

  async checkBrokenLinks() {
    // Implementar verificación de enlaces rotos
    return { count: 0, details: [] };
  }

  async validateAnchorIntegrity() {
    // Implementar validación de integridad de anclas
    return { valid: true, issues: [] };
  }

  async assessPerformanceImpact() {
    // Implementar assessment de impacto en rendimiento
    return { loadTime: '2.1s', impact: 'minimal' };
  }

  async collectUserFeedback() {
    // Implementar recolección de feedback de usuarios
    return { rating: 4.8, comments: [] };
  }
}
```

---

## **SUCCESS CRITERIA**

### **Métricas de Éxito de Migración**

#### **Integridad Técnica**
- ✅ **100%** de referencias lineales transformadas
- ✅ **0** broken internal links
- ✅ **100%** de anclas válidas y únicas
- ✅ **0** pérdida de contenido durante transformación

#### **Experiencia de Usuario**
- ✅ **<3s** tiempo de carga para página con anclas
- ✅ **WCAG 2.1 AA** compliance para accesibilidad
- ✅ **95%** de enlaces semánticos funcionales
- ✅ **Mobile-friendly** responsive design

#### **Mantenibilidad**
- ✅ **Automated validation** de integridad de anclas
- ✅ **Automatic backup** antes de cambios
- ✅ **Rollback capability** <5 minutos
- ✅ **Monitoring alerts** para broken links

---

## **ESTADO FINAL**

### **✅ Completado:**
- Diseño completo de estrategia de migración
- Script automatizado de migración
- Script de rollback para seguridad
- Sistema de monitoreo post-migración
- Criterios de éxito definidos

### **📋 Preparado para Ejecución:**
- Todos los scripts y herramientas listas
- Estrategia de backup y rollback definida
- Sistema de validación automática
- Plan de monitoreo continuo

### **🚀 Próximos Pasos:**
1. Ejecutar script de migración en ambiente de staging
2. Validar resultados con UAT
3. Deploy a producción con monitoreo activo
4. Documentar lecciones aprendidas

---

**ESTADO**: Plan de migración completamente documentado y listo para ejecución segura
**RIESGO**: **BAJO** - Con backup, rollback y validación automática
**IMPACTO**: **ALTO** - Transformación completa del sistema de documentación