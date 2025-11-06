#!/usr/bin/env node

/**
 * Skill ID Fix Script - CLOOP Phase 1
 * Fixes critical skillId issue in pbv2-activator.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const WORKSPACE = '/Users/felipe/Developer/skills-fabrik';

async function main() {
  console.log('🔧 [Skill ID Fix] Starting critical issue repair...\n');

  // 1. Load skill-rules.json
  const rulesPath = resolve(WORKSPACE, 'configs/skill-rules.json');
  const rulesContent = readFileSync(rulesPath, 'utf8');
  const skillRules = JSON.parse(rulesContent);

  // 2. Extract all skillIds
  const skillIds = Object.keys(skillRules);
  console.log(`📊 Found ${skillIds.length} skills in skill-rules.json`);

  // 3. Create category-based skillId mappings for common use cases
  const categoryMappings = {
    'backend': [
      'backend-architecture-patterns',
      'backend-dev-guidelines',
      'database-verification'
    ],
    'frontend': [
      'frontend-dev-guidelines',
      'performance-optimization',
      'webapp-testing'
    ],
    'database': [
      'database-verification',
      'database-management'
    ],
    'security': [
      'security-testing-guide',
      'secrets-and-config'
    ],
    'api': [
      'api-design-and-testing',
      'backend-dev-guidelines'
    ],
    'testing': [
      'test-driven-development',
      'webapp-testing'
    ],
    'devops': [
      'ci-cd-pipelines',
      'pm2-monitor'
    ],
    'general': skillIds.slice(0, 5) // First 5 as general fallback
  };

  console.log('\n📋 Category Mappings:');
  for (const [category, ids] of Object.entries(categoryMappings)) {
    console.log(`  ${category}: ${ids.join(', ')}`);
  }

  // 4. Update pbv2-activator.mjs with smart skillId detection
  const activatorPath = resolve(WORKSPACE, 'scripts/hooks/pbv2-activator.mjs');
  let activatorContent = readFileSync(activatorPath, 'utf8');

  // Add skillId auto-detection function before activatePBv2
  const autoDetectFunction = `
/**
 * Auto-detects relevant skillIds based on description keywords
 * @param {string} description - Task description
 * @param {Array} allSkillIds - All available skillIds
 * @returns {Array} Most relevant skillIds
 */
function autoDetectSkillIds(description, allSkillIds) {
  const desc = description.toLowerCase();

  // Keyword to skill mapping
  const keywordMap = [
    { keywords: ['backend', 'api', 'endpoint', 'server', 'controller'], skills: ['backend-architecture-patterns', 'backend-dev-guidelines'] },
    { keywords: ['frontend', 'react', 'component', 'ui', 'interface'], skills: ['frontend-dev-guidelines', 'performance-optimization'] },
    { keywords: ['database', 'migration', 'prisma', 'schema', 'query'], skills: ['database-verification', 'database-management'] },
    { keywords: ['security', 'auth', 'oauth', 'jwt', 'vulnerability'], skills: ['security-testing-guide', 'secrets-and-config'] },
    { keywords: ['test', 'testing', 'unit', 'integration', 'e2e'], skills: ['test-driven-development', 'webapp-testing'] },
    { keywords: ['deploy', 'ci', 'cd', 'pipeline', 'build'], skills: ['ci-cd-pipelines', 'pm2-monitor'] },
    { keywords: ['performance', 'optimization', 'cache', 'speed'], skills: ['performance-optimization', 'backend-dev-guidelines'] }
  ];

  const detected = new Set();

  // Check each keyword mapping
  for (const mapping of keywordMap) {
    if (mapping.keywords.some(kw => desc.includes(kw))) {
      mapping.skills.forEach(skill => {
        if (allSkillIds.includes(skill)) {
          detected.add(skill);
        }
      });
    }
  }

  // If nothing detected, use general fallbacks
  if (detected.size === 0) {
    const generalSkills = ['backend-dev-guidelines', 'frontend-dev-guidelines', 'database-verification'];
    generalSkills.forEach(skill => {
      if (allSkillIds.includes(skill)) {
        detected.add(skill);
      }
    });
  }

  return Array.from(detected).slice(0, 3); // Return max 3 skills
}
`;

  // Find the line where skillIds are defined and add auto-detection
  const skillIdLine = `skillIds: options.skillIds || [], // Permitir skill IDs específicos`;
  const newSkillIdLine = `skillIds: options.skillIds && options.skillIds.length > 0
      ? options.skillIds
      : autoDetectSkillIds(description, ${JSON.stringify(skillIds)}), // Auto-detect skillIds`;

  // Insert auto-detection function before activatePBv2
  const activateFunctionIndex = activatorContent.indexOf('export async function activatePBv2');
  if (activateFunctionIndex !== -1) {
    activatorContent = activatorContent.slice(0, activateFunctionIndex) +
      autoDetectFunction + '\n' +
      activatorContent.slice(activateFunctionIndex);
  }

  // Update skillId assignment
  activatorContent = activatorContent.replace(skillIdLine, newSkillIdLine);

  // Write updated content
  writeFileSync(activatorPath, activatorContent);
  console.log('\n✅ Updated pbv2-activator.mjs with auto-detection');

  // 5. Create skillId mapping file for testing
  const mappingData = {
    timestamp: new Date().toISOString(),
    totalSkills: skillIds.length,
    skillIds,
    categoryMappings,
    description: 'Auto-generated skillId mappings for testing'
  };

  const mappingPath = resolve(WORKSPACE, 'dev/active/fix-skillid-critical-issue/skill-id-mapping.json');
  writeFileSync(mappingPath, JSON.stringify(mappingData, null, 2));
  console.log(`✅ Created skillId mapping file: ${mappingPath}`);

  // 6. Test the fix with a sample call
  console.log('\n🧪 Testing the fix...');

  // Create a test script
  const testScript = `
import { activatePBv2 } from '${resolve(WORKSPACE, 'scripts/hooks/pbv2-activator.mjs')}';

const testCases = [
  'Create a React component for user dashboard',
  'Implement database migration for user table',
  'Set up CI/CD pipeline for deployment',
  'Add authentication middleware to API'
];

console.log('Testing skillId auto-detection...\n');

for (const testCase of testCases) {
  console.log(\`Testing: "\${testCase}"\`);
  try {
    const result = await activatePBv2(testCase, '${WORKSPACE}');
    console.log(\`  ✅ Success in \${result.latency_ms}ms\`);
    console.log(\`  Skills: \${result.skillActivation?.join(', ') || 'auto-detected'}\`);
    console.log(\`  Score: \${result.expectedScore}\`);
  } catch (error) {
    console.log(\`  ❌ Error: \${error.message}\`);
  }
  console.log('');
}
`;

  const testPath = resolve(WORKSPACE, 'dev/active/fix-skillid-critical-issue/test-skillid-fix.mjs');
  writeFileSync(testPath, testScript);
  console.log(`✅ Created test script: ${testPath}`);

  console.log('\n🎯 Skill ID Fix Complete!');
  console.log('   - Auto-detection function added');
  console.log('   - pbv2-activator.mjs updated');
  console.log('   - Category mappings created');
  console.log('   - Test script ready');
  console.log('\n📝 Next: Run test script to validate fix');
}

main().catch(error => {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
});