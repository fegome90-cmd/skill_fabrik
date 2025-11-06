// Lightweight logger wrapper. Uses pino if available, else console.
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

interface LoggerLike {
  level: LogLevel;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  child: (bindings: Record<string, any>) => LoggerLike;
}

function consoleLogger(level: LogLevel = 'info'): LoggerLike {
  const base: LoggerLike = {
    level,
    info: (...a: any[]) => console.log('[info]', ...a),
    warn: (...a: any[]) => console.warn('[warn]', ...a),
    error: (...a: any[]) => console.error('[error]', ...a),
    debug: (...a: any[]) => { if (level === 'debug' || level === 'trace') console.debug('[debug]', ...a); },
    child: (_b: Record<string, any>) => base,
  };
  return base;
}

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export function getLogger(bindings: Record<string, any> = {}): LoggerLike {
  const level = (process.env.SF_LOG_LEVEL as LogLevel) || 'info';
  const pretty = process.env.SF_LOG_PRETTY === '1';
  try {
    // dynamic require to avoid hard dep
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pino = require('pino');
    const opts: any = { level };
    if (pretty) {
      try {
        const transport = {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        };
        return pino(opts, transport).child(bindings);
      } catch {
        return pino(opts).child(bindings);
      }
    }
    return pino(opts).child(bindings);
  } catch {
    return consoleLogger(level).child(bindings);
  }
}
