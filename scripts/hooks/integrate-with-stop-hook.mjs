#!/usr/bin/env node

/**
 * Integración con Stop Hook existente
 *
 * Este script demuestra cómo integrar PBv2 con el Stop Hook de Claude Code
 * sin modificar el código existente.
 *
 * Uso:
 *   node scripts/hooks/integrate-with-stop-hook.mjs --output "texto" --cwd "/path"
 */

import { pbv2StopHook } from './pbv2-integration.mjs';

// Simulación del Stop Hook existente con PBv2 integrado
async function enhancedStopHook(context) {
  const { editLog, reposChanged, cwd, mode, autoGitDiff, verbose } = context;

  // ... código existente del Stop Hook ...

  // NUEVA FUNCIONALIDAD: Integrar PBv2
  // Detectar si hay salida de Claude Code para procesar
  // (En implementación real, esto vendría del contexto de Claude Code)

  // Simular captura de output de Claude Code
  // En la integración real, esto se haría antes del procesamiento final

  // EJEMPLO DE INTEGRACIÓN:
  /*
  const claudeOutput = context.claudeOutput; // Suponiendo que existe
  if (claudeOutput) {
    const pbv2Result = await pbv2StopHook(claudeOutput, { cwd, verbose });
    if (pbv2Result.processed) {
      context.pbv2Integration = pbv2Result;
    }
  }
  */

  // Continuar con el flujo normal del Stop Hook...
  return {
    success: true,
    mode: mode,
    processed: true,
    pbv2Integrated: false // Se cambiaría a true cuando haya output
  };
}

// Modo standalone para testing
async function standaloneMode(output, cwd) {
  console.log('🔧 PBv2 Integration - Standalone Mode\n');
  console.log('='.repeat(60));

  try {
    const result = await pbv2StopHook(output, { cwd, verbose: true });

    console.log('\n' + '='.repeat(60));
    console.log('📊 INTEGRATION RESULT');
    console.log('='.repeat(60));

    if (result.processed) {
      console.log('✅ Plan procesado exitosamente');
      console.log('   Acción:', result.action);

      if (result.savedPath) {
        console.log('   Guardado en:', result.savedPath);
      }

      if (result.pb2Result) {
        console.log('\n📈 Métricas PBv2:');
        console.log('   Latencia:', result.pb2Result.latency_ms, 'ms');
        console.log('   Score:', result.pb2Result.expectedScore?.toFixed(2) || 'N/A');
        console.log('   Skills:', result.pb2Result.skillActivation?.length || 0);
        console.log('   Tags:', result.pb2Result.signals?.tags?.length || 0);
      }
    } else {
      console.log('⚠️ No se detectó plan');
      console.log('   Razón:', result.reason);
    }

    console.log('\n📁 Archivos generados:');
    const { planCache } = await import('./plan-detector.mjs');
    const stats = planCache.getStats();
    console.log('   Cache size:', stats.size);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Parse argumentos
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    output: '',
    cwd: process.cwd(),
    mode: 'standalone',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
        result.output = args[++i];
        break;
      case '--cwd':
        result.cwd = args[++i];
        break;
      case '--mode':
        result.mode = args[++i];
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

function showHelp() {
  console.log(`
PBv2 Integration with Claude Code Stop Hook

USAGE:
  node scripts/hooks/integrate-with-stop-hook.mjs [OPTIONS]

OPTIONS:
  --output <text>          Output from Claude Code to analyze
  --cwd <path>             Working directory (default: current)
  --mode <mode>            Mode: standalone | hook
  --help, -h               Show this help message

EXAMPLES:
  # Standalone testing
  node scripts/hooks/integrate-with-stop-hook.mjs \\
    --output "[Layout] Plan de desarrollo..."

  # Hook integration example
  node scripts/hooks/integrate-with-stop-hook.mjs --mode hook

INTEGRATION:
  To integrate with existing Stop Hook, add this to your hook:

  import { pbv2StopHook } from './pbv2-integration.mjs';

  async function yourStopHook(context) {
    // Your existing code...

    // Add PBv2 integration
    if (context.claudeOutput) {
      const result = await pbv2StopHook(context.claudeOutput, context);
      context.pbv2Integration = result;
    }

    // Continue with normal processing...
  }

RETURN:
  JSON result with PBv2 integration status and metrics
`);
}

// Main
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.mode === 'standalone') {
    if (!args.output) {
      console.error('Error: --output is required for standalone mode');
      showHelp();
      process.exit(1);
    }

    standaloneMode(args.output, args.cwd)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  } else if (args.mode === 'hook') {
    console.log('🔧 Hook Integration Mode\n');
    console.log('To integrate with your existing Stop Hook:\n');
    console.log('1. Import the integration:');
    console.log('   import { pbv2StopHook } from "./pbv2-integration.mjs";\n');
    console.log('2. Add to your Stop Hook:');
    console.log('   if (context.claudeOutput) {');
    console.log('     const result = await pbv2StopHook(context.claudeOutput, context);');
    console.log('     context.pbv2Integration = result;');
    console.log('   }\n');
    console.log('3. The integration will automatically:');
    console.log('   - Detect plans in Claude output');
    console.log('   - Activate PBv2');
    console.log('   - Save results to dev/plans/');
    console.log('   - Log metrics');
    console.log('\n✅ Integration example provided above');
  }
}
