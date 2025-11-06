/**
 * /dev-docs Command Handler
 * Generates strategic plan guidance without writing files yet
 */

import { SlashCommandHandler } from './base.js';
import {
  ParsedSlashCommand,
  SlashCommandContext,
  DevDocsPlan,
  SlashCommandResult,
} from '../types.js';

export class DevDocsHandler extends SlashCommandHandler {
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const taskDescription = this.requireArgument(parsedCommand, 0, 'task description');
    const verbosity = this.getFlag(parsedCommand, 'verbose', false);
    const template = this.getFlag(parsedCommand, 'template', 'cloop');

    // Generate strategic guidance
      const plan = await this.generateStrategicPlan(taskDescription, context, {
      verbosity: verbosity || false,
      template: template || 'cloop',
      context: (this.getFlag(parsedCommand, 'context', '' as string) as string) || undefined,
    });

    const output = this.formatPlanOutput(plan, {
      format: this.getOption(parsedCommand, 'f', 'text') as any,
      verbosity,
    });

    // Store plan in context for potential /create-dev-docs follow-up
    await this.contextManager.updateContext(context.sessionId, {
      state: {
        lastGeneratedPlan: plan,
        taskDescription,
        generatedAt: new Date().toISOString(),
      }
    });

    return this.createSuccessResult(
      output,
      { plan, taskDescription },
      [
        `Use /create-dev-docs "${taskDescription}" to materialize this plan into files`,
        'Add --save to save plan to context for later use',
        'Use /dev-docs-update to modify existing plans',
      ]
    );
  }

  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    const taskDescription = this.getArgument(parsedCommand, 0);

    if (!taskDescription) {
      return { valid: false, message: 'Task description is required' };
    }

    if (taskDescription.length < 5) {
      return { valid: false, message: 'Task description must be at least 5 characters' };
    }

    if (taskDescription.length > 200) {
      return { valid: false, message: 'Task description must be less than 200 characters' };
    }

    // Validate template
    const template = this.getFlag(parsedCommand, 'template', 'cloop');
    const validTemplates = ['cloop', 'agile', 'waterfall', 'custom'];
    if (!validTemplates.includes(template)) {
      return {
        valid: false,
        message: `Invalid template: ${template}. Valid options: ${validTemplates.join(', ')}`
      };
    }

    return { valid: true };
  }

  private async generateStrategicPlan(
    taskDescription: string,
    context: SlashCommandContext,
    options: {
      verbosity?: boolean;
      template?: string;
      context?: string;
    }
  ): Promise<DevDocsPlan> {
    const planId = this.generatePlanId(taskDescription);
    const timestamp = new Date();

    // Extract key elements from task description
    const analysis = this.analyzeTaskDescription(taskDescription);

    // Generate objectives based on task type and complexity
    const objectives = this.generateObjectives(taskDescription, analysis);

    // Create phases based on template
    const phases = this.generatePhases(taskDescription, analysis, options.template || 'cloop');

    // Identify potential risks
    const risks = this.identifyRisks(taskDescription, analysis, context.workspace);

    // Define KPIs for success measurement
    const kpis = this.defineKPIs(taskDescription, analysis);

    return {
      id: planId,
      title: this.generatePlanTitle(taskDescription),
      description: taskDescription,
      objectives,
      phases,
      risks,
      kpis,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private analyzeTaskDescription(taskDescription: string) {
    const lowerDesc = taskDescription.toLowerCase();

    return {
      complexity: this.assessComplexity(taskDescription),
      type: this.identifyTaskType(taskDescription),
      scope: this.identifyScope(taskDescription),
      stakeholders: this.identifyStakeholders(taskDescription),
      technologies: this.identifyTechnologies(taskDescription),
      deliverables: this.identifyDeliverables(taskDescription),
    };
  }

  private assessComplexity(taskDescription: string): 'low' | 'medium' | 'high' {
    const complexityIndicators = {
      high: ['integration', 'architecture', 'system', 'migration', 'platform', 'infrastructure'],
      medium: ['api', 'service', 'component', 'feature', 'module', 'workflow'],
      low: ['fix', 'update', 'refactor', 'documentation', 'configuration', 'setup']
    };

    const lowerDesc = taskDescription.toLowerCase();

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => lowerDesc.includes(indicator))) {
        return level as 'low' | 'medium' | 'high';
      }
    }

    return 'medium'; // default
  }

  private identifyTaskType(taskDescription: string): string {
    const taskTypes = {
      'development': ['implement', 'develop', 'build', 'create', 'code'],
      'testing': ['test', 'validate', 'verify', 'qa', 'testing'],
      'documentation': ['document', 'write', 'docs', 'readme', 'guide'],
      'infrastructure': ['deploy', 'setup', 'configure', 'infrastructure', 'ci/cd'],
      'maintenance': ['fix', 'debug', 'optimize', 'refactor', 'maintain'],
      'research': ['research', 'investigate', 'explore', 'analyze', 'study'],
    };

    const lowerDesc = taskDescription.toLowerCase();

    for (const [type, keywords] of Object.entries(taskTypes)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return type;
      }
    }

    return 'general';
  }

  private identifyScope(taskDescription: string): 'single-component' | 'multi-component' | 'system-wide' {
    const scopeIndicators = {
      'system-wide': ['system', 'platform', 'architecture', 'migration'],
      'multi-component': ['integration', 'service', 'api', 'workflow'],
      'single-component': ['component', 'module', 'feature', 'function'],
    };

    const lowerDesc = taskDescription.toLowerCase();

    for (const [scope, indicators] of Object.entries(scopeIndicators)) {
      if (indicators.some(indicator => lowerDesc.includes(indicator))) {
        return scope as any;
      }
    }

    return 'single-component'; // default
  }

  private identifyStakeholders(taskDescription: string): string[] {
    const stakeholders = [];
    const lowerDesc = taskDescription.toLowerCase();

    if (lowerDesc.includes('user') || lowerDesc.includes('customer')) {
      stakeholders.push('users');
    }
    if (lowerDesc.includes('api') || lowerDesc.includes('integration')) {
      stakeholders.push('developers');
      stakeholders.push('external-services');
    }
    if (lowerDesc.includes('security') || lowerDesc.includes('auth')) {
      stakeholders.push('security-team');
    }
    if (lowerDesc.includes('performance') || lowerDesc.includes('scalability')) {
      stakeholders.push('ops-team');
    }
    if (lowerDesc.includes('ui') || lowerDesc.includes('frontend')) {
      stakeholders.push('design-team');
    }

    return stakeholders.length > 0 ? stakeholders : ['development-team'];
  }

  private identifyTechnologies(taskDescription: string): string[] {
    const techMap = {
      'react': ['react', 'jsx', 'frontend', 'component'],
      'typescript': ['typescript', 'ts', 'types'],
      'node': ['node', 'nodejs', 'backend', 'api'],
      'database': ['database', 'db', 'sql', 'nosql', 'migration'],
      'testing': ['test', 'testing', 'unit', 'integration', 'e2e'],
      'docker': ['docker', 'container', 'deployment'],
      'aws': ['aws', 'cloud', 'lambda', 's3'],
      'security': ['auth', 'security', 'jwt', 'oauth'],
    };

    const lowerDesc = taskDescription.toLowerCase();
    const technologies: string[] = [];

    for (const [tech, keywords] of Object.entries(techMap)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        technologies.push(tech);
      }
    }

    return technologies;
  }

  private identifyDeliverables(taskDescription: string): string[] {
    const deliverables = [];
    const lowerDesc = taskDescription.toLowerCase();

    if (lowerDesc.includes('api') || lowerDesc.includes('service')) {
      deliverables.push('API Endpoints', 'Documentation');
    }
    if (lowerDesc.includes('ui') || lowerDesc.includes('component')) {
      deliverables.push('UI Components', 'Style Guide');
    }
    if (lowerDesc.includes('test')) {
      deliverables.push('Test Suite', 'Test Reports');
    }
    if (lowerDesc.includes('documentation') || lowerDesc.includes('docs')) {
      deliverables.push('Documentation', 'User Guides');
    }
    if (lowerDesc.includes('deploy') || lowerDesc.includes('infrastructure')) {
      deliverables.push('Deployment Scripts', 'Infrastructure Config');
    }

    return deliverables.length > 0 ? deliverables : ['Solution Implementation', 'Documentation'];
  }

  private generateObjectives(taskDescription: string, analysis: any): string[] {
    const objectives = [
      `Successfully implement: ${taskDescription}`,
      'Ensure high code quality and maintainability',
      'Follow established development best practices',
    ];

    // Add complexity-specific objectives
    if (analysis.complexity === 'high') {
      objectives.push('Manage architectural complexity and dependencies');
      objectives.push('Ensure scalability and performance requirements');
    }

    // Add type-specific objectives
    if (analysis.type === 'development') {
      objectives.push('Deliver fully functional and tested implementation');
    } else if (analysis.type === 'testing') {
      objectives.push('Achieve comprehensive test coverage');
      objectives.push('Validate all critical user scenarios');
    }

    // Add stakeholder-specific objectives
    if (analysis.stakeholders.includes('users')) {
      objectives.push('Ensure excellent user experience and usability');
    }
    if (analysis.stakeholders.includes('security-team')) {
      objectives.push('Meet all security requirements and standards');
    }

    return objectives;
  }

  private generatePhases(taskDescription: string, analysis: any, template: string = 'cloop'): any[] {
    const basePhases = [
      {
        id: 'clarify',
        name: 'Clarify Requirements',
        description: 'Define objectives, scope, and success criteria',
        status: 'pending' as const,
        tasks: [
          {
            id: 'clarify-1',
            title: 'Define clear objectives and success criteria',
            description: 'Document what success looks like for this task',
            status: 'pending' as const,
          },
          {
            id: 'clarify-2',
            title: 'Identify stakeholders and requirements',
            description: 'Map out all stakeholders and their needs',
            status: 'pending' as const,
          },
        ],
      },
      {
        id: 'layout',
        name: 'Layout Solution',
        description: 'Design architecture and implementation approach',
        status: 'pending' as const,
        tasks: [
          {
            id: 'layout-1',
            title: 'Design technical approach',
            description: 'Create high-level technical design',
            status: 'pending' as const,
          },
          {
            id: 'layout-2',
            title: 'Define implementation milestones',
            description: 'Break down work into manageable milestones',
            status: 'pending' as const,
          },
        ],
      },
    ];

    // Add complexity-specific phases
    if (analysis.complexity === 'high') {
      basePhases.push({
        id: 'prototype',
        name: 'Prototype & Validate',
        description: 'Create proof of concept and validate approach',
        status: 'pending' as const,
        tasks: [
          {
            id: 'prototype-1',
            title: 'Build proof of concept',
            description: 'Implement core functionality to validate approach',
            status: 'pending' as const,
          },
        ],
      });
    }

    basePhases.push(
      {
        id: 'operate',
        name: 'Implement Solution',
        description: 'Execute the implementation work',
        status: 'pending' as const,
        tasks: [
          {
            id: 'operate-1',
            title: 'Implement core functionality',
            description: 'Build the main solution components',
            status: 'pending' as const,
          },
          {
            id: 'operate-2',
            title: 'Write comprehensive tests',
            description: 'Ensure test coverage for all functionality',
            status: 'pending' as const,
          },
        ],
      },
      {
        id: 'observe',
        name: 'Test & Validate',
        description: 'Test implementation and gather feedback',
        status: 'pending' as const,
        tasks: [
          {
            id: 'observe-1',
            title: 'Execute test suite',
            description: 'Run all tests and validate functionality',
            status: 'pending' as const,
          },
          {
            id: 'observe-2',
            title: 'Performance validation',
            description: 'Validate performance requirements are met',
            status: 'pending' as const,
          },
        ],
      },
      {
        id: 'reflect',
        name: 'Review & Deploy',
        description: 'Review work and prepare for deployment',
        status: 'pending' as const,
        tasks: [
          {
            id: 'reflect-1',
            title: 'Code review and quality check',
            description: 'Review code for quality and standards compliance',
            status: 'pending' as const,
          },
          {
            id: 'reflect-2',
            title: 'Documentation and deployment',
            description: 'Complete documentation and deploy solution',
            status: 'pending' as const,
          },
        ],
      }
    );

    return basePhases;
  }

  private identifyRisks(taskDescription: string, analysis: any, workspace: any): any[] {
    const risks = [];

    // Complexity-based risks
    if (analysis.complexity === 'high') {
      risks.push({
        id: 'risk-complexity',
        title: 'Technical Complexity',
        description: 'High complexity may lead to implementation challenges',
        probability: 'medium' as const,
        impact: 'high' as const,
        mitigation: 'Break down work into smaller, manageable components',
        status: 'open' as const,
      });
    }

    // Technology-specific risks
    if (analysis.technologies.length > 3) {
      risks.push({
        id: 'risk-tech-stack',
        title: 'Technology Stack Complexity',
        description: 'Multiple technologies may increase integration complexity',
        probability: 'medium' as const,
        impact: 'medium' as const,
        mitigation: 'Ensure proper expertise and documentation for each technology',
        status: 'open' as const,
      });
    }

    // Scope-related risks
    if (analysis.scope === 'system-wide') {
      risks.push({
        id: 'risk-scope',
        title: 'Scope Creep',
        description: 'System-wide changes may have unexpected impacts',
        probability: 'high' as const,
        impact: 'high' as const,
        mitigation: 'Thorough impact analysis and incremental rollout',
        status: 'open' as const,
      });
    }

    // Common risks
    risks.push(
      {
        id: 'risk-timeline',
        title: 'Timeline Risk',
        description: 'Unexpected issues may impact delivery timeline',
        probability: 'medium' as const,
        impact: 'medium' as const,
        mitigation: 'Regular progress tracking and early issue identification',
        status: 'open' as const,
      },
      {
        id: 'risk-quality',
        title: 'Quality Risk',
        description: 'Rush to meet deadlines may compromise quality',
        probability: 'medium' as const,
        impact: 'high' as const,
        mitigation: 'Maintain code review process and quality gates',
        status: 'open' as const,
      }
    );

    return risks;
  }

  private defineKPIs(taskDescription: string, analysis: any): any[] {
    const kpis = [
      {
        id: 'kpi-completion',
        name: 'Task Completion',
        description: 'Percentage of planned work completed',
        target: '100%',
        unit: '%',
        category: 'delivery' as const,
      },
      {
        id: 'kpi-quality',
        name: 'Code Quality',
        description: 'Code quality score based on reviews and tests',
        target: '90%',
        unit: 'score',
        category: 'quality' as const,
      },
      {
        id: 'kpi-timeline',
        name: 'Timeline Adherence',
        description: 'Delivery against planned timeline',
        target: '95%',
        unit: '%',
        category: 'delivery' as const,
      },
    ];

    // Add complexity-specific KPIs
    if (analysis.complexity === 'high') {
      kpis.push({
        id: 'kpi-architecture',
        name: 'Architecture Quality',
        description: 'Adherence to architectural principles',
        target: '85%',
        unit: 'score',
        category: 'quality' as const,
      });
    }

    // Add type-specific KPIs
    if (analysis.type === 'development') {
      kpis.push({
        id: 'kpi-test-coverage',
        name: 'Test Coverage',
        description: 'Code coverage by automated tests',
        target: '80%',
        unit: '%',
        category: 'quality' as const,
      });
    } else if (analysis.type === 'testing') {
      kpis.push({
        id: 'kpi-test-effectiveness',
        name: 'Test Effectiveness',
        description: 'Defect detection rate',
        target: '95%',
        unit: '%',
        category: 'quality' as const,
      });
    }

    return kpis;
  }

  private generatePlanId(taskDescription: string): string {
    const timestamp = Date.now();
    const normalized = taskDescription
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20);
    return `${normalized}-${timestamp}`;
  }

  private generatePlanTitle(taskDescription: string): string {
    return taskDescription.charAt(0).toUpperCase() + taskDescription.slice(1);
  }

  private formatPlanOutput(plan: DevDocsPlan, options: { format: string; verbosity: boolean }): string {
    if (options.format === 'json') {
      return JSON.stringify(plan, null, 2);
    }

    let output = `# ${plan.title}\n\n`;
    output += `**Description:** ${plan.description}\n`;
    output += `**Created:** ${plan.createdAt.toLocaleDateString()}\n\n`;

    // Objectives
    output += `## 📋 Objectives\n\n`;
    plan.objectives.forEach((objective, index) => {
      output += `${index + 1}. ${objective}\n`;
    });

    // Phases
    output += `\n## 🔄 Phases\n\n`;
    plan.phases.forEach((phase) => {
      const statusEmoji = this.getStatusEmoji(phase.status);
      output += `### ${statusEmoji} ${phase.name}\n\n`;
      output += `${phase.description}\n\n`;

      if (options.verbosity || phase.tasks.some(t => t.status !== 'pending')) {
        output += '**Tasks:**\n';
        phase.tasks.forEach((task) => {
          const taskStatusEmoji = this.getStatusEmoji(task.status);
          output += `- ${taskStatusEmoji} ${task.title}\n`;
          if (options.verbosity) {
            output += `  - ${task.description}\n`;
          }
        });
        output += '\n';
      }
    });

    // Risks
    if (plan.risks.length > 0) {
      output += `## ⚠️ Risks\n\n`;
      plan.risks.forEach((risk) => {
        const riskEmoji = this.getRiskEmoji(risk.probability, risk.impact);
        output += `### ${riskEmoji} ${risk.title}\n\n`;
        output += `**Description:** ${risk.description}\n`;
        output += `**Probability:** ${risk.probability} | **Impact:** ${risk.impact}\n`;
        if (risk.mitigation) {
          output += `**Mitigation:** ${risk.mitigation}\n`;
        }
        output += `\n`;
      });
    }

    // KPIs
    output += `## 📊 Success Metrics (KPIs)\n\n`;
    plan.kpis.forEach((kpi) => {
      output += `- **${kpi.name}:** Target ${kpi.target} ${kpi.unit}\n`;
      if (kpi.current) {
        output += `  - Current: ${kpi.current} ${kpi.unit}\n`;
      }
    });

    output += `\n---\n`;
    output += `*Generated by Skills Fabric Slash Commands System*\n`;
    output += `Plan ID: ${plan.id}\n`;

    return output;
  }

  private getStatusEmoji(status: string): string {
    const statusEmojis = {
      'pending': '⏳',
      'in-progress': '🔄',
      'completed': '✅',
      'blocked': '🚫',
    };
    return statusEmojis[status as keyof typeof statusEmojis] || '⏳';
  }

  private getRiskEmoji(probability: string, impact: string): string {
    const highHigh = (probability === 'high' && impact === 'high');
    if (highHigh) return '🔴';
    if (probability === 'high' || impact === 'high') return '🟡';
    return '🟢';
  }
}