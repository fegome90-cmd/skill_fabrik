export const MOCK_SKILLS_RESPONSE = {
  skills: [
    {
      name: 'test-skill',
      description: 'Test skill for integration testing',
      severity: 'medium',
      triggers: { keywords: ['test', 'mock'] }
    }
  ]
};

export const MOCK_PLAN_RESPONSE = {
  id: 'test-plan-1',
  title: 'Test Plan',
  status: 'draft',
  phases: [
    { id: 'clarify', title: 'Clarify Objectives', completed: false },
    { id: 'layout', title: 'Layout MVP', completed: false }
  ]
};

export const MOCK_KPI_RESPONSE = {
  period: '7-days',
  metrics: {
    totalActivations: 150,
    successRate: 0.95,
    averageLatency: 250
  }
};
