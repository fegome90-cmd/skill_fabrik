/**
 * File Search Worker - FASE 2
 * Runs in worker thread to handle intensive I/O operations
 */

const { parentPort, workerData } = require('worker_threads');
const { readdir, stat, access } = require('fs/promises');
const { constants } = require('fs');
const path = require('path');

/**
 * Check if file matches glob pattern (simplified)
 */
function matchesPattern(filePath, pattern) {
  // Convert glob to regex
  let regexPattern = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\./g, '\\.')
    .replace(/\//g, '\\/');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

/**
 * Search for files matching pattern
 */
async function searchFiles(searchPath, pattern, cwd, maxFiles) {
  const found = [];

  try {
    // Check if directory exists and is readable
    await access(searchPath, constants.F_OK);

    const entries = await readdir(searchPath, { withFileTypes: true });

    for (const entry of entries) {
      if (found.length >= maxFiles) {
        break;
      }

      const fullPath = path.join(searchPath, entry.name);
      const relativePath = path.relative(cwd, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        // Skip node_modules and other common exclusions
        if (entry.name.startsWith('.') ||
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === 'build') {
          continue;
        }

        // Recursively search subdirectories
        const subResults = await searchFiles(fullPath, pattern, cwd, maxFiles - found.length);
        found.push(...subResults);
      } else if (entry.isFile()) {
        // Check if file matches pattern
        if (matchesPattern(relativePath, pattern)) {
          found.push(relativePath);
        }
      }
    }
  } catch (error) {
    // Directory not accessible or other error
    console.warn(`Search error in ${searchPath}:`, error.message);
  }

  return found;
}

/**
 * Main worker function
 */
async function processTask(task) {
  const { type, data } = task;

  try {
    switch (type) {
      case 'file_search':
        return await handleFileSearch(data);
      case 'index_generation':
        return await handleIndexGeneration(data);
      case 'pattern_matching':
        return await handlePatternMatching(data);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  } catch (error) {
    throw new Error(`Task ${type} failed: ${error.message}`);
  }
}

/**
 * Handle file search task
 */
async function handleFileSearch({ pathPatterns, cwd, maxFiles, parallel }) {
  const results = [];

  for (const pattern of pathPatterns) {
    try {
      // Determine search paths based on pattern
      const searchPaths = determineSearchPaths(pattern, cwd);

      for (const searchPath of searchPaths) {
        const matches = await searchFiles(searchPath, pattern, cwd, maxFiles);
        results.push(...matches);

        if (results.length >= maxFiles) {
          break;
        }
      }

      if (results.length >= maxFiles) {
        break;
      }
    } catch (error) {
      console.warn(`Pattern search failed for ${pattern}:`, error.message);
    }
  }

  // Deduplicate results
  const uniqueResults = Array.from(new Set(results));

  return uniqueResults.slice(0, maxFiles);
}

/**
 * Handle index generation task
 */
async function handleIndexGeneration({ cwd }) {
  const index = {
    version: '2.0.0',
    timestamp: Date.now(),
    globPatterns: {},
    byKeyword: {},
    lastScan: Date.now()
  };

  const commonPatterns = ['**/*.ts', '**/*.js', '**/*.json', '**/*.md'];

  for (const pattern of commonPatterns) {
    try {
      const files = await handleFileSearch({ pathPatterns: [pattern], cwd, maxFiles: 1000, parallel: false });
      index.globPatterns[pattern] = files;
    } catch (error) {
      console.warn(`Index generation failed for pattern ${pattern}:`, error.message);
      index.globPatterns[pattern] = [];
    }
  }

  // Index by keywords (simplified)
  index.byKeyword = {
    database: index.globPatterns['**/*.ts']?.filter(f =>
      f.includes('database') || f.includes('db') || f.includes('prisma')
    ) || [],
    api: index.globPatterns['**/*.ts']?.filter(f =>
      f.includes('api') || f.includes('route') || f.includes('controller')
    ) || [],
    cache: index.globPatterns['**/*.ts']?.filter(f =>
      f.includes('cache') || f.includes('redis') || f.includes('memtech')
    ) || [],
    performance: index.globPatterns['**/*.ts']?.filter(f =>
      f.includes('performance') || f.includes('benchmark') || f.includes('optimize')
    ) || []
  };

  return index;
}

/**
 * Handle pattern matching task
 */
async function handlePatternMatching({ pattern, searchPath, cwd, maxFiles }) {
  try {
    const results = await searchFiles(searchPath, pattern, cwd, maxFiles);
    return results;
  } catch (error) {
    throw new Error(`Pattern matching failed: ${error.message}`);
  }
}

/**
 * Determine search paths based on pattern
 */
function determineSearchPaths(pattern, cwd) {
  const searchPaths = [];

  if (pattern.includes('packages/**') || pattern.includes('**/memtech/**')) {
    const packagesPath = path.join(cwd, 'packages');
    searchPaths.push(packagesPath);
  } else if (pattern.includes('backend/src/**')) {
    const backendPath = path.join(cwd, 'backend', 'src');
    searchPaths.push(backendPath);
  } else if (pattern.includes('frontend/src/**')) {
    const frontendPath = path.join(cwd, 'frontend', 'src');
    searchPaths.push(frontendPath);
  } else if (pattern.includes('**/.env*') || pattern.includes('**/config/**')) {
    searchPaths.push(cwd);
  } else {
    // Generic pattern - search in cwd
    searchPaths.push(cwd);
  }

  return searchPaths;
}

// Main execution
if (parentPort) {
  parentPort.on('message', async (task) => {
    try {
      const result = await processTask(task);
      parentPort.postMessage({
        id: task.id,
        success: true,
        data: result
      });
    } catch (error) {
      parentPort.postMessage({
        id: task.id,
        success: false,
        error: error.message
      });
    }
  });

  // Signal ready
  parentPort.postMessage({ ready: true });
}
