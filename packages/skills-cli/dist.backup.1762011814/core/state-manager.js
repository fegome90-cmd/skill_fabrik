import fs from 'fs';
import path from 'path';
import { WriteBarrier } from './write-barrier.js';
import { colors, format, createBox } from '../utils/colors';
export class StateManager {
    stateDir;
    securityContext;
    validationRules;
    mutationLimits;
    constructor() {
        this.stateDir = path.resolve(process.cwd(), '.codemachine', 'state');
        this.securityContext = {
            operationCounts: new Map(),
            lastValidation: Date.now(),
            blocked: false
        };
        // Initialize validation rules with database-verification skill
        this.validationRules = [
            {
                name: 'noMassiveDeletion',
                validate: (data) => this.validateNoMassiveDeletion(data),
                message: 'Massive deletion operations are not allowed',
                level: 'block'
            },
            {
                name: 'noMassiveUpdate',
                validate: (data) => this.validateNoMassiveUpdate(data),
                message: 'Massive update operations require confirmation',
                level: 'warn'
            },
            {
                name: 'dataIntegrity',
                validate: (data) => this.validateDataIntegrity(data),
                message: 'Data integrity check failed',
                level: 'error'
            },
            {
                name: 'safeStructure',
                validate: (data) => this.validateSafeStructure(data),
                message: 'Invalid data structure detected',
                level: 'error'
            }
        ];
        // Define mutation limits for security
        this.mutationLimits = [
            { maxRecords: 100, timeWindow: 60000, operation: 'write' }, // 100 writes per minute
            { maxRecords: 10, timeWindow: 60000, operation: 'delete' }, // 10 deletes per minute
            { maxRecords: 50, timeWindow: 60000, operation: 'update' } // 50 updates per minute
        ];
    }
    /**
     * Enhanced save with database-verification security validation
     */
    async saveNavigationState(state) {
        const filePath = path.join(this.stateDir, 'navigation.json');
        // Apply security validation before saving
        const validationResult = await this.validateOperation('write', state);
        if (!validationResult.valid) {
            if (validationResult.level === 'block') {
                throw new Error(`SECURITY_BLOCK: ${validationResult.message}`);
            }
            else if (validationResult.level === 'error') {
                console.error(colors.error(`Security Error: ${validationResult.message}`));
                throw new Error(`SECURITY_ERROR: ${validationResult.message}`);
            }
            else {
                console.warn(colors.warning(`Security Warning: ${validationResult.message}`));
            }
        }
        await this.writeJsonFile(filePath, state);
    }
    async loadNavigationState() {
        const filePath = path.join(this.stateDir, 'navigation.json');
        try {
            const data = await this.readJsonFile(filePath, {
                currentView: 'home',
                previousView: '',
                viewHistory: ['home'],
                isLoading: false,
                error: null,
                healthyComponents: [],
                unhealthyComponents: []
            });
            // Validate loaded data integrity
            const integrityCheck = this.validateDataIntegrity(data);
            if (!integrityCheck) {
                console.warn(colors.warning('Navigation state integrity check failed'));
            }
            return data;
        }
        catch (error) {
            console.error(colors.error(`Failed to load navigation state: ${error}`));
            return {
                currentView: 'home',
                previousView: '',
                viewHistory: ['home'],
                isLoading: false,
                error: null,
                healthyComponents: [],
                unhealthyComponents: []
            };
        }
    }
    async appendMetrics(metric) {
        const filePath = path.join(this.stateDir, 'metrics.jsonl');
        const line = JSON.stringify({ ...metric, timestamp: Date.now() }) + '\n';
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            await fs.promises.appendFile(filePath, line);
        }
        catch (error) {
            throw new Error('E_METRICS_WRITE: Failed to write metrics');
        }
    }
    async saveLastRun(run) {
        const filePath = path.join(this.stateDir, 'last-run.json');
        await this.writeJsonFile(filePath, run);
    }
    async writeJsonFile(filePath, data) {
        const writeBarrier = WriteBarrier.getInstance();
        await writeBarrier.writeFile(filePath, JSON.stringify(data, null, 2));
    }
    async readJsonFile(filePath, defaultValue = {}) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(content);
        }
        catch {
            return defaultValue;
        }
    }
    /**
     * Database-verification validation methods
     */
    async validateOperation(operation, data) {
        // Check rate limiting first
        const rateLimitCheck = this.checkRateLimit(operation);
        if (!rateLimitCheck.valid) {
            return rateLimitCheck;
        }
        // Apply all validation rules
        for (const rule of this.validationRules) {
            try {
                if (!rule.validate(data)) {
                    return {
                        valid: false,
                        message: rule.message,
                        level: rule.level
                    };
                }
            }
            catch (error) {
                return {
                    valid: false,
                    message: `Validation error in ${rule.name}: ${error}`,
                    level: 'error'
                };
            }
        }
        return { valid: true };
    }
    checkRateLimit(operation) {
        const now = Date.now();
        const timestamps = this.securityContext.operationCounts.get(operation) || [];
        // Filter old timestamps outside time window
        const relevantTimestamps = timestamps.filter(timestamp => now - timestamp < 60000 // 1 minute window
        );
        // Find applicable limit
        const limit = this.mutationLimits.find(l => l.operation === operation);
        if (limit && relevantTimestamps.length >= limit.maxRecords) {
            return {
                valid: false,
                message: `Rate limit exceeded: ${limit.maxRecords} ${operation}s per minute`,
                level: 'block'
            };
        }
        // Update operation count
        relevantTimestamps.push(now);
        this.securityContext.operationCounts.set(operation, relevantTimestamps);
        return { valid: true };
    }
    validateNoMassiveDeletion(data) {
        // Check if operation involves deletion of many records
        if (data && typeof data === 'object') {
            // Look for deletion indicators
            if (data.deleteMany || data.bulkDelete || data.massDelete) {
                return false;
            }
            // Check for arrays being cleared
            if (Array.isArray(data.items) && data.items.length === 0 && data.previousLength > 50) {
                return false;
            }
        }
        return true;
    }
    validateNoMassiveUpdate(data) {
        // Check if operation involves updating many records
        if (data && typeof data === 'object') {
            // Look for massive update indicators
            if (data.updateMany && data.updateMany > 20) {
                return false;
            }
            if (data.bulkUpdate && data.bulkUpdate.records > 50) {
                return false;
            }
            // Check for large arrays being replaced
            if (Array.isArray(data.items) && data.items.length > 100) {
                return false;
            }
        }
        return true;
    }
    validateDataIntegrity(data) {
        try {
            // Basic structural validation
            if (!data || typeof data !== 'object') {
                return false;
            }
            // Check for required fields in navigation state
            if (data.currentView !== undefined && typeof data.currentView !== 'string') {
                return false;
            }
            if (data.viewHistory && !Array.isArray(data.viewHistory)) {
                return false;
            }
            // Check for circular references
            const seen = new WeakSet();
            const checkCircular = (obj) => {
                if (obj && typeof obj === 'object') {
                    if (seen.has(obj))
                        return false;
                    seen.add(obj);
                    for (const value of Object.values(obj)) {
                        if (!checkCircular(value))
                            return false;
                    }
                }
                return true;
            };
            return checkCircular(data);
        }
        catch {
            return false;
        }
    }
    validateSafeStructure(data) {
        // Check for potentially dangerous structures
        try {
            const jsonStr = JSON.stringify(data);
            // Check for prototype pollution patterns
            if (jsonStr.includes('__proto__') || jsonStr.includes('constructor') || jsonStr.includes('prototype')) {
                return false;
            }
            // Check for code injection patterns
            if (jsonStr.includes('eval(') || jsonStr.includes('Function(') || jsonStr.includes('setTimeout(')) {
                return false;
            }
            // Check size limits
            if (jsonStr.length > 1024 * 1024) { // 1MB limit
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Show security dashboard
     */
    showSecurityDashboard() {
        const stats = {
            totalOperations: Array.from(this.securityContext.operationCounts.values())
                .reduce((sum, timestamps) => sum + timestamps.length, 0),
            activeRules: this.validationRules.length,
            rateLimits: this.mutationLimits.length,
            blocked: this.securityContext.blocked
        };
        console.log(createBox(format.header('🔒 Database Security Dashboard') + '\n\n' +
            format.section('Security Status') +
            format.bullet('Total Operations', colors.text(`${stats.totalOperations}`)) +
            format.bullet('Active Rules', colors.info(`${stats.activeRules}`)) +
            format.bullet('Rate Limits', colors.info(`${stats.rateLimits}`)) +
            format.bullet('System Status', stats.blocked ? colors.error('BLOCKED') : colors.success('SECURE')) + '\n' +
            format.section('Validation Rules Applied') +
            this.validationRules.map(rule => format.bullet(rule.name, rule.level === 'block' ? colors.error('BLOCK') :
                rule.level === 'error' ? colors.warning('ERROR') : colors.info('WARN'))).join('') + '\n' +
            format.section('Rate Limits') +
            this.mutationLimits.map(limit => format.bullet(`${limit.operation}`, colors.text(`${limit.maxRecords}/min`))).join('') + '\n' +
            format.section('Security Features') +
            format.command('state.verify - Run security verification') + '\n' +
            format.command('state.reset - Reset security context') + '\n' +
            format.command('state.rules - Show validation rules') + '\n', undefined, colors.warning));
    }
    /**
     * Reset security context
     */
    resetSecurityContext() {
        this.securityContext = {
            operationCounts: new Map(),
            lastValidation: Date.now(),
            blocked: false
        };
        console.log(colors.success('Security context reset successfully'));
    }
}
//# sourceMappingURL=state-manager.js.map