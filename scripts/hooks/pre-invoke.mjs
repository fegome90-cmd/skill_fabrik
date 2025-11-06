#!/usr/bin/env node

/**
 * Universal Pre-Invoke Hook
 *
 * This script provides a universal interface for skill activation that works with:
 * - Direct Node import (fastest)
 * - HTTP daemon mode (enhanced capabilities)
 * - CLI fallback (compatible)
 *
 * Usage:
 *   node scripts/hooks/pre-invoke.mjs --prompt "text" --open-files '["file.ts"]' --active-file-content "content" --cwd "/path/to/project"
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    prompt: '',
    openFiles: [],
    activeFileContent: '',
    cwd: process.cwd(),
    mode: 'auto', // auto | direct | http | cli
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prompt':
        result.prompt = args[++i];
        break;
      case '--open-files':
        try {
          result.openFiles = JSON.parse(args[++i]);
        } catch (e) {
          result.openFiles = [];
        }
        break;
      case '--active-file-content':
        result.activeFileContent = args[++i];
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
Universal Pre-Invoke Hook for Skills Fabric

USAGE:
  node scripts/hooks/pre-invoke.mjs [OPTIONS]

OPTIONS:
  --prompt <text>                User prompt to process
  --open-files <json>            Array of open file paths (JSON string)
  --active-file-content <text>   Content of the active file
  --cwd <path>                   Working directory (default: current directory)
  --mode <mode>                  Execution mode: auto | direct | http | cli
  --verbose                      Enable verbose logging
  --help, -h                     Show this help message

EXAMPLES:
  # Basic usage
  node scripts/hooks/pre-invoke.mjs --prompt "implement user auth"

  # With file context
  node scripts/hooks/pre-invoke.mjs \\
    --prompt "fix this component" \\
    --open-files '["src/components/Login.tsx"]' \\
    --active-file-content "export const Login = () => {"

  # Specific mode
  node scripts/hooks/pre-invoke.mjs --prompt "add validation" --mode http

MODES:
  auto    - Automatically select best available mode (default)
  direct  - Use direct Node import (fastest, requires router package)
  http    - Use HTTP daemon mode (enhanced, requires daemon running)
  cli     - Use CLI fallback (always available)

RETURNS:
  JSON output with skill activation results
`);
}

// Mode 1: Direct Node import (fastest)
async function directMode(context) {
  try {
    if (context.verbose) {
      console.error('[INFO] Using direct Node import mode');
    }

    const { userPromptSubmitHook } = await import(join(__dirname, '../../packages/router/dist/index.js'));
    const result = await userPromptSubmitHook(context);

    return {
      success: true,
      mode: 'direct',
      result,
      latency_ms: Date.now() - Date.now() // Placeholder - would need proper timing
    };
  } catch (error) {
    throw new Error(`Direct mode failed: ${error.message}`);
  }
}

// Mode 2: HTTP daemon mode (enhanced)
async function httpMode(context) {
  try {
    if (context.verbose) {
      console.error('[INFO] Using HTTP daemon mode');
    }

    // Node.js 18+ has built-in fetch
    const routerUrl = process.env.ROUTER_URL || 'http://127.0.0.1:3000';

    const response = await fetch(`${routerUrl}/pre-invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(context)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      mode: 'http',
      result,
      daemon_enhanced: true
    };
  } catch (error) {
    throw new Error(`HTTP mode failed: ${error.message}`);
  }
}

// Mode 3: CLI fallback (compatible)
async function cliMode(context) {
  try {
    if (context.verbose) {
      console.error('[INFO] Using CLI fallback mode');
    }

    const { spawn } = await import('child_process');
    const cliPath = join(__dirname, '../../packages/skills-cli/dist/index.js');

    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, 'skills', 'check', context.prompt, '--threshold', '0.3'], {
        cwd: context.cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse CLI output to extract skill matches
            const lines = stdout.split('\n');
            const skillsLine = lines.find(line => line.includes('matching skill(s)'));

            let skills = [];
            if (skillsLine) {
              const match = skillsLine.match(/Found (\d+) matching skill\(s\):/);
              if (match) {
                const count = parseInt(match[1]);
                if (count > 0) {
                  skills = lines
                    .filter(line => line.includes('✓'))
                    .map(line => {
                      const skillMatch = line.match(/✓\s+(.+?)\s+\((\d+\.\d+)%\)/);
                      return skillMatch ? {
                        skillId: skillMatch[1].trim(),
                        confidence: parseFloat(skillMatch[2]) / 100,
                        reason: 'cli-match'
                      } : null;
                    })
                    .filter(Boolean);
                }
              }
            }

            resolve({
              success: true,
              mode: 'cli',
              result: {
                success: true,
                results: skills,
                timestamp: new Date().toISOString()
              }
            });
          } catch (parseError) {
            reject(new Error(`CLI mode parsing failed: ${parseError.message}`));
          }
        } else {
          reject(new Error(`CLI mode failed with exit code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`CLI mode spawn failed: ${error.message}`));
      });
    });
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

  if (!config.prompt) {
    console.error('Error: --prompt is required');
    process.exit(1);
  }

  const context = {
    prompt: config.prompt,
    openFiles: config.openFiles,
    activeFileContent: config.activeFileContent,
    cwd: config.cwd
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
        prompt: config.prompt,
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