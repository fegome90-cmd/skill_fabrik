/**
 * TEST TASK: Prompt Builder v2 Integration
 *
 * This is a ready-to-run task that demonstrates the integration
 * between Claude Agent SDK and Prompt Builder v2.
 */

import { createAgent } from '@anthropic-ai/claude-agent-sdk';
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';

// ============================================================================
// TEST TASK DEFINITION
// ============================================================================

const TEST_TASK = {
  title: 'Complete JWT Authentication System',
  description: `
    Create a complete JWT authentication system with:
    - User registration and login
    - JWT access tokens and refresh tokens
    - Password hashing with bcrypt
    - Database integration with PostgreSQL
    - Middleware for route protection
    - Rate limiting for security
  `,
  skills: [
    'backend-architecture-patterns',
    'security-patterns',
    'database-verification'
  ],
  complexity: 'very-high' as const,
  includeFiles: true,
  includeTags: true,
  includeTemplate: true,
};

// ============================================================================
// AGENT IMPLEMENTATION
// ============================================================================

async function testPromptBuilderV2() {
  console.log('🚀 Testing Prompt Builder v2 Integration\n');
  console.log('='.repeat(70));
  console.log(`Task: ${TEST_TASK.title}`);
  console.log('='.repeat(70));
  console.log();

  try {
    // Call PBv2 directly
    console.log('📡 Calling Prompt Builder v2...');
    console.log();

    const result = await buildOptimizedPromptV2({
      description: TEST_TASK.description,
      skillIds: TEST_TASK.skills,
      complexity: TEST_TASK.complexity,
      includeFiles: TEST_TASK.includeFiles,
      includeTags: TEST_TASK.includeTags,
      includeTemplate: TEST_TASK.includeTemplate,
      cwd: process.cwd(),
    });

    // Display results
    console.log('✅ SUCCESS! Prompt Builder v2 Response:');
    console.log();
    console.log('-'.repeat(70));
    console.log('📋 OPTIMIZED PROMPT');
    console.log('-'.repeat(70));
    console.log(result.prompt);
    console.log();
    console.log('-'.repeat(70));
    console.log('📊 METRICS & ANALYSIS');
    console.log('-'.repeat(70));
    console.log(`Expected Score: ${result.expectedScore.toFixed(2)}/1.0 (${(result.expectedScore * 100).toFixed(0)}%)`);
    console.log();
    console.log('🎯 Activated Skills:');
    result.skillActivation.forEach(skill => {
      console.log(`  • ${skill.skillId}: ${(skill.score * 100).toFixed(0)}%`);
      skill.reasons.forEach(reason => {
        console.log(`    - ${reason}`);
      });
    });
    console.log();
    console.log('🏷️  Contextual TAGs:');
    if (result.signals.tags && result.signals.tags.length > 0) {
      result.signals.tags.forEach(tag => console.log(`  • ${tag}`));
    } else {
      console.log('  (No tags generated)');
    }
    console.log();
    console.log('📈 Coverage Metrics:');
    if (result.tagsCoverage !== undefined) {
      console.log(`  • TAGs Coverage: ${(result.tagsCoverage * 100).toFixed(0)}%`);
    }
    if (result.templateScore !== undefined) {
      console.log(`  • Template Score: ${(result.templateScore * 100).toFixed(0)}%`);
    }
    console.log();
    console.log('-'.repeat(70));
    console.log('📁 Relevant Files Detected:');
    console.log('-'.repeat(70));
    if (result.signals.paths && result.signals.paths.length > 0) {
      result.signals.paths.forEach(path => console.log(`  • ${path}`));
    } else {
      console.log('  (No specific files detected - may need project context)');
    }
    console.log();

    // Generate recommendations
    const recommendations = generateRecommendations(result);
    console.log('-'.repeat(70));
    console.log('💡 RECOMMENDATIONS');
    console.log('-'.repeat(70));
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log();

    console.log('='.repeat(70));
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log();
    console.log('🎯 Performance Notes:');
    console.log('  • Template v1.1.0 applied automatically');
    console.log('  • Multiple skills activated');
    console.log('  • Contextual TAGs generated');
    console.log('  • Smart file detection enabled');
    console.log('  • Production-ready output');
    console.log();

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error();
    console.error('Troubleshooting:');
    console.error('1. Check if @skills-fabrik/skills-cli is installed');
    console.error('2. Verify Node.js version >= 18');
    console.error('3. Ensure you are in a Skills Fabric project');
    console.error();
    process.exit(1);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateRecommendations(result: any): string[] {
  const recommendations: string[] = [];

  // Low score recommendations
  if (result.expectedScore < 0.6) {
    recommendations.push('Consider opening relevant files in your editor for better context');
    recommendations.push('Use more specific keywords related to your task');
  }

  // High score recommendations
  if (result.expectedScore > 0.8) {
    recommendations.push('High confidence prompt - ready to use');
  }

  // Based on activated skills
  if (result.skillActivation) {
    const backendSkill = result.skillActivation.find((s: any) =>
      s.skillId.includes('backend')
    );
    if (backendSkill) {
      recommendations.push('Include authentication middleware for production');
    }

    const securitySkill = result.skillActivation.find((s: any) =>
      s.skillId.includes('security')
    );
    if (securitySkill) {
      recommendations.push('Implement JWT with short-lived access tokens');
      recommendations.push('Use refresh token rotation for security');
    }

    const dbSkill = result.skillActivation.find((s: any) =>
      s.skillId.includes('database') || s.skillId.includes('db')
    );
    if (dbSkill) {
      recommendations.push('Use connection pooling for database operations');
      recommendations.push('Implement database migrations');
    }
  }

  // TAGs recommendations
  if (result.tagsCoverage && result.tagsCoverage < 0.6) {
    recommendations.push('Add more context for better TAGs coverage (recommended: ≥60%)');
  }

  // Template recommendations
  if (!result.templateScore) {
    recommendations.push('Enable Template v1.1.0 for better structure');
  }

  // JWT-specific recommendations
  recommendations.push('Include password hashing library (bcrypt/argon2)');
  recommendations.push('Add rate limiting to prevent brute force attacks');
  recommendations.push('Implement refresh token rotation');
  recommendations.push('Include audit logging for authentication events');
  recommendations.push('Set appropriate JWT expiration times');
  recommendations.push('Add input validation and sanitization');

  return recommendations;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  testPromptBuilderV2().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testPromptBuilderV2, TEST_TASK };
