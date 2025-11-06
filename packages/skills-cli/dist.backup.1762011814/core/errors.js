export class CloopError extends Error {
}
export class ConfigError extends CloopError {
    field;
    expected;
    actual;
    code = 'E_CONFIG';
    constructor(field, expected, actual) {
        super(`Config error: ${field}`);
        this.field = field;
        this.expected = expected;
        this.actual = actual;
        this.name = 'ConfigError';
    }
    get userMessage() {
        return `Configuration error in ${this.field}`;
    }
    get solution() {
        return `Fix ${this.field} in config file. Expected: ${this.expected}${this.actual ? `, Actual: ${this.actual}` : ''}`;
    }
}
export class BackendError extends CloopError {
    backend;
    reason;
    code = 'E_BACKEND';
    constructor(backend, reason) {
        super(`Backend error: ${backend}`);
        this.backend = backend;
        this.reason = reason;
        this.name = 'BackendError';
    }
    get userMessage() {
        return `Backend ${this.backend} is not available: ${this.reason}`;
    }
    get solution() {
        return `Check ${this.backend} configuration and credentials, or switch to a supported fallback backend`;
    }
}
export class GateError extends CloopError {
    gate;
    reason;
    code = 'E_GATE';
    constructor(gate, reason) {
        super(`Gate error: ${gate}`);
        this.gate = gate;
        this.reason = reason;
        this.name = 'GateError';
    }
    get userMessage() {
        return `Gate ${this.gate} failed: ${this.reason}`;
    }
    get solution() {
        return `Fix the issue that caused ${this.gate} to fail and retry`;
    }
}
export class WriteError extends CloopError {
    path;
    reason;
    code = 'E_WRITE';
    constructor(path, reason) {
        super(`Write error: ${path}`);
        this.path = path;
        this.reason = reason;
        this.name = 'WriteError';
    }
    get userMessage() {
        return `Cannot write to ${this.path}: ${this.reason}`;
    }
    get solution() {
        return `Check permissions and valid paths. Writes are limited to the CLI sandbox directories`;
    }
}
//# sourceMappingURL=errors.js.map