#!/usr/bin/env node
/**
 * Dev-Docs Guard (CLOOP DocOps)
 * Verifica C1–C8 en plan.md y presencia de KPIs en task.md.
 * Uso: node scripts/dev-docs-guard.mjs dev/daemon-infalible-sprint
 */
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || 'dev/daemon-infalible-sprint';
const planPath = path.join(root, 'plan.md');
const taskPath = path.join(root, 'task.md');

const requiredHeaders = [
  '## CONTEXTO (C1)',
  '## OBJETIVOS SMART (C2)',
  '## ALCANCE/LIMITES (C3)',
  '## PLAN CLOOP (C4)',
  '## RIESGOS/MITIGACIONES (C5)',
  '## ENTREGABLES/DoD (C6)',
  '## KPIs/MÉTRICAS (C7)',
  '## GOBERNANZA/GATES (C8)'
];

let fails = 0;

function ensureFile(p) {
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing file: ${p}`);
    fails++;
    return '';
  }
  return fs.readFileSync(p, 'utf8');
}

const planTxt = ensureFile(planPath);
const taskTxt = ensureFile(taskPath);

if (planTxt) {
  for (const h of requiredHeaders) {
    if (!planTxt.includes(h)) {
      console.error(`❌ ${path.basename(planPath)} falta sección: ${h}`);
      fails++;
    }
  }
}

if (taskTxt) {
  const hasKpi = /\bkpi:\s*/i.test(taskTxt);
  if (!hasKpi) {
    console.error(`❌ ${path.basename(taskPath)}: no se encontraron marcadores KPI ("kpi:")`);
    fails++;
  }
}

if (fails) {
  if (process.env.DOCOPS_WARN_ONLY === '1') {
    console.warn('⚠️ Dev-Docs Guard WARN (no bloquea por DOCOPS_WARN_ONLY=1)');
    process.exit(0);
  }
  console.error(`❌ Dev-Docs Guard FAILS = ${fails}`);
  process.exit(2);
}

console.log('✅ Dev-Docs Guard PASS');
