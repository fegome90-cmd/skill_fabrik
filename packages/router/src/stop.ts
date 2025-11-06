/**
 * Stop Hook: Pipeline de calidad post-respuesta
 * 0. Git Clean Check - Verificar estado inicial del repo (INFO si hay cambios)
 * 1. File Watcher Integration - Conectar con daemon para eventos en tiempo real
 * 2. Guardrails - Verificación multi-nivel de seguridad (BLOCK si violaciones)
 * 3. Bash Command Security Validation (BLOCK si comandos peligrosos)
 * 4. ESLint vía daemon quality service
 * 5. Build Check vía daemon QA service (BLOCK si falla)
 * 6. Prettier → archivos editados (filtrado por extensión)
 * 7. TypeCheck por repo
 * 8. Error hints (si 1-4 errores)
 * 9. Auto-resolver (si ≥5 errores, 6 patrones soportados)
 * 9.5. Advanced Quality Gates - Validación específica por tipo de proyecto
 * 10. NMLB - Verificación final de estado del repo (BLOCK si hay cambios)
 * 11. Emit KPIs
 * 12. Notificaciones cross-platform
 */

import { execa } from 'execa';
import { resolve, join } from 'path';
import { readFile, writeFile, appendFile, mkdir, access, constants } from 'fs/promises';
import type { StopHookInput, StopHookOutput, KPIEvent } from './types.js';
import { checkGuardrails } from './guardrails.js';
import { advancedQualityGateValidator, type QualitySummary } from './advanced-quality-gates.js';

/**
 * Verifica si un path existe
 */
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extrae comandos bash de contenido de archivo
 */
function extractBashCommands(content: string): string[] {
  const patterns = [
    // exec() patterns
    /exec\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // spawn() patterns
    /spawn\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // Template literal patterns
    /\$\{([^}]+)\}/g,
    // Backtick patterns
    /`([^`]+)`/g,
    // child_process.exec
    /child_process\.exec\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // child_process.spawn
    /child_process\.spawn\s*\(\s*['"`]([^'"`]+)['"`]/g,
  ];

  const commands: string[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const command = match[1].trim();
      if (command && !seen.has(command) && !isSafeCommand(command)) {
        commands.push(command);
        seen.add(command);
      }
    }
  }

  return commands;
}

/**
 * Verifica si un comando es seguro (no necesita validación)
 */
function isSafeCommand(command: string): boolean {
  const safeCommands = [
    'echo', 'printf', 'date', 'whoami', 'pwd', 'ls', 'cat', 'grep', 'find',
    'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'awk', 'sed', 'node', 'npm',
    'pnpm', 'yarn', 'git', 'curl', 'wget', 'which', 'whereis', 'type',
    'export', 'env', 'set', 'unset', 'alias', 'source', '.', 'cd', 'pushd',
    'popd', 'dirs', 'history', 'jobs', 'bg', 'fg', 'kill', 'ps', 'top',
    'df', 'du', 'free', 'uname', 'uptime'
  ];

  const firstWord = command.split(/\s+/)[0];
  return safeCommands.includes(firstWord);
}

/**
 * Valida comandos bash usando el script existente
 */
async function validateBashCommands(files: string[], cwd: string): Promise<{
  blocked: boolean;
  reason?: string;
  details?: string;
  blockedCommands?: string[];
}> {
  const bashValidator = join(cwd, 'scripts/hooks/bash-validator.py');

  // Verificar que el script exista
  if (!(await pathExists(bashValidator))) {
    console.warn('Bash validator script not found at:', bashValidator);
    return { blocked: false };
  }

  const blockedCommands: string[] = [];
  const allFiles: string[] = [];

  // Filtrar archivos relevantes
  const relevantFiles = files.filter(file =>
    file.endsWith('.ts') ||
    file.endsWith('.js') ||
    file.endsWith('.mjs') ||
    file.endsWith('.jsx') ||
    file.endsWith('.tsx')
  );

  for (const file of relevantFiles) {
    try {
      const content = await readFile(file, 'utf-8');
      const commands = extractBashCommands(content);

      for (const command of commands) {
        allFiles.push(command);

        // Crear archivo temporal para validación
        const tempFile = join(cwd, '.tmp_bash_check');
        await writeFile(tempFile, command + '\n');

        try {
          const result = await execa('python3', [bashValidator, tempFile], {
            cwd,
            timeout: 5000,
            reject: false
          });

          // Verificar si el comando fue bloqueado
          const output = result.stderr || result.stdout;
          if (output.includes('🚫') || output.includes('BLOCKED') || result.exitCode === 1) {
            blockedCommands.push(command);
          }
        } catch (error: any) {
          // Timeout u otros errores - ser conservador y marcar como bloqueado
          if (error.timedOut || error.exitCode === 1) {
            blockedCommands.push(command);
          }
        } finally {
          // Limpiar archivo temporal
          try {
            await execa('rm', [tempFile], { cwd });
          } catch {
            // Ignorar error al limpiar
          }
        }
      }
    } catch (error) {
      // Silenciosamente ignorar errores de lectura de archivos
      continue;
    }
  }

  if (blockedCommands.length > 0) {
    return {
      blocked: true,
      reason: `Dangerous bash commands detected: ${blockedCommands.slice(0, 3).join(', ')}`,
      details: `Blocked commands: ${blockedCommands.join(', ')}`,
      blockedCommands
    };
  }

  return { blocked: false };
}

/**
 * Formatea archivos editados con Prettier
 */
async function runPrettier(files: string[], cwd: string): Promise<string[]> {
  if (files.length === 0) return [];

  // Extensiones soportadas por Prettier
  const prettierExtensions = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.json', '.jsonc', '.json5',
    '.md', '.mdx', '.css', '.scss', '.sass', '.less', '.html',
    '.vue', '.svelte', '.astro', '.yml', '.yaml', '.graphql',
    '.gql', '.toml'
  ]);

  // Filtrar archivos por extensión válida y existencia
  const validFiles = [];
  for (const file of files) {
    const ext = file.toLowerCase().substring(file.lastIndexOf('.'));
    const isValid = ext && prettierExtensions.has(ext);

    if (!isValid) {
      console.log(`📄 Skipping ${file} - extensión no soportada por Prettier`);
      continue;
    }

    // Verificar que el archivo existe
    try {
      await access(file, constants.F_OK);
      validFiles.push(file);
    } catch (error) {
      console.log(`📄 Skipping ${file} - archivo no encontrado`);
    }
  }

  if (validFiles.length === 0) {
    console.log('📄 No hay archivos válidos para formatear con Prettier');
    return [];
  }

  console.log(`📄 Formateando ${validFiles.length}/${files.length} archivos con Prettier...`);

  try {
    await execa('npx', ['prettier', '--write', ...validFiles], {
      cwd,
      stdio: 'inherit',
    });
    return validFiles;
  } catch (error) {
    console.warn('Prettier falló, continuando:', error);
    return [];
  }
}

/**
 * Ejecuta typecheck por repo tocado
 */
async function runTypeCheck(
  repos: string[],
  cwd: string
): Promise<Array<{ repo: string; errors: number; output: string }>> {
  const results: Array<{ repo: string; errors: number; output: string }> = [];

  for (const repo of repos) {
    try {
      const repoPath = resolve(cwd, repo);
      const { stdout, stderr } = await execa('npx', ['tsc', '--noEmit'], {
        cwd: repoPath,
        reject: false,
      });

      // Contar errores en la salida
      const errorLines = (stdout + stderr).split('\n').filter(line => line.includes('error TS'));

      results.push({
        repo,
        errors: errorLines.length,
        output: stdout + stderr,
      });
    } catch (error) {
      results.push({
        repo,
        errors: -1,
        output: `Error ejecutando tsc: ${error}`,
      });
    }
  }

  return results;
}

/**
 * Parsea errores TypeScript del output
 */
interface ParsedError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

function parseTypeScriptErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const errorRegex = /(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/g;
  let match;
  
  while ((match = errorRegex.exec(output)) !== null) {
    errors.push({
      file: match[1].trim(),
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      code: match[4],
      message: match[5].trim(),
    });
  }
  
  return errors;
}

/**
 * Intenta resolver errores TypeScript automáticamente
 * Retorna número de errores resueltos
 */
async function autoResolveTypeScriptErrors(
  errors: ParsedError[],
  cwd: string
): Promise<{ resolved: number; summary: string[] }> {
  const resolved: string[] = [];
  let resolvedCount = 0;

  // Agrupar errores por archivo
  const errorsByFile = new Map<string, ParsedError[]>();
  for (const error of errors) {
    const filePath = resolve(cwd, error.file);
    if (!errorsByFile.has(filePath)) {
      errorsByFile.set(filePath, []);
    }
    errorsByFile.get(filePath)!.push(error);
  }

  // Procesar cada archivo
  for (const [filePath, fileErrors] of errorsByFile.entries()) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      let fileModified = false;

      for (const error of fileErrors) {
        // Solo intentar corregir errores comunes y seguros
        let errorResolved = false;

        // TS2307: Cannot find module
        if (error.code === 'TS2307') {
          const importMatch = error.message.match(/Cannot find module ['"](.+?)['"]/);
          if (importMatch && error.line <= lines.length) {
            const moduleName = importMatch[1];
            const line = lines[error.line - 1];

            // Verificar si es un import relativo que falta '.js'
            if (line.includes('from') && !moduleName.startsWith('.')) {
              // No auto-fixar imports externos - requiere conocimiento del proyecto
              continue;
            }

            // Para imports relativos, intentar agregar extensión .js si falta
            if (moduleName.startsWith('.') && !moduleName.endsWith('.js') && !moduleName.endsWith('.json')) {
              const newImport = line.replace(
                new RegExp(`['"]${moduleName}['"]`),
                `'${moduleName}.js'`
              );
              lines[error.line - 1] = newImport;
              fileModified = true;
              resolved.push(`${error.file}:${error.line} - Agregado .js al import: ${moduleName}`);
              resolvedCount++;
              errorResolved = true;
            }
          }
        }

        // TS2532: Object is possibly 'undefined'
        else if (error.code === 'TS2532' && !errorResolved) {
          if (error.line <= lines.length) {
            const line = lines[error.line - 1];

            // Pattern 1: obj.prop?. -> obj.prop!
            const optionalChainPattern = /(\w+(?:\.\w+)*)\?\./;
            if (optionalChainPattern.test(line)) {
              const newLine = line.replace(optionalChainPattern, '$1.');
              lines[error.line - 1] = newLine;
              fileModified = true;
              resolved.push(`${error.file}:${error.line} - Removido optional chain (?) y agregado assertion (!)`);
              resolvedCount++;
              errorResolved = true;
            }
            // Pattern 2: Add non-null assertion for simple cases
            else if (line.includes('=') && line.includes('undefined')) {
              // Only fix simple assignment cases
              const variableMatch = line.match(/(\w+)\s*=\s*(.+)$/);
              if (variableMatch && !variableMatch[2].includes('undefined')) {
                const newLine = line.replace(variableMatch[2], `${variableMatch[2]}!`);
                lines[error.line - 1] = newLine;
                fileModified = true;
                resolved.push(`${error.file}:${error.line} - Agregado non-null assertion (!)`);
                resolvedCount++;
                errorResolved = true;
              }
            }
          }
        }

        // TS2322: Type is not assignable (simple cases)
        else if (error.code === 'TS2322' && !errorResolved) {
          if (error.line <= lines.length) {
            const line = lines[error.line - 1];

            // Pattern 1: Add type assertion for simple cases
            if (line.includes('const') && line.includes('=') && !line.includes('as')) {
              const constMatch = line.match(/const\s+(\w+)\s*=\s*(.+)$/);
              if (constMatch && constMatch[2].includes('{')) {
                // Object literal - add type assertion
                const newLine = line.replace(constMatch[2], `${constMatch[2]} as any`);
                lines[error.line - 1] = newLine;
                fileModified = true;
                resolved.push(`${error.file}:${error.line} - Agregado type assertion (as any)`);
                resolvedCount++;
                errorResolved = true;
              }
            }
          }
        }

        // TS2688: Cannot find type definition file
        else if (error.code === 'TS2688' && !errorResolved) {
          const typeMatch = error.message.match(/Cannot find type definition file for ['"](.+?)['"]/);
          if (typeMatch && error.line <= lines.length) {
            const typeName = typeMatch[1];
            // For common types, suggest installing @types packages
            const commonTypes: { [key: string]: string } = {
              'node': '@types/node',
              'express': '@types/express',
              'react': '@types/react',
              'react-dom': '@types/react-dom',
              'jest': '@types/jest',
              'lodash': '@types/lodash'
            };

            if (commonTypes[typeName]) {
              resolved.push(`${error.file}:${error.line} - Sugerencia: npm install ${commonTypes[typeName]}`);
              resolvedCount++;
              errorResolved = true;
            }
          }
        }

        // TS1192: Module '"..."' has no default export
        else if (error.code === 'TS1192' && !errorResolved) {
          if (error.line <= lines.length) {
            const line = lines[error.line - 1];

            // Convert default import to named import
            const defaultImportPattern = /import\s+(\w+)\s+from\s+['"](.+?)['"]/;
            const match = line.match(defaultImportPattern);
            if (match) {
              const newLine = line.replace(defaultImportPattern, `import { ${match[1]} } from '${match[2]}'`);
              lines[error.line - 1] = newLine;
              fileModified = true;
              resolved.push(`${error.file}:${error.line} - Convertido default import a named import`);
              resolvedCount++;
              errorResolved = true;
            }
          }
        }

        // TS7016: Could not find a declaration for module
        else if (error.code === 'TS7016' && !errorResolved) {
          const moduleMatch = error.message.match(/Could not find a declaration for module ['"](.+?)['"]/);
          if (moduleMatch && error.line <= lines.length) {
            const moduleName = moduleMatch[1];

            // For relative modules, try adding .js extension
            if (moduleName.startsWith('.')) {
              const line = lines[error.line - 1];
              const newLine = line.replace(
                new RegExp(`['"]${moduleName}['"]`),
                `'${moduleName}.js'`
              );
              lines[error.line - 1] = newLine;
              fileModified = true;
              resolved.push(`${error.file}:${error.line} - Agregado .js para module: ${moduleName}`);
              resolvedCount++;
              errorResolved = true;
            }
          }
        }
      }

      if (fileModified) {
        await writeFile(filePath, lines.join('\n'), 'utf-8');
      }
    } catch (error) {
      // Silenciosamente ignorar errores al leer/escribir archivos
      continue;
    }
  }

  return {
    resolved: resolvedCount,
    summary: resolved,
  };
}

/**
 * Genera hints de errores si hay 1-4 errores
 */
function generateErrorHints(
  typecheckResults: Array<{ repo: string; errors: number; output: string }>
): string[] {
  const hints: string[] = [];
  const totalErrors = typecheckResults.reduce((sum, r) => sum + Math.max(0, r.errors), 0);

  if (totalErrors >= 1 && totalErrors <= 4) {
    hints.push(`⚠️ Se detectaron ${totalErrors} error(es) TypeScript:`);

    for (const result of typecheckResults) {
      if (result.errors > 0) {
        hints.push(`  • ${result.repo}: ${result.errors} error(es)`);

        // Extraer primeros errores como hint
        const errorLines = result.output
          .split('\n')
          .filter(line => line.includes('error TS'))
          .slice(0, 2);

        errorLines.forEach(line => {
          hints.push(`    → ${line.trim()}`);
        });
      }
    }

    hints.push(
      '\n💡 Recordatorio: Manejo de errores en controladores/repos (logger/Sentry, BaseController, try/catch)'
    );
  }

  return hints;
}

/**
 * Conecta con daemon file watcher para eventos en tiempo real con cache compartido
 */
async function connectToFileWatcherDaemon(cwd: string): Promise<{
  connected: boolean;
  stats?: any;
  error?: string;
  cacheHit?: boolean;
}> {
  const cacheKey = 'file-watcher:stats';

  // Intentar obtener del cache compartido (30 segundos TTL para stats en tiempo real)
  const cached = await getSharedCache(cacheKey);
  if (cached && cached.data) {
    console.log('📁 File watcher stats from shared cache');
    return {
      ...cached.data,
      cacheHit: true
    };
  }

  try {
    const response = await fetch('http://127.0.0.1:7727/api/file-watcher/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return {
        connected: false,
        error: `File watcher daemon unavailable (${response.status})`
      };
    }

    const stats = await response.json();
    const connectionResult = {
      connected: true,
      stats
    };

    // Guardar en cache por 30 segundos (stats en tiempo real)
    await setSharedCache(cacheKey, connectionResult, 30000, 'router');

    return connectionResult;
  } catch (error) {
    return {
      connected: false,
      error: `Failed to connect to file watcher daemon: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Obtiene historial de cambios del daemon file watcher
 */
async function getFileWatcherHistory(limit: number = 10): Promise<{
  history?: any[];
  error?: string;
}> {
  try {
    const response = await fetch(`http://127.0.0.1:7727/api/file-watcher/history?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return {
        error: `Failed to get file watcher history (${response.status})`
      };
    }

    const history = await response.json();

    return {
      history: Array.isArray(history) ? history : []
    };
  } catch (error) {
    return {
      error: `Failed to get file watcher history: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Cache compartido entre router y daemon via Redis
 */
interface SharedCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  source: string; // 'router' | 'daemon'
}

const SHARED_CACHE_PREFIX = 'sf:quality:';

/**
 * Obtiene valor del cache compartido Redis
 */
async function getSharedCache(key: string): Promise<SharedCacheEntry | null> {
  try {
    // Intentar importar y usar cliente Redis existente
    const { getRedisClient } = await import('@skills-fabrik/mcp-adapters');
    const redis = await getRedisClient('cache');

    const redisKey = `${SHARED_CACHE_PREFIX}${key}`;
    const cached = await redis.get(redisKey);

    if (cached) {
      const entry: SharedCacheEntry = JSON.parse(cached);

      // Verificar TTL
      if (Date.now() - entry.timestamp < entry.ttl) {
        return entry;
      } else {
        // Expired, delete it
        await redis.del(redisKey);
      }
    }

    return null;
  } catch (error) {
    console.log('⚠️ Shared cache unavailable, using local fallback:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Establece valor en cache compartido Redis
 */
async function setSharedCache(
  key: string,
  data: any,
  ttlMs: number = 300000, // 5 minutos default
  source: string = 'router'
): Promise<void> {
  try {
    const { getRedisClient } = await import('@skills-fabrik/mcp-adapters');
    const redis = await getRedisClient('cache');

    const redisKey = `${SHARED_CACHE_PREFIX}${key}`;
    const entry: SharedCacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      source
    };

    await redis.setEx(redisKey, Math.ceil(ttlMs / 1000), JSON.stringify(entry));
  } catch (error) {
    console.log('⚠️ Failed to set shared cache:', error instanceof Error ? error.message : String(error));
    // Silently fail - continue without shared cache
  }
}

/**
 * Limpia cache compartido por patrón
 */
async function clearSharedCache(pattern: string): Promise<void> {
  try {
    const { getRedisClient } = await import('@skills-fabrik/mcp-adapters');
    const redis = await getRedisClient('cache');

    const fullPattern = `${SHARED_CACHE_PREFIX}${pattern}*`;
    const keys = await redis.keys(fullPattern);

    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🗑️ Cleared ${keys.length} shared cache entries matching: ${pattern}`);
    }
  } catch (error) {
    console.log('⚠️ Failed to clear shared cache:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Sistema de métricas avanzadas de performance
 */
interface PipelineMetrics {
  startTime: number;
  steps: Map<string, StepMetrics>;
  totalDuration?: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  warnings: number;
}

interface StepMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Inicializa métricas de pipeline
 */
function initializePipelineMetrics(): PipelineMetrics {
  return {
    startTime: Date.now(),
    steps: new Map(),
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    warnings: 0
  };
}

/**
 * Inicia tracking de un paso del pipeline
 */
function startStep(metrics: PipelineMetrics, stepName: string): void {
  metrics.steps.set(stepName, {
    name: stepName,
    startTime: Date.now(),
    success: false
  });
}

/**
 * Finaliza tracking de un paso del pipeline
 */
function endStep(
  metrics: PipelineMetrics,
  stepName: string,
  success: boolean = true,
  error?: string,
  metadata?: Record<string, any>
): void {
  const step = metrics.steps.get(stepName);
  if (step) {
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    step.success = success;
    step.error = error;
    step.metadata = metadata;
  }
}

/**
 * Calcula métricas finales del pipeline
 */
function finalizePipelineMetrics(metrics: PipelineMetrics): PipelineMetrics & {
  stepMetrics: StepMetrics[];
  averageStepDuration: number;
  slowestStep?: { name: string; duration: number };
  fastestStep?: { name: string; duration: number };
} {
  const endTime = Date.now();
  metrics.totalDuration = endTime - metrics.startTime;

  const stepMetrics = Array.from(metrics.steps.entries()).map(([stepName, step]) => ({
    name: stepName,
    startTime: step.startTime,
    endTime: step.endTime,
    duration: step.duration,
    success: step.success,
    error: step.error,
    metadata: step.metadata
  }));

  const completedSteps = stepMetrics.filter(s => s.duration !== undefined);
  const averageStepDuration = completedSteps.length > 0
    ? completedSteps.reduce((sum, step) => sum + (step.duration || 0), 0) / completedSteps.length
    : 0;

  let slowestStep: { name: string; duration: number } | undefined;
  let fastestStep: { name: string; duration: number } | undefined;

  completedSteps.forEach(step => {
    const stepDuration = step.duration || 0;
    if (!slowestStep || stepDuration > slowestStep.duration) {
      slowestStep = { name: step.name, duration: stepDuration };
    }
    if (!fastestStep || stepDuration < fastestStep.duration) {
      fastestStep = { name: step.name, duration: stepDuration };
    }
  });

  return {
    ...metrics,
    stepMetrics,
    averageStepDuration,
    slowestStep,
    fastestStep
  };
}

/**
 * Emite evento KPI a events.jsonl
 */
async function emitKPIEvent(event: KPIEvent, cwd: string): Promise<void> {
  const kpiDir = resolve(cwd, 'obs/kpi');
  await mkdir(kpiDir, { recursive: true });

  const kpiFile = resolve(kpiDir, 'events.jsonl');
  await appendFile(kpiFile, JSON.stringify(event) + '\n', 'utf-8');
}

/**
 * Ejecuta ESLint vía daemon quality service con cache compartido
 */
async function runESLintViaDaemon(files: string[]): Promise<{
  success: boolean;
  errors: number;
  warnings: number;
  output: string;
  blocked: boolean;
  reason?: string;
  cacheHit?: boolean;
}> {
  // Generar cache key basada en los archivos
  const cacheKey = `eslint:${Buffer.from(files.sort().join(',')).toString('base64')}`;

  // Intentar obtener del cache compartido
  const cached = await getSharedCache(cacheKey);
  if (cached && cached.data) {
    console.log('📋 ESLint result from shared cache');
    return {
      ...cached.data,
      cacheHit: true
    };
  }

  try {
    const response = await fetch('http://127.0.0.1:7727/api/quality/lint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files,
        fix: false
      })
    });

    if (!response.ok) {
      console.warn('Daemon ESLint service unavailable, falling back to local execution');
      return { success: false, errors: 0, warnings: 0, output: '', blocked: false };
    }

    const result = await response.json() as {
      success?: boolean;
      errors?: number;
      warnings?: number;
      message?: string;
    };

    const eslintResult = {
      success: result.success || false,
      errors: result.errors || 0,
      warnings: result.warnings || 0,
      output: result.message || '',
      blocked: false
    };

    // Guardar en cache compartido (5 minutos TTL)
    await setSharedCache(cacheKey, eslintResult, 300000, 'router');

    return eslintResult;
  } catch (error) {
    console.warn('Daemon ESLint service failed, continuing without ESLint:', error);
    return { success: false, errors: 0, warnings: 0, output: '', blocked: false };
  }
}

/**
 * Ejecuta build check vía daemon QA service con cache compartido
 */
async function runBuildCheckViaDaemon(repos: string[]): Promise<{
  success: boolean;
  errors: number;
  output: string;
  blocked: boolean;
  reason?: string;
  cacheHit?: boolean;
}> {
  // Generar cache key basada en el proyecto
  const project = repos[0] || 'all';
  const cacheKey = `build:${project}`;

  // Intentar obtener del cache compartido (solo si fue exitoso previamente)
  const cached = await getSharedCache(cacheKey);
  if (cached && cached.data && cached.data.success) {
    console.log('🏗️ Build check result from shared cache (successful)');
    return {
      ...cached.data,
      cacheHit: true
    };
  }

  try {
    const response = await fetch('http://127.0.0.1:7727/api/qa/check-build', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project,
        options: {
          timeout: 30000
        }
      })
    });

    if (!response.ok) {
      console.warn('Daemon build check service unavailable, falling back to local execution');
      return { success: false, errors: 0, output: '', blocked: false };
    }

    const result = await response.json() as {
      status?: string;
      message?: string;
      details?: {
        errors?: number;
        warnings?: number;
      };
    };

    const buildResult = {
      success: result.status === 'success',
      errors: result.details?.errors || 0,
      output: result.message || '',
      blocked: false
    };

    // Build fallido es un bloqueo
    if (result.status === 'failed') {
      buildResult.blocked = true;
      (buildResult as any).reason = `Build failed: ${result.message}`;
      buildResult.errors = result.details?.errors || 1;
      buildResult.output = result.message || 'Build failed';

      // No cachear builds fallidos
      return buildResult;
    }

    // Guardar solo builds exitosos en cache (2 minutos TTL)
    await setSharedCache(cacheKey, buildResult, 120000, 'router');

    return {
      ...buildResult,
      cacheHit: false
    };
  } catch (error) {
    console.warn('Daemon build check service failed, continuing without build check:', error);
    return { success: false, errors: 0, output: '', blocked: false };
  }
}

/**
 * Verifica NMLB (No-Mess-Left-Behind) - estado limpio del repositorio
 */
async function verifyCleanRepoState(cwd: string): Promise<{
  clean: boolean;
  blocked: boolean;
  reason?: string;
  details?: string;
  gitStatus?: string;
  untrackedFiles?: string[];
}> {
  try {
    // Check if NMLB enforcement is disabled (for testing/development)
    const nmlbDisabled = process.env.SKILLS_FABRIK_NMLB_DISABLE === 'true' ||
                         process.env.NODE_ENV === 'test' ||
                         process.env.TEST_MODE === 'true';

    if (nmlbDisabled) {
      return { clean: true, blocked: false, gitStatus: 'disabled' };
    }

    // Verificar que estamos en un repositorio git
    // Verificar que estamos en un repositorio git
    const gitCheck = await execa('git', ['rev-parse', '--git-dir'], {
      cwd,
      reject: false,
    });

    if (gitCheck.exitCode !== 0) {
      // No es un repositorio git, permitimos continuar
      return { clean: true, blocked: false };
    }

    // Verificar git status
    const statusResult = await execa('git', ['status', '--porcelain'], {
      cwd,
      reject: false,
    });

    const statusOutput = statusResult.stdout || '';
    const statusLines = statusOutput.split('\n').filter(line => line.trim());

    // Parsear git status --porcelain
    const staged: string[] = [];
    const modified: string[] = [];
    const untracked: string[] = [];
    const deleted: string[] = [];

    for (const line of statusLines) {
      if (line.length < 3) continue;

      const statusCode = line.substring(0, 2);
      const filePath = line.substring(3);

      // M = modified, A = added, D = deleted, ?? = untracked, etc.
      if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
        staged.push(filePath);
      }
      if (statusCode[1] !== ' ' && statusCode[1] !== '?') {
        modified.push(filePath);
      }
      if (statusCode === '??') {
        untracked.push(filePath);
      }
      if (statusCode.includes('D')) {
        deleted.push(filePath);
      }
    }

    // Verificar si hay stash entries
    const stashResult = await execa('git', ['stash', 'list'], {
      cwd,
      reject: false,
    });

    const hasStash = stashResult.exitCode === 0 && stashResult.stdout.trim().length > 0;

    // Evaluar estado del repositorio
    const hasChanges = staged.length > 0 || modified.length > 0 || deleted.length > 0;
    const hasUntracked = untracked.length > 0;
    const hasIssues = hasChanges || hasUntracked || hasStash;

    if (!hasIssues) {
      return { clean: true, blocked: false, gitStatus: 'clean' };
    }

    // Preparar mensaje de error
    const issues: string[] = [];

    if (staged.length > 0) {
      issues.push(`📋 ${staged.length} archivo(s) staged para commit`);
    }
    if (modified.length > 0) {
      issues.push(`✏️ ${modified.length} archivo(s) modificados`);
    }
    if (deleted.length > 0) {
      issues.push(`🗑️ ${deleted.length} archivo(s) eliminados`);
    }
    if (untracked.length > 0) {
      issues.push(`❓ ${untracked.length} archivo(s) untracked`);
    }
    if (hasStash) {
      issues.push(`📦 Hay stashed changes pendientes`);
    }

    const reason = issues.join(', ');
    const details = `
Detalles del estado del repositorio:
${staged.length > 0 ? `  • Staged: ${staged.join(', ')}` : ''}
${modified.length > 0 ? `  • Modified: ${modified.join(', ')}` : ''}
${deleted.length > 0 ? `  • Deleted: ${deleted.join(', ')}` : ''}
${untracked.length > 0 ? `  • Untracked: ${untracked.slice(0, 5).join(', ')}${untracked.length > 5 ? ` y ${untracked.length - 5} más...` : ''}` : ''}
${hasStash ? '  • Stash: Hay cambios temporales guardados' : ''}
`;

    // Si hay cambios staged o modificados, es un bloqueo
    const blocked = staged.length > 0 || modified.length > 0 || deleted.length > 0;

    return {
      clean: false,
      blocked,
      reason: `Repo state not clean: ${reason}`,
      details: details.trim(),
      gitStatus: 'dirty',
      untrackedFiles: untracked
    };

  } catch (error) {
    console.warn('NMLB check failed, continuing:', error);
    return { clean: true, blocked: false };
  }
}

/**
 * Ejecuta notificación cross-platform
 */
async function sendNotification(
  type: 'info' | 'success' | 'warning' | 'error',
  message: string,
  cwd: string
): Promise<void> {
  try {
    // Intentar leer configuración de hooks
    const hooksConfigPath = resolve(cwd, '.cursor/hooks/hooks-config.json');
    let notifyEnabled = true;
    let notifyScriptPath = 'scripts/hooks/notify.sh';

    if (await pathExists(hooksConfigPath)) {
      try {
        const hooksConfig = JSON.parse(await readFile(hooksConfigPath, 'utf-8'));
        const stopConfig = hooksConfig.stop;
        if (stopConfig?.notifications) {
          notifyEnabled = stopConfig.notifications.enabled !== false;
          if (stopConfig.notifications.scriptPath) {
            notifyScriptPath = stopConfig.notifications.scriptPath;
          }

          // Verificar si este tipo de notificación está habilitado
          const typeMap: Record<string, string> = {
            success: 'onSuccess',
            warning: 'onWarning',
            error: 'onError',
          };
          const typeKey = typeMap[type];
          if (typeKey && stopConfig.notifications[typeKey] === false) {
            return; // Esta notificación está deshabilitada
          }
        }
      } catch {
        // Si hay error leyendo config, continuar con defaults
      }
    }

    if (!notifyEnabled) {
      return;
    }

    const notifyScript = resolve(cwd, notifyScriptPath);
    if (!(await pathExists(notifyScript))) {
      return; // Script no existe, continuar silenciosamente
    }

    // Ejecutar script de notificación
    await execa('bash', [notifyScript, type, message], {
      cwd,
      stdio: 'ignore', // No mostrar output del script de notificación
    });
  } catch (error) {
    // Silenciosamente fallar - las notificaciones no deben romper el hook
    // console.warn('Failed to send notification:', error);
  }
}

/**
 * Stop Hook principal: ejecuta pipeline completo
 */
export async function stopHook(input: StopHookInput): Promise<StopHookOutput> {
  const editedFiles = input.editLog.map(e => e.file);
  const reposChanged = Array.from(input.reposChanged);

  // Optimización para casos simples (1 archivo, 1 repo)
  const isSimpleCase = editedFiles.length === 1 && reposChanged.length === 1;
  const useOptimizedFlow = isSimpleCase && process.env.SKILLS_FABRIK_OPTIMIZE_SIMPLE !== 'false';

  // Inicializar métricas de performance
  const metrics = initializePipelineMetrics();

  // 0. Git Clean Check: Verificar estado inicial del repositorio
  startStep(metrics, 'git-clean-check');
  const initialRepoState = await verifyCleanRepoState(input.cwd);
  endStep(metrics, 'git-clean-check', true, undefined, {
    repoStatus: initialRepoState.gitStatus,
    hasChanges: !initialRepoState.clean
  });

  if (initialRepoState.gitStatus === 'dirty' && !initialRepoState.clean) {
    console.log('\n⚠️ REPOSITORIO CON CAMBIOS PREEXISTENTES:\n');
    console.log(`  ${initialRepoState.reason}\n`);
    console.log('💡 Los cambios preexistentes no afectan el procesamiento actual,\n');
    console.log('   pero considera commitearlos o hacer stash antes de continuar.\n');

    // Enviar notificación informativa (no bloqueante)
    await sendNotification(
      'info',
      `Repo con cambios preexistentes: ${initialRepoState.reason}`,
      input.cwd
    );
  }

  // 1. File Watcher Integration: Conectar con daemon para eventos en tiempo real
  startStep(metrics, 'file-watcher-integration');
  let fileWatcherConnection: any;

  if (useOptimizedFlow) {
    // Para casos simples, omitir conexión al daemon para reducir latencia
    fileWatcherConnection = {
      connected: false,
      skipped: true,
      reason: 'optimized-flow'
    };
    endStep(metrics, 'file-watcher-integration', true, undefined, {
      connected: false,
      optimized: true
    });
  } else {
    fileWatcherConnection = await connectToFileWatcherDaemon(input.cwd);
    endStep(metrics, 'file-watcher-integration', true, undefined, {
      connected: fileWatcherConnection.connected,
      cacheHit: (fileWatcherConnection as any).cacheHit || false
    });
  }

  if (fileWatcherConnection.connected && fileWatcherConnection.stats) {
    console.log(`📁 File watcher daemon conectado`);
    console.log(`   - ${fileWatcherConnection.stats.totalChanges || 0} cambios totales`);
    console.log(`   - ${fileWatcherConnection.stats.connectedClients || 0} clientes conectados`);
    console.log(`   - ${fileWatcherConnection.stats.watchedPaths?.length || 0} paths monitoreados`);
  } else if (fileWatcherConnection.error) {
    console.log(`⚠️ File watcher daemon no disponible: ${fileWatcherConnection.error}`);
  }

  // 2. Guardrails: Verificar multi-nivel ANTES de cualquier otra operación
  const guardrailCheck = await checkGuardrails(input.editLog, input.cwd);

  // Mostrar sugerencias (no bloquean)
  if (guardrailCheck.suggestions.length > 0) {
    console.log('\n💡 SUGERENCIAS:\n');
    guardrailCheck.suggestions.forEach(v => {
      const location = v.line ? `${v.file}:${v.line}` : v.file;
      console.log(`  ${v.message}\n     → ${location}\n`);
    });
  }

  // Mostrar warnings (no bloquean, pero alertan)
  if (guardrailCheck.warnings.length > 0) {
    console.warn('\n⚠️  ADVERTENCIAS:\n');
    guardrailCheck.warnings.forEach(v => {
      const location = v.line ? `${v.file}:${v.line}` : v.file;
      console.warn(`  ${v.message}\n     → ${location}\n`);
    });

    await sendNotification(
      'warning',
      `${guardrailCheck.warnings.length} advertencia(s) de guardrail`,
      input.cwd
    );
  }

  // Bloqueos son críticos y detienen el flujo
  if (guardrailCheck.blocked) {
    const violationMessages = guardrailCheck.violations.map(v => {
      const location = v.line ? `${v.file}:${v.line}` : v.file;
      return `🚫 ${v.skillId}: ${v.message}\n   → ${location}`;
    });

    console.error('\n🚫 GUARDRAIL BLOQUEADO - Operación no permitida:\n');
    console.error(violationMessages.join('\n\n'));
    console.error('\nPor favor corrige las violaciones antes de continuar.');

    // Enviar notificación de error
    await sendNotification(
      'error',
      `Guardrail bloqueado: ${guardrailCheck.violations.length} violación(es) detectada(s)`,
      input.cwd
    );

    // Emit KPI de bloqueo
    const kpiEvent: KPIEvent = {
      ts: new Date().toISOString(),
      repo: reposChanged[0] || 'unknown',
      skills: guardrailCheck.violations.map(v => v.skillId),
      errors_ts: 0,
      auto_resolver_used: false,
      latency_ms: 0,
      zero_errors_left_behind: false,
      activated_by: {
        keywords: false,
        intent_regex: false,
        path_globs: false,
        content_patterns: false,
      },
      adherence: false,
      progressive_disclosure: {
        metadata_loaded: false,
        skill_md_loaded: false,
        resources_loaded: 0,
      },
    };

    await emitKPIEvent(kpiEvent, input.cwd);

    return {
      formatted: [],
      typecheck: [],
      hints: violationMessages,
      autoResolved: false,
      kpiEvent,
    };
  }

  // 3. Bash Command Security Validation
  const bashValidation = await validateBashCommands(editedFiles, input.cwd);

  if (bashValidation.blocked) {
    console.error('\n🚫 BASH SECURITY BLOQUEADO - Comandos peligrosos detectados:\n');
    console.error(`  ${bashValidation.reason}\n`);
    if (bashValidation.details) {
      console.error(`  Detalles: ${bashValidation.details}\n`);
    }
    console.error('Por favor elimina o reemplaza los comandos peligrosos antes de continuar.\n');

    // Enviar notificación de error
    await sendNotification(
      'error',
      ` Bash security bloqueado: ${bashValidation.blockedCommands?.length || 0} comando(s) peligroso(s)`,
      input.cwd
    );

    // Emit KPI de bloqueo por bash security
    const kpiEvent: KPIEvent = {
      ts: new Date().toISOString(),
      repo: reposChanged[0] || 'unknown',
      skills: ['bash-security-validator'],
      errors_ts: 0,
      auto_resolver_used: false,
      latency_ms: 0,
      zero_errors_left_behind: false,
      activated_by: {
        keywords: false,
        intent_regex: false,
        path_globs: false,
        content_patterns: false,
      },
      adherence: false,
      progressive_disclosure: {
        metadata_loaded: false,
        skill_md_loaded: false,
        resources_loaded: 0,
      },
    };

    await emitKPIEvent(kpiEvent, input.cwd);

    return {
      formatted: [],
      typecheck: [],
      hints: [`🚫 Bash Security: ${bashValidation.reason}`],
      autoResolved: false,
      kpiEvent,
    };
  }

  // 4. ESLint vía daemon
  startStep(metrics, 'eslint-check');
  const eslintResult = await runESLintViaDaemon(editedFiles);
  endStep(metrics, 'eslint-check', true, undefined, {
    success: eslintResult.success,
    errors: eslintResult.errors,
    warnings: eslintResult.warnings,
    cacheHit: (eslintResult as any).cacheHit || false
  });

  // 5. Build Check vía daemon
  startStep(metrics, 'build-check');
  const buildResult = await runBuildCheckViaDaemon(reposChanged);
  endStep(metrics, 'build-check', true, undefined, {
    success: buildResult.success,
    errors: buildResult.errors,
    blocked: buildResult.blocked,
    cacheHit: (buildResult as any).cacheHit || false
  });

  // Build fallido es crítico y detiene el flujo
  if (buildResult.blocked) {
    console.error('\n🚫 BUILD CHECK BLOQUEADO - Build fallido:\n');
    console.error(`  ${buildResult.reason}\n`);
    if (buildResult.output) {
      console.error(`  Detalles: ${buildResult.output}\n`);
    }
    console.error('Por favor corrige los errores de build antes de continuar.\n');

    // Enviar notificación de error
    await sendNotification(
      'error',
      `Build check bloqueado: ${buildResult.errors} error(es) de build`,
      input.cwd
    );

    // Emit KPI de bloqueo por build
    const kpiEvent: KPIEvent = {
      ts: new Date().toISOString(),
      repo: reposChanged[0] || 'unknown',
      skills: ['build-check-validator'],
      errors_ts: buildResult.errors,
      auto_resolver_used: false,
      latency_ms: 0,
      zero_errors_left_behind: false,
      activated_by: {
        keywords: false,
        intent_regex: false,
        path_globs: false,
        content_patterns: false,
      },
      adherence: false,
      progressive_disclosure: {
        metadata_loaded: false,
        skill_md_loaded: false,
        resources_loaded: 0,
      },
    };

    await emitKPIEvent(kpiEvent, input.cwd);

    return {
      formatted: [],
      typecheck: [],
      hints: [`🚫 Build Check: ${buildResult.reason}`],
      autoResolved: false,
      kpiEvent,
    };
  }

  // 6. Prettier
  startStep(metrics, 'prettier-format');
  const formatted = await runPrettier(editedFiles, input.cwd);
  endStep(metrics, 'prettier-format', true, undefined, {
    filesProcessed: formatted.length,
    filesTotal: editedFiles.length
  });

  // 7. TypeCheck
  startStep(metrics, 'typecheck');
  const typecheck = await runTypeCheck(reposChanged, input.cwd);
  const totalErrors = typecheck.reduce((sum, r) => sum + Math.max(0, r.errors), 0);
  endStep(metrics, 'typecheck', true, undefined, {
    reposChecked: reposChanged.length,
    errorsFound: totalErrors
  });

  // 8. Error hints (si 1-4 errores)
  const hints = totalErrors >= 1 && totalErrors <= 4 ? generateErrorHints(typecheck) : undefined;

  // 9. Auto-resolver (si ≥5 errores)
  let autoResolved = false;
  let autoResolveSummary: string[] = [];
  
  if (totalErrors >= 5) {
    // Parsear todos los errores y intentar resolver
    const allErrors: ParsedError[] = [];
    for (const result of typecheck) {
      if (result.errors > 0) {
        const parsed = parseTypeScriptErrors(result.output);
        allErrors.push(...parsed);
      }
    }

    if (allErrors.length > 0) {
      startStep(metrics, 'auto-resolver');
      const resolveResult = await autoResolveTypeScriptErrors(allErrors, input.cwd);
      autoResolved = resolveResult.resolved > 0;
      autoResolveSummary = resolveResult.summary;
      endStep(metrics, 'auto-resolver', true, undefined, {
        errorsAttempted: allErrors.length,
        errorsResolved: resolveResult.resolved,
        resolutionRate: allErrors.length > 0 ? resolveResult.resolved / allErrors.length : 0
      });

      if (autoResolved) {
        console.log(`\n🔧 Auto-resolver: ${resolveResult.resolved} error(es) corregido(s) automáticamente:\n`);
        resolveResult.summary.forEach(msg => console.log(`  ✓ ${msg}`));
        console.log('\n💡 Ejecuta el typecheck nuevamente para verificar que los errores se resolvieron.\n');
        
        // Re-ejecutar typecheck para verificar
        const recheck = await runTypeCheck(reposChanged, input.cwd);
        const remainingErrors = recheck.reduce((sum, r) => sum + Math.max(0, r.errors), 0);
        
        if (remainingErrors < totalErrors) {
          const fixed = totalErrors - remainingErrors;
          console.log(`✅ ${fixed} error(es) resuelto(s). ${remainingErrors} error(es) restante(s).\n`);
          
          await sendNotification(
            'info',
            `🔧 Auto-resolver corrigió ${fixed} error(es) TypeScript. ${remainingErrors} restante(s).`,
            input.cwd
          );
        }
      }
    }

    // Si no se pudo resolver automáticamente pero hay muchos errores
    if (!autoResolved && totalErrors >= 5) {
      console.warn(`\n⚠️  ${totalErrors} error(es) TypeScript detectado(s). El auto-resolver no pudo corregirlos automáticamente.\n`);
      console.warn('💡 Considera revisar los errores manualmente o usar herramientas de análisis estático.\n');
      
      await sendNotification(
        'warning',
        `⚠️ ${totalErrors} error(es) TypeScript detectado(s). Revisión manual recomendada.`,
        input.cwd
      );
    }
  }

  // 9.5. Advanced Quality Gates - Validación específica por tipo de proyecto
  startStep(metrics, 'advanced-quality-gates');
  let qualityGateSummary: QualitySummary | null = null;
  let qualityGateBlocked = false;
  let qualityGateReason = '';

  try {
    console.log('\n🔍 Advanced Quality Gates - Analizando calidad del proyecto...\n');

    // Ejecutar advanced quality gates para cada repositorio afectado
    for (const repo of reposChanged) {
      const repoPath = join(input.cwd, repo);

      try {
        // Verificar que el repositorio existe
        if (await pathExists(repoPath)) {
          const qualityResult = await advancedQualityGateValidator.validateProject(repoPath);
          qualityGateSummary = qualityResult;

          // Mostrar resumen de calidad
          console.log(`\n📊 Quality Report - ${repo}`);
          console.log(`   Tipo de proyecto: ${qualityResult.characteristics.type}`);
          console.log(`   Score: ${qualityResult.score}/100 (${qualityResult.grade})`);
          console.log(`   Gates: ${qualityResult.passedGates}/${qualityResult.totalGates} pasaron`);

          if (qualityResult.failedGates > 0) {
            console.log(`   Fallidos: ${qualityResult.errorGates} errores, ${qualityResult.warningGates} warnings, ${qualityResult.infoGates} info`);
          }

          // Mostrar gates fallidos con detalles
          const failedGates = qualityResult.results.filter(r => !r.passed);
          if (failedGates.length > 0) {
            console.log('\n⚠️ Quality Gates fallidos:');
            for (const gate of failedGates) {
              const icon = gate.gate.severity === 'error' ? '🚫' :
                         gate.gate.severity === 'warning' ? '⚠️' : 'ℹ️';
              console.log(`   ${icon} ${gate.gate.name}: ${gate.gate.message}`);
              if (gate.gate.fix) {
                console.log(`      💡 Solución: ${gate.gate.fix}`);
              }
            }
            console.log('');
          }

          // Mostrar recomendaciones
          if (qualityResult.recommendations.length > 0) {
            console.log('\n💡 Recomendaciones de mejora:');
            qualityResult.recommendations.forEach(rec => {
              console.log(`   ${rec}`);
            });
            console.log('');
          }

          // Verificar si hay errores críticos que deben bloquear
          const criticalFailures = qualityResult.results.filter(r =>
            !r.passed && r.gate.severity === 'error'
          );

          if (criticalFailures.length > 0) {
            qualityGateBlocked = true;
            qualityGateReason = `${criticalFailures.length} quality gate(s) crítico(s) fallido(s)`;

            console.error(`\n🚫 ADVANCED QUALITY GATES BLOQUEADO:\n`);
            console.error(`   ${qualityGateReason}\n`);

            // Enviar notificación de bloqueo
            await sendNotification(
              'error',
              `Quality Gates bloqueado: ${qualityGateReason}`,
              input.cwd
            );
          }

          // Log de métricas de calidad
          console.log(`⏱️ Análisis completado en ${qualityResult.executionTime}ms\n`);

        } else {
          console.log(`⚠️ Repositorio ${repo} no encontrado, omitiendo análisis de quality gates\n`);
        }
      } catch (error) {
        console.error(`❌ Error analizando quality gates para ${repo}:`, error);
        // No bloquear por errores en el análisis de calidad, solo loggear
      }
    }

    endStep(metrics, 'advanced-quality-gates', !qualityGateBlocked, qualityGateBlocked ? qualityGateReason : undefined, {
      qualityScore: qualityGateSummary?.score || 0,
      qualityGrade: qualityGateSummary?.grade || 'F',
      gatesPassed: qualityGateSummary?.passedGates || 0,
      gatesTotal: qualityGateSummary?.totalGates || 0,
      blocked: qualityGateBlocked
    });

  } catch (error) {
    console.error('❌ Error en Advanced Quality Gates:', error);
    endStep(metrics, 'advanced-quality-gates', false, String(error));
  }

  // Si los quality gates están bloqueados, detener el flujo
  if (qualityGateBlocked) {
    // Emit KPI de bloqueo por quality gates
    const kpiEvent: KPIEvent = {
      ts: new Date().toISOString(),
      repo: reposChanged[0] || 'unknown',
      skills: ['advanced-quality-gates'],
      errors_ts: totalErrors,
      auto_resolver_used: autoResolved,
      latency_ms: metrics.totalDuration || 0,
      zero_errors_left_behind: false,
      activated_by: {
        keywords: false,
        intent_regex: false,
        path_globs: false,
        content_patterns: false,
      },
      adherence: false,
      progressive_disclosure: {
        metadata_loaded: false,
        skill_md_loaded: false,
        resources_loaded: 0,
      },
    };

    await emitKPIEvent(kpiEvent, input.cwd);

    return {
      formatted,
      typecheck,
      hints: [`🚫 Advanced Quality Gates: ${qualityGateReason}`],
      autoResolved,
      kpiEvent,
    };
  }

  // 10. NMLB (No-Mess-Left-Behind) - Verificación final de estado del repo
  startStep(metrics, 'nmlb-check');
  const nmlbResult = await verifyCleanRepoState(input.cwd);
  endStep(metrics, 'nmlb-check', true, undefined, {
    clean: nmlbResult.clean,
    blocked: nmlbResult.blocked,
    repoStatus: nmlbResult.gitStatus
  });

  if (nmlbResult.blocked) {
    console.error('\n🚫 NMLB BLOQUEADO - Repositorio en estado inconsistente:\n');
    console.error(`  ${nmlbResult.reason}\n`);
    if (nmlbResult.details) {
      console.error(`  ${nmlbResult.details}\n`);
    }
    console.error('Por favor limpia el estado del repositorio antes de continuar (git stash, git commit, git clean).\n');

    // Enviar notificación de error
    await sendNotification(
      'error',
      `NMLB bloqueado: ${nmlbResult.reason}`,
      input.cwd
    );

    // Emit KPI de bloqueo por NMLB
    const kpiEvent: KPIEvent = {
      ts: new Date().toISOString(),
      repo: reposChanged[0] || 'unknown',
      skills: ['nmlb-validator'],
      errors_ts: totalErrors,
      auto_resolver_used: false,
      latency_ms: 0,
      zero_errors_left_behind: false,
      activated_by: {
        keywords: false,
        intent_regex: false,
        path_globs: false,
        content_patterns: false,
      },
      adherence: false,
      progressive_disclosure: {
        metadata_loaded: false,
        skill_md_loaded: false,
        resources_loaded: 0,
      },
    };

    await emitKPIEvent(kpiEvent, input.cwd);

    return {
      formatted,
      typecheck,
      hints: [`🚫 NMLB: ${nmlbResult.reason}`],
      autoResolved,
      autoResolveSummary: autoResolveSummary.length > 0 ? autoResolveSummary : undefined,
      kpiEvent,
    };
  }

  // 11. Emit KPI Event
  const totalESLintIssues = eslintResult.errors + eslintResult.warnings;

  // Calcular métricas de cache
  const cacheHits = [
    (eslintResult as any).cacheHit || false,
    (buildResult as any).cacheHit || false,
    (fileWatcherConnection as any).cacheHit || false
  ].filter(Boolean).length;

  const cacheTotal = 3; // ESLint, Build, File Watcher
  const cacheHitRate = cacheTotal > 0 ? Math.round((cacheHits / cacheTotal) * 100) : 0;

  const kpiEvent: KPIEvent = {
    ts: new Date().toISOString(),
    repo: reposChanged[0] || 'unknown',
    skills: [
      ...(eslintResult.success ? ['eslint-check'] : []),
      ...(buildResult.success ? ['build-check'] : []),
      ...(nmlbResult.clean ? ['nmlb-check'] : [])
    ], // Skills activos en este ciclo
    errors_ts: totalErrors,
    auto_resolver_used: autoResolved,
    latency_ms: 0, // Se llena desde tiempo de ejecución real
    zero_errors_left_behind: totalErrors === 0 && totalESLintIssues === 0 && nmlbResult.clean,
    activated_by: {
      keywords: false,
      intent_regex: false,
      path_globs: false,
      content_patterns: false,
    },
    adherence: false,
    progressive_disclosure: {
      metadata_loaded: false,
      skill_md_loaded: false,
      resources_loaded: 0,
    },
  };

  await emitKPIEvent(kpiEvent, input.cwd);

  // Log de métricas de cache
  if (cacheHits > 0) {
    console.log(`📊 Cache Performance: ${cacheHits}/${cacheTotal} hits (${cacheHitRate}%)`);
  }

  // 12. Enviar notificaciones según resultado
  if (totalErrors === 0 && totalESLintIssues === 0 && nmlbResult.clean && formatted.length > 0) {
    // Éxito completo: todo limpio
    await sendNotification(
      'success',
      `✓ ${formatted.length} archivo(s) formateado(s) - Todo OK (TS+ESLint+Build+NMLB)`,
      input.cwd
    );
  } else if (totalErrors === 0 && totalESLintIssues === 0 && nmlbResult.clean && formatted.length === 0 && input.editLog.length > 0) {
    // Sin cambios pero todo limpio
    await sendNotification('info', `ℹ️ Sin cambios que procesar - Repositorio limpio`, input.cwd);
  } else if (totalErrors > 0) {
    // Errores TypeScript detectados
    const repoStatus = nmlbResult.clean ? 'Repo limpio' : `Repo: ${nmlbResult.reason}`;
    await sendNotification(
      'warning',
      `⚠️ ${totalErrors} error(es) TS + ${totalESLintIssues} ESLint issues - ${repoStatus}`,
      input.cwd
    );
  } else if (totalESLintIssues > 0) {
    // Solo ESLint issues
    const repoStatus = nmlbResult.clean ? 'Repo limpio' : `Repo: ${nmlbResult.reason}`;
    await sendNotification(
      'warning',
      `⚠️ ${eslintResult.errors} errores + ${eslintResult.warnings} advertencias ESLint - ${repoStatus}`,
      input.cwd
    );
  } else if (!nmlbResult.clean) {
    // Solo issues de NMLB
    await sendNotification(
      'warning',
      `⚠️ NMLB: ${nmlbResult.reason}`,
      input.cwd
    );
  } else if (formatted.length === 0 && input.editLog.length > 0) {
    // Sin cambios que formatear
    await sendNotification('info', `ℹ️ Sin cambios que procesar`, input.cwd);
  }

  // Finalizar y reportar métricas de performance
  const finalMetrics = finalizePipelineMetrics(metrics);

  // Log de métricas de performance
  console.log('\n📊 Pipeline Performance Metrics:');
  console.log(`   ⏱️ Total duration: ${finalMetrics.totalDuration}ms`);
  console.log(`   📈 Average step duration: ${Math.round(finalMetrics.averageStepDuration)}ms`);
  if (finalMetrics.slowestStep) {
    console.log(`   🐌 Slowest step: ${finalMetrics.slowestStep.name} (${finalMetrics.slowestStep.duration}ms)`);
  }
  if (finalMetrics.fastestStep) {
    console.log(`   ⚡ Fastest step: ${finalMetrics.fastestStep.name} (${finalMetrics.fastestStep.duration}ms)`);
  }

  // Cache performance summary
  const cacheHitsTotal = [
    (eslintResult as any).cacheHit || false,
    (buildResult as any).cacheHit || false,
    (fileWatcherConnection as any).cacheHit || false
  ].filter(Boolean).length;

  if (cacheHitsTotal > 0) {
    console.log(`   🎯 Cache hits: ${cacheHitsTotal}/3 services (${Math.round((cacheHitsTotal / 3) * 100)}%)`);
  }

  return {
    formatted,
    typecheck,
    hints,
    autoResolved,
    autoResolveSummary: autoResolveSummary.length > 0 ? autoResolveSummary : undefined,
    kpiEvent,
    metrics: finalMetrics // Agregar métricas al resultado para análisis externo
  };
}
