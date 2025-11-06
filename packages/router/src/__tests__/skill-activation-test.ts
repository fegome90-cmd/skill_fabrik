/**
 * Test de activación de skills con heurística multi-señal
 * Simula diferentes escenarios para verificar scoring correcto
 */

import { matchRulesFor } from '../detectors.js';
import type { PreHookInput, SkillRules } from '../types.js';

// Mock de skill rules con las 5 skills base
const mockRules: SkillRules = {
  'backend-dev-guidelines': {
    type: 'guideline',
    enforcement: 'suggest',
    priority: 'high',
    promptTriggers: {
      keywords: ['backend', 'controller', 'service', 'API', 'endpoint', 'route'],
      intentPatterns: ['(create|add|fix).*?(route|endpoint|controller|service)'],
    },
    fileTriggers: {
      pathPatterns: ['**/controllers/**/*.ts', '**/services/**/*.ts'],
      contentPatterns: ['router\\.', 'export.*Controller'],
    },
  },
  'frontend-dev-guidelines': {
    type: 'guideline',
    enforcement: 'suggest',
    priority: 'high',
    promptTriggers: {
      keywords: ['frontend', 'component', 'hook', 'UI', 'view'],
      intentPatterns: ['(create|add|fix).*?(component|hook|view)'],
    },
    fileTriggers: {
      pathPatterns: ['frontend/src/**/*.{ts,tsx}', '**/components/**/*.{ts,tsx}'],
      contentPatterns: ['function\\s+.*\\(', 'use[A-Z]\\w+\\('],
    },
  },
};

// Escenario 1: Prompt con keywords + intent + path
const testCase1: PreHookInput = {
  prompt: 'create a new endpoint for user authentication',
  openFiles: ['backend/src/controllers/AuthController.ts'],
  activeFileContent: 'router.post("/auth", AuthController.login);',
  cwd: process.cwd(),
};

// Escenario 2: Solo keywords
const testCase2: PreHookInput = {
  prompt: 'I need help with backend services',
  openFiles: [],
  activeFileContent: undefined,
  cwd: process.cwd(),
};

// Escenario 3: Prompt frontend + archivo + contenido
const testCase3: PreHookInput = {
  prompt: 'create a new react component for dashboard',
  openFiles: ['frontend/src/components/Dashboard.tsx'],
  activeFileContent: 'function Dashboard() { return <div>Dashboard</div>; }',
  cwd: process.cwd(),
};

console.log('=== Test de Activación de Skills ===\n');

console.log('Escenario 1: Backend endpoint completo');
const result1 = matchRulesFor(testCase1, mockRules, 0.6);
console.log(`Activated: ${result1.activated.join(', ')}`);
console.log(`Scores:`, result1.metadata.scores);
console.log(`Reasons:`, result1.metadata.reasons);
console.log('');

console.log('Escenario 2: Solo keywords backend');
const result2 = matchRulesFor(testCase2, mockRules, 0.6);
console.log(`Activated: ${result2.activated.join(', ') || 'NONE'}`);
console.log(`Scores:`, result2.metadata.scores);
console.log(`Reasons:`, result2.metadata.reasons);
console.log('');

console.log('Escenario 3: Frontend component completo');
const result3 = matchRulesFor(testCase3, mockRules, 0.6);
console.log(`Activated: ${result3.activated.join(', ')}`);
console.log(`Scores:`, result3.metadata.scores);
console.log(`Reasons:`, result3.metadata.reasons);
console.log('');

