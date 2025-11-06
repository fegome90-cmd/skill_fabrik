export declare class StateManager {
    private stateDir;
    private securityContext;
    private validationRules;
    private mutationLimits;
    constructor();
    /**
     * Enhanced save with database-verification security validation
     */
    saveNavigationState(state: any): Promise<void>;
    loadNavigationState(): Promise<any>;
    appendMetrics(metric: any): Promise<void>;
    saveLastRun(run: any): Promise<void>;
    private writeJsonFile;
    private readJsonFile;
    /**
     * Database-verification validation methods
     */
    private validateOperation;
    private checkRateLimit;
    private validateNoMassiveDeletion;
    private validateNoMassiveUpdate;
    private validateDataIntegrity;
    private validateSafeStructure;
    /**
     * Show security dashboard
     */
    showSecurityDashboard(): void;
    /**
     * Reset security context
     */
    resetSecurityContext(): void;
}
//# sourceMappingURL=state-manager.d.ts.map