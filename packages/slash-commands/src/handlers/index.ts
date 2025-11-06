/**
 * Slash Command Handlers Index
 */

export { SlashCommandHandler } from './base.js';

// Foundation Handlers
export { BuildAndFixHandler } from './build-and-fix.js';
export { CompactHandler } from './compact.js';
export { UndoHandler } from './undo.js';

// Intermediate Handlers
export { CodeReviewHandler } from './code-review.js';

// Existing Handlers
export { DevDocsUpdateHandler } from './dev-docs-update.js';

// Advanced Handlers
export { RouteResearchForTestingHandler } from './route-research-for-testing.js';
export { TestRouteHandler } from './test-route.js';
export { PluginHandler } from './plugin.js';

// Development Handlers
// export { DevDocsHandler } from './dev-docs.js';
// export { CreateDevDocsHandler } from './create-dev-docs.js';