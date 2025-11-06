/**
 * Comando: prompt-builder (v2 mejorado)
 * Genera prompts optimizados para activar skills según heurística multi-señal
 * Integra Template v1.1.0, TAGs system, detección de archivos reales, y patrones aprendidos
 */

import { Command } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { buildOptimizedPrompt } from '../utils/prompt-builder.js';
import { buildOptimizedPromptV2 } from '../utils/prompt-builder-v2.js';
import { Logger } from '../core/logger.js';

export function promptBuilderCommand(program: Command) {
  const cmd = program
    .command('prompt-builder')
    .description('Genera prompt optimizado para activar skills (v2 con mejoras del sprint)')
    .argument('<skill-id>', 'ID del skill a activar (o múltiples separados por coma)')
    .argument('<description>', 'Descripción de la tarea')
    .option('--include-files', 'Incluir sugerencias de archivos reales detectados', true)
    .option('--include-content', 'Incluir snippets de contenido', true)
    .option('--include-template', 'Incluir estructura Template v1.1.0 (8/8 componentes)', false)
    .option('--include-tags', 'Incluir TAGs system (coverage ≥60%)', false)
    .option('--include-plan-context', 'Incluir contexto de plan activo si está aprobado', false)
    .option('--multiple-skills', 'Permitir múltiples skills separados por coma en skill-id', false)
    .option('--show-score', 'Mostrar score esperado y desglose detallado', false)
    .option('--v2', 'Usar versión v2 mejorada con todas las lecciones aprendidas', true)
    .option('--track', 'Registrar evento de activación PBv2 en obs/kpi', false)
    .option('--no-audit', 'Desactivar la sección de auditoría (Audit 4D)', false)
    .option('--raw', 'Generar prompt mínimo (sin template, tags, files, content, ni auditoría)', false)
    .option('--validate', 'Validar activación contra daemon /activate (si disponible)', false)
    .action(async (skillId: string, description: string, options: {
      includeFiles?: boolean;
      includeContent?: boolean;
      includeTemplate?: boolean;
      includeTags?: boolean;
      includePlanContext?: boolean;
      multipleSkills?: boolean;
      showScore?: boolean;
      v2?: boolean;
      complexity?: string;
      duration?: string;
      enableValidation?: boolean;
      batch?: boolean;
      track?: boolean;
      noAudit?: boolean;
      raw?: boolean;
      validate?: boolean;
    }) => {
      try {
        const useV2 = options.v2 !== false; // Por defecto usar v2
        
        // Parsear múltiples skills si está habilitado
        const skillIds = options.multipleSkills && skillId.includes(',')
          ? skillId.split(',').map(s => s.trim())
          : [skillId];

        Logger.info(`Generando prompt optimizado para skill(s): ${skillIds.join(', ')} (v${useV2 ? '2' : '1'})`);

        let result;
        if (useV2) {
          const v2Opts: any = {
            skillIds: skillIds,
            description,
            includeFiles: options.includeFiles !== false,
            includeContent: options.includeContent !== false,
            includeTemplate: options.includeTemplate === true,
            includeTags: options.includeTags === true,
            includePlanContext: options.includePlanContext === true,
            complexity: (options.complexity as any) || 'medium',
            duration: options.duration,
            enableValidation: options.enableValidation === true,
            enableBatchCreation: options.batch === true && skillIds.length >= 4,
          };

          if (options.raw) {
            v2Opts.includeFiles = false;
            v2Opts.includeContent = false;
            v2Opts.includeTemplate = false;
            v2Opts.includeTags = false;
          }

          result = await buildOptimizedPromptV2({
            ...v2Opts,
          });
        } else {
          result = await buildOptimizedPrompt({
            skillId: skillIds[0],
            description,
            includeFiles: options.includeFiles !== false,
            includeContent: options.includeContent !== false,
          });
        }

        // Opcionalmente limpiar auditoría para --no-audit / --raw
        let outputPrompt: string = result.prompt;
        if (options.noAudit || options.raw) {
          const idx = outputPrompt.indexOf('\n---\nAudit 4D: ');
          if (idx !== -1) {
            outputPrompt = outputPrompt.slice(0, idx);
          }
        }

        console.log('\n📝 PROMPT OPTIMIZADO:\n');
        console.log(outputPrompt);
        console.log('');

        // Tracking opcional de evento PBv2 - OPTIMIZADO FASE 1: Async non-blocking
        if (options.track) {
          // Execute in background without blocking response
          setImmediate(async () => {
            try {
              const { mkdir, appendFile } = await import('fs/promises');
              const { resolve } = await import('path');
              const { createHash } = await import('crypto');
              const outDir = resolve(process.cwd(), 'dev/agent-dev-docs');
              await mkdir(outDir, { recursive: true });
              const descHash = createHash('sha256').update(description).digest('hex');
              const event = {
                ts: new Date().toISOString(),
                kind: 'pb2_eval_cli',
                desc_hash: descHash,
                skills: (result.skillActivation || []).map((a: any) => ({ skillId: a.skillId, score: Number(a.score || 0) })),
                signals: {
                  keywords: result.signals?.keywords?.length || 0,
                  intent: result.signals?.intent?.length || 0,
                  paths: result.signals?.paths?.length || 0,
                  content: result.signals?.content?.length || 0,
                }
              };
              await appendFile(resolve(outDir, 'pb2-activations.jsonl'), JSON.stringify(event) + '\n', 'utf-8');
              console.log('📝 PBv2 tracking: dev/agent-dev-docs/pb2-activations.jsonl');
            } catch {
              // Non-fatal tracking error
            }
          });
        }

        // Validación opcional contra daemon /activate
        if (options.validate) {
          try {
            const { post } = await import('../lib/http.js');
            const body = {
              intent: description,
              context: { files: [], activeFile: '', activeFileContent: '', workingDirectory: process.cwd(), editor: 'cli' },
              options: { threshold: 0.6, maxResults: 5, includeMetadata: true }
            };
            const { ok, status, json } = await post('/activate', body);
            if (!ok) {
              console.log(`\n❌ Validación falló (status ${status})`);
            } else {
              const activated = Array.isArray(json?.results) ? json.results.map((r: any) => r.skillId) : [];
              const expected = (result.skillActivation || [])
                .filter((a: any) => a.score >= 0.6)
                .map((a: any) => a.skillId);
              console.log('\n🔎 Validación daemon /activate:');
              console.log(`  PBv2 activaría: ${expected.length ? expected.join(', ') : '—'}`);
              console.log(`  Daemon activó: ${activated.length ? activated.join(', ') : '—'}`);
              const overlap = expected.filter((s: string) => activated.includes(s));
              console.log(`  Overlap: ${overlap.length} ${overlap.length ? '(' + overlap.join(', ') + ')' : ''}`);
            }
          } catch (e) {
            console.log('\n⚠️  No se pudo validar contra daemon (post /activate no disponible)');
          }
        }

        if (options.showScore) {
          console.log('📊 DESGLOSE DETALLADO:\n');
          console.log(`Score esperado: ${result.expectedScore.toFixed(2)} / 1.0`);
          console.log(`Threshold: 0.6`);
          console.log(`Activaría skill(s): ${result.expectedScore >= 0.6 ? '✅ SÍ' : '❌ NO'}`);
          
          if (result.templateScore) {
            console.log(`Template v1.1.0: ${result.templateScore >= 1.0 ? '✅ 8/8 componentes' : '⚠️ Incompleto'}`);
          }
          
          if (result.tagsCoverage !== undefined) {
            const coveragePercent = (result.tagsCoverage * 100).toFixed(0);
            console.log(`TAGs coverage: ${coveragePercent}% ${result.tagsCoverage >= 0.6 ? '✅' : '⚠️ (recomendado: ≥60%)'}`);
          }
          
          if (result.planContext) {
            console.log(`Plan activo: ✅ ${result.planContext.planId || 'N/A'}`);
          }

          console.log('');
          console.log('Señales utilizadas:');
          console.log(`  Keywords (20%): ${result.signals.keywords.length > 0 ? '✓ ' + result.signals.keywords.join(', ') : '✗'}`);
          console.log(`  Intent (30%): ${result.signals.intent.length > 0 ? '✓ ' + result.signals.intent.length + ' pattern(s)' : '✗'}`);
          console.log(`  Path (30%): ${result.signals.paths.length > 0 ? '✓ ' + result.signals.paths.slice(0, 3).join(', ') + (result.signals.paths.length > 3 ? '...' : '') : '✗'}`);
          console.log(`  Content (20%): ${result.signals.content.length > 0 ? '✓ ' + result.signals.content.length + ' snippet(s)' : '✗'}`);
          
          if (result.signals.tags && result.signals.tags.length > 0) {
            console.log(`  TAGs: ✓ ${result.signals.tags.length} tags aplicados`);
          }
          
          if (result.signals.templateComponents) {
            console.log(`  Template Components: ✓ ${result.signals.templateComponents.length}/8`);
          }

          console.log('');
          if (result.skillActivation.length > 0) {
            console.log('Activación por skill:');
            for (const activation of result.skillActivation) {
              console.log(`  • ${activation.skillId}: ${activation.score.toFixed(2)} (${activation.reasons.join(', ')})`);
            }
          }
        }

        // Guardar prompt a archivo para ubicarlo fácilmente - OPTIMIZADO FASE 1: Async non-blocking
        setImmediate(async () => {
          try {
            const outDir = resolve(process.cwd(), 'docs/generated-prompts');
            await mkdir(outDir, { recursive: true });
            const primarySkill = (Array.isArray(skillIds) && skillIds.length > 0 ? skillIds[0] : 'prompt')
              .replace(/[^a-z0-9-_]/gi, '-')
              .toLowerCase();
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const outPath = resolve(outDir, `${ts}-${primarySkill}.md`);
            await writeFile(outPath, result.prompt, 'utf-8');
            console.log(`\n🗂️  Guardado en: ${outPath}`);
          } catch {
            // Si no se puede guardar, continuar silenciosamente
          }
        });

        console.log('\n💡 Copia el prompt generado y úsalo en tu editor/Cursor');
        
        if (result.expectedScore < 0.6) {
          console.log('\n⚠️  Score bajo (<0.6). Considera:');
          console.log('  • Usar --include-files para detectar archivos reales');
          console.log('  • Usar --include-template para estructura completa');
          console.log('  • Usar --include-tags para mejorar coverage');
        }
        
        if (useV2 && !options.includeTemplate && !options.includeTags) {
          console.log('\n💡 Tip: Usa --include-template y --include-tags para prompts más completos');
        }
        
        console.log('');

        // Asegurar cierre limpio del proceso tras imprimir y guardar
        process.exit(0);

      } catch (error) {
        Logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
  
  return cmd;
}
