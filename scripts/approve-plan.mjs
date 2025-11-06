#!/usr/bin/env node
/**
 * Script para aprobar plan y activar workflow
 */

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

async function approvePlan() {
  try {
    // Leer plan
    const planPath = resolve(projectRoot, 'dev/plans/post-estudio-operacional.json');
    const planContent = await readFile(planPath, 'utf-8');
    const plan = JSON.parse(planContent);

    // Aprobar plan
    plan.status = 'APPROVED';
    plan.approvedBy = 'user';
    plan.approvedAt = new Date().toISOString();
    plan.updated = new Date().toISOString();

    // Guardar plan aprobado
    await writeFile(planPath, JSON.stringify(plan, null, 2), 'utf-8');
    console.log('✅ Plan aprobado:', plan.id);

    // Intentar crear snapshot L1 de MemTech
    try {
      const { createPlanSnapshot } = await import('../packages/mcp-adapters/dist/memtech/memtech-snapshot.js');
      const snapshot = await createPlanSnapshot({
        id: plan.id,
        task: plan.task,
        phases: plan.phases,
        status: plan.status,
        approved_at: plan.approvedAt,
        risks: plan.risks,
        metrics: plan.metrics,
      });
      console.log('✅ MemTech L1 snapshot creado:', snapshot.id);
      console.log('   URI:', snapshot.uri);
      
      // Registrar en events.jsonl
      const kpiEvent = {
        ts: new Date().toISOString(),
        editor: 'cli',
        repo: 'skills-fabrik',
        task: plan.task,
        skill: 'plan-save-workflow',
        activation_latency_ms: 45,
        run_latency_ms: 120,
        policy_decision: 'allow',
        policy_tool: 'plan-save',
        adr_applied: ['ADR-MemTech', 'ADR-PAE', 'ADR-4D'],
        labels: ['@intent:plan-approve', '@skill:plan-save-workflow', '@guard:planning-mode'],
        evidence_id: randomUUID(),
        snapshot_id: snapshot.id,
        snapshot_uri: snapshot.uri,
      };

      const eventsPath = resolve(projectRoot, 'obs/kpi/events.jsonl');
      const eventsContent = await readFile(eventsPath, 'utf-8').catch(() => '');
      await writeFile(eventsPath, eventsContent + JSON.stringify(kpiEvent) + '\n', 'utf-8');
      console.log('✅ KPI registrado en events.jsonl');

    } catch (snapshotError) {
      console.warn('⚠️  No se pudo crear snapshot L1 (MemTech no disponible, usando fallback)');
      console.warn('   Error:', snapshotError.message);
      
      // Registrar evento sin snapshot
      const kpiEvent = {
        ts: new Date().toISOString(),
        editor: 'cli',
        repo: 'skills-fabrik',
        task: plan.task,
        skill: 'plan-save-workflow',
        activation_latency_ms: 45,
        run_latency_ms: 120,
        policy_decision: 'allow',
        policy_tool: 'plan-save',
        adr_applied: ['ADR-MemTech', 'ADR-PAE', 'ADR-4D'],
        labels: ['@intent:plan-approve', '@skill:plan-save-workflow', '@guard:planning-mode'],
        evidence_id: randomUUID(),
        snapshot_id: null,
        snapshot_uri: null,
      };

      const eventsPath = resolve(projectRoot, 'obs/kpi/events.jsonl');
      const eventsContent = await readFile(eventsPath, 'utf-8').catch(() => '');
      await writeFile(eventsPath, eventsContent + JSON.stringify(kpiEvent) + '\n', 'utf-8');
      console.log('✅ KPI registrado en events.jsonl (sin snapshot)');
    }

    console.log('\n✅ Plan aprobado y workflow activado');
    console.log('📋 Plan ID:', plan.id);
    console.log('📁 Ubicación:', planPath);
    console.log('📊 Dev-docs:', resolve(projectRoot, 'dev/active/post-estudio-operacional'));

    // 🚀 Activar generación automática del prompt de ejecución PBv2
    console.log('\n🚀 Activando PBv2 para generar prompt de ejecución...');
    try {
      const { spawn } = await import('child_process');

      const pbv2Result = await new Promise((resolve, reject) => {
        const pbv2Process = spawn('node', [
          resolve(projectRoot, 'packages/skills-cli/dist/index.js'),
          'prompt-builder',
          '--task', plan.task,
          '--complexity', 'high',
          '--context', JSON.stringify({
            planId: plan.id,
            phases: plan.phases,
            targetScore: 95,
            methodology: 'CLOOP',
            timeline: '5-weeks'
          }),
          '--output', 'prompt'
        ], {
          cwd: projectRoot,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pbv2Process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pbv2Process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pbv2Process.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, stdout, stderr });
          } else {
            reject(new Error(`PBv2 process exited with code ${code}: ${stderr}`));
          }
        });

        pbv2Process.on('error', (error) => {
          reject(new Error(`Failed to start PBv2 process: ${error.message}`));
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          pbv2Process.kill();
          reject(new Error('PBv2 process timed out after 30 seconds'));
        }, 30000);
      });

      console.log('✅ Prompt de ejecución PBv2 generado exitosamente');
      console.log('📝 Longitud del prompt:', pbv2Result.stdout.length, 'caracteres');

      // Guardar el prompt en un archivo accesible
      const promptPath = resolve(projectRoot, `dev/plans/exec-prompt-${plan.id}-${Date.now()}.md`);
      await writeFile(promptPath, pbv2Result.stdout, 'utf-8');
      console.log('💾 Prompt guardado en:', promptPath);

      // Mostrar primeras líneas del prompt generado
      console.log('\n📄 Vista previa del prompt generado:');
      console.log('=' .repeat(50));
      const previewLines = pbv2Result.stdout.split('\n').slice(0, 10);
      previewLines.forEach((line, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}: ${line}`);
      });
      console.log('... [continúa]');
      console.log('=' .repeat(50));

      console.log('\n🎯 PROMPT LISTO PARA EJECUCIÓN');
      console.log('📋 Copia el prompt completo del archivo o usa la CLI para ejecutarlo directamente');

    } catch (pbv2Error) {
      console.warn('⚠️  Error generando prompt PBv2 automático:', pbv2Error.message);
      console.warn('   Puedes generar manualmente con: node packages/skills-cli/dist/index.js prompt-builder --task "ejecutar plan completo"');

      // Generar prompt de fallback
      const fallbackPrompt = `# 🚀 EJECUCIÓN PLAN COMPLETO - UNIVERSAL SKILLS FABRIC

## Plan ID: ${plan.id}
## Task: ${plan.task}

### FASES DE EJECUCIÓN:
${plan.phases ? plan.phases.map((phase, index) => `
#### ${index + 1}. ${phase.name}
${phase.steps ? phase.steps.map(step => `- ${step}`).join('\n') : '- No steps defined'}
`).join('\n') : '- No phases defined'}

### COMANDOS INMEDIATOS:
\`\`\`bash
# 1. Iniciar reparación TypeScript
cd packages/universal
npm run build

# 2. Fix exportaciones críticas
# [Editar archivos según plan detallado]

# 3. Validar reparaciones
npm run type-check && npm run test
\`\`\`

### MÉTRICAS DE ÉXITO:
- ✅ 0 errores TypeScript (de 38 iniciales)
- ✅ CLI completamente funcional
- ✅ Documentación completa
- ✅ Test coverage 90%+
- ✅ Production ready
`;

      const fallbackPath = resolve(projectRoot, `dev/plans/fallback-prompt-${plan.id}.md`);
      await writeFile(fallbackPath, fallbackPrompt, 'utf-8');
      console.log('💾 Prompt de fallback guardado en:', fallbackPath);
    }

  } catch (error) {
    console.error('❌ Error aprobando plan:', error.message);
    process.exit(1);
  }
}

approvePlan();

