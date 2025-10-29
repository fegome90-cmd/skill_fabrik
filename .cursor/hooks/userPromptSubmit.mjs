#!/usr/bin/env node
/**
 * UserPromptSubmit Hook
 * Auto-activates skills based on user prompt intent using router package
 */

import { userPromptSubmitHook } from '../../packages/router/dist/index.js';
import { resolve } from 'path';

async function main() {
  const prompt = process.argv[2] || '';
  const openFilesArg = process.argv[3] || '[]';
  
  if (!prompt) {
    // No prompt provided, exit silently (hook is optional)
    process.exit(0);
  }
  
  try {
    const openFiles = JSON.parse(openFilesArg);
    
    // Get active file content if available (max 2KB)
    let activeFileContent = '';
    if (openFiles.length > 0) {
      try {
        const { readFile } = await import('fs/promises');
        const firstFile = resolve(process.cwd(), openFiles[0]);
        const content = await readFile(firstFile, { encoding: 'utf-8' });
        activeFileContent = content.substring(0, 2048); // Limit to 2KB
      } catch {
        // Ignore errors reading file
      }
    }
    
    // Call router hook
    const result = await userPromptSubmitHook({
      prompt,
      openFiles: Array.isArray(openFiles) ? openFiles : [],
      activeFileContent,
      cwd: process.cwd(),
    });
    
    // Output injected note if skills activated
    if (result.injectedNote) {
      console.log(result.injectedNote);
    }
    
    // Exit with success
    process.exit(0);
  } catch (error) {
    // Silently fail - hooks should not break editor workflow
    console.error('Hook error:', error);
    process.exit(0);
  }
}

main();
