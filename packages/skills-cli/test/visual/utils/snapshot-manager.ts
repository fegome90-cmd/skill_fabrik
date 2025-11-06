/**
 * Visual Regression Testing - Snapshot Manager
 * Handles capturing, storing, and comparing CLI output snapshots
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';

export interface SnapshotConfig {
  tolerance: number;        // Difference tolerance (0-1)
  ignoreColors: boolean;    // Ignore color differences
  ignoreWhitespace: boolean; // Ignore whitespace differences
  ignoreTimestamps: boolean; // Ignore timestamps and dates
  ignoreNumbers: boolean;   // Ignore numeric values
  ignorePaths: boolean;     // Ignore file paths
  ignorePids: boolean;      // Ignore process IDs
}

export interface VisualSnapshot {
  id: string;
  command: string;
  args: string[];
  output: string;
  metadata: {
    timestamp: number;
    cliVersion: string;
    environment: string;
    nodeVersion: string;
    platform: string;
    colors: boolean;
    format: string;
    exitCode: number;
  };
}

export interface SnapshotComparison {
  passed: boolean;
  difference: number;
  added: string[];
  removed: string[];
  modified: Array<{ old: string; new: string }>;
  metadata: {
    oldSnapshot: VisualSnapshot;
    newSnapshot: VisualSnapshot;
    comparisonTime: number;
  };
}

/**
 * Snapshot Manager for visual regression testing
 */
export class SnapshotManager {
  private snapshotsDir: string;
  private diffsDir: string;
  private defaultConfig: SnapshotConfig;

