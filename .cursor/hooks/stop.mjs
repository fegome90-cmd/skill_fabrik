/**
 * Cursor Stop Hook - Calls Universal Stop Hook
 *
 * This hook is called by Cursor IDE after each response.
 * It delegates to the universal stop hook with PBv2 integration.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main stop hook function called by Cursor
 */
export async function stopHook(output, context = {}) {
  try {
    console.log('[Cursor Stop Hook] Processing output...');

    // Get the universal stop hook script
    const universalHookPath = join(__dirname, '../../scripts/hooks/stop.mjs');

    // Prepare arguments
    const args = [
      universalHookPath,
      '--output',
      typeof output === 'string' ? output : JSON.stringify(output),
      '--cwd',
      context.cwd || process.cwd(),
      '--mode',
      'auto'
    ];

    // Add verbose if debug mode is enabled
    if (context.debug || process.env.DEBUG_HOOKS) {
      args.push('--verbose');
    }

    // Execute the universal hook
    const child = spawn('node', args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: context.cwd || process.cwd()
    });

    // Capture output
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const str = data.toString();
      stdout += str;
      process.stdout.write(str); // Also display in real-time
    });

    child.stderr.on('data', (data) => {
      const str = data.toString();
      stderr += str;
      process.stderr.write(str); // Also display in real-time
    });

    // Wait for completion
    return new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            console.log('[Cursor Stop Hook]  Completed successfully');
            resolve(result);
          } catch (e) {
            console.log('[Cursor Stop Hook]  Completed (no JSON output)');
            resolve({ success: true });
          }
        } else {
          console.error(`[Cursor Stop Hook] L Failed with code ${code}`);
          if (stderr) {
            console.error(stderr);
          }
          reject(new Error(`Stop hook failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        console.error('[Cursor Stop Hook] =¥ Error:', error.message);
        reject(error);
      });
    });

  } catch (error) {
    console.error('[Cursor Stop Hook] =¥ Fatal error:', error.message);
    // Don't fail the entire response - return a minimal result
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}
