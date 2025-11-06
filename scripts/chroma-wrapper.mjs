#!/usr/bin/env node
/**
 * ChromaDB Wrapper for Node.js
 * Provides a Node.js-friendly interface to ChromaDB Cloud via Python bridge
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Python bridge (adjust for skills-fabrik structure)
const PYTHON_BRIDGE = path.join(__dirname, 'chromadb', 'python-bridge.py');


class ChromaDBClient {
    /**
     * Execute a Python bridge command
     * @private
     */
    async _executeCommand(command, args = {}) {
        try {
            // Allow overriding python interpreter via env or local venv
            // Try multiple paths: project root, current dir, or relative to script
            const scriptDir = path.dirname(__filename);
            const projectRoot = path.resolve(scriptDir, '..');
            const possibleVenvPaths = [
                path.join(projectRoot, 'chromadb-env', 'bin', 'python3.12'),
                path.join(projectRoot, 'chromadb-env', 'bin', 'python3'),
                path.join(process.cwd(), 'chromadb-env', 'bin', 'python3.12'),
                path.join(process.cwd(), 'chromadb-env', 'bin', 'python3'),
            ];
            
            let usePython = process.env.CHROMA_PYTHON;
            if (!usePython) {
                // Find first existing venv python
                const { access } = await import('fs/promises');
                const { constants } = await import('fs');
                for (const venvPath of possibleVenvPaths) {
                    try {
                        await access(venvPath, constants.F_OK);
                        usePython = venvPath;
                        break;
                    } catch {
                        // Continue to next path
                    }
                }
            }
            // Fallback to system python3
            if (!usePython) {
                usePython = 'python3';
            }

            let cmd = `${usePython} "${PYTHON_BRIDGE}" ${command}`;
            
            // Add arguments
            if (args.collection) {
                cmd += ` --collection "${args.collection}"`;
            }
            if (args.limit !== undefined) {
                cmd += ` --limit ${args.limit}`;
            }
            if (args.query) {
                cmd += ` --query "${args.query}"`;
            }
            if (args.nResults !== undefined) {
                cmd += ` --n-results ${args.nResults}`;
            }
            if (args.where) {
                cmd += ` --where '${JSON.stringify(args.where)}'`;
            }
            if (args.metadata) {
                cmd += ` --metadata '${args.metadata}'`;
            }
            if (args.ids) {
                cmd += ` --ids '${args.ids}'`;
            }
            if (args.documents) {
                cmd += ` --documents '${args.documents}'`;
            }
            if (args.metadatas) {
                cmd += ` --metadatas '${args.metadatas}'`;
            }
            
            const { stdout, stderr } = await execAsync(cmd, {
                cwd: process.cwd(),
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });
            
            if (stderr && !stderr.includes('WARNING')) {
                console.warn('Python bridge stderr:', stderr);
            }
            
            return JSON.parse(stdout);
        } catch (error) {
            throw new Error(`ChromaDB command failed: ${error.message}`);
        }
    }
    
    /**
     * Check ChromaDB connection
     */
    async heartbeat() {
        return await this._executeCommand('heartbeat');
    }
    
    /**
     * List all collections
     */
    async listCollections() {
        const result = await this._executeCommand('list-collections');
        return result.success ? result.data : [];
    }
    
    /**
     * Get a specific collection
     */
    async getCollection(collectionName) {
        return await this._executeCommand('get-collection', {
            collection: collectionName
        });
    }
    
    /**
     * Count documents in a collection
     */
    async count(collectionName) {
        const result = await this._executeCommand('count-collection', {
            collection: collectionName
        });
        return result.success ? result.data : 0;
    }
    
    /**
     * Peek at documents in a collection
     */
    async peek(collectionName, limit = 5) {
        const result = await this._executeCommand('peek-collection', {
            collection: collectionName,
            limit
        });
        return result.success ? result.data : null;
    }
    
    /**
     * Query a collection
     */
    async query(collectionName, queryText, options = {}) {
        const args = {
            collection: collectionName,
            query: queryText,
            nResults: options.nResults || 10,
            where: options.where
        };
        
        const result = await this._executeCommand('query-collection', args);
        return result.success ? result.data : null;
    }
    
    /**
     * Create a new collection
     */
    async createCollection(collectionName, metadata = {}) {
        const args = {
            collection: collectionName,
            metadata: JSON.stringify(metadata)
        };
        
        const result = await this._executeCommand('create-collection', args);
        return result;
    }
    
    /**
     * Add documents to a collection
     */
    async addDocuments(collectionName, ids, documents, metadatas = null) {
        const args = {
            collection: collectionName,
            ids: JSON.stringify(ids),
            documents: JSON.stringify(documents)
        };
        
        if (metadatas) {
            args.metadatas = JSON.stringify(metadatas);
        }
        
        const result = await this._executeCommand('add-documents', args);
        return result;
    }
}


// Export singleton instance and class
export const chroma = new ChromaDBClient();
export default ChromaDBClient;


// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    const collection = process.argv[3];
    
    async function run() {
        try {
            switch (command) {
                case 'heartbeat':
                    const heartbeat = await chroma.heartbeat();
                    console.log(JSON.stringify(heartbeat, null, 2));
                    break;
                    
                case 'list':
                    const collections = await chroma.listCollections();
                    console.log(JSON.stringify(collections, null, 2));
                    break;
                    
                case 'count':
                    if (!collection) {
                        console.error('Usage: node chroma-wrapper.mjs count <collection>');
                        process.exit(1);
                    }
                    const count = await chroma.count(collection);
                    console.log(`Documents in ${collection}: ${count}`);
                    break;
                    
                case 'peek':
                    if (!collection) {
                        console.error('Usage: node chroma-wrapper.mjs peek <collection> [limit]');
                        process.exit(1);
                    }
                    const limit = parseInt(process.argv[4]) || 5;
                    const peek = await chroma.peek(collection, limit);
                    console.log(JSON.stringify(peek, null, 2));
                    break;
                    
                default:
                    console.error(`Unknown command: ${command}`);
                    console.error('Usage: node chroma-wrapper.mjs <command> [args...]');
                    console.error('Commands: heartbeat, list, count, peek');
                    process.exit(1);
            }
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
    
    run();
}
