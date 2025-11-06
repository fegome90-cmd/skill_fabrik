#!/usr/bin/env node

/**
 * Create Test Plans with skillIds - CLOOP Phase 2
 * Generates 10 comprehensive test plans with proper skillId mapping
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const WORKSPACE = '/Users/felipe/Developer/skills-fabrik';

// SkillId mapping based on category analysis
const SKILL_MAPPINGS = {
  'backend-architecture-patterns': 'backend-dev-guidelines',
  'react-app': 'frontend-dev-guidelines',
  'database-migration': 'database-verification',
  'security-implementation': 'security-testing-guide',
  'performance-optimization': 'performance-optimization',
  'testing-strategy': 'test-driven-development',
  'devops-pipeline': 'ci-cd-pipelines',
  'microservices': 'backend-architecture-patterns',
  'mobile-app': 'frontend-dev-guidelines',
  'legacy-modernization': 'backend-architecture-patterns'
};

const testPlans = [
  {
    id: 'TP001',
    name: 'Backend API Development',
    task: 'Implement user authentication API with JWT tokens',
    skillId: SKILL_MAPPINGS['backend-architecture-patterns'],
    description: 'Crear API REST para autenticación de usuarios con endpoints de login, registro y refresh token. Implementar middleware de autorización y manejo de errores. Usar arquitectura hexagonal con DDD patterns.',
    phases: [
      { name: 'Clarify', description: 'Definir requerimientos de autenticación y endpoints' },
      { name: 'Layout', description: 'Diseñar estructura de API y esquemas de datos' },
      { name: 'Operate', description: 'Implementar controladores y servicios' },
      { name: 'Observe', description: 'Validar funcionamiento con tests' },
      { name: 'Reflect', description: 'Optimizar y documentar la API' }
    ],
    expectedDuration: '6-8 horas',
    complexity: 'high',
    keywords: ['backend', 'api', 'authentication', 'jwt', 'middleware']
  },
  {
    id: 'TP002',
    name: 'React Dashboard Component',
    task: 'Create user dashboard with data tables and filters',
    skillId: SKILL_MAPPINGS['react-app'],
    description: 'Desarrollar componente React para dashboard de usuarios con tablas de datos virtualizadas, filtros avanzados, paginación y acciones en lote. Implementar usando hooks personalizados y context API.',
    phases: [
      { name: 'Clarify', description: 'Especificar estructura de datos y UI requirements' },
      { name: 'Layout', description: 'Diseñar arquitectura de componentes y hooks' },
      { name: 'Operate', description: 'Implementar componentes y lógica de estado' },
      { name: 'Observe', description: 'Testing visual y de interacción' },
      { name: 'Reflect', description: 'Optimizar performance y accesibilidad' }
    ],
    expectedDuration: '4-6 horas',
    complexity: 'medium',
    keywords: ['react', 'component', 'dashboard', 'hooks', 'virtualization']
  },
  {
    id: 'TP003',
    name: 'Database Migration System',
    task: 'Set up Prisma migrations for user and content schemas',
    skillId: SKILL_MAPPINGS['database-migration'],
    description: 'Configurar sistema de migraciones con Prisma para esquemas de usuarios y contenido. Implementar seeders, rollback procedures y validaciones de integridad referencial.',
    phases: [
      { name: 'Clarify', description: 'Definir modelos de datos y relaciones' },
      { name: 'Layout', description: 'Diseñar estructura de migraciones' },
      { name: 'Operate', description: 'Crear migraciones y seeders' },
      { name: 'Observe', description: 'Validar integridad y performance' },
      { name: 'Reflect', description: 'Documentar y optimizar queries' }
    ],
    expectedDuration: '3-4 horas',
    complexity: 'medium',
    keywords: ['database', 'prisma', 'migration', 'schema', 'seeding']
  },
  {
    id: 'TP004',
    name: 'Security Implementation Guide',
    task: 'Implement security scanning and OWASP compliance',
    skillId: SKILL_MAPPINGS['security-implementation'],
    description: 'Configurar pipeline de security testing incluyendo SAST, DAST y OWASP compliance checks. Implementar detección de vulnerabilidades XSS, CSRF, SQL injection.',
    phases: [
      { name: 'Clarify', description: 'Identificar riesgos de seguridad críticos' },
      { name: 'Layout', description: 'Diseñar estrategia de security testing' },
      { name: 'Operate', description: 'Implementar guards y validaciones' },
      { name: 'Observe', description: 'Ejecutar penetration testing' },
      { name: 'Reflect', description: 'Documentar findings y remediations' }
    ],
    expectedDuration: '5-7 horas',
    complexity: 'high',
    keywords: ['security', 'owasp', 'vulnerability', 'sast', 'dast']
  },
  {
    id: 'TP005',
    name: 'Performance Optimization',
    task: 'Optimize database queries and API response times',
    skillId: SKILL_MAPPINGS['performance-optimization'],
    description: 'Analizar y optimizar queries de base de datos, implementar caching strategies, lazy loading y compresión. Optimizar API response times y bundle sizes.',
    phases: [
      { name: 'Clarify', description: 'Identificar bottlenecks de performance' },
      { name: 'Layout', description: 'Diseñar estrategias de optimización' },
      { name: 'Operate', description: 'Implementar caching y optimizaciones' },
      { name: 'Observe', description: 'Medir mejoras con benchmarks' },
      { name: 'Reflect', description: 'Documentar optimizaciones aplicadas' }
    ],
    expectedDuration: '4-6 horas',
    complexity: 'medium',
    keywords: ['performance', 'optimization', 'cache', 'benchmark', 'latency']
  },
  {
    id: 'TP006',
    name: 'Testing Strategy Implementation',
    task: 'Create comprehensive testing suite with TDD approach',
    skillId: SKILL_MAPPINGS['testing-strategy'],
    description: 'Implementar estrategia completa de testing incluyendo unit tests, integration tests, e2e tests con Jest, Testing Library y Cypress.',
    phases: [
      { name: 'Clarify', description: 'Definir test coverage y casos críticos' },
      { name: 'Layout', description: 'Diseñar estructura de test suite' },
      { name: 'Operate', description: 'Crear tests siguiendo TDD' },
      { name: 'Observe', description: 'Ejecutar test suite completo' },
      { name: 'Reflect', description: 'Analizar coverage y ajustar tests' }
    ],
    expectedDuration: '6-8 horas',
    complexity: 'high',
    keywords: ['testing', 'tdd', 'unit', 'integration', 'e2e']
  },
  {
    id: 'TP007',
    name: 'DevOps Pipeline Setup',
    task: 'Configure CI/CD pipeline with GitHub Actions',
    skillId: SKILL_MAPPINGS['devops-pipeline'],
    description: 'Configurar pipeline de CI/CD con GitHub Actions incluyendo build, test, security scan y deployment automático a staging y production.',
    phases: [
      { name: 'Clarify', description: 'Definir workflow y environments' },
      { name: 'Layout', description: 'Diseñar pipeline stages y triggers' },
      { name: 'Operate', description: 'Implementar GitHub Actions workflows' },
      { name: 'Observe', description: 'Probar deployment pipeline' },
      { name: 'Reflect', description: 'Optimizar tiempos y costos' }
    ],
    expectedDuration: '4-5 horas',
    complexity: 'medium',
    keywords: ['ci/cd', 'github actions', 'pipeline', 'deployment', 'automation']
  },
  {
    id: 'TP008',
    name: 'Microservices Architecture',
    task: 'Design and implement microservice for user management',
    skillId: SKILL_MAPPINGS['microservices'],
    description: 'Diseñar e implementar microservicio de gestión de usuarios con API Gateway, service discovery, circuit breaker pattern y database per service.',
    phases: [
      { name: 'Clarify', description: 'Definir bounded contexts y responsabilidades' },
      { name: 'Layout', description: 'Diseñar arquitectura de microservicios' },
      { name: 'Operate', description: 'Implementar servicios y patrones' },
      { name: 'Observe', description: 'Validar comunicación entre servicios' },
      { name: 'Reflect', description: 'Optimizar patterns y monitoring' }
    ],
    expectedDuration: '8-10 horas',
    complexity: 'very-high',
    keywords: ['microservices', 'api gateway', 'circuit breaker', 'ddd', 'bounded context']
  },
  {
    id: 'TP009',
    name: 'Mobile App Development',
    task: 'Create React Native app for task management',
    skillId: SKILL_MAPPINGS['mobile-app'],
    description: 'Desarrollar aplicación React Native para gestión de tareas con navegación, state management, offline support y sync con backend.',
    phases: [
      { name: 'Clarify', description: 'Especificar features y user flows' },
      { name: 'Layout', description: 'Diseñar navegación y arquitectura' },
      { name: 'Operate', description: 'Implementar screens y funcionalidades' },
      { name: 'Observe', description: 'Testing en dispositivos físicos' },
      { name: 'Reflect', description: 'Optimizar UX y performance móvil' }
    ],
    expectedDuration: '10-12 horas',
    complexity: 'high',
    keywords: ['react native', 'mobile', 'navigation', 'state management', 'offline']
  },
  {
    id: 'TP010',
    name: 'Legacy Code Modernization',
    task: 'Refactor monolithic app to modern architecture',
    skillId: SKILL_MAPPINGS['legacy-modernization'],
    description: 'Modernizar aplicación monolítica heredada migrando a arquitectura modular, implementando tests, documentación y estableciendo CI/CD pipeline.',
    phases: [
      { name: 'Clarify', description: 'Auditar código legacy y dependencias' },
      { name: 'Layout', description: 'Diseñar estrategia de refactoring gradual' },
      { name: 'Operate', description: 'Refactor módulos críticos' },
      { name: 'Observe', description: 'Validar funcionamiento y tests' },
      { name: 'Reflect', description: 'Documentar lecciones y next steps' }
    ],
    expectedDuration: '12-16 horas',
    complexity: 'very-high',
    keywords: ['legacy', 'refactoring', 'monolith', 'modernization', 'technical debt']
  }
];

function main() {
  console.log('📋 [Test Plans Creator] Generating 10 test plans with skillIds...\n');

  // Create output directory
  const outputDir = resolve(WORKSPACE, 'dev/active/test-plans-skillids');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Generate individual plan files
  testPlans.forEach((plan, index) => {
    const planFile = resolve(outputDir, `${plan.id}-${plan.name.toLowerCase().replace(/\s+/g, '-')}.json`);
    const planContent = {
      ...plan,
      metadata: {
        version: '2.0.0',
        created: new Date().toISOString(),
        skillId: plan.skillId,
        category: getCategoryFromSkill(plan.skillId),
        testType: 'pbv2_activation'
      }
    };

    writeFileSync(planFile, JSON.stringify(planContent, null, 2));
    console.log(`✅ Created: ${plan.id} - ${plan.name} (skillId: ${plan.skillId})`);
  });

  // Generate master test plan file
  const masterPlan = {
    testSuite: {
      name: 'PBv2 SkillId Test Suite',
      description: 'Comprehensive test suite for skillId activation and auto-detection',
      version: '2.0.0',
      created: new Date().toISOString(),
      totalPlans: testPlans.length,
      skillIds: [...new Set(testPlans.map(p => p.skillId))],
      categories: {
        backend: testPlans.filter(p => p.skillId.includes('backend')).length,
        frontend: testPlans.filter(p => p.skillId.includes('frontend')).length,
        database: testPlans.filter(p => p.skillId.includes('database')).length,
        security: testPlans.filter(p => p.skillId.includes('security')).length,
        performance: testPlans.filter(p => p.skillId.includes('performance')).length,
        testing: testPlans.filter(p => p.skillId.includes('test-driven')).length,
        devops: testPlans.filter(p => p.skillId.includes('ci-cd')).length,
        microservices: testPlans.filter(p => p.skillId.includes('backend')).length
      }
    },
    plans: testPlans,
    expectedResults: {
      detectionLatency: '< 50ms',
      activationLatency: '< 200ms',
      successRate: '> 90%',
      qualityScore: '> 8/10'
    }
  };

  const masterFile = resolve(outputDir, 'master-test-plan.json');
  writeFileSync(masterFile, JSON.stringify(masterPlan, null, 2));
  console.log(`\n📦 Created master test plan: ${masterFile}`);

  // Generate skillId summary
  const skillIdSummary = {
    totalSkillIds: testPlans.length,
    skillIdDistribution: testPlans.reduce((acc, plan) => {
      acc[plan.skillId] = (acc[plan.skillId] || 0) + 1;
      return acc;
    }, {}),
    categories: {
      'backend-architecture-patterns': testPlans.filter(p =>
        ['TP001', 'TP008', 'TP010'].includes(p.id)
      ).length,
      'frontend-dev-guidelines': testPlans.filter(p =>
        ['TP002', 'TP009'].includes(p.id)
      ).length,
      'database-verification': testPlans.filter(p =>
        ['TP003'].includes(p.id)
      ).length,
      'security-testing-guide': testPlans.filter(p =>
        ['TP004'].includes(p.id)
      ).length,
      'performance-optimization': testPlans.filter(p =>
        ['TP005'].includes(p.id)
      ).length,
      'test-driven-development': testPlans.filter(p =>
        ['TP006'].includes(p.id)
      ).length,
      'ci-cd-pipelines': testPlans.filter(p =>
        ['TP007'].includes(p.id)
      ).length
    }
  };

  const summaryFile = resolve(outputDir, 'skillid-summary.json');
  writeFileSync(summaryFile, JSON.stringify(skillIdSummary, null, 2));
  console.log(`📊 Created skillId summary: ${summaryFile}`);

  console.log('\n🎯 Test Plans Creation Complete!');
  console.log(`   - Generated ${testPlans.length} test plans`);
  console.log(`   - Used ${skillIdSummary.totalSkillIds} unique skillIds`);
  console.log(`   - Covered ${Object.keys(skillIdSummary.categories).length} categories`);
  console.log('\n📝 Next: Execute live testing with these plans');
}

function getCategoryFromSkill(skillId) {
  if (skillId.includes('backend')) return 'backend';
  if (skillId.includes('frontend')) return 'frontend';
  if (skillId.includes('database')) return 'database';
  if (skillId.includes('security')) return 'security';
  if (skillId.includes('performance')) return 'performance';
  if (skillId.includes('test-driven')) return 'testing';
  if (skillId.includes('ci-cd')) return 'devops';
  return 'general';
}

main().catch(error => {
  console.error('❌ Failed to create test plans:', error.message);
  process.exit(1);
});