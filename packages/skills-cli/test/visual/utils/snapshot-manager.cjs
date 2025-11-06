/**
 * Visual Snapshot Manager
 * Manages CLI output snapshots for visual regression testing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Visual Snapshot
 * Represents a CLI output snapshot
 */
class VisualSnapshot {
  constructor(id, command, args, output, metadata = {}) {
    this.id = id;
    this.command = command;
    this.args = args;
    this.output = output;
    this.metadata = {
      timestamp: Date.now(),
      platform: process.platform,
      nodeVersion: process.version,
      ...metadata
    };
  }

  /**
   * Get snapshot hash for comparison
   */
  getHash() {
    const content = `${this.command}:${this.args.join(' ')}:${this.output}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      command: this.command,
      args: this.args,
      output: this.output,
      metadata: this.metadata,
      hash: this.getHash()
    };
  }
}

/**
 * Snapshot Comparison Result
 */
class SnapshotComparison {
  constructor(currentSnapshot, referenceSnapshot, differences = []) {
    this.currentSnapshot = currentSnapshot;
    this.referenceSnapshot = referenceSnapshot;
    this.differences = differences;
    this.timestamp = Date.now();
  }

  get hasDifferences() {
    return this.differences.length > 0;
  }

  get isIdentical() {
    return !this.hasDifferences;
  }

  get summary() {
    return {
      hasDifferences: this.hasDifferences,
      differenceCount: this.differences.length,
      currentHash: this.currentSnapshot.getHash(),
      referenceHash: this.referenceSnapshot?.getHash()
    };
  }
}

/**
 * Snapshot Manager
 * Manages creation, storage, and comparison of CLI output snapshots
 */
class SnapshotManager {
  constructor(options = {}) {
    this.snapshotsDir = options.snapshotsDir || path.join(__dirname, '../snapshots');
    this.diffsDir = options.diffsDir || path.join(__dirname, '../diffs');
    this.ensureDirectories();
    this.snapshots = new Map();
    this.loadExistingSnapshots();
  }

  /**
   * Ensure necessary directories exist
   */
  ensureDirectories() {
    [this.snapshotsDir, this.diffsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load existing snapshots from disk
   */
  loadExistingSnapshots() {
    try {
      const files = fs.readdirSync(this.snapshotsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(this.snapshotsDir, file), 'utf8'));
            const snapshot = new VisualSnapshot(
              data.id,
              data.command,
              data.args,
              data.output,
              data.metadata
            );
            this.snapshots.set(snapshot.id, snapshot);
          } catch (error) {
            console.warn(`Failed to load snapshot ${file}:`, error.message);
          }
        }
      });
    } catch (error) {
      console.warn('No existing snapshots found:', error.message);
    }
  }

  /**
   * Create a new snapshot
   */
  createSnapshot(command, args, output, metadata = {}) {
    const id = this.generateSnapshotId(command, args);
    const snapshot = new VisualSnapshot(id, command, args, output, metadata);

    this.snapshots.set(id, snapshot);
    this.saveSnapshot(snapshot);

    return snapshot;
  }

  /**
   * Generate unique snapshot ID
   */
  generateSnapshotId(command, args) {
    const signature = `${command}:${args.join(' ')}`;
    const hash = crypto.createHash('sha256').update(signature).digest('hex').substring(0, 16);
    return `${command}-${hash}`;
  }

  /**
   * Save snapshot to disk
   */
  saveSnapshot(snapshot) {
    const filename = `${snapshot.id}.json`;
    const filepath = path.join(this.snapshotsDir, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(snapshot.toJSON(), null, 2));
    } catch (error) {
      console.error(`Failed to save snapshot ${snapshot.id}:`, error.message);
    }
  }

  /**
   * Get snapshot by ID
   */
  getSnapshot(id) {
    return this.snapshots.get(id);
  }

  /**
   * Get snapshots by command
   */
  getSnapshotsByCommand(command) {
    return Array.from(this.snapshots.values()).filter(snapshot => snapshot.command === command);
  }

  /**
   * Compare current output with existing snapshot
   */
  compareSnapshot(command, args, currentOutput) {
    const id = this.generateSnapshotId(command, args);
    const referenceSnapshot = this.getSnapshot(id);

    if (!referenceSnapshot) {
      // No reference snapshot exists
      const currentSnapshot = this.createSnapshot(command, args, currentOutput, {
        status: 'new_snapshot'
      });
      return new SnapshotComparison(currentSnapshot, null, ['No reference snapshot found']);
    }

    const currentSnapshot = new VisualSnapshot(id, command, args, currentOutput);
    const differences = this.findDifferences(currentSnapshot, referenceSnapshot);

    const comparison = new SnapshotComparison(currentSnapshot, referenceSnapshot, differences);

    // Save diff report if there are differences
    if (differences.length > 0) {
      this.saveDiffReport(comparison);
    }

    return comparison;
  }

  /**
   * Find differences between two snapshots
   */
  findDifferences(current, reference) {
    const differences = [];

    // Compare output text
    if (current.output !== reference.output) {
      differences.push({
        type: 'output_diff',
        message: 'CLI output differs from reference'
      });
    }

    // Compare metadata if needed
    const currentHash = current.getHash();
    const referenceHash = reference.getHash();

    if (currentHash !== referenceHash) {
      differences.push({
        type: 'hash_diff',
        message: 'Snapshot content differs (hash mismatch)',
        currentHash,
        referenceHash
      });
    }

    return differences;
  }

  /**
   * Save diff report
   */
  saveDiffReport(comparison) {
    const filename = `diff-${comparison.currentSnapshot.id}-${Date.now()}.json`;
    const filepath = path.join(this.diffsDir, filename);

    const report = {
      summary: comparison.summary,
      currentSnapshot: comparison.currentSnapshot.toJSON(),
      referenceSnapshot: comparison.referenceSnapshot.toJSON(),
      differences: comparison.differences,
      timestamp: comparison.timestamp
    };

    try {
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error(`Failed to save diff report:`, error.message);
    }
  }

  /**
   * Update reference snapshot
   */
  updateReferenceSnapshot(command, args, output, metadata = {}) {
    const id = this.generateSnapshotId(command, args);
    const snapshot = new VisualSnapshot(id, command, args, output, {
      ...metadata,
      status: 'updated_reference'
    });

    this.snapshots.set(id, snapshot);
    this.saveSnapshot(snapshot);

    return snapshot;
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(id) {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      return false;
    }

    // Remove from memory
    this.snapshots.delete(id);

    // Remove from disk
    try {
      const filename = `${id}.json`;
      const filepath = path.join(this.snapshotsDir, filename);
      fs.unlinkSync(filepath);
      return true;
    } catch (error) {
      console.error(`Failed to delete snapshot ${id}:`, error.message);
      return false;
    }
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots() {
    return Array.from(this.snapshots.values());
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const snapshots = this.getAllSnapshots();
    const commands = [...new Set(snapshots.map(s => s.command))];

    return {
      totalSnapshots: snapshots.length,
      totalCommands: commands.length,
      commands: commands.map(cmd => ({
        name: cmd,
        count: snapshots.filter(s => s.command === cmd).length
      })),
      oldestSnapshot: snapshots.length > 0 ? Math.min(...snapshots.map(s => s.metadata.timestamp)) : null,
      newestSnapshot: snapshots.length > 0 ? Math.max(...snapshots.map(s => s.metadata.timestamp)) : null
    };
  }

  /**
   * Clear all snapshots
   */
  clearAllSnapshots() {
    this.snapshots.clear();

    try {
      const files = fs.readdirSync(this.snapshotsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.snapshotsDir, file));
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear snapshots:', error.message);
      return false;
    }
  }
}

module.exports = {
  VisualSnapshot,
  SnapshotComparison,
  SnapshotManager
};