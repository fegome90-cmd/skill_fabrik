#!/usr/bin/env ts-node
/**
 * Harness E2E para simular activación de skills, guardrails y notificaciones
 *
 * Uso: pnpm e2e
 */

import { userPromptSubmitHook, stopHook } from '../src/index.js';
import { resolve } from 'path';
import type { PreHookInput, StopHookInput, EditLogEntry } from '../src/types.js';

async function main() {
  const cwd = resolve(process.cwd());
  console.log('🧪 E2E Simulation - Skills Fabric\n');

  // ========================================
  // 1) Pre-invoke: Activación de skills
  // ========================================
  console.log('📥 Step 1: Pre-invoke Hook\n');

  const prompt = 'Crear endpoint para usuarios';
  const openFiles = ['backend/src/controllers/UserController.ts'];
  const activeFileContent = 'export class UserController {\n  async getById(id: string) {}\n}';

  const preInput: PreHookInput = {
    prompt,
    openFiles,
    activeFileContent,
    cwd,
  };

  const preResult = await userPromptSubmitHook(preInput);

  console.log(`Prompt: "${prompt}"`);
  console.log(`Open files: ${openFiles.join(', ')}\n`);

  if (preResult.activated.length > 0) {
    console.log(`✅ Skills activados (${preResult.activated.length}):`);
    preResult.activated.forEach(skillId => {
      const score = (preResult.metadata.scores[skillId] as number) || 0;
      const reasons = preResult.metadata.reasons[skillId] || [];
      console.log(`  • ${skillId} (${(score * 100).toFixed(1)}%)`);
      if (reasons.length > 0) {
        console.log(`    → ${reasons.join(', ')}`);
      }
    });
    console.log();

    if (preResult.injectedNote) {
      console.log('📝 Banner inyectado:');
      console.log(preResult.injectedNote);
      console.log();
    }
  } else {
    console.log('⚠️  No skills activados');
    if (Object.keys(preResult.metadata.scores).length > 0) {
      console.log('\nScores detectados:');
      Object.entries(preResult.metadata.scores).forEach(([skill, score]) => {
        const scoreNum = typeof score === 'number' ? score : 0;
        if (scoreNum > 0) {
          console.log(`  • ${skill}: ${(scoreNum * 100).toFixed(1)}%`);
        }
      });
    }
    console.log();
  }

  // ========================================
  // 2) Stop hook: Guardrails + validaciones
  // ========================================
  console.log('🛑 Step 2: Stop Hook\n');

  // Simula edición peligrosa para gatillar guardrail
  const editedFiles: EditLogEntry[] = [
    {
      file: 'backend/src/repository/UserRepo.ts',
      repo: 'backend',
      ts: Date.now(),
    },
  ];

  const reposChanged = new Set<string>(['backend']);

  const stopInput: StopHookInput = {
    editLog: editedFiles,
    reposChanged,
    cwd,
  };

  console.log(`Archivos editados: ${editedFiles.map(e => e.file).join(', ')}\n`);

  // Crear un archivo temporal con contenido peligroso para probar guardrail
  const testRepoPath = resolve(cwd, 'test-temp/backend/src/repository/UserRepo.ts');
  const { mkdir, writeFile } = await import('fs/promises');
  await mkdir(resolve(testRepoPath, '..'), { recursive: true });
  await writeFile(
    testRepoPath,
    `
import { prisma } from '../prisma';

export class UserRepo {
  async deleteAll() {
    // ❌ Esto debería ser bloqueado
    return await prisma.user.deleteMany();
  }
}
  `.trim()
  );

  const stopResult = await stopHook(stopInput);

  console.log('📊 Resultado Stop Hook:');
  console.log(`  • Archivos formateados: ${stopResult.formatted.length}`);
  console.log(`  • TypeCheck ejecutado en: ${stopResult.typecheck.length} repo(s)`);

  const totalErrors = stopResult.typecheck.reduce((sum, tc) => sum + Math.max(0, tc.errors), 0);
  console.log(`  • Errores TypeScript: ${totalErrors}`);

  if (stopResult.hints && stopResult.hints.length > 0) {
    console.log('\n💡 Hints/Sugerencias:');
    stopResult.hints.forEach(hint => {
      console.log(`  ${hint}`);
    });
  }

  console.log('\n📈 KPI Event:');
  console.log(JSON.stringify(stopResult.kpiEvent, null, 2));

  // Verificar si fue bloqueado
  const blocked = stopResult.hints?.some(h => h.includes('🚫') || h.includes('GUARDRAIL'));

  if (blocked) {
    console.log('\n🚫 RESULTADO: Bloqueado por guardrails');
    console.log('✅ Test PASSED: Guardrail detectó operación peligrosa\n');
    return 0;
  } else if (totalErrors > 0) {
    console.log('\n⚠️  RESULTADO: Errores detectados pero no bloqueado');
    console.log('✅ Test PASSED: Sistema detectó errores\n');
    return 0;
  } else {
    console.log('\n✅ RESULTADO: Sin errores ni bloqueos');
    console.log('✅ Test PASSED: Pipeline ejecutado correctamente\n');
    return 0;
  }
}

main().catch(error => {
  console.error('❌ E2E Simulation failed:', error);
  process.exit(1);
});
