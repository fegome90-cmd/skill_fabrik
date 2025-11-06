import { WriteBarrier } from '../../core/write-barrier.js';
import { StateManager } from '../../core/state-manager.js';
import { Logger } from '../../core/logger.js';
import fs from 'fs';
import path from 'path';
const writeBarrier = WriteBarrier.getInstance();
const stateManager = new StateManager();
const INIT_FILES = {
    'config/cloop.yaml': `project: QuanNex
sprint: S14
mode: "SAFE"
retriever:
  topK: 8
  backend: "inmemory"
  namespace: "\${project}/\${sprint}"
models:
  clarify: "cursor"
  plan: "claude"
  verify: "codex"
timeouts:
  step: 120000
  agent: 300000
loop:
  maxIterations: 6
  skip: ["status-lite"]
`,
    'policies/sprints/S14.yaml': `write:
  backend-agent:
    - ".codemachine/memory/QuanNex/S14/backend-agent/**"
    - "services/**"
  frontend-agent:
    - ".codemachine/memory/QuanNex/S14/frontend-agent/**"
    - "ui/**"
merge:
  require:
    - "diff-guard:pass"
    - "coverage-gate:>=0.80"
    - "metrics-gate:pass"
    - "adr-writer:present"
retriever:
  read_scope: "snapshots-only"
  forbid_views: ["sandbox/*"]
`,
    'config/memory.yaml': `backend: "inmemory"
embeddingModel: "S-embed-v1"
namespace: "\${project}/\${sprint}"
`
};
export async function initCloop() {
    Logger.info('Initializing CLOOP...');
    // Check if already initialized
    const cloopConfig = path.resolve(process.cwd(), 'config', 'cloop.yaml');
    if (fs.existsSync(cloopConfig)) {
        Logger.info('CLOOP already initialized (no change)');
        return;
    }
    // Create files
    for (const [relativePath, content] of Object.entries(INIT_FILES)) {
        try {
            await writeBarrier.writeFile(relativePath, content);
            Logger.info(`Created: ${relativePath}`);
        }
        catch (error) {
            Logger.error(`Error creating ${relativePath}: ${error}`);
        }
    }
    await stateManager.saveLastRun({
        type: 'init',
        timestamp: Date.now(),
        files: Object.keys(INIT_FILES)
    });
    Logger.info('CLOOP initialization complete');
}
//# sourceMappingURL=init.js.map