import { Command } from 'commander';
import { Logger } from '../utils/logger.js';

interface GuardrailRule {
  pattern: string | RegExp;
  type: 'command' | 'code' | 'path' | 'security';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  block: boolean;
}

const DESTRUCTIVE_PATTERNS: GuardrailRule[] = [
  {
    pattern: /\brm\s+(-rf|--recursive|--force)\s+\//,
    type: 'command',
    severity: 'critical',
    message: 'Destructive file system operation detected: rm -rf /',
    block: true,
  },
  {
    pattern: /\bdeleteMany\s*\(\s*\)/,
    type: 'code',
    severity: 'critical',
    message: 'deleteMany() without where clause - will delete all records!',
    block: true,
  },
  // deleteMany({ ... }) without where → BLOCK
  {
    pattern: /\bdeleteMany\s*\(\s*\{(?![\s\S]*?\bwhere\s*:)\s*[\s\S]*?\}\s*\)/,
    type: 'code',
    severity: 'critical',
    message: 'deleteMany({...}) without where clause - will delete all records!',
    block: true,
  },
  {
    pattern: /\bupdateMany\s*\(\s*\)/,
    type: 'code',
    severity: 'high',
    message: 'updateMany() without where clause - will update all records!',
    block: false,
  },
  // updateMany({ ... }) without where → WARN (non-blocking)
  {
    pattern: /\bupdateMany\s*\(\s*\{(?![\s\S]*?\bwhere\s*:)\s*[\s\S]*?\}\s*\)/,
    type: 'code',
    severity: 'high',
    message: 'updateMany({...}) without where clause - risk of updating all records',
    block: false,
  },
  // findMany({ ... }) without where → SUGGEST (non-blocking)
  {
    pattern: /\bfindMany\s*\(\s*\{(?![\s\S]*?\bwhere\s*:)\s*[\s\S]*?\}\s*\)/,
    type: 'code',
    severity: 'medium',
    message: 'findMany({...}) without where clause - consider narrowing results',
    block: false,
  },
  {
    pattern: /\bDROP\s+TABLE\s+\w+/i,
    type: 'code',
    severity: 'critical',
    message: 'DROP TABLE statement detected',
    block: true,
  },
  {
    pattern: /\bTRUNCATE\s+TABLE\s+\w+/i,
    type: 'code',
    severity: 'high',
    message: 'TRUNCATE TABLE statement detected',
    block: false,
  },
  {
    pattern: /eval\(/,
    type: 'code',
    severity: 'high',
    message: 'eval() usage detected - security risk',
    block: false,
  },
  // Detección de secretos hardcodeados
  {
    pattern: /(?:API_KEY|SECRET_KEY|PASSWORD|TOKEN|PRIVATE_KEY)\s*[:=]\s*['"](?:sk_live|sk-|pk_live|pk-|eyJ)[\w-]{20,}['"]/i,
    type: 'security',
    severity: 'critical',
    message: 'Secretos hardcodeados detectados (API_KEY, SECRET_KEY, etc.). Usar variables de entorno.',
    block: true,
  },
  {
    pattern: /(?:password|secret|api_key|token|jwt_secret)\s*[:=]\s*['"][\w-]{15,}['"]/i,
    type: 'security',
    severity: 'high',
    message: 'Posible secreto hardcodeado detectado. Verificar y usar variables de entorno.',
    block: false,
  },
];

export function guardrailCommand(program: Command) {
  program
    .command('guardrail')
    .description('Test guardrails against destructive patterns')
    .argument('<pattern>', 'Pattern to test (e.g., "rm -rf /")')
    .option('-v, --verbose', 'Verbose output')
    .option('--file <path>', 'Test pattern against file content')
    .action(async (pattern: string, options: { verbose?: boolean; file?: string }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info(`Testing guardrail against: "${pattern}"`);

        let contentToTest = pattern;

        // If file option provided, read file content
        if (options.file) {
          const { readFile } = await import('fs/promises');
          contentToTest = await readFile(options.file, { encoding: 'utf-8' });
          logger.debug(`Reading content from: ${options.file}`);
        }

        const matches: GuardrailRule[] = [];

        // Test against all guardrail rules
        for (const rule of DESTRUCTIVE_PATTERNS) {
          const regex =
            rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern, 'i');

          if (regex.test(contentToTest)) {
            matches.push(rule);

            logger.warning(`⚠️  ${rule.severity.toUpperCase()}: ${rule.message}`);

            if (options.verbose) {
              const matchResult = regex.exec(contentToTest);
              if (matchResult) {
                logger.debug(`  Matched: "${matchResult[0]}"`);
              }
            }
          }
        }

        // Check if any blocking rules matched
        const blockingMatches = matches.filter(m => m.block);

        if (blockingMatches.length > 0) {
          logger.error(`\n✗ BLOCKED: ${blockingMatches.length} destructive pattern(s) detected`);
          blockingMatches.forEach(m => {
            logger.error(`  - ${m.message}`);
          });
          process.exit(1);
        } else if (matches.length > 0) {
          logger.warning(
            `\n⚠️  WARNING: ${matches.length} risky pattern(s) detected (non-blocking)`
          );
          process.exit(0);
        } else {
          logger.success('\n✓ No guardrail violations detected');
          process.exit(0);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });
}
