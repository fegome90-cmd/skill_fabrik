import { StateManager } from '../core/state-manager.js';
export class NavigationCore {
    state;
    stateHistory = [];
    maxHistorySize = 10;
    stateManager;
    initialized = false;
    constructor() {
        this.stateManager = new StateManager();
        this.state = this.getInitialState();
        // Lazy initialization - don't block constructor
    }
    getInitialState() {
        return {
            currentView: 'home',
            previousView: '',
            viewHistory: ['home'],
            isLoading: false,
            error: null,
            healthyComponents: new Set(),
            unhealthyComponents: new Set()
        };
    }
    async ensureInitialized() {
        if (this.initialized)
            return;
        try {
            const saved = await this.stateManager.loadNavigationState();
            if (saved && saved.currentView) {
                this.state = { ...this.getInitialState(), ...saved };
            }
        }
        catch {
            // Use defaults
        }
        this.initialized = true;
    }
    async navigateTo(view, params) {
        await this.ensureInitialized();
        try {
            this.setLoading(true);
            // Save current state to history
            this.saveStateToHistory();
            // Validate view is accessible
            if (!await this.isViewAccessible(view)) {
                this.handleError(new Error(`View ${view} is not accessible`));
                return false;
            }
            // Navigate to new view
            await this.renderView(view, params);
            // Update state
            this.state.previousView = this.state.currentView;
            this.state.currentView = view;
            this.state.viewHistory.push(view);
            // Limit history size
            if (this.state.viewHistory.length > 20) {
                this.state.viewHistory.shift();
            }
            this.setLoading(false);
            await this.persistState();
            return true;
        }
        catch (error) {
            this.handleError(error);
            return false;
        }
    }
    async goBack() {
        await this.ensureInitialized();
        if (this.state.viewHistory.length <= 1) {
            return false;
        }
        // Remove current view from history
        this.state.viewHistory.pop();
        // Get previous view
        const previousView = this.state.viewHistory[this.state.viewHistory.length - 1];
        return await this.navigateTo(previousView);
    }
    async isViewAccessible(view) {
        // In SAFE mode, validate required components
        const requiredComponents = this.getRequiredComponentsForView(view);
        for (const componentName of requiredComponents) {
            if (this.state.unhealthyComponents.has(componentName)) {
                return false;
            }
        }
        return true;
    }
    getRequiredComponentsForView(view) {
        const viewRequirements = {
            'home': ['memory-system', 'command-processor'],
            'agents': ['agent-manager'],
            'mem': ['memory-system'],
            'workflow': ['workflow-runner']
        };
        return viewRequirements[view] || [];
    }
    async renderView(_view, _params) {
        // Placeholder for view rendering
        // This would integrate with actual view renderers
    }
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
    }
    handleError(error) {
        this.state.error = error;
        this.setLoading(false);
        this.attemptRecovery();
    }
    attemptRecovery() {
        if (this.state.currentView !== 'home') {
            setTimeout(() => this.navigateTo('home'), 1000);
        }
    }
    saveStateToHistory() {
        this.stateHistory.push({ ...this.state });
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }
    async persistState() {
        try {
            await this.stateManager.saveNavigationState({
                currentView: this.state.currentView,
                previousView: this.state.previousView,
                viewHistory: this.state.viewHistory,
                isLoading: this.state.isLoading,
                error: this.state.error?.message || null,
                healthyComponents: Array.from(this.state.healthyComponents),
                unhealthyComponents: Array.from(this.state.unhealthyComponents)
            });
        }
        catch {
            // Silent fail
        }
    }
    registerComponent(name, isHealthy) {
        if (isHealthy) {
            this.state.healthyComponents.add(name);
            this.state.unhealthyComponents.delete(name);
        }
        else {
            this.state.healthyComponents.delete(name);
            this.state.unhealthyComponents.add(name);
        }
    }
    getState() {
        return { ...this.state };
    }
    async getStateAsync() {
        await this.ensureInitialized();
        return { ...this.state };
    }
    getBreadcrumbs() {
        return [...this.state.viewHistory];
    }
}
//# sourceMappingURL=navigation-core.js.map