export interface HookConfig {
    enabled: boolean;
    skillRulesPath?: string;
    buildCheck?: boolean;
    prettier?: boolean;
    kpiEmit?: boolean;
}
export interface HooksConfiguration {
    userPromptSubmit?: HookConfig;
    stop?: HookConfig;
}
export interface HookInstallationResult {
    success: boolean;
    hooksInstalled: string[];
    errors: string[];
}
//# sourceMappingURL=hooks.d.ts.map