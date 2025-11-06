import { execSync } from 'child_process';
import { pathExists } from 'fs-extra';
import * as path from 'path';
export async function trackEdits() {
    try {
        // Use git to track modified files (unstaged and staged)
        const unstaged = execSync('git diff --name-only', { encoding: 'utf-8', stdio: 'pipe' }).trim();
        const staged = execSync('git diff --cached --name-only', {
            encoding: 'utf-8',
            stdio: 'pipe',
        }).trim();
        const allFiles = [...unstaged.split('\n'), ...staged.split('\n')]
            .filter(Boolean)
            .filter((file, index, self) => self.indexOf(file) === index); // Remove duplicates
        const edits = [];
        for (const file of allFiles) {
            edits.push({
                file,
                repo: await detectRepo(file),
                timestamp: new Date().toISOString(),
            });
        }
        return edits;
    }
    catch (error) {
        // If not a git repo or git command fails, return empty
        return [];
    }
}
export function detectRepos(edits) {
    const repos = new Set();
    edits.forEach(edit => {
        if (edit.repo && edit.repo !== 'root') {
            repos.add(edit.repo);
        }
    });
    return Array.from(repos);
}
async function detectRepo(filePath) {
    // Check if file is in a package directory
    const parts = filePath.split('/');
    // Look for packages/ directory
    const packagesIndex = parts.indexOf('packages');
    if (packagesIndex !== -1 && parts.length > packagesIndex + 1) {
        const packageName = parts[packagesIndex + 1];
        const packagePath = path.join(process.cwd(), 'packages', packageName);
        // Verify package.json exists
        const packageJson = path.join(packagePath, 'package.json');
        if (await pathExists(packageJson)) {
            // Try to read package name from package.json
            try {
                const { readJson } = await import('fs-extra');
                const pkg = await readJson(packageJson);
                return pkg.name || `@skills-fabrik/${packageName}`;
            }
            catch {
                return `@skills-fabrik/${packageName}`;
            }
        }
    }
    // Check root package.json
    const rootPackageJson = path.join(process.cwd(), 'package.json');
    if (await pathExists(rootPackageJson)) {
        return 'root';
    }
    return 'root';
}
//# sourceMappingURL=file-tracker.js.map