#!/usr/bin/env node

/**
 * Universal Stop Hook con Integración PBv2
 *
 * Este script proporciona una interfaz universal para el procesamiento post-respuesta que incluye:
 * - Detección automática de planes en el output de Claude Code
 * - Activación de Prompt Builder v2 (PBv2)
 * - Visualización dual: terminal + archivo
 *
 * Uso:
 *   node scripts/hooks/stop.mjs --output "output text" --cwd "/path/to/project"
 *   node scripts/hooks/stop.mjs --edit-log '[...]' --output "response" --cwd "/path/to/project"
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import { validatePlanQuality } from './plan-quality-check.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    output: '',
    editLog: null,
    reposChanged: new Set(),
    cwd: process.cwd(),
    mode: 'auto',
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
        result.output = args[++i] || '';
        break;
      case '--edit-log':
        try {
          result.editLog = JSON.parse(args[++i]);
        } catch (e) {
          result.editLog = [];
        }
        break;
      case '--repos-changed':
        try {
          const repos = JSON.parse(args[++i]);
          result.reposChanged = new Set(Array.isArray(repos) ? repos : [repos]);
        } catch (e) {
          result.reposChanged = new Set();
        }
        break;
      case '--cwd':
        result.cwd = args[++i];
        break;
      case '--mode':
        result.mode = args[++i];
        break;
      case '--verbose':
        result.verbose = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

// Show help information
function showHelp() {
  console.log(`
Universal Stop Hook con Integración PBv2 para Skills Fabric

USAGE:
  node scripts/hooks/stop.mjs [OPTIONS]

OPTIONS:
  --output <text>                 Output de Claude Code para procesar
  --edit-log <json>              Edit log entries (JSON string)
  --repos-changed <json>         Changed repositories (JSON string or array)
  --cwd <path>                   Working directory (default: current directory)
  --mode <mode>                  Execution mode: auto | direct | http | cli
  --verbose                      Enable verbose logging
  --help, -h                     Show this help message

EXAMPLES:
  # Con output de respuesta
  node scripts/hooks/stop.mjs --output "[Layout] Plan de desarrollo..."

  # Con edit log y output
  node scripts/hooks/stop.mjs --edit-log '[...]' --output "response text"

  # Modo verbose
  node scripts/hooks/stop.mjs --output "..." --verbose

MODES:
  auto    - Automatically select best available mode (default)
  direct  - Use direct Node import (fastest, requires router package)
  http    - Use HTTP daemon mode (enhanced, requires daemon running)
  cli     - Use CLI fallback (always available)

FEATURES:
  ✅ Detección automática de planes en output
  ✅ Activación de Prompt Builder v2 (PBv2)
  ✅ Visualización dual: terminal + archivo
  ✅ Solo se activa cuando detecta un plan
  ✅ Guardado automático en dev/plans/

RETURNS:
  JSON output con resultados del procesamiento y calidad checks
`);
}

// Import PBv2 integration dynamically
async function getPBv2Integration() {
  try {
    const pbv2Integration = await import(join(__dirname, 'pbv2-integration.mjs'));
    return pbv2Integration;
  } catch (error) {
    console.error('[Stop Hook] Failed to load PBv2 integration:', error.message);
    return null;
  }
}

// Process output with PBv2 integration
async function processOutputWithPBv2(output, cwd, verbose = false) {
  if (!output || typeof output !== 'string') {
    if (verbose) {
      console.error('[PBv2 Stop Hook] No output provided or invalid');
    }
    return {
      processed: false,
      reason: 'no_output'
    };
  }

  const pbv2Integration = await getPBv2Integration();
  if (!pbv2Integration) {
    if (verbose) {
      console.error('[PBv2 Stop Hook] PBv2 integration not available');
    }
    return {
      processed: false,
      reason: 'pbv2_not_available'
    };
  }

  try {
    if (verbose) {
      console.error('[PBv2 Stop Hook] Processing output with PBv2...');
      console.error('[PBv2 Stop Hook] Output length:', output.length);
    }

    // Use processClaudeOutput which is the main processing function
    const result = await pbv2Integration.processClaudeOutput(output, cwd, { verbose });

    if (verbose) {
      console.error('[PBv2 Stop Hook] Raw result:', JSON.stringify(result, null, 2));
    }

    // Always show prompt if plan was detected
    if (result.processed && result.detection && result.detection.detected) {
      console.log('\n' + '='.repeat(70));
      console.log('🧩 PLAN DETECTADO - PROMPT BUILDER v2 GENERADO');
      console.log('='.repeat(70));

      if (result.pbv2Result && result.pbv2Result.prompt) {
        console.log('\n' + result.pbv2Result.prompt);
        console.log('\n' + '='.repeat(70));

        if (result.savedPath) {
          console.log(`💾 Guardado en: ${result.savedPath}`);
        }

        const qualityReport = validatePlanQuality(result.pbv2Result.prompt);
        result.qualityReport = qualityReport;

        if (qualityReport.passed) {
          console.log('✅ Startkit plan quality check passed');
        } else {
          console.log(
            `⚠️  Plan quality issues: ${qualityReport.missingSections.join(', ') || 'sin detalles'}`
          );
          if (qualityReport.warnings.length > 0) {
            console.log(`⚠️  Warnings: ${qualityReport.warnings.join(', ')}`);
          }
        }

        console.log('='.repeat(70) + '\n');
      } else {
        console.log('✅ Plan detectado pero no se generó prompt');
        console.log('='.repeat(70) + '\n');
      }

      if (verbose) {
        console.error('[PBv2 Stop Hook] ✅ PBv2 processing complete');
        console.error('[PBv2 Stop Hook] Action:', result.action);
        console.error('[PBv2 Stop Hook] Plan confidence:', result.detection?.confidence);
      }

      // Wait for user confirmation
      console.log('Presiona ENTER para continuar o Ctrl+C para cancelar...');

      if (process.stdin.isTTY) {
        // Wait for user input in interactive terminal
        await new Promise(resolve => {
          process.stdin.once('data', () => {
            resolve();
          });
        });
      } else {
        // In non-interactive mode (pipes), wait briefly
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Continuando...\n');
    } else {
      if (verbose) {
        console.error('[PBv2 Stop Hook] No plan detected');
      }
    }

    return result;

  } catch (error) {
    console.error('[PBv2 Stop Hook] 💥 Error processing output:', error.message);
    if (verbose) {
      console.error(error.stack);
    }
    return {
      processed: false,
      reason: 'error',
      error: error.message
    };
  }
}

// Mode 1: Direct Node import (fastest) with PBv2

// Mode 1: Direct Node import (fastest) with PBv2
async function directMode(context) {
  try {
    if (context.verbose) {
      console.error('[INFO] Using direct Node import mode with PBv2');
    }

    // First process with PBv2 if output provided
    let pbv2Result = null;
    if (context.output) {
      pbv2Result = await processOutputWithPBv2(context.output, context.cwd, context.verbose);
    }

    // Then call router stop hook if edit log provided
    let routerResult = null;
    if (context.editLog && context.editLog.length > 0) {
      const { stopHook } = await import(join(__dirname, '../../packages/router/dist/index.js'));
      routerResult = await stopHook({
        editLog: context.editLog,
        reposChanged: context.reposChanged,
        cwd: context.cwd
      });
    }

    return {
      success: true,
      mode: 'direct',
      pbv2: pbv2Result,
      router: routerResult,
      combined: true
    };
  } catch (error) {
    throw new Error(`Direct mode failed: ${error.message}`);
  }
}

// Mode 2: HTTP daemon mode (enhanced) with PBv2
async function httpMode(context) {
  try {
    if (context.verbose) {
      console.error('[INFO] Using HTTP daemon mode');
    }

    // First process with PBv2 if output provided
    let pbv2Result = null;
    if (context.output) {
      pbv2Result = await processOutputWithPBv2(context.output, context.cwd, context.verbose);
    }

    // Then call router stop hook via HTTP if edit log provided
    let routerResult = null;
    if (context.editLog && context.editLog.length > 0) {
      const fetch = (await import('node-fetch')).default;
      const routerUrl = process.env.ROUTER_URL || 'http://127.0.0.1:3000';

      const response = await fetch(`${routerUrl}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editLog: context.editLog,
          reposChanged: Array.from(context.reposChanged),
          cwd: context.cwd
        })
      });

      if (response.ok) {
        routerResult = await response.json();
      }
    }

    return {
      success: true,
      mode: 'http',
      pbv2: pbv2Result,
      router: routerResult,
      daemon_enhanced: true
    };
  } catch (error) {
    throw new Error(`HTTP mode failed: ${error.message}`);
  }
}

// Mode 3: CLI fallback (compatible) with PBv2
async function cliMode(context) {
  try {
    if (context.verbose) {
      console.error('[INFO] Using CLI fallback mode');
    }

    // First process with PBv2 if output provided
    let pbv2Result = null;
    if (context.output) {
      pbv2Result = await processOutputWithPBv2(context.output, context.cwd, context.verbose);
    }

    // For CLI mode, just return the PBv2 result if available
    // Router integration would be done by the CLI tool itself

    return {
      success: true,
      mode: 'cli',
      pbv2: pbv2Result,
      router: null
    };
  } catch (error) {
    throw new Error(`CLI mode failed: ${error.message}`);
  }
}

// Auto mode: try modes in order of preference
async function autoMode(context) {
  const modes = ['direct', 'http', 'cli'];

  for (const mode of modes) {
    try {
      switch (mode) {
        case 'direct':
          return await directMode(context);
        case 'http':
          return await httpMode(context);
        case 'cli':
          return await cliMode(context);
      }
    } catch (error) {
      if (context.verbose) {
        console.error(`[WARN] ${mode} mode failed: ${error.message}`);
      }
      continue;
    }
  }

  throw new Error('All modes failed');
}

// Main execution
async function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    process.exit(0);
  }

  // Check if we have something to process
  if (!config.output && !config.editLog) {
    console.error('❌ Error: --output or --edit-log is required');
    process.exit(1);
  }

  const context = {
    output: config.output,
    editLog: config.editLog || [],
    reposChanged: config.reposChanged,
    cwd: config.cwd,
    verbose: config.verbose
  };

  try {
    let result;

    switch (config.mode) {
      case 'direct':
        result = await directMode(context);
        break;
      case 'http':
        result = await httpMode(context);
        break;
      case 'cli':
        result = await cliMode(context);
        break;
      case 'auto':
      default:
        result = await autoMode(context);
        break;
    }

    // Output JSON result
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (error) {
    const errorResult = {
      success: false,
      error: error.message,
      mode: config.mode,
      context: {
        hasOutput: !!config.output,
        hasEditLog: !!(config.editLog && config.editLog.length > 0),
        cwd: config.cwd
      }
    };

    console.error(JSON.stringify(errorResult, null, 2));
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({
    success: false,
    error: `Uncaught exception: ${error.message}`,
    stack: error.stack
  }, null, 2));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(JSON.stringify({
    success: false,
    error: `Unhandled rejection: ${reason}`,
    promise: promise.toString()
  }, null, 2));
  process.exit(1);
});

// Run main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
