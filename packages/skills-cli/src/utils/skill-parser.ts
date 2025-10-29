import fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';

const { readFile, pathExists } = fs;
import type { SkillMetadata, ValidationResult } from '../types/skill.js';

export interface ExtendedSkillMetadata extends SkillMetadata {
  id?: string;
  summary?: string;
  when_to_use?: string;
  resources?: string[];
  type?: string;
  enforcement?: string;
}

export async function parseSkillMD(filePath: string): Promise<ExtendedSkillMetadata> {
  const content = await readFile(filePath, { encoding: 'utf-8' });

  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    throw new Error(`No YAML frontmatter found in ${filePath}`);
  }

  const frontmatter = yaml.parse(frontmatterMatch[1]);

  // Return extended metadata with all fields
  return {
    name: frontmatter.name || frontmatter.id || '',
    id: frontmatter.id || frontmatter.name,
    description: frontmatter.description || frontmatter.summary || '',
    summary: frontmatter.summary || frontmatter.description,
    when_to_use: frontmatter.when_to_use,
    resources: frontmatter.resources || [],
    type: frontmatter.type,
    enforcement: frontmatter.enforcement,
    severity: frontmatter.severity || 'medium',
  };
}

export async function validateSkillStructure(skillPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const skillMD = path.join(skillPath, 'SKILL.md');

  if (!(await pathExists(skillMD))) {
    errors.push(`SKILL.md not found in ${skillPath}`);
  }

  if (errors.length === 0 && warnings.length === 0) {
    try {
      await parseSkillMD(skillMD);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
