#!/usr/bin/env node

/**
 * Analizador simple de calidad de código
 * Identifica funciones largas y complejidad básica
 */

const fs = require('fs');
const path = require('path');

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Find functions
  const functions = [];
  let currentFunction = null;
  let braceCount = 0;
  let lineStart = 0;

  lines.forEach((line, index) => {
    // Detect function start
    if (
      line.match(/function\s+\w+\s*\(/) ||
      line.match(/const\s+\w+\s*=.*=>/)
    ) {
      if (currentFunction) {
        // Save previous function
        currentFunction.lines = index - lineStart + 1;
        functions.push(currentFunction);
      }

      const funcName =
        line.match(/function\s+(\w+)/)?.[1] ||
        line.match(/const\s+(\w+)\s*=/)?.[1] ||
        'anonymous';

      currentFunction = {
        name: funcName,
        startLine: index + 1,
        lines: 0,
        complexity: 1
      };
      lineStart = index;
    }

    // Track braces
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceCount += openBraces - closeBraces;

    // Count complexity indicators
    if (currentFunction) {
      if (line.match(/if\s*\(/)) currentFunction.complexity++;
      if (line.match(/for\s*\(/)) currentFunction.complexity++;
      if (line.match(/while\s*\(/)) currentFunction.complexity++;
      if (line.match(/&&|\|\|/)) currentFunction.complexity++;
    }

    // End function
    if (currentFunction && braceCount === 0) {
      currentFunction.lines = index - lineStart + 1;
      functions.push(currentFunction);
      currentFunction = null;
    }
  });

  // Save last function if exists
  if (currentFunction) {
    currentFunction.lines = lines.length - lineStart;
    functions.push(currentFunction);
  }

  return {
    file: path.basename(filePath),
    totalLines: lines.length,
    functions: functions,
    issues: functions.filter(f => f.lines > 50 || f.complexity > 10)
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node simple-quality-check.js <directory>');
    process.exit(1);
  }

  const targetDir = args[0];
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory not found: ${targetDir}`);
    process.exit(1);
  }

  console.log(`🔍 Analyzing code quality in: ${targetDir}`);

  const jsFiles = fs
    .readdirSync(targetDir)
    .filter(f => f.endsWith('.js'))
    .map(f => path.join(targetDir, f));

  let totalIssues = 0;

  jsFiles.forEach(file => {
    const analysis = analyzeFile(file);
    console.log(`\n📄 ${analysis.file}`);
    console.log(`   Total lines: ${analysis.totalLines}`);
    console.log(`   Functions: ${analysis.functions.length}`);

    if (analysis.issues.length > 0) {
      totalIssues += analysis.issues.length;
      console.log(`   ⚠️  Issues found: ${analysis.issues.length}`);
      analysis.issues.forEach(issue => {
        console.log(
          `      - ${issue.name} (${issue.lines} lines, complexity ${issue.complexity})`
        );
      });
    } else {
      console.log('   ✅ No issues found');
    }
  });

  if (totalIssues > 0) {
    console.log(`\n❌ Found ${totalIssues} code quality issues`);
    process.exit(1);
  } else {
    console.log('\n✅ All files passed quality check');
  }
}

if (require.main === module) {
  main();
}
