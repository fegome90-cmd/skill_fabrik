#!/usr/bin/env node
/**
 * UserPromptSubmit Hook
 * Auto-activates skills based on user prompt intent
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  const prompt = process.argv[2] || '';
  
  if (!prompt) {
    console.error('No prompt provided');
    process.exit(1);
  }
  
  try {
    // Load skill registry
    const registryPath = join(process.cwd(), 'registry/index.json');
    const registry = JSON.parse(await readFile(registryPath, 'utf-8'));
    
    // Find matching skills (simplified matching - can be enhanced)
    const matches = registry.skills
      .filter((skill: { triggers?: { keywords?: string[] } }) => {
        const keywords = skill.triggers?.keywords || [];
        return keywords.some((keyword: string) => 
          prompt.toLowerCase().includes(keyword.toLowerCase())
        );
      })
      .map((skill: { name: string; severity?: string }) => ({
        skill: skill.name,
        severity: skill.severity || 'medium',
      }));
    
    // Output matches as JSON for Cursor to process
    if (matches.length > 0) {
      console.log(JSON.stringify({
        matches,
        activated: matches.filter((m: { severity: string }) => m.severity === 'critical' || m.severity === 'high'),
      }));
    }
  } catch (error) {
    console.error('Error in UserPromptSubmit hook:', error);
    process.exit(1);
  }
}

main();
