export abstract class CloopError extends Error {
  abstract code: string;
  abstract userMessage: string;
  abstract solution: string;
}

export class ConfigError extends CloopError {
  code = 'E_CONFIG';

  constructor(
    public field: string,
    public expected: string,
    public actual?: string
  ) {
    super(`Config error: ${field}`);
    this.name = 'ConfigError';
  }

  get userMessage(): string {
    return `Configuration error in ${this.field}`;
  }

  get solution(): string {
    return `Fix ${this.field} in config file. Expected: ${this.expected}${this.actual ? `, Actual: ${this.actual}` : ''}`;
  }
}

export class BackendError extends CloopError {
  code = 'E_BACKEND';

  constructor(
    public backend: string,
    public reason: string
  ) {
    super(`Backend error: ${backend}`);
    this.name = 'BackendError';
  }

  get userMessage(): string {
    return `Backend ${this.backend} is not available: ${this.reason}`;
  }

  get solution(): string {
    return `Check ${this.backend} configuration and credentials, or switch to a supported fallback backend`;
  }
}

export class GateError extends CloopError {
  code = 'E_GATE';

  constructor(
    public gate: string,
    public reason: string
  ) {
    super(`Gate error: ${gate}`);
    this.name = 'GateError';
  }

  get userMessage(): string {
    return `Gate ${this.gate} failed: ${this.reason}`;
  }

  get solution(): string {
    return `Fix the issue that caused ${this.gate} to fail and retry`;
  }
}

export class WriteError extends CloopError {
  code = 'E_WRITE';

  constructor(
    public path: string,
    public reason: string
  ) {
    super(`Write error: ${path}`);
    this.name = 'WriteError';
  }

  get userMessage(): string {
    return `Cannot write to ${this.path}: ${this.reason}`;
  }

  get solution(): string {
    return `Check permissions and valid paths. Writes are limited to the CLI sandbox directories`;
  }
}


