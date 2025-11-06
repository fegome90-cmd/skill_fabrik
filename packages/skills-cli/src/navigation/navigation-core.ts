import { StateManager } from '../core/state-manager.js';

export interface NavigationState {
  currentView: string;
  previousView: string;
  viewHistory: string[];
  isLoading: boolean;
  error: Error | null;
  healthyComponents: Set<string>;
  unhealthyComponents: Set<string>;
}

export class NavigationCore {
  private state: NavigationState;
  private stateHistory: NavigationState[] = [];
  private maxHistorySize: number = 10;
  private stateManager: StateManager;

  private initialized = false;

  constructor() {
    this.stateManager = new StateManager();
    this.state = this.getInitialState();
    // Lazy initialization - don't block constructor
  }

  private getInitialState(): NavigationState {
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

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const saved = await this.stateManager.loadNavigationState();
      if (saved && saved.currentView) {
        this.state = { ...this.getInitialState(), ...saved };
      }
    } catch {
      // Use defaults
    }
    
    this.initialized = true;
  }

  async navigateTo(view: string, params?: unknown): Promise<boolean> {
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
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  async goBack(): Promise<boolean> {
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

  private async isViewAccessible(view: string): Promise<boolean> {
    // In SAFE mode, validate required components
    const requiredComponents = this.getRequiredComponentsForView(view);

    for (const componentName of requiredComponents) {
      if (this.state.unhealthyComponents.has(componentName)) {
        return false;
      }
    }

    return true;
  }

  private getRequiredComponentsForView(view: string): string[] {
    const viewRequirements: Record<string, string[]> = {
      'home': ['memory-system', 'command-processor'],
      'agents': ['agent-manager'],
      'mem': ['memory-system'],
      'workflow': ['workflow-runner']
    };

    return viewRequirements[view] || [];
  }

  private async renderView(_view: string, _params?: unknown): Promise<void> {
    // Placeholder for view rendering
    // This would integrate with actual view renderers
  }

  private setLoading(isLoading: boolean): void {
    this.state.isLoading = isLoading;
  }

  private handleError(error: Error): void {
    this.state.error = error;
    this.setLoading(false);
    this.attemptRecovery();
  }

  private attemptRecovery(): void {
    if (this.state.currentView !== 'home') {
      setTimeout(() => this.navigateTo('home'), 1000);
    }
  }

  private saveStateToHistory(): void {
    this.stateHistory.push({ ...this.state });

    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  private async persistState(): Promise<void> {
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
    } catch {
      // Silent fail
    }
  }

  registerComponent(name: string, isHealthy: boolean): void {
    if (isHealthy) {
      this.state.healthyComponents.add(name);
      this.state.unhealthyComponents.delete(name);
    } else {
      this.state.healthyComponents.delete(name);
      this.state.unhealthyComponents.add(name);
    }
  }

  getState(): NavigationState {
    return { ...this.state };
  }

  async getStateAsync(): Promise<NavigationState> {
    await this.ensureInitialized();
    return { ...this.state };
  }

  getBreadcrumbs(): string[] {
    return [...this.state.viewHistory];
  }
}
