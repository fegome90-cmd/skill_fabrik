#!/usr/bin/env node

/**
 * PBv2 Activator - Versión con Problemas Estructurales para Análisis
 * Este archivo contiene los problemas identificados para demostración
 */

import { buildOptimizedPromptV2 } from './packages/skills-cli/dist/utils/prompt-builder-v2.js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

    try {
      const planCheckModule = await getPlanCheck(cwd);
      const planCheck = await planCheckModule.checkApprovedPlan(cwd);
      if (planCheck.hasPlan && planCheck.plan) {
        const plan = planCheck.plan;
        planContext = {
          planId: plan.id,
          taskName: planCheck.taskName,
          phases: plan.phases,
        };
      }
    } catch {
        if (planContext.phases && planContext.phases.length > 0) {
          optimizedPrompt += `\nFases del plan: ${planContext.phases.map((p: any) => p.name).join(', ')}`;
        }
    }

import { join, resolve, dirname } from 'path';
import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
    let fileCount = 0;
    function countFiles(dir) {
      try {
        const files = statSync(dir);
        if (files.isDirectory()) {
          const items = require('fs').readdirSync(dir);
          for (const item of items) {
            if (!item.startsWith('.') && item !== 'node_modules') {
              fileCount += countFiles(join(dir, item));
            }
          }
        } else if (files.isFile()) {
          fileCount++;
        }
      } catch (e) {
        // Ignorar errores de permisos
      }
      return fileCount;
    }

    const totalFiles = countFiles(cwd);

import { join, resolve, dirname } from 'path';
import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function detectRepoInfo(cwd) {
export function TEST_getFastConfig(cwd) {
  const repoInfo = TEST_detectRepoInfo(cwd);

  const config = {
    includeFiles: repoInfo.size === 'small',  // Solo en repos pequeños
    includeTags: true,
    includeTemplate: true,
    complexity: repoInfo.size === 'large' ? 'low' : 'medium',
    cwd: cwd,
    timeout: 5000  // 5 segundos timeout
  };

  console.error(`[PBv2 Activator] Repo info: size=${repoInfo.size}, monorepo=${repoInfo.isMonorepo}`);
  console.error(`[PBv2 Activator] Fast config:`, config);

  return config;
}

    // Procesar resultado
    const processedResult = {
      success: true,
      latency_ms: latency,
      prompt: result.prompt || '',
      expectedScore: result.expectedScore || 0,
      skillActivation: result.skillActivation || [],
      signals: result.signals || {},
      tagsCoverage: result.tagsCoverage || 0,
      templateScore: result.templateScore || 0,
      recommendations: result.recommendations || [],
      metadata: {
        skillIdsUsed: skillIds,
        complexityUsed: params.complexity,
        repoSize: TEST_detectRepoInfo(cwd).size,
        timestamp: new Date().toISOString()
      }
    };
