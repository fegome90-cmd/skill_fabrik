#!/usr/bin/env node

/**
 * Validación de completitud del análisis forense
 * Verifica que todas las áreas esperadas hayan sido cubiertas
 */

const fs = require('fs');
const path = require('path');

class CompletenessValidator {
  constructor() {
    this.reportsPath = path.join(process.cwd(), 'reports');
    this.coverageIssues = [];
    this.coverageSuccess = [];
    this.expectedAreas = {
      'phase-a-inventory': [
        'packages/router',
        'packages/daemon',
        'packages/skills-cli',
        'packages/shared',
        'skills',
        'dev-docs',
        'configs',
        'apps'
      ],
      'phase-b-responsibilities': [
        'router',
        'daemon',
        'skills',
        'tools',
        'dependencies'
      ],
      'phase-c-testing': [
        'tests existentes',
        'cobertura',
        'TODO',
        'FIXME',
        'HACK'
      ],
      'phase-d-runtime': [
        'scripts npm',
        'configs pm2',
        'flujos operativos',
        'redundancias'
      ],
      'phase-e-prompts': [
        'Prompt Builder',
        'contratos',
        'conflictos',
        'gobernanza'
      ]
    };
  }

  validateCompleteness() {
    console.log('🔍 Validando completitud del análisis...\n');

    if (!fs.existsSync(this.reportsPath)) {
      console.log('📁 No hay informes que validar aún\n');
      return true;
    }

    const reports = fs
      .readdirSync(this.reportsPath)
      .filter(file => file.endsWith('.md'));

    let overallComplete = true;

    reports.forEach(report => {
      const reportKey = this.getReportKey(report);
      if (this.expectedAreas[reportKey]) {
        const isComplete = this.validateReportCompleteness(report, reportKey);
        overallComplete = overallComplete && isComplete;
      }
    });

    this.printResults();
    return overallComplete && this.coverageIssues.length === 0;
  }

  getReportKey(reportFile) {
    // Convertir nombre de archivo a clave de expectedAreas
    const name = reportFile.replace('.md', '').replace('phase-', '');
    return `phase-${name}`;
  }

  validateReportCompleteness(reportFile, reportKey) {
    const reportPath = path.join(this.reportsPath, reportFile);
    const content = fs.readFileSync(reportPath, 'utf8');

    console.log(`📋 Validando completitud: ${reportFile}`);

    const expectedAreas = this.expectedAreas[reportKey];
    let coveredAreas = 0;

    expectedAreas.forEach(area => {
      if (this.isAreaCovered(content, area)) {
        coveredAreas++;
        this.coverageSuccess.push(`✅ ${reportFile}: Área "${area}" cubierta`);
      } else {
        this.coverageIssues.push(
          `❌ ${reportFile}: Área "${area}" no cubierta o insuficiente`
        );
      }
    });

    const coveragePercentage = (coveredAreas / expectedAreas.length) * 100;
    const isComplete = coveragePercentage >= 80; // 80% de cobertura mínimo

    console.log(
      `📊 Cobertura: ${coveredAreas}/${expectedAreas.length} (${coveragePercentage.toFixed(1)}%)`
    );

    if (isComplete) {
      this.coverageSuccess.push(
        `✅ ${reportFile}: Cobertura aceptable (${coveragePercentage.toFixed(1)}%)`
      );
    } else {
      this.coverageIssues.push(
        `❌ ${reportFile}: Cobertura insuficiente (${coveragePercentage.toFixed(1)}%)`
      );
    }

    return isComplete;
  }

  isAreaCovered(content, area) {
    // Estrategias de búsqueda según el área
    const searchStrategies = {
      'packages/router': [
        'packages/router',
        '/router',
        'router:',
        'router package'
      ],
      'packages/daemon': [
        'packages/daemon',
        '/daemon',
        'daemon:',
        'daemon package'
      ],
      'packages/skills-cli': [
        'packages/skills-cli',
        '/skills-cli',
        'skills-cli:',
        'skills-cli package',
        'cli package'
      ],
      'packages/shared': [
        'packages/shared',
        '/shared',
        'shared:',
        'shared package',
        'tools package'
      ],
      skills: ['skills/', '/skills', 'skills:', 'SKILL.md'],
      'dev-docs': ['dev-docs/', '/dev-docs', 'dev-docs:', 'documentación'],
      configs: ['configs/', '/configs', 'configs:', 'configuración'],
      apps: ['apps/', '/apps', 'apps:', 'dashboard', 'frontend'],
      router: ['router:', 'router ', 'Router', 'enrutador'],
      daemon: ['daemon:', 'daemon ', 'Daemon', 'demonio'],
      dependencies: ['dependenci', 'imports', 'require', 'import'],
      'tests existentes': ['test', 'spec.', '__tests__', '.test.', '.spec.'],
      cobertura: ['cobertura', 'coverage', 'test coverage'],
      TODO: ['TODO', 'FIXME', 'HACK'],
      FIXME: ['FIXME', 'TODO', 'HACK'],
      HACK: ['HACK', 'TODO', 'FIXME'],
      'scripts npm': ['npm', 'package.json', 'scripts'],
      'configs pm2': ['pm2', 'ecosystem', 'processes'],
      'flujos operativos': ['flujo', 'workflow', 'proceso', 'secuencia'],
      redundancias: ['redundan', 'duplicad', 'múltiple'],
      'Prompt Builder': ['prompt builder', 'PromptBuilder', 'prompt-builder'],
      contratos: ['contrato', 'contract', 'agreement'],
      conflictos: ['conflicto', 'conflict', 'desalineación'],
      gobernanza: ['gobernanza', 'governance', 'reglas', 'policies']
    };

    const strategies = searchStrategies[area] || [area];

    return strategies.some(strategy =>
      content.toLowerCase().includes(strategy.toLowerCase())
    );
  }

  printResults() {
    console.log('\n📊 Resultados de Validación de Completitud');
    console.log('==========================================');

    if (this.coverageSuccess.length > 0) {
      console.log('\n✅ Áreas Cubiertas:');
      this.coverageSuccess.forEach(item => console.log(`  ${item}`));
    }

    if (this.coverageIssues.length > 0) {
      console.log('\n❌ Áreas Faltantes o Insuficientes:');
      this.coverageIssues.forEach(item => console.log(`  ${item}`));
    }

    console.log('\n📈 Resumen:');
    console.log(`  ✅ Cubiertas: ${this.coverageSuccess.length}`);
    console.log(`  ❌ Faltantes: ${this.coverageIssues.length}`);

    const totalExpected = Object.values(this.expectedAreas).reduce(
      (sum, areas) => sum + areas.length,
      0
    );
    const totalCovered = this.coverageSuccess.length;
    const overallCoverage = (totalCovered / totalExpected) * 100;

    console.log(
      `\n📊 Cobertura General: ${totalCovered}/${totalExpected} (${overallCoverage.toFixed(1)}%)`
    );

    const overallStatus =
      this.coverageIssues.length === 0 ? '✅ COMPLETO' : '❌ INCOMPLETO';
    console.log(`🎯 Estado General: ${overallStatus}`);
  }
}

// Ejecutar validación
if (require.main === module) {
  const validator = new CompletenessValidator();
  const success = validator.validateCompleteness();
  process.exit(success ? 0 : 1);
}

module.exports = CompletenessValidator;
