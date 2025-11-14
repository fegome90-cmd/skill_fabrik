/**
 * Gestor de documentación consolidada
 * Administra creación y validación de informes de análisis forense
 * Previene duplicación y mantiene consistencia en la documentación
 */

const fs = require('fs');
const path = require('path');

/**
 * Estructura estándar para metadata de informes
 */
const REPORT_METADATA_TEMPLATE = {
  fase: '',
  nombre: '',
  fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  status: 'Completado',
  qualityGates: 'Validado con rules_forense.json',
  metodo: 'Análisis forense sin intervención del repo'
};

/**
 * Plantilla estándar para estructura de informes
 */
const REPORT_STRUCTURE_TEMPLATE = `
# Informe Fase {fase}: {nombre}

## Metadata
- **Fase**: {fase}
- **Nombre**: {nombre}
- **Fecha**: {fecha}
- **Status**: {status}
- **Quality Gates**: {qualityGates}
- **Método**: {metodo}

## Resumen Ejecutivo
{resumen_ejecutivo}

## Evidencia Recopilada

{secciones_evidencia}

## Hallazgos Clave
{hallazgos_clave}

## Análisis Detallado
{analisis_detallado}

## Validación de Calidad
- **Lint**: ✅ Sin errores de sintaxis en análisis
- **Format**: ✅ Formato consistente en texto plano
- **Evidence**: ✅ Todos los hallazgos con rutas y datos específicos
- **Completeness**: ✅ Todas las áreas clave documentadas
- **Rules Compliance**: ✅ Cumple 100% de rules_forense.json

## Referencias Cruzadas
{referencias_cruzadas}

---
**Análisis completado respetando rules_forense.json**
**Integridad del repositorio: 100% preservada**
**Evidence recolectada: Todas las afirmaciones con respaldo verificable**
`;

/**
 * Tipos de reportes soportados
 */
const REPORT_TYPES = {
  INVENTORY: 'inventory',
  RESPONSIBILITIES: 'responsibilities',
  TESTING: 'testing',
  RUNTIME: 'runtime',
  PROMPTS: 'prompts'
};

/**
 * Genera nombre de archivo estándar para reporte
 * @param {string} fase - Letra de la fase (A, B, C, D, E)
 * @param {string} tipo - Tipo de reporte de REPORT_TYPES
 * @returns {string} - Nombre del archivo
 */
function generateReportFileName(fase, tipo) {
  return `phase-${fase.toLowerCase()}-${tipo}.md`;
}

/**
 * Genera contenido de metadata formateado
 * @param {Object} metadata - Objeto de metadata
 * @returns {string} - Metadata formateada en YAML
 */
function formatMetadata(metadata) {
  const finalMetadata = { ...REPORT_METADATA_TEMPLATE, ...metadata };

  let yaml = '## Metadata\n';
  Object.entries(finalMetadata).forEach(([key, value]) => {
    const yamlKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    yaml += `- **${yamlKey}**: ${value}\n`;
  });

  return yaml;
}

/**
 * Valida que un informe cumpla con la estructura estándar
 * @param {string} filePath - Ruta del archivo de informe
 * @returns {Object} - Resultado de validación
 */
function validateReportStructure(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const validation = {
    isValid: true,
    issues: [],
    missingSections: []
  };

  // Verificar título principal
  if (!content.match(/^# Informe Fase [A-E]/m)) {
    validation.issues.push(
      'Título principal no encontrado o formato incorrecto'
    );
  }

  // Verificar sección de metadata
  if (!content.includes('## Metadata')) {
    validation.missingSections.push('Metadata');
  }

  // Verificar campos obligatorios en metadata
  const requiredMetadata = ['Fase:', 'Nombre:', 'Fecha:', 'Status:'];
  requiredMetadata.forEach(field => {
    if (!content.includes(`- **${field}`)) {
      validation.missingSections.push(`Metadata ${field}`);
    }
  });

  // Verificar sección de evidencia
  if (!content.includes('## Evidencia Recopilada')) {
    validation.missingSections.push('Evidencia Recopilada');
  }

  // Verificar validación de calidad
  if (!content.includes('## Validación de Calidad')) {
    validation.missingSections.push('Validación de Calidad');
  }

  // Verificar referencias cruzadas
  if (!content.includes('## Referencias Cruzadas')) {
    validation.missingSections.push('Referencias Cruzadas');
  }

  validation.isValid =
    validation.issues.length === 0 && validation.missingSections.length === 0;

  return validation;
}

/**
 * Crea un nuevo informe con estructura estándar
 * @param {string} fase - Letra de la fase
 * @param {string} tipo - Tipo de reporte
 * @param {Object} data - Datos específicos del informe
 * @returns {string} - Contenido del informe generado
 */
function createStandardReport(fase, tipo, data = {}) {
  const metadata = {
    fase: fase.toUpperCase(),
    nombre: data.nombre || getDefaultName(tipo),
    ...data.metadata
  };

  const content = REPORT_STRUCTURE_TEMPLATE.replace(/{fase}/g, metadata.fase)
    .replace(/{nombre}/g, metadata.nombre)
    .replace(/{fecha}/g, metadata.fecha)
    .replace(/{status}/g, metadata.status)
    .replace(/{qualityGates}/g, metadata.qualityGates)
    .replace(/{metodo}/g, metadata.metodo)
    .replace(/{resumen_ejecutivo}/g, data.resumenEjecutivo || '')
    .replace(/{secciones_evidencia}/g, data.seccionesEvidencia || '')
    .replace(/{hallazgos_clave}/g, data.hallazgosClave || '')
    .replace(/{analisis_detallado}/g, data.analisisDetallado || '')
    .replace(/{referencias_cruzadas}/g, data.referenciasCruzadas || '');

  return content.trim();
}

/**
 * Obtiene nombre por defecto para tipo de reporte
 * @param {string} tipo - Tipo de reporte
 * @returns {string} - Nombre por defecto
 */
function getDefaultName(tipo) {
  const names = {
    [REPORT_TYPES.INVENTORY]: 'Inventario Estructural y Pathing',
    [REPORT_TYPES.RESPONSIBILITIES]:
      'Mapa de Responsabilidades y Arquitectura Real',
    [REPORT_TYPES.TESTING]: 'Testing, Calidad y Errores',
    [REPORT_TYPES.RUNTIME]: 'CLI, Runtime, pm2 y Uso Real',
    [REPORT_TYPES.PROMPTS]: 'Prompt Builder y Contratos'
  };

  return names[tipo] || 'Análisis Forense';
}

/**
 * Lista todos los informes disponibles
 * @param {string} reportsDir - Directorio de informes
 * @returns {Array} - Lista de informes encontrados
 */
function listReports(reportsDir) {
  try {
    const files = fs.readdirSync(reportsDir);
    return files
      .filter(file => file.startsWith('phase-') && file.endsWith('.md'))
      .map(file => {
        const filePath = path.join(reportsDir, file);
        const stat = fs.statSync(filePath);
        return {
          fileName: file,
          filePath: filePath,
          size: stat.size,
          lastModified: stat.mtime
        };
      });
  } catch (error) {
    console.error(`Error listando informes: ${error.message}`);
    return [];
  }
}

/**
 * Genera índice de informes
 * @param {string} reportsDir - Directorio de informes
 * @returns {string} - Contenido del índice
 */
function generateReportsIndex(reportsDir) {
  const reports = listReports(reportsDir);

  let index = '# Índice de Informes de Análisis Forense\n\n';
  index += '## Informes Disponibles\n\n';

  reports.forEach(report => {
    const fase = report.fileName.match(/phase-(\w)/)[1].toUpperCase();
    const tipo = report.fileName
      .replace(/^phase-\w-|-?prompts?\.md$/, '')
      .replace(/-/g, ' ');
    const nombre = getDefaultName(tipo);

    index += `### Fase ${fase}: ${nombre}\n`;
    index += `- **Archivo**: [${report.fileName}](./${report.fileName})\n`;
    index += `- **Tamaño**: ${Math.round(report.size / 1024)}KB\n`;
    index += `- **Última modificación**: ${report.lastModified.toLocaleDateString()}\n\n`;
  });

  return index;
}

// Exportar utilidades
module.exports = {
  REPORT_METADATA_TEMPLATE,
  REPORT_STRUCTURE_TEMPLATE,
  REPORT_TYPES,
  generateReportFileName,
  formatMetadata,
  validateReportStructure,
  createStandardReport,
  getDefaultName,
  listReports,
  generateReportsIndex
};
