export declare abstract class CloopError extends Error {
    abstract code: string;
    abstract userMessage: string;
    abstract solution: string;
}
export declare class ConfigError extends CloopError {
    field: string;
    expected: string;
    actual?: string;
    code: string;
    constructor(field: string, expected: string, actual?: string);
    get userMessage(): string;
    get solution(): string;
}
export declare class BackendError extends CloopError {
    backend: string;
    reason: string;
    code: string;
    constructor(backend: string, reason: string);
    get userMessage(): string;
    get solution(): string;
}
export declare class GateError extends CloopError {
    gate: string;
    reason: string;
    code: string;
    constructor(gate: string, reason: string);
    get userMessage(): string;
    get solution(): string;
}
export declare class WriteError extends CloopError {
    path: string;
    reason: string;
    code: string;
    constructor(path: string, reason: string);
    get userMessage(): string;
    get solution(): string;
}
//# sourceMappingURL=errors.d.ts.map