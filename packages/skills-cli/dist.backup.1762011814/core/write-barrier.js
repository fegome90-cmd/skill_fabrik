import fs from 'fs';
import path from 'path';
import { WriteError } from './errors.js';
export class WriteBarrier {
    static instance;
    allowedPaths = [];
    static getInstance() {
        if (!WriteBarrier.instance) {
            WriteBarrier.instance = new WriteBarrier();
        }
        return WriteBarrier.instance;
    }
    constructor() {
        this.allowedPaths = [
            path.resolve(process.cwd(), '.codemachine'),
            path.resolve(process.cwd(), 'config'),
            path.resolve(process.cwd(), 'templates'),
            path.resolve(process.cwd(), 'policies')
        ];
    }
    async writeFile(filePath, content) {
        const absolutePath = path.resolve(filePath);
        const isAllowed = this.allowedPaths.some(allowedPath => absolutePath.startsWith(allowedPath));
        if (!isAllowed) {
            throw new WriteError(filePath, 'Attempt to write outside sandbox');
        }
        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await fs.promises.writeFile(absolutePath, content);
    }
}
//# sourceMappingURL=write-barrier.js.map