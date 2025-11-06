export interface NavigationState {
    currentView: string;
    previousView: string;
    viewHistory: string[];
    isLoading: boolean;
    error: Error | null;
    healthyComponents: Set<string>;
    unhealthyComponents: Set<string>;
}
export declare class NavigationCore {
    private state;
    private stateHistory;
    private maxHistorySize;
    private stateManager;
    private initialized;
    constructor();
    private getInitialState;
    private ensureInitialized;
    navigateTo(view: string, params?: unknown): Promise<boolean>;
    goBack(): Promise<boolean>;
    private isViewAccessible;
    private getRequiredComponentsForView;
    private renderView;
    private setLoading;
    private handleError;
    private attemptRecovery;
    private saveStateToHistory;
    private persistState;
    registerComponent(name: string, isHealthy: boolean): void;
    getState(): NavigationState;
    getStateAsync(): Promise<NavigationState>;
    getBreadcrumbs(): string[];
}
//# sourceMappingURL=navigation-core.d.ts.map