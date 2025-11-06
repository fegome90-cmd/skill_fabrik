import fs from 'fs';
import path from 'path';
import { safeExec } from '../utils/safe-exec.js';
import { ConfigManager } from './config-manager.js';
export async function preflightCheck() {
    // Node version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    if (Number.isFinite(major) && major < 20) {
        throw new Error(`E_NODE_VERSION: Requires Node.js >= 20, found ${nodeVersion}`);
    }
    // .codemachine permissions
    const cmDir = path.resolve(process.cwd(), '.codemachine');
    if (!fs.existsSync(cmDir)) {
        fs.mkdirSync(cmDir, { recursive: true });
    }
    try {
        await fs.promises.access(cmDir, fs.constants.R_OK | fs.constants.W_OK);
    }
    catch {
        throw new Error('E_FS_PERMISSIONS: No read/write permissions for .codemachine directory');
    }
    // Validate config paths
    const configManager = new ConfigManager();
    const pathValidation = configManager.validatePaths();
    if (!pathValidation.valid && pathValidation.missing.length > 0) {
        // Attempt to create missing paths to avoid blocking later flows
        const cfg = configManager.getAllConfig();
        const ensureDir = async (dirPath) => {
            if (!dirPath)
                return;
            try {
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            }
            catch {
                // Best-effort: keep going, commands should still work with fallbacks
            }
        };
        await ensureDir(cfg.paths.configDir);
        await ensureDir(cfg.paths.stateDir);
        await ensureDir(cfg.paths.templatesDir);
    }
    // Git availability (best-effort)
    if (process.env.CLOOP_DISABLE_GIT !== 'true') {
        try {
            await safeExec('git', ['--version'], { timeout: 3000 });
        }
        catch {
            // optional: ignore if git is not available
        }
    }
}
//# sourceMappingURL=preflight.js.map