#!/usr/bin/env node

/**
 * Analizador de calidad de código
 * Mide complejidad, identifica funciones largas y sugiere optimizaciones
 * Previene acumulación de deuda técnica
 */

const fs = require('fs');

// Constants - Clean Code: Límites de calidad de código
const MAX_FUNCTION_LINES = 50;
const MAX_CYCLOMATIC_COMPLEXITY = 10;
const MAX_COGNITIVE_COMPLEXITY = 15;
const MAX_PARAMETERS = 5;
const MAX_INDENT_LEVELS = 4;
const HIGH_COMPLEXITY_THRESHOLD = 8;
const MAX_GOOD_SCORE = 85;
const MIN_ACCEPTABLE_SCORE = 70;

/**
 * Analiza complejidad de una función JavaScript
 * @param {string} code - Código de la función a analizar
 * @returns {Object} - Métricas de complejidad
 */
function analyzeComplexity(code) {
  const complexity = {
    cognitive: 0,
    cyclomatic: 1,
    lines: code.split('\n').length,
    indent: 0,
    hasErrorHandling: false,
    hasAsyncOperations: false,
    hasNestedLoops: false,
    hasConditionals: false,
    parameters: 0,
    returnStatements: 0
  };

  // Count parameters
  const paramMatch = code.match(/function\s*\([^)]*\)/);
  if (paramMatch) {
    complexity.parameters = paramMatch[1]
      .split(',')
      .filter(p => p.trim()).length;
  }

  // Count cognitive complexity indicators
  const cognitiveIndicators = [
    /if\s*\(/g,
    /else\s+if/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /do\s*{/g,
    /switch\s*\(/g,
    /catch\s*\(/g,
    /case\s+.*:/g,
    /\?\s*[^:]+:/g,
    /&&/g,
    /\|\|/g
  ];

  cognitiveIndicators.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      complexity.cognitive += matches.length;
    }
  });

  // Count cyclomatic complexity indicators
  const cyclomaticIndicators = [
    /if\s*\(/g,
    /else\s+if/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /do\s*{/g,
    /switch\s*\(/g,
    /catch\s*\(/g,
    /case\s+.*:/g
  ];

  cyclomaticIndicators.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      complexity.cyclomatic += matches.length;
    }
  });

  // Check for other quality indicators
  complexity.hasErrorHandling = /try\s*{|catch\s*\(|throw\s+/g.test(code);
  complexity.hasAsyncOperations = /async\s+|await\s+|\.then\(|\.catch\(/g.test(
    code
  );
  complexity.hasNestedLoops = /(for|while).*\n\s*(for|while)/.test(code);
  complexity.hasConditionals = /if\s*\(/.test(code);
  complexity.returnStatements = (code.match(/return\s+[^;]+;/g) || []).length;

  // Calculate maximum indentation
  const lines = code.split('\n');
  lines.forEach(line => {
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent > complexity.indent) {
      complexity.indent = indent;
    }
  });

  return complexity;
}

/**
 * Sugiere refactorización para función compleja
 * @param {Object} complexity - Métricas de complejidad
 * @param {string} functionName - Nombre de la función
 * @returns {Array} - Lista de sugerencias
 */
function suggestRefactoring(complexity, functionName) {
  const suggestions = [];

  if (complexity.lines > MAX_FUNCTION_LINES) {
    suggestions.push(
      `${functionName}: Considerar dividir función (${complexity.lines} líneas)`
    );
  }

  if (complexity.cyclomatic > MAX_CYCLOMATIC_COMPLEXITY) {
    suggestions.push(
      `${functionName}: Alta complejidad ciclomática (${complexity.cyclomatic}) - extraer lógica`
    );
  }

  if (complexity.cognitive > MAX_COGNITIVE_COMPLEXITY) {
    suggestions.push(
      `${functionName}: Alta complejidad cognitiva (${complexity.cognitive}) - simplificar lógica`
    );
  }

  if (complexity.parameters > MAX_PARAMETERS) {
    suggestions.push(
      `${functionName}: Demasiados parámetros (${complexity.parameters}) - considerar objeto de opciones`
    );
  }

  if (complexity.indent > MAX_INDENT_LEVELS) {
    suggestions.push(
      `${functionName}: Anidamiento profundo (${complexity.indent} niveles) - extraer nested logic`
    );
  }

  if (complexity.hasNestedLoops && !complexity.hasAsyncOperations) {
    suggestions.push(
      `${functionName}: Bucles anidados detectados - considerar usar funciones auxiliares`
    );
  }

  if (
    complexity.hasConditionals &&
    complexity.cyclomatic > HIGH_COMPLEXITY_THRESHOLD
  ) {
    suggestions.push(
      `${functionName}: Múltiples condicionales - considerar early returns o strategy pattern`
    );
  }

  if (!complexity.hasErrorHandling && complexity.hasAsyncOperations) {
    suggestions.push(`${functionName}: Operaciones async sin error handling`);
  }

  return suggestions;
}

/**
 * Analiza calidad de un archivo JavaScript
 * @param {string} filePath - Ruta del archivo a analizar
 * @returns {Object} - Reporte de calidad del archivo
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Find function definitions
    const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)/g);
    const arrowFunctionMatches = content.match(
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>/g
    );
    const methodMatches = content.match(/\w+\s*\([^)]*\)\s*{/g);

    const functions = [
      ...(functionMatches || []).map(m => ({ type: 'function', signature: m })),
      ...(arrowFunctionMatches || []).map(m => ({
        type: 'arrow',
        signature: m
      })),
      ...(methodMatches || []).map(m => ({ type: 'method', signature: m }))
    ];

    const analysis = {
      filePath,
      totalFunctions: functions.length,
      functions: [],
      overallScore: 100,
      issues: []
    };

    functions.forEach((func, index) => {
      const funcName =
        func.signature.match(/function\s+(\w+)/)?.[1] ||
        func.signature.match(/const\s+(\w+)/)?.[1] ||
        func.signature.match(/(\w+)\s*\(/)?.[1] ||
        `function_${index}`;

      // Extract function body (simplified)
      const startIndex = content.indexOf(func.signature);
      let braceCount = 0;
      let endIndex = startIndex;
      let inFunction = false;

      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') {
          if (!inFunction) {
            inFunction = true;
          }
          braceCount++;
        } else if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0 && inFunction) {
            endIndex = i + 1;
            break;
          }
        }
      }

      const functionCode = content.substring(startIndex, endIndex);
      const complexity = analyzeComplexity(functionCode);
      const suggestions = suggestRefactoring(complexity, funcName);

      analysis.functions.push({
        name: funcName,
        type: func.type,
        complexity,
        suggestions
      });

      // Penalize overall score for complexity issues
      suggestions.forEach(() => {
        analysis.overallScore -= 5;
      });
    });

    // Ensure score doesn't go negative
    analysis.overallScore = Math.max(0, analysis.overallScore);

    return analysis;
  } catch (error) {
    return {
      filePath,
      error: error.message,
      overallScore: 0
    };
  }
}

/**
 * Genera reporte en formato legible
 * @param {Object} analysis - Resultado del análisis
 * @returns {string} - Reporte formateado
 */
function generateQualityReport(analysis) {
  let report = '\n## 📊 Code Quality Analysis Report\n\n';

  if (analysis.error) {
    report += `❌ Error: ${analysis.error}\n`;
    return report;
  }

  report += `**File**: ${analysis.filePath}\n`;
  report += `**Overall Score**: ${analysis.overallScore}/100\n`;
  report += `**Functions**: ${analysis.totalFunctions}\n\n`;

  if (analysis.functions.length > 0) {
    analysis.functions.forEach(func => {
      if (func.suggestions.length > 0) {
        report += `### ${func.name}\n`;
        report += `- **Complexity**: ${func.complexity.cyclomatic}\n`;
        report += `- **Lines**: ${func.complexity.lines}\n`;
        report += `- **Issues**: ${func.suggestions.length}\n`;
        func.suggestions.forEach(suggestion => {
          report += `  - ${suggestion}\n`;
        });
        report += '\n';
      }
    });
  }

  return report;
}

// CLI functionality
function main(args = process.argv.slice(2)) {
  if (args.length === 0) {
    console.log('🔍 Code Quality Analyzer');
    console.log('Usage: node code-quality-analyzer.js <file>');
    console.log(
      'Example: node code-quality-analyzer.js src/scripts/example.js'
    );
    process.exit(1);
  }

  const targetFile = args[0];
  if (!fs.existsSync(targetFile)) {
    console.error(`❌ File not found: ${targetFile}`);
    process.exit(1);
  }

  console.log(`🔍 Analyzing code quality: ${targetFile}`);
  const analysis = analyzeFile(targetFile);
  const report = generateQualityReport(analysis);

  console.log(report);

  if (analysis.overallScore < MIN_ACCEPTABLE_SCORE) {
    console.log(
      `\n❌ Code quality score: ${analysis.overallScore}/100 (Needs improvement)`
    );
    process.exit(1);
  } else if (analysis.overallScore < MAX_GOOD_SCORE) {
    console.log(
      `\n⚠️  Code quality score: ${analysis.overallScore}/100 (Good, but can be improved)`
    );
  } else {
    console.log(
      `\n✅ Code quality score: ${analysis.overallScore}/100 (Excellent)`
    );
  }
}

// Export para uso como módulo
module.exports = {
  analyzeComplexity,
  suggestRefactoring,
  analyzeFile,
  generateQualityReport
};

// Ejecutar como CLI si se llama directamente
if (require.main === module) {
  main();
}