  constructor(baseDir: string = './test/visual') {
    this.snapshotsDir = join(baseDir, 'snapshots');
    this.diffsDir = join(baseDir, 'diffs');
    this.defaultConfig = {
      tolerance: 0.1,
      ignoreColors: false,
      ignoreWhitespace: true,
      ignoreTimestamps: true,
      ignoreNumbers: false,
      ignorePaths: true,
      ignorePids: true
    };

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Create snapshot directory structure
   */
  private ensureDirectories(): void {
    [this.snapshotsDir, this.diffsDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate unique snapshot ID from command and args
   */
  private generateSnapshotId(command: string, args: string[]): string {
    const content = `${command}:${args.join(':')}`;
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * Get snapshot file path
   */
  private getSnapshotPath(id: string): string {
    return join(this.snapshotsDir, `${id}.snapshot.json`);
  }

  /**
   * Get diff file path
   */
  private getDiffPath(id: string): string {
    return join(this.diffsDir, `${id}.diff.json`);
  }

  /**
   * Preprocess output for comparison
   */
  private preprocessOutput(output: string, config: SnapshotConfig): string {
    let processed = output;

    // Remove ANSI color codes if ignoring colors
    if (config.ignoreColors) {
      processed = processed.replace(/\x1b\[[0-9;]*m/g, '');
    }

    // Normalize whitespace if ignoring
    if (config.ignoreWhitespace) {
      processed = processed.replace(/\s+/g, ' ').trim();
    }

    // Remove timestamps if ignoring
    if (config.ignoreTimestamps) {
      processed = processed.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/g, '[TIMESTAMP]');
      processed = processed.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]');
      processed = processed.replace(/\d{2}:\d{2}:\d{2}/g, '[TIME]');
    }

    // Remove numbers if ignoring
    if (config.ignoreNumbers) {
      processed = processed.replace(/\b\d+(\.\d+)?\b/g, '[NUMBER]');
    }

    // Remove file paths if ignoring
    if (config.ignorePaths) {
      processed = processed.replace(/\/[^\s\/]+\/[^\s\/]*/g, '[PATH]');
      processed = processed.replace(/\/tmp\/[^\s]+/g, '[TMP_PATH]');
      processed = processed.replace(/\/Users\/[^\/s]+/g, '[USER_PATH]');
    }

    // Remove process IDs if ignoring
    if (config.ignorePids) {
      processed = processed.replace(/\bpid:\s*\d+/g, 'pid: [PID]');
      processed = processed.replace(/\bprocess:\s*\d+/g, 'process: [PID]');
    }

    return processed;
  }

  /**
   * Create a new snapshot
   */
  createSnapshot(
    command: string,
    args: string[],
    output: string,
    metadata: Partial<VisualSnapshot['metadata']> = {}
  ): VisualSnapshot {
    const id = this.generateSnapshotId(command, args);

    const snapshot: VisualSnapshot = {
      id,
      command,
      args,
      output,
      metadata: {
        timestamp: Date.now(),
        cliVersion: process.env.npm_package_version || 'unknown',
        environment: process.env.NODE_ENV || 'test',
        nodeVersion: process.version,
        platform: process.platform,
        colors: output.includes('\x1b['),
        format: this.detectOutputFormat(output),
        exitCode: metadata.exitCode || 0,
        ...metadata
      }
    };

    return snapshot;
  }

  /**
   * Detect output format from content
   */
  private detectOutputFormat(output: string): string {
    if (output.trim().startsWith('{') && output.trim().endsWith('}')) {
      return 'json';
    }
    if (output.includes(',') && output.split('\n').every(line => line.includes(','))) {
      return 'csv';
    }
    if (output.includes('#') || output.includes('*') || output.includes('-')) {
      return 'markdown';
    }
    return 'plain';
  }

  /**
   * Save snapshot to disk
   */
  saveSnapshot(snapshot: VisualSnapshot): void {
    const filePath = this.getSnapshotPath(snapshot.id);
    const content = JSON.stringify(snapshot, null, 2);
    writeFileSync(filePath, content, 'utf8');
  }

  /**
   * Load snapshot from disk
   */
  loadSnapshot(id: string): VisualSnapshot | null {
    const filePath = this.getSnapshotPath(id);

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf8');
      return JSON.parse(content) as VisualSnapshot;
    } catch (error) {
      console.error(`Failed to load snapshot ${id}:`, error);
      return null;
    }
  }

  /**
   * Compare two outputs
   */
  private compareOutputs(oldOutput: string, newOutput: string): {
    difference: number;
    added: string[];
    removed: string[];
    modified: Array<{ old: string; new: string }>;
  } {
    const oldLines = oldOutput.split('\n').filter(line => line.trim());
    const newLines = newOutput.split('\n').filter(line => line.trim());

    const added: string[] = [];
    const removed: string[] = [];
    const modified: Array<{ old: string; new: string }> = [];

    // Find added lines
    for (const newLine of newLines) {
      if (!oldLines.includes(newLine)) {
        added.push(newLine);
      }
    }

    // Find removed lines
    for (const oldLine of oldLines) {
      if (!newLines.includes(oldLine)) {
        removed.push(oldLine);
      }
    }

    // Calculate difference ratio
    const totalLines = Math.max(oldLines.length, newLines.length);
    const differentLines = added.length + removed.length;
    const difference = totalLines > 0 ? differentLines / totalLines : 0;

    return { difference, added, removed, modified };
  }

  /**
   * Compare snapshot with current output
   */
  compareSnapshot(
    command: string,
    args: string[],
    currentOutput: string,
    config: Partial<SnapshotConfig> = {}
  ): SnapshotComparison {
    const fullConfig = { ...this.defaultConfig, ...config };
    const id = this.generateSnapshotId(command, args);

    const oldSnapshot = this.loadSnapshot(id);
    if (!oldSnapshot) {
      throw new Error(`No snapshot found for command: ${command} ${args.join(' ')}`);
    }

    const newSnapshot = this.createSnapshot(command, args, currentOutput, {
      exitCode: 0 // Default to success for comparison
    });

    const startTime = Date.now();

    // Preprocess both outputs
    const oldProcessed = this.preprocessOutput(oldSnapshot.output, fullConfig);
    const newProcessed = this.preprocessOutput(currentOutput, fullConfig);

    // Compare outputs
    const { difference, added, removed, modified } = this.compareOutputs(oldProcessed, newProcessed);

    const comparisonTime = Date.now() - startTime;

    const comparison: SnapshotComparison = {
      passed: difference <= fullConfig.tolerance,
      difference,
      added,
      removed,
      modified,
      metadata: {
        oldSnapshot,
        newSnapshot,
        comparisonTime
      }
    };

    // Save comparison result for debugging
    this.saveComparisonResult(id, comparison);

    return comparison;
  }

  /**
   * Save comparison result for debugging
   */
  private saveComparisonResult(id: string, comparison: SnapshotComparison): void {
    const diffPath = this.getDiffPath(id);
    const content = JSON.stringify(comparison, null, 2);
    writeFileSync(diffPath, content, 'utf8');
  }

  /**
   * Update existing snapshot
   */
  updateSnapshot(command: string, args: string[], output: string): void {
    const snapshot = this.createSnapshot(command, args, output);
    this.saveSnapshot(snapshot);
  }

  /**
   * Check if snapshot exists
   */
  hasSnapshot(command: string, args: string[]): boolean {
    const id = this.generateSnapshotId(command, args);
    return existsSync(this.getSnapshotPath(id));
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): VisualSnapshot[] {
    // This would require reading all files in the snapshots directory
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Clean up old snapshots
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    // Clean up snapshots older than maxAge (default: 30 days)
    // Implementation would read directory and delete old files
    return 0; // Placeholder
  }

  /**
   * Generate diff report
   */
  generateDiffReport(comparisons: SnapshotComparison[]): string {
    const failedComparisons = comparisons.filter(comp => !comp.passed);

    if (failedComparisons.length === 0) {
      return '✅ All visual tests passed!\n\nNo visual regressions detected.';
    }

    let report = `❌ Visual regressions detected in ${failedComparisons.length} tests\n\n`;

    failedComparisons.forEach((comparison, index) => {
      const { oldSnapshot, newSnapshot } = comparison.metadata;

      report += `${index + 1}. ${oldSnapshot.command} ${oldSnapshot.args.join(' ')}\n`;
      report += `   Difference: ${(comparison.difference * 100).toFixed(2)}%\n`;

      if (comparison.added.length > 0) {
        report += `   Added lines (${comparison.added.length}):\n`;
        comparison.added.slice(0, 3).forEach(line => {
          report += `     + ${line}\n`;
        });
        if (comparison.added.length > 3) {
          report += `     ... and ${comparison.added.length - 3} more\n`;
        }
      }

      if (comparison.removed.length > 0) {
        report += `   Removed lines (${comparison.removed.length}):\n`;
        comparison.removed.slice(0, 3).forEach(line => {
          report += `     - ${line}\n`;
        });
        if (comparison.removed.length > 3) {
          report += `     ... and ${comparison.removed.length - 3} more\n`;
        }
      }

      report += '\n';
    });

    report += `💡 Run with --update-snapshots to approve changes\n`;
    report += `📁 Detailed diffs saved to: ${this.diffsDir}`;

    return report;
  }
}