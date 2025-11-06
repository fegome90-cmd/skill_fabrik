/**
 * Worker Thread Manager - FASE 2
 * Manages worker threads for intensive I/O operations
 */

import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WorkerTask {
  id: string;
  type: 'file_search' | 'index_generation' | 'pattern_matching';
  data: any;
}

interface WorkerResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

class WorkerThreadManager {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: WorkerTask[] = [];
  private maxWorkers: number = 4;
  private activeWorkers: number = 0;
  private taskTimeout: number = 30000; // 30 seconds

  constructor(options?: { maxWorkers?: number; taskTimeout?: number }) {
    this.maxWorkers = options?.maxWorkers || 4;
    this.taskTimeout = options?.taskTimeout || 30000;
  }

  /**
   * Execute a task in a worker thread
   */
  async executeTask(task: WorkerTask): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      // Check if we can use a worker immediately
      if (this.activeWorkers < this.maxWorkers) {
        this.runTaskInWorker(task, resolve, reject);
      } else {
        // Queue the task
        this.taskQueue.push(task);
        // Set a timeout to prevent infinite queuing
        setTimeout(() => {
          reject(new Error(`Task ${task.id} timed out in queue`));
        }, this.taskTimeout);
      }
    });
  }

  /**
   * Run a task in a worker thread
   */
  private runTaskInWorker(
    task: WorkerTask,
    resolve: (value: WorkerResult) => void,
    reject: (reason?: any) => void
  ): void {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const workerPath = path.resolve(__dirname, '../workers/file-search-worker.js');
      const worker = new Worker(workerPath, {
        workerData: task
      });

      this.workers.set(workerId, worker);
      this.activeWorkers++;

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error(`Task ${task.id} timed out`));
      }, this.taskTimeout);

      worker.on('message', (result: WorkerResult) => {
        clearTimeout(timeout);
        this.cleanupWorker(workerId);
        resolve(result);
      });

      worker.on('error', (error) => {
        clearTimeout(timeout);
        this.cleanupWorker(workerId);
        reject(error);
      });

      worker.on('exit', (code) => {
        clearTimeout(timeout);
        this.cleanupWorker(workerId);
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Clean up a worker thread
   */
  private cleanupWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerId);
      this.activeWorkers--;

      // Process next queued task
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
          this.executeTask(nextTask).catch(err => {
            console.error('Queued task failed:', err);
          });
        }
      }
    }
  }

  /**
   * Execute parallel file search using worker threads
   */
  async executeParallelFileSearch(
    pathPatterns: string[],
    cwd: string,
    maxFiles: number = 5
  ): Promise<string[]> {
    const taskId = `file-search-${Date.now()}`;

    const task: WorkerTask = {
      id: taskId,
      type: 'file_search',
      data: {
        pathPatterns,
        cwd,
        maxFiles,
        parallel: true
      }
    };

    try {
      const result = await this.executeTask(task);
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown worker error');
      }
    } catch (error) {
      console.warn('Worker thread failed, falling back to main thread:', error);
      // Fallback to main thread processing
      return [];
    }
  }

  /**
   * Generate project index using worker thread
   */
  async generateProjectIndex(cwd: string): Promise<any> {
    const taskId = `index-gen-${Date.now()}`;

    const task: WorkerTask = {
      id: taskId,
      type: 'index_generation',
      data: { cwd }
    };

    try {
      const result = await this.executeTask(task);
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Index generation failed');
      }
    } catch (error) {
      console.warn('Index generation worker failed:', error);
      throw error;
    }
  }

  /**
   * Pattern matching in worker thread
   */
  async executePatternMatching(
    pattern: string,
    searchPath: string,
    cwd: string,
    maxFiles: number
  ): Promise<string[]> {
    const taskId = `pattern-${Date.now()}`;

    const task: WorkerTask = {
      id: taskId,
      type: 'pattern_matching',
      data: { pattern, searchPath, cwd, maxFiles }
    };

    try {
      const result = await this.executeTask(task);
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Pattern matching failed');
      }
    } catch (error) {
      console.warn('Pattern matching worker failed:', error);
      return [];
    }
  }

  /**
   * Get worker statistics
   */
  getStats(): {
    activeWorkers: number;
    queuedTasks: number;
    maxWorkers: number;
  } {
    return {
      activeWorkers: this.activeWorkers,
      queuedTasks: this.taskQueue.length,
      maxWorkers: this.maxWorkers
    };
  }

  /**
   * Shutdown all workers
   */
  async shutdown(): Promise<void> {
    const shutdownPromises = Array.from(this.workers.values()).map(worker => worker.terminate());
    await Promise.all(shutdownPromises);
    this.workers.clear();
    this.activeWorkers = 0;
    this.taskQueue.length = 0;
  }
}

// Export singleton instance
export const workerThreadManager = new WorkerThreadManager();

export default WorkerThreadManager;
