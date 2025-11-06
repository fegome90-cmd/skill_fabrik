import { startServer } from './app.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Ensure CWD is the package root so relative paths (schemas/, config/) resolve predictably
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  process.chdir(resolve(__dirname, '..'));
} catch {}

startServer().catch(err => {
  console.error(err);
  // Prefer setting exitCode to allow any pending logs/flush
  process.exitCode = 1;
});
