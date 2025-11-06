#!/usr/bin/env node
// Prompt Builder v2 smoke dataset runner (P1 skills)
// Runs a small dataset of prompts against buildOptimizedPromptV2 and prints a JSON summary.

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const { buildOptimizedPromptV2 } = await import('../../packages/skills-cli/dist/utils/prompt-builder-v2.js');

  const dataset = [
    { skillId: 'backend-dev-guidelines', desc: 'Crear endpoint /auth/login en Express con validación y controlador' },
    { skillId: 'backend-dev-guidelines', desc: 'Refactor controlador de usuarios y añadir ruta /users/profile' },
    { skillId: 'frontend-dev-guidelines', desc: 'Crear componente Dashboard con hook de datos y vista responsive' },
    { skillId: 'frontend-dev-guidelines', desc: 'Añadir hook useUserProfile y componente ProfileCard' },
    { skillId: 'database-verification', desc: 'Revisar findMany sin filtros en repositorio de usuarios' },
    { skillId: 'database-verification', desc: 'Auditar updateMany masivo y aplicar where correcto' },
    { skillId: 'secrets-and-config', desc: 'Verificar API_KEY y SECRET en archivos de configuración' },
    { skillId: 'secrets-and-config', desc: 'Auditar .env y variables TOKEN antes de despliegue' },
  ];

  const results = [];
  for (const item of dataset) {
    const out = await buildOptimizedPromptV2({
      skillIds: [item.skillId],
      description: item.desc,
      includeFiles: true,
      includeContent: true,
      includeTemplate: true,
      includeTags: true,
      complexity: 'medium',
    });
    results.push({
      skillId: item.skillId,
      desc: item.desc,
      expectedScore: Number(out.expectedScore.toFixed(2)),
      pass: out.expectedScore >= 0.6,
      signals: {
        keywords: out.signals.keywords.length,
        intent: out.signals.intent.length,
        paths: out.signals.paths.length,
        content: out.signals.content.length,
      },
    });
  }

  const summary = {
    timestamp: new Date().toISOString(),
    passRate: `${results.filter(r => r.pass).length}/${results.length}`,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));

  try {
    const outDir = resolve('docs/test-outputs');
    await mkdir(outDir, { recursive: true });
    const outFile = resolve(outDir, `pb2-smoke-${Date.now()}.json`);
    await writeFile(outFile, JSON.stringify(summary, null, 2), 'utf8');
    console.error(`Saved: ${outFile}`);
  } catch {}
}

main().catch((e) => { console.error(e); process.exit(1); });

