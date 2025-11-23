#!/usr/bin/env node

/**
 * Validación de evidencia en informes de análisis
 * Verifica que cada hallazgo tenga evidencia concreta y verificable
 */

const fs = require('fs');
const path = require('path');

class EvidenceValidator {
  constructor(options = {}) {
    this.reportsPath =
      options.reportsPath || path.join(process.cwd(), 'reports');
    this.evidenceIssues = [];
    this.validations = [];
  }

  validateEvidence() {
    console.log('🔍 Validando evidencia en informes...\n');

    if (!fs.existsSync(this.reportsPath)) {
      console.log('📁 Creando directorio reports...');
      fs.mkdirSync(this.reportsPath, { recursive: true });
      console.log('✅ Directorio reports creado\n');
      return true; // No hay informes que validar aún
    }

    const reports = fs
      .readdirSync(this.reportsPath)
      .filter(file => file.endsWith('.md'));

    if (reports.length === 0) {
      console.log('📝 No hay informes que validar aún\n');
      return true;
    }

    reports.forEach(report => this.validateReport(report));
    this.printResults();

    return this.evidenceIssues.length === 0;
  }

  validateReport(reportFile) {
    const reportPath = path.join(this.reportsPath, reportFile);
    const content = fs.readFileSync(reportPath, 'utf8');

    console.log(`📋 Validando informe: ${reportFile}`);

    // Validar estructura del informe
    this.validateReportStructure(content, reportFile);

    // Validar secciones de evidencia
    this.validateEvidenceSections(content, reportFile);

    // Validar hallazgos con evidencia
    this.validateFindings(content, reportFile);

    // Validar referencias cruzadas
    this.validateReferences(content, reportFile);
  }

  validateReportStructure(content, reportFile) {
    const requiredSections = [
      '# Informe Fase',
      '## Metadata',
      '## Resumen Ejecutivo',
      '## Evidencia Recopilada',
      '## Hallazgos Clave'
    ];

    requiredSections.forEach(section => {
      if (content.includes(section)) {
        this.validations.push(
          `✅ ${reportFile}: Contiene sección "${section}"`
        );
      } else {
        this.evidenceIssues.push(
          `❌ ${reportFile}: Falta sección "${section}"`
        );
      }
    });
  }

  validateEvidenceSections(content, reportFile) {
    // Buscar secciones de evidencia
    const evidenceSectionRegex =
      /## Evidencia Recopilada\n([\s\S]*?)(?=\n## |\n# |$)/;
    const evidenceMatch = content.match(evidenceSectionRegex);

    if (!evidenceMatch) {
      this.evidenceIssues.push(`❌ ${reportFile}: No hay sección de evidencia`);
      return;
    }

    const evidenceSection = evidenceMatch[1];

    // Validar que tenga áreas de análisis
    const areaSections = evidenceSection.match(/### Área \d+: .+/g);
    if (areaSections && areaSections.length > 0) {
      this.validations.push(
        `✅ ${reportFile}: ${areaSections.length} áreas de evidencia identificadas`
      );
    } else {
      this.evidenceIssues.push(
        `❌ ${reportFile}: No hay áreas de evidencia identificadas`
      );
    }

    // Validar items de evidencia
    const evidenceItems = evidenceSection.match(/- \*\*Hallazgo\*\*: .+/g);
    if (evidenceItems && evidenceItems.length > 0) {
      this.validations.push(
        `✅ ${reportFile}: ${evidenceItems.length} hallazgos con evidencia`
      );
    } else {
      this.evidenceIssues.push(
        `❌ ${reportFile}: No hay hallazgos documentados con evidencia`
      );
    }
  }

  validateFindings(content, reportFile) {
    // Validar que cada hallazgo tenga los campos requeridos
    const findingBlocks = content.match(
      /- \*\*Hallazgo\*\*: .+[\s\S]*?- \*\*Evidencia\*\*: .+/g
    );

    if (findingBlocks) {
      findingBlocks.forEach((block, index) => {
        const hasEvidencia = block.includes('**Evidencia**:');
        const hasContexto = block.includes('**Contexto**:');
        const hasImpacto = block.includes('**Impacto**:');

        if (hasEvidencia) {
          this.validations.push(
            `✅ ${reportFile}: Hallazgo ${index + 1} tiene evidencia`
          );
        } else {
          this.evidenceIssues.push(
            `❌ ${reportFile}: Hallazgo ${index + 1} falta evidencia`
          );
        }

        if (hasContexto) {
          this.validations.push(
            `✅ ${reportFile}: Hallazgo ${index + 1} tiene contexto`
          );
        }

        if (hasImpacto) {
          this.validations.push(
            `✅ ${reportFile}: Hallazgo ${index + 1} tiene impacto`
          );
        }
      });
    }
  }

  validateReferences(content, reportFile) {
    // Validar referencias a archivos y rutas
    const pathReferences = content.match(
      /\/[a-zA-Z0-9_\-\/\.]+\.(md|json|js|ts|tsx)/g
    );

    if (pathReferences && pathReferences.length > 0) {
      pathReferences.forEach(pathRef => {
        // Verificar que la referencia tenga un contexto claro
        if (
          content.includes(`**Evidencia**: ${pathRef}`) ||
          content.includes(`**Ruta**: ${pathRef}`) ||
          content.includes(`**Evidencia**: \`${pathRef}\``) ||
          content.includes(`**Evidencia**: ${pathRef} `) ||
          content.includes(`**Evidencia**: \`${pathRef}\``)
        ) {
          this.validations.push(
            `✅ ${reportFile}: Referencia a ruta documentada: ${pathRef}`
          );
        } else {
          this.evidenceIssues.push(
            `⚠️ ${reportFile}: Referencia a ruta sin contexto claro: ${pathRef}`
          );
        }
      });
    }

    // Validar referencias cruzadas a dev-docs
    const devDocRefs = content.match(/dev-docs\/[a-zA-Z0-9_\-\.]+/g);
    if (devDocRefs && devDocRefs.length > 0) {
      this.validations.push(
        `✅ ${reportFile}: ${devDocRefs.length} referencias a dev-docs`
      );
    }
  }

  printResults() {
    console.log('\n📊 Resultados de Validación de Evidencia');
    console.log('======================================');

    if (this.validations.length > 0) {
      console.log('\n✅ Validaciones Exitosas:');
      this.validations.forEach(item => console.log(`  ${item}`));
    }

    if (this.evidenceIssues.length > 0) {
      console.log('\n❌ Problemas de Evidencia:');
      this.evidenceIssues.forEach(item => console.log(`  ${item}`));
    }

    console.log('\n📈 Resumen:');
    console.log(`  ✅ Validaciones: ${this.validations.length}`);
    console.log(`  ❌ Problemas: ${this.evidenceIssues.length}`);

    const overallStatus =
      this.evidenceIssues.length === 0 ? '✅ APROBADO' : '❌ RECHAZADO';
    console.log(`\n🎯 Estado General: ${overallStatus}`);
  }
}

// Ejecutar validación
if (require.main === module) {
  const args = process.argv.slice(2);
  const reportsPath = args[0] || 'reports';
  const validator = new EvidenceValidator({ reportsPath });
  const success = validator.validateEvidence();
  process.exit(success ? 0 : 1);
}

module.exports = EvidenceValidator;
