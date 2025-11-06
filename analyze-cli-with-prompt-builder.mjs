#!/usr/bin/env node

/**
 * Script para analizar el CLI de Skills Fabric usando Prompt Builder v2
 * Este script utiliza el sistema de skills para generar un análisis estructurado
 * con Template v1.1.0 y metodología CLOOP
 */

import { buildOptimizedPromptV2 } from './packages/skills-cli/dist/utils/prompt-builder-v2.js';
import { readFile } from 'fs/promises';

async function analyzeCLIWithPromptBuilder() {
  console.log('🔍 Analizando CLI de Skills Fabric con Prompt Builder v2...\n');

  try {
    // Prompt optimizado para análisis del CLI
    const analysisPrompt = `analiza, estructura, comprehensiva: [Context] Analizar la arquitectura del CLI de Skills Fabric. [Learning] Examinar comandos disponibles y su organización. [Options] Identificar patrones de diseño y capacidades. [Outcomes] Generar análisis detallado de estructura y funcionalidad. [Planning] Proponer mejoras y optimizaciones.

[EVIDENCIA] Examinar packages/skills-cli/src/index.ts, estructura de comandos, core modules.
[PROPUESTA] Análisis completo con categorías, comandos, patrones y recomendaciones.

ámbitos: [K:CLI-ARCHITECTURE] [K:COMMAND-STRUCTURE] [K:SKILLS-MANAGEMENT] [C:CLOOP-INTEGRATION] [U:DEV-EXPERIENCE]`;

    // Usar Prompt Builder v2 para generar análisis optimizado
    const optimizedPrompt = await buildOptimizedPromptV2({
      skillId: 'plan-architect', // Usar esta skill para análisis estructurado
      description: analysisPrompt,
      includeFiles: true,
      includeContent: true,
      includeTemplate: true,
      includeTags: true,
      cwd: process.cwd(),
    });

    console.log('📋 Prompt Optimizado Generado:\n');
    console.log('='.repeat(80));
    console.log(optimizedPrompt.prompt);
    console.log('='.repeat(80));

    console.log('\n📊 Métricas del Prompt:');
    console.log(`• Score esperado: ${optimizedPrompt.expectedScore || 'N/A'}`);
    console.log(`• Score Template v1.1.0: ${optimizedPrompt.templateScore || 'N/A'}`);
    console.log(`• Coverage de TAGs: ${optimizedPrompt.tagsCoverage || 'N/A'}%`);

    if (optimizedPrompt.skillActivation?.length > 0) {
      console.log('\n🎯 Skills Activadas:');
      optimizedPrompt.skillActivation.forEach(skill => {
        console.log(`• ${skill.skillId}: ${skill.score.toFixed(2)} (${skill.reasons.join(', ')})`);
      });
    }

    if (optimizedPrompt.signals) {
      console.log('\n📡 Señales Detectadas:');
      console.log(`• Keywords: ${optimizedPrompt.signals.keywords.join(', ')}`);
      console.log(`• Intent: ${optimizedPrompt.signals.intent.join(', ')}`);
      console.log(`• Paths: ${optimizedPrompt.signals.paths.join(', ')}`);
      if (optimizedPrompt.signals.tags) {
        console.log(`• TAGs: ${optimizedPrompt.signals.tags.join(', ')}`);
      }
    }

    if (optimizedPrompt.planContext) {
      console.log('\n📝 Contexto del Plan:');
      console.log(`• Plan ID: ${optimizedPrompt.planContext.planId || 'N/A'}`);
      console.log(`• Task: ${optimizedPrompt.planContext.taskName || 'N/A'}`);
    }

    // Guardar el prompt optimizado para uso posterior
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `docs/generated-prompts/${timestamp}-cli-analysis-prompt-v2.md`;

    try {
      await readFile('docs/generated-prompts'); // Verificar que existe el directorio
    } catch {
      // El directorio no existe, crearlo
      await import('fs/promises').then(fs =>
        fs.mkdir('docs/generated-prompts', { recursive: true })
      );
    }

    await import('fs/promises').then(fs => fs.writeFile(filename, optimizedPrompt.prompt));

    console.log(`\n💾 Prompt guardado en: ${filename}`);
  } catch (error) {
    console.error('❌ Error al generar análisis con Prompt Builder v2:', error);
    console.log('\n🔄 Alternativa: Análisis directo del CLI...');

    // Análisis de respaldo si Prompt Builder v2 falla
    await directCLIAnalysis();
  }
}

async function directCLIAnalysis() {
  try {
    const cliIndex = await readFile('./packages/skills-cli/src/index.ts', 'utf-8');

    // Extraer comandos disponibles
    const commandImports = cliIndex.match(/import.*from\s+['"]\.\/commands\/(.+)\.js['"];?/g);
    const commands =
      commandImports?.map(imp => imp.match(/\/commands\/(.+)\.js/)?.[1]).filter(Boolean) || [];

    console.log('\n📋 Análisis Directo del CLI:');
    console.log(`• Comandos detectados: ${commands.length}`);
    commands.forEach(cmd => console.log(`  - ${cmd}`));

    // Analizar estructura principal
    const hasPreAction = cliIndex.includes('preAction');
    const hasErrorHandling = cliIndex.includes('configureOutput');
    const hasCloopCommands = commands.some(cmd => cmd.includes('cloop') || cmd.includes('plan'));

    console.log('\n🏗️ Características de Arquitectura:');
    console.log(`• Pre-action hooks: ${hasPreAction ? '✅' : '❌'}`);
    console.log(`• Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
    console.log(`• CLOOP integration: ${hasCloopCommands ? '✅' : '❌'}`);
  } catch (error) {
    console.error('❌ Error en análisis directo:', error);
  }
}

// Ejecutar análisis
analyzeCLIWithPromptBuilder().catch(console.error);
