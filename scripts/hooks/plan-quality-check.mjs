#!/usr/bin/env node

import { readFile } from 'fs/promises';

const REQUIRED_CHECKS = [
  { label: 'Frontmatter meta', test: content => /^---[\s\S]*?meta:/m.test(content) },
  { label: 'CLARIFY section', test: content => /##\s+.*CLARIFY/i.test(content) },
  { label: 'LAYOUT section', test: content => /##\s+.*LAYOUT/i.test(content) },
  { label: 'OPERATE section', test: content => /##\s+.*OPERATE/i.test(content) },
  { label: 'OBSERVE section', test: content => /##\s+.*OBSERVE/i.test(content) },
  { label: 'REFLECT section', test: content => /##\s+.*REFLECT/i.test(content) },
  { label: 'Objetivos SMART', test: content => /Objetivos\s+SMART/i.test(content) },
  { label: 'Mini-Task entries', test: content => /Mini-Task/i.test(content) },
  { label: 'Métricas table', test: content => /\|\s*Métrica\s*\|/i.test(content) },
  { label: 'Tests ejecutables', test: content => /Tests\s+Ejecutables/i.test(content) },
  { label: 'Handoff checklist', test: content => /Handoff/i.test(content) },
  { label: 'Auditoría 4D', test: content => /Auditoría\s*4D/i.test(content) },
  { label: 'Anti-drift markers', test: content => /Anti-Drift/i.test(content) },
  { label: 'Template checklist', test: content => /Template\s+v1\.1\.0/i.test(content) }
];

export function validatePlanQuality(content) {
  const missingSections = REQUIRED_CHECKS.filter(check => !check.test(content)).map(
    check => check.label
  );

  const warnings = [];
  if (!/\[K:[A-Z-]+\]/.test(content)) {
    warnings.push('Sin TAGs [K:/C:/U:] detectados');
  }
  if (!/\`pnpm.*\`/.test(content)) {
    warnings.push('Sin comandos de verificación formateados');
  }

  return {
    passed: missingSections.length === 0,
    missingSections,
    warnings,
    totalChecks: REQUIRED_CHECKS.length,
  };
}

async function readStdIn() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function runCli() {
  const args = process.argv.slice(2);
  let filePath;
  let useStdin = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file' || arg === '-f') {
      filePath = args[++i];
    } else if (arg === '--stdin') {
      useStdin = true;
    } else if (!filePath && !arg.startsWith('-')) {
      filePath = arg;
    }
  }

  if (!filePath && !useStdin) {
    console.error('Usage: plan-quality-check.mjs --file <path> | --stdin');
    process.exit(1);
  }

  const content = useStdin ? await readStdIn() : await readFile(filePath, 'utf-8');
  const report = validatePlanQuality(content);

  if (report.passed) {
    console.log(`✅ Plan quality check passed (${report.totalChecks}/${report.totalChecks})`);
    if (report.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${report.warnings.join(', ')}`);
    }
    process.exit(0);
  } else {
    console.error(`❌ Missing sections: ${report.missingSections.join(', ')}`);
    if (report.warnings.length > 0) {
      console.error(`⚠️  Warnings: ${report.warnings.join(', ')}`);
    }
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
