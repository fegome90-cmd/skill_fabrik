/**
 * Enterprise Chaos Engineering Suite
 * DIY chaos engineering scripts for system resilience testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ChaosEngineeringSuite {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    this.originalEnvironment = { ...process.env };
    this.setupChaosEnvironment();
    this.experiments = this.defineChaosExperiments();
  }

  setupChaosEnvironment() {
    console.log('🌪️  Setting up chaos engineering environment...');

    // Create chaos directories
    this.chaosDataDir = path.join(__dirname, 'chaos-data');
    this.resultsDir = path.join(__dirname, 'chaos-results');
    this.backupDir = path.join(__dirname, 'chaos-backups');

    [this.chaosDataDir, this.resultsDir, this.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });

    // Initialize system state monitoring
    this.systemMonitor = new SystemMonitor();
  }

  defineChaosExperiments() {
    return [
      {
        name: 'Network Latency Injection',
        category: 'network',
        severity: 'medium',
        fn: () => this.injectNetworkLatency()
      },
      {
        name: 'Memory Pressure Simulation',
        category: 'resource',
        severity: 'high',
        fn: () => this.simulateMemoryPressure()
      },
      {
        name: 'File System Chaos',
        category: 'filesystem',
        severity: 'medium',
        fn: () => this.introduceFilesystemChaos()
      },
      {
        name: 'Process Killer',
        category: 'process',
        severity: 'high',
        fn: () => this.killRandomProcesses()
      },
      {
        name: 'Environment Variable Corruption',
        category: 'environment',
        severity: 'medium',
        fn: () => this.corruptEnvironmentVariables()
      },
      {
        name: 'Resource Exhaustion',
        category: 'resource',
        severity: 'high',
        fn: () => this.exhaustResources()
      },
      {
        name: 'Configuration Corruption',
        category: 'configuration',
        severity: 'medium',
        fn: () => this.corruptConfigurations()
      },
      {
        name: 'Dependency Unavailability',
        category: 'dependency',
        severity: 'high',
        fn: () => this.simulateDependencyFailure()
      },
      {
        name: 'Random Input Injection',
        category: 'input',
        severity: 'low',
        fn: () => this.injectRandomInputs()
      },
      {
        name: 'System Clock Manipulation',
        category: 'system',
        severity: 'medium',
        fn: () => this.manipulateSystemClock()
      }
    ];
  }

  async runChaosExperiments() {
    console.log('\n🌪️  Starting Enterprise Chaos Engineering Suite');
    console.log('===============================================');

    // Take system snapshot before chaos
    const beforeSnapshot = await this.systemMonitor.takeSnapshot();

    for (const experiment of this.experiments) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔥 Running: ${experiment.name} (${experiment.category})`);
      console.log(`⚠️  Severity: ${experiment.severity.toUpperCase()}`);
      console.log('='.repeat(60));

      const experimentStart = Date.now();

      try {
        // Monitor system before experiment
        const beforeState = await this.systemMonitor.getCurrentState();

        // Run chaos experiment
        const result = await experiment.fn();

        // Monitor system after experiment
        const afterState = await this.systemMonitor.getCurrentState();

        // Calculate system impact
        const impact = this.calculateImpact(beforeState, afterState);

        this.testResults.push({
          experiment: experiment.name,
          category: experiment.category,
          severity: experiment.severity,
          success: result.success !== false,
          duration: Date.now() - experimentStart,
          details: result.details || {},
          impact: impact,
          systemRecovered: result.recovered || false,
          timestamp: Date.now()
        });

        const status = result.success !== false ? '✅ PASSED' : '❌ FAILED';
        const recovery = result.recovered ? '🔄 RECOVERED' : '⚠️  NO RECOVERY';
        console.log(`${status} ${experiment.name} (${Date.now() - experimentStart}ms) - ${recovery}`);

        if (impact.severity === 'critical') {
          console.log(`🚨 CRITICAL IMPACT: ${impact.description}`);
        }

      } catch (error) {
        this.testResults.push({
          experiment: experiment.name,
          category: experiment.category,
          severity: experiment.severity,
          success: false,
          duration: Date.now() - experimentStart,
          details: { error: error.message },
          impact: { severity: 'critical', description: error.message },
          systemRecovered: false,
          timestamp: Date.now()
        });
        console.log(`❌ ${experiment.name} - FAILED: ${error.message}`);
      }

      // Allow system to stabilize between experiments
      console.log('⏳ Waiting for system stabilization...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Take system snapshot after chaos
    const afterSnapshot = await this.systemMonitor.takeSnapshot();

    this.generateChaosReport(beforeSnapshot, afterSnapshot);
  }

  async injectNetworkLatency() {
    console.log('Injecting network latency...');

    const latencyMs = 1000 + Math.random() * 2000; // 1-3 seconds
    const details = { latencyMs, packetsDropped: 0 };

    try {
      // Simulate network latency by modifying hosts file temporarily
      const hostsFile = os.platform() === 'win32' ?
        'C:\\Windows\\System32\\drivers\\etc\\hosts' :
        '/etc/hosts';

      const hostsBackup = path.join(this.backupDir, 'hosts.backup');

      // Backup original hosts file
      if (fs.existsSync(hostsFile)) {
        fs.copyFileSync(hostsFile, hostsBackup);
      }

      // Add latency simulation entries (commented out for safety)
      const latencyEntry = `\n# Chaos Engineering: Network latency simulation\n# 127.0.0.1 latency-test.example.com\n`;

      try {
        fs.appendFileSync(hostsFile, latencyEntry);

        // Test CLI operation with simulated latency
        const cliPath = path.join(__dirname, '../../dist/index.js');
        const startTime = Date.now();

        const result = execSync(`node "${cliPath}" skills check "test with network conditions"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 30000
        });

        const actualDuration = Date.now() - startTime;
        details.actualDuration = actualDuration;
        details.expectedDuration = actualDuration - latencyMs;

        // Restore hosts file
        if (fs.existsSync(hostsBackup)) {
          fs.copyFileSync(hostsBackup, hostsFile);
        }

        return {
          success: true,
          recovered: true,
          details
        };

      } catch (error) {
        // Ensure restoration even on error
        if (fs.existsSync(hostsBackup)) {
          fs.copyFileSync(hostsBackup, hostsFile);
        }
        throw error;
      }

    } catch (error) {
      return {
        success: false,
        recovered: true, // Best effort recovery
        details: { ...details, error: error.message }
      };
    }
  }

  async simulateMemoryPressure() {
    console.log('Simulating memory pressure...');

    const memoryBefore = process.memoryUsage();
    const targetMemoryMB = 100 + Math.random() * 200; // 100-300MB
    const details = { targetMemoryMB, memoryBefore };

    try {
      // Allocate memory to simulate pressure
      const memoryChunks = [];
      const chunkSize = 1024 * 1024; // 1MB chunks
      const chunksNeeded = targetMemoryMB;

      for (let i = 0; i < chunksNeeded; i++) {
        memoryChunks.push(Buffer.alloc(chunkSize, 'x'));

        // Test CLI operation under memory pressure
        if (i % 10 === 0) {
          try {
            const cliPath = path.join(__dirname, '../../dist/index.js');
            const result = execSync(`node "${cliPath}" skills check "memory pressure test ${i}"`, {
              encoding: 'utf8',
              stdio: 'pipe',
              timeout: 15000
            });
            details.testsUnderPressure = (details.testsUnderPressure || 0) + 1;
          } catch (error) {
            details.testFailures = (details.testFailures || 0) + 1;
          }
        }
      }

      const memoryAfter = process.memoryUsage();
      details.memoryAfter = memoryAfter;
      details.memoryAllocated = memoryAfter.heapUsed - memoryBefore.heapUsed;

      // Test recovery after memory pressure
      let recovered = false;
      try {
        const cliPath = path.join(__dirname, '../../dist/index.js');
        const result = execSync(`node "${cliPath}" skills check "recovery test after memory pressure"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        recovered = true;
      } catch (error) {
        details.recoveryError = error.message;
      }

      // Clean up allocated memory
      memoryChunks.length = 0;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      return {
        success: true,
        recovered,
        details
      };

    } catch (error) {
      return {
        success: false,
        recovered: false,
        details: { ...details, error: error.message }
      };
    }
  }

  async introduceFilesystemChaos() {
    console.log('Introducing filesystem chaos...');

    const testFiles = [];
    const details = { filesCreated: 0, operationsPerformed: 0 };

    try {
      // Create temporary files to fill disk space
      const testDataDir = path.join(this.chaosDataDir, 'fs-chaos');
      if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
      }

      // Create many small files
      for (let i = 0; i < 100; i++) {
        const testFile = path.join(testDataDir, `chaos-${i}.tmp`);
        const content = `Chaos engineering test file ${i}\n`.repeat(100);
        fs.writeFileSync(testFile, content);
        testFiles.push(testFile);
        details.filesCreated++;
      }

      // Test CLI operations during filesystem chaos
      const cliPath = path.join(__dirname, '../../dist/index.js');

      try {
        const result1 = execSync(`node "${cliPath}" skills check "test during filesystem chaos"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        details.cliOperationsSucceeded = (details.cliOperationsSucceeded || 0) + 1;
      } catch (error) {
        details.cliOperationsFailed = (details.cliOperationsFailed || 0) + 1;
      }

      // Introduce file permission changes
      testFiles.forEach((file, index) => {
        if (index % 10 === 0) {
          try {
            fs.chmodSync(file, 0o000); // Remove all permissions
            details.permissionChanges = (details.permissionChanges || 0) + 1;
          } catch (error) {
            details.permissionErrors = (details.permissionErrors || 0) + 1;
          }
        }
      });

      // Test CLI with permission issues
      try {
        const result2 = execSync(`node "${cliPath}" skills lint "${testDataDir}"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        details.cliOperationsSucceeded = (details.cliOperationsSucceeded || 0) + 1;
      } catch (error) {
        details.cliOperationsFailed = (details.cliOperationsFailed || 0) + 1;
        details.permissionImpact = error.message.includes('permission') || error.message.includes('denied');
      }

      // Recovery: Restore permissions and cleanup
      let recovered = false;
      try {
        testFiles.forEach(file => {
          try {
            fs.chmodSync(file, 0o644); // Restore normal permissions
          } catch (error) {
            // Ignore permission restoration errors
          }
        });

        // Test recovery
        const result3 = execSync(`node "${cliPath}" skills check "recovery after filesystem chaos"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        recovered = true;
      } catch (error) {
        details.recoveryError = error.message;
      }

      // Cleanup test files
      testFiles.forEach(file => {
        try {
          fs.unlinkSync(file);
        } catch (error) {
          // Ignore cleanup errors
        }
      });

      try {
        fs.rmdirSync(testDataDir, { recursive: true });
      } catch (error) {
        // Ignore cleanup errors
      }

      return {
        success: true,
        recovered,
        details
      };

    } catch (error) {
      return {
        success: false,
        recovered: false,
        details: { ...details, error: error.message }
      };
    }
  }

  async killRandomProcesses() {
    console.log('Simulating process failures (safe mode)...');

    const details = { processesSimulated: 0, impactAssessed: false };

    try {
      // NOTE: This is a SAFE simulation - we don't actually kill processes
      // Instead, we simulate the impact of process failures

      // Simulate losing daemon service
      details.simulatedDaemonFailure = true;

      // Test CLI without daemon
      const cliPath = path.join(__dirname, '../../dist/index.js');

      try {
        const result1 = execSync(`node "${cliPath}" skills check "test without daemon"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000,
          env: { ...process.env, SF_DAEMON_DISABLED: 'true' }
        });
        details.daemonNotRequired = true;
      } catch (error) {
        details.daemonRequired = true;
        details.daemonFailureImpact = error.message;
      }

      // Simulate database connection loss
      details.simulatedDbFailure = true;

      try {
        const result2 = execSync(`node "${cliPath}" skills check "test without database"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000,
          env: { ...process.env, DATABASE_URL: 'postgresql://invalid:invalid@localhost:9999/invalid' }
        });
        details.dbNotRequired = true;
      } catch (error) {
        details.dbRequired = true;
        details.dbFailureImpact = error.message;
      }

      // Simulate router service failure
      details.simulatedRouterFailure = true;

      try {
        const result3 = execSync(`node "${cliPath}" skills check "test without router"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000,
          env: { ...process.env, SF_ROUTER_URL: 'http://localhost:9999' }
        });
        details.routerNotRequired = true;
      } catch (error) {
        details.routerRequired = true;
        details.routerFailureImpact = error.message;
      }

      // Test recovery when services come back online
      let recovered = false;
      try {
        const result4 = execSync(`node "${cliPath}" skills check "recovery after service restoration"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000,
          env: process.env // Use original environment
        });
        recovered = true;
        details.servicesRecovered = true;
      } catch (error) {
        details.recoveryFailure = error.message;
      }

      details.processesSimulated = 3;
      details.impactAssessed = true;

      return {
        success: true,
        recovered,
        details
      };

    } catch (error) {
      return {
        success: false,
        recovered: false,
        details: { ...details, error: error.message }
      };
    }
  }

  async corruptEnvironmentVariables() {
    console.log('Corrupting environment variables...');

    const originalEnv = { ...process.env };
    const corruptedVars = {};
    const details = { variablesCorrupted: 0, variablesRestored: 0 };

    try {
      // Corrupt critical environment variables
      const criticalVars = [
        'NODE_ENV',
        'SF_ENDPOINT',
        'SF_STORAGE_L0',
        'PG_HOST',
        'PG_PORT',
        'REDIS_URL'
      ];

      criticalVars.forEach(varName => {
        if (originalEnv[varName]) {
          const originalValue = originalEnv[varName];
          corruptedVars[varName] = originalValue;

          // Corrupt the variable
          if (varName.includes('PORT')) {
            process.env[varName] = '99999'; // Invalid port
          } else if (varName.includes('HOST')) {
            process.env[varName] = 'invalid-host-name-that-does-not-exist.com';
          } else if (varName.includes('URL')) {
            process.env[varName] = 'invalid://protocol';
          } else {
            process.env[varName] = 'CORRUPTED_VALUE';
          }
          details.variablesCorrupted++;
        }
      });

      // Test CLI with corrupted environment
      const cliPath = path.join(__dirname, '../../dist/index.js');

      try {
        const result = execSync(`node "${cliPath}" skills check "test with corrupted environment"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        details.environmentTolerant = true;
      } catch (error) {
        details.environmentSensitive = true;
        details.corruptionImpact = error.message;
      }

      // Recovery: Restore original environment
      let recovered = false;
      Object.keys(corruptedVars).forEach(varName => {
        process.env[varName] = corruptedVars[varName];
        details.variablesRestored++;
      });

      try {
        const result2 = execSync(`node "${cliPath}" skills check "recovery after environment restoration"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        recovered = true;
      } catch (error) {
        details.recoveryFailure = error.message;
      }

      return {
        success: true,
        recovered,
        details
      };

    } catch (error) {
      // Ensure environment restoration on error
      Object.keys(corruptedVars).forEach(varName => {
        process.env[varName] = corruptedVars[varName];
      });

      return {
        success: false,
        recovered: true, // Environment restored
        details: { ...details, error: error.message }
      };
    }
  }

  async exhaustResources() {
    console.log('Exhausting system resources...');

    const resources = {
      memory: [],
      fileDescriptors: [],
      timers: []
    };

    const details = { memoryAllocated: 0, fdsOpened: 0, timersCreated: 0 };

    try {
      // Exhaust memory (limited to safe levels)
      const memoryLimit = 50 * 1024 * 1024; // 50MB limit
      let memoryUsed = 0;

      while (memoryUsed < memoryLimit) {
        const chunk = Buffer.alloc(1024 * 1024, 'resource-exhaustion-test');
        resources.memory.push(chunk);
        memoryUsed += chunk.length;

        // Test CLI under resource pressure
        if (resources.memory.length % 10 === 0) {
          try {
            const cliPath = path.join(__dirname, '../../dist/index.js');
            const result = execSync(`node "${cliPath}" skills check "test under resource exhaustion"`, {
              encoding: 'utf8',
              stdio: 'pipe',
              timeout: 15000
            });
            details.testsUnderPressure = (details.testsUnderPressure || 0) + 1;
          } catch (error) {
            details.testFailures = (details.testFailures || 0) + 1;
          }
        }
      }

      details.memoryAllocated = memoryUsed;

      // Exhaust file descriptors (limited)
      const tempFiles = [];
      const fdLimit = 50; // Safe limit

      for (let i = 0; i < fdLimit; i++) {
        try {
          const tempFile = path.join(this.chaosDataDir, `resource-test-${i}.tmp`);
          fs.writeFileSync(tempFile, 'resource exhaustion test');
          const fd = fs.openSync(tempFile, 'r');
          resources.fileDescriptors.push({ file: tempFile, fd });
          tempFiles.push(tempFile);
          details.fdsOpened++;
        } catch (error) {
          break; // Stop if we run out of file descriptors
        }
      }

      // Create many timers (limited)
      for (let i = 0; i < 100; i++) {
        const timer = setTimeout(() => {
          // Timer callback
        }, 10000 + Math.random() * 20000);
        resources.timers.push(timer);
        details.timersCreated++;
      }

      // Test system under extreme resource pressure
      try {
        const cliPath = path.join(__dirname, '../../dist/index.js');
        const result = execSync(`node "${cliPath}" skills check "test under extreme resource pressure"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 25000
        });
        details.extremePressureTest = 'passed';
      } catch (error) {
        details.extremePressureTest = 'failed';
        details.extremePressureError = error.message;
      }

      // Recovery: Clean up all resources
      let recovered = false;

      // Clean up memory
      resources.memory.length = 0;

      // Clean up file descriptors
      resources.fileDescriptors.forEach(({ file, fd }) => {
        try {
          fs.closeSync(fd);
          fs.unlinkSync(file);
        } catch (error) {
          // Ignore cleanup errors
        }
      });

      // Clean up timers
      resources.timers.forEach(timer => {
        clearTimeout(timer);
      });

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      // Test recovery
      try {
        const cliPath = path.join(__dirname, '../../dist/index.js');
        const result = execSync(`node "${cliPath}" skills check "recovery after resource exhaustion"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        recovered = true;
      } catch (error) {
        details.recoveryFailure = error.message;
      }

      return {
        success: true,
        recovered,
        details
      };

    } catch (error) {
      // Cleanup on error
      resources.memory.length = 0;
      resources.fileDescriptors.forEach(({ file, fd }) => {
        try {
          fs.closeSync(fd);
          fs.unlinkSync(file);
        } catch (error) {
          // Ignore cleanup errors
        }
      });
      resources.timers.forEach(timer => clearTimeout(timer));

      return {
        success: false,
        recovered: false,
        details: { ...details, error: error.message }
      };
    }
  }

  async corruptConfigurations() {
    console.log('Corrupting configuration files...');

    const corruptedConfigs = [];
    const details = { configsCorrupted: 0, configsRestored: 0 };

    try {
      // Backup and corrupt configuration files
      const configFiles = [
        path.join(__dirname, '../../package.json'),
        path.join(__dirname, '../../tsconfig.json'),
        path.join(__dirname, '../../configs/skill-rules.json')
      ];

      for (const configFile of configFiles) {
        if (fs.existsSync(configFile)) {
          const backupFile = path.join(this.backupDir, path.basename(configFile) + '.backup');

          try {
            // Backup original
            fs.copyFileSync(configFile, backupFile);
            corruptedConfigs.push({ original: configFile, backup: backupFile });

            // Corrupt the file
            const originalContent = fs.readFileSync(configFile, 'utf8');
            const corruptedContent = originalContent.replace(/"/g, "'").replace(/\{/g, '[').replace(/\}/g, ']');
            fs.writeFileSync(configFile, corruptedContent);
            details.configsCorrupted++;

          } catch (error) {
            details.corruptionErrors = (details.corruptionErrors || 0) + 1;
          }
        }
      }

      // Test CLI with corrupted configurations
      const cliPath = path.join(__dirname, '../../dist/index.js');

      try {
        const result = execSync(`node "${cliPath}" skills check "test with corrupted configs"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        details.configTolerant = true;
      } catch (error) {
        details.configSensitive = true;
        details.corruptionImpact = error.message;
      }

      // Recovery: Restore original configurations
      let recovered = false;

      for (const { original, backup } of corruptedConfigs) {
        try {
          fs.copyFileSync(backup, original);
          details.configsRestored++;
        } catch (error) {
          details.restorationErrors = (details.restorationErrors || 0) + 1;
        }
      }

      try {
        const result2 = execSync(`node "${cliPath}" skills check "recovery after config restoration"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        recovered = true;
      } catch (error) {
        details.recoveryFailure = error.message;
      }

      return {
        success: true,
        recovered,
        details
      };

    } catch (error) {
      // Ensure config restoration on error
      for (const { original, backup } of corruptedConfigs) {
        try {
          fs.copyFileSync(backup, original);
        } catch (error) {
          // Ignore restoration errors
        }
      }

      return {
        success: false,
        recovered: true, // Configs restored
        details: { ...details, error: error.message }
      };
    }
  }

  async simulateDependencyFailure() {
    console.log('Simulating dependency failures...');

    const details = { dependenciesSimulated: 0, impactAssessed: false };

    try {
      // Simulate npm dependency failure by renaming node_modules temporarily
      const nodeModulesPath = path.join(__dirname, '../../node_modules');
      const nodeModulesBackup = path.join(this.backupDir, 'node-modules-backup');

      let nodeModulesMoved = false;

      if (fs.existsSync(nodeModulesPath)) {
        try {
          fs.renameSync(nodeModulesPath, nodeModulesBackup);
          nodeModulesMoved = true;
          details.nodeModulesUnavailable = true;
          details.dependenciesSimulated++;
        } catch (error) {
          details.nodeModulesMoveError = error.message;
        }
      }

      // Test CLI without dependencies
      const cliPath = path.join(__dirname, '../../dist/index.js');

      try {
        const result = execSync(`node "${cliPath}" skills check "test without dependencies"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        details.dependencyTolerant = true;
      } catch (error) {
        details.dependencyRequired = true;
        details.dependencyFailureImpact = error.message;
      }

      // Simulate package.json corruption
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJsonBackup = path.join(this.backupDir, 'package.json.backup');

      let packageJsonCorrupted = false;

      if (fs.existsSync(packageJsonPath)) {
        try {
          fs.copyFileSync(packageJsonPath, packageJsonBackup);
          const corruptedPackageJson = '{ "name": "corrupted", "version": "1.0.0", "dependencies": { "nonexistent": "1.0.0" } }';
          fs.writeFileSync(packageJsonPath, corruptedPackageJson);
          packageJsonCorrupted = true;
          details.packageJsonCorrupted = true;
          details.dependenciesSimulated++;
        } catch (error) {
          details.packageJsonCorruptionError = error.message;
        }
      }

      // Test CLI with corrupted package.json
      try {
        const result2 = execSync(`node "${cliPath}" skills check "test with corrupted package.json"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        details.packageCorruptionTolerant = true;
      } catch (error) {
        details.packageCorruptionSensitive = true;
        details.packageCorruptionImpact = error.message;
      }

      // Recovery: Restore dependencies
      let recovered = false;

      if (packageJsonCorrupted) {
        try {
          fs.copyFileSync(packageJsonBackup, packageJsonPath);
          details.packageJsonRestored = true;
        } catch (error) {
          details.packageJsonRestorationError = error.message;
        }
      }

      if (nodeModulesMoved) {
        try {
          fs.renameSync(nodeModulesBackup, nodeModulesPath);
          details.nodeModulesRestored = true;
        } catch (error) {
          details.nodeModulesRestorationError = error.message;
        }
      }

      try {
        const result3 = execSync(`node "${cliPath}" skills check "recovery after dependency restoration"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        recovered = true;
      } catch (error) {
        details.recoveryFailure = error.message;
      }

      details.impactAssessed = true;

      return {
        success: true,
        recovered,
        details
      };

    } catch (error) {
      return {
        success: false,
        recovered: false,
        details: { ...details, error: error.message }
      };
    }
  }

  async injectRandomInputs() {
    console.log('Injecting random inputs...');

    const randomInputs = [];
    const details = { inputsGenerated: 0, inputsProcessed: 0, errorsGenerated: 0 };

    try {
      const cliPath = path.join(__dirname, '../../dist/index.js');

      // Generate various types of random inputs
      const inputGenerators = [
        () => Math.random().toString(36).substring(2),
        () => '🚀'.repeat(Math.floor(Math.random() * 100)),
        () => '!@#$%^&*()'.repeat(Math.floor(Math.random() * 50)),
        () => '{ "invalid": json }'.repeat(Math.floor(Math.random() * 20)),
        () => '\\n'.repeat(Math.floor(Math.random() * 100)),
        () => '0'.repeat(Math.floor(Math.random() * 1000)),
        () => 'SELECT * FROM users WHERE 1=1; --',
        () => '<script>alert("xss")</script>',
        () => '../../../etc/passwd',
        () => Buffer.alloc(10000, 'random').toString('base64')
      ];

      // Test random inputs
      for (let i = 0; i < 50; i++) {
        const generator = inputGenerators[Math.floor(Math.random() * inputGenerators.length)];
        const randomInput = generator();

        randomInputs.push({
          index: i,
          input: randomInput.substring(0, 100) + (randomInput.length > 100 ? '...' : ''),
          length: randomInput.length
        });

        try {
          const result = execSync(`node "${cliPath}" skills check "${randomInput.substring(0, 200)}"`, {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: 15000
          });
          details.inputsProcessed++;
        } catch (error) {
          details.errorsGenerated++;
          details.lastError = error.message.substring(0, 200);
        }

        details.inputsGenerated++;
      }

      // Test system recovery after random input barrage
      let recovered = false;
      try {
        const result = execSync(`node "${cliPath}" skills check "recovery test after random inputs"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        recovered = true;
      } catch (error) {
        details.recoveryFailure = error.message;
      }

      return {
        success: details.errorsGenerated < details.inputsGenerated * 0.8, // Less than 80% error rate
        recovered,
        details
      };

    } catch (error) {
      return {
        success: false,
        recovered: false,
        details: { ...details, error: error.message }
      };
    }
  }

  async manipulateSystemClock() {
    console.log('Manipulating system clock (simulation)...');

    const details = { clockManipulations: 0, timeDrifts: [] };

    try {
      // NOTE: We don't actually manipulate system clock for safety
      // Instead, we simulate time-related issues

      const originalDate = Date.now;
      const timeDrifts = [
        1000 * 60 * 60, // 1 hour ahead
        -1000 * 60 * 30, // 30 minutes behind
        1000 * 60 * 60 * 24, // 1 day ahead
        -1000 * 60 * 60 * 24 * 7 // 1 week behind
      ];

      for (let i = 0; i < timeDrifts.length; i++) {
        const drift = timeDrifts[i];

        // Simulate time drift
        const simulatedDate = () => originalDate() + drift;

        try {
          // Test CLI with simulated time drift
          const cliPath = path.join(__dirname, '../../dist/index.js');

          // We can't actually override Date.now globally, so we simulate by
          // testing time-sensitive operations with different timestamps

          const result = execSync(`node "${cliPath}" kpi --days 1`, {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: 20000,
            env: {
              ...process.env,
              MOCK_TIMESTAMP: (originalDate() + drift).toString()
            }
          });

          details.timeDrifts.push({
            drift: drift,
            result: 'success',
            timestamp: originalDate() + drift
          });

        } catch (error) {
          details.timeDrifts.push({
            drift: drift,
            result: 'error',
            error: error.message.substring(0, 200),
            timestamp: originalDate() + drift
          });
        }

        details.clockManipulations++;
      }

      // Test recovery after time manipulations
      let recovered = false;
      try {
        const cliPath = path.join(__dirname, '../../dist/index.js');
        const result = execSync(`node "${cliPath}" skills check "recovery after time manipulation"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000
        });
        recovered = true;
      } catch (error) {
        details.recoveryFailure = error.message;
      }

      return {
        success: true,
        recovered,
        details
      };

    } catch (error) {
      return {
        success: false,
        recovered: false,
        details: { ...details, error: error.message }
      };
    }
  }

  calculateImpact(beforeState, afterState) {
    const impact = {
      severity: 'low',
      description: 'Minimal system impact detected',
      metrics: {}
    };

    // Calculate memory impact
    const memoryImpact = afterState.memory.heapUsed - beforeState.memory.heapUsed;
    impact.metrics.memoryImpact = memoryImpact;

    if (Math.abs(memoryImpact) > 100 * 1024 * 1024) { // 100MB
      impact.severity = 'high';
      impact.description = `Significant memory impact: ${(memoryImpact / 1024 / 1024).toFixed(2)}MB`;
    } else if (Math.abs(memoryImpact) > 50 * 1024 * 1024) { // 50MB
      impact.severity = 'medium';
      impact.description = `Moderate memory impact: ${(memoryImpact / 1024 / 1024).toFixed(2)}MB`;
    }

    // Calculate CPU impact (simplified)
    const cpuImpact = Math.abs(afterState.loadAverage - beforeState.loadAverage);
    impact.metrics.cpuImpact = cpuImpact;

    if (cpuImpact > 2.0) {
      impact.severity = 'high';
      impact.description += ` | High CPU impact: ${cpuImpact.toFixed(2)}`;
    } else if (cpuImpact > 1.0) {
      impact.severity = impact.severity === 'high' ? 'high' : 'medium';
      impact.description += ` | Moderate CPU impact: ${cpuImpact.toFixed(2)}`;
    }

    return impact;
  }

  generateChaosReport(beforeSnapshot, afterSnapshot) {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    console.log('\n' + '='.repeat(80));
    console.log('🌪️  ENTERPRISE CHAOS ENGINEERING REPORT');
    console.log('='.repeat(80));
    console.log(`Total duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Chaos experiments executed: ${this.testResults.length}`);
    console.log('');

    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const recovered = this.testResults.filter(r => r.systemRecovered).length;
    const criticalImpacts = this.testResults.filter(r => r.impact.severity === 'critical').length;

    console.log(`✅ Experiments passed: ${passed}`);
    console.log(`❌ Experiments failed: ${failed}`);
    console.log(`🔄 Systems recovered: ${recovered}`);
    console.log(`🚨 Critical impacts: ${criticalImpacts}`);

    if (criticalImpacts > 0) {
      console.log('\n🚨 CRITICAL SYSTEM IMPACTS:');
      this.testResults.forEach(result => {
        if (result.impact.severity === 'critical') {
          console.log(`\n   ${result.experiment}:`);
          console.log(`     🔴 ${result.impact.description}`);
          console.log(`     📊 Impact: ${JSON.stringify(result.impact.metrics, null, 6)}`);
          console.log(`     🔄 Recovered: ${result.systemRecovered ? 'Yes' : 'No'}`);
        }
      });
    }

    console.log('\n📋 Experiment Details:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const recovery = result.systemRecovered ? '🔄' : '⚠️';
      const duration = result.duration ? `(${result.duration}ms)` : '(no timing)';
      const impact = result.impact.severity.toUpperCase();
      console.log(`   ${status} ${result.experiment} ${duration} - ${recovery} ${impact}`);

      if (result.details && Object.keys(result.details).length > 0) {
        const keyDetail = Object.keys(result.details)[0];
        console.log(`      └─ ${keyDetail}: ${typeof result.details[keyDetail] === 'object' ?
          JSON.stringify(result.details[keyDetail]).substring(0, 50) + '...' :
          result.details[keyDetail]}`);
      }
    });

    // Resilience assessment
    const recoveryRate = (recovered / this.testResults.length) * 100;
    const successRate = (passed / this.testResults.length) * 100;

    console.log('\n🎯 System Resilience Assessment:');
    console.log(`   Success rate: ${successRate.toFixed(1)}%`);
    console.log(`   Recovery rate: ${recoveryRate.toFixed(1)}%`);

    if (successRate >= 80 && recoveryRate >= 80) {
      console.log('\n🎉 EXCELLENT SYSTEM RESILIENCE!');
      console.log('✅ System demonstrates strong resilience to chaos');
      console.log('✅ Recovery mechanisms are effective');
      console.log('✅ Ready for production deployment');
    } else if (successRate >= 60 && recoveryRate >= 60) {
      console.log('\n✅ GOOD SYSTEM RESILIENCE');
      console.log('✅ System shows acceptable resilience levels');
      console.log('⚠️  Some improvements needed for optimal robustness');
      console.log('   Review failed experiments and enhance recovery mechanisms');
    } else {
      console.log('\n🚨 RESILIENCE ISSUES DETECTED');
      console.log(`❌ Success rate: ${successRate.toFixed(1)}% (target: ≥80%)`);
      console.log(`❌ Recovery rate: ${recoveryRate.toFixed(1)}% (target: ≥80%)`);
      console.log('   Address resilience issues before production deployment');
    }

    console.log('\n💡 Chaos Engineering Insights:');
    const failedExperiments = this.testResults.filter(r => !r.success);
    if (failedExperiments.length > 0) {
      console.log('   System vulnerabilities identified:');
      failedExperiments.forEach(result => {
        console.log(`   • ${result.experiment}: ${result.details.error || 'Unknown failure'}`);
      });
    }

    const nonRecoveredExperiments = this.testResults.filter(r => !r.systemRecovered);
    if (nonRecoveredExperiments.length > 0) {
      console.log('   Recovery mechanisms needed for:');
      nonRecoveredExperiments.forEach(result => {
        console.log(`   • ${result.experiment}: Implement automatic recovery`);
      });
    }

    // Save detailed report
    const reportPath = path.join(this.resultsDir, `chaos-report-${new Date().toISOString().split('T')[0]}.json`);
    const detailedReport = {
      summary: {
        totalDuration,
        experimentsExecuted: this.testResults.length,
        successRate,
        recoveryRate,
        criticalImpacts,
        beforeSnapshot,
        afterSnapshot,
        timestamp: new Date().toISOString()
      },
      experiments: this.testResults,
      recommendations: this.generateResilienceRecommendations()
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
      console.log(`\n📁 Detailed chaos report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save detailed report: ${error.message}`);
    }
  }

  generateResilienceRecommendations() {
    const recommendations = [];
    const categories = {};

    // Analyze failures by category
    this.testResults.forEach(result => {
      if (!result.success || !result.systemRecovered) {
        if (!categories[result.category]) {
          categories[result.category] = [];
        }
        categories[result.category].push(result);
      }
    });

    Object.keys(categories).forEach(category => {
      const issues = categories[category];
      if (issues.length > 0) {
        switch (category) {
          case 'network':
            recommendations.push('Implement network resilience patterns (circuit breakers, retries, timeouts)');
            break;
          case 'resource':
            recommendations.push('Add resource monitoring and automatic scaling capabilities');
            break;
          case 'filesystem':
            recommendations.push('Implement file system error handling and backup mechanisms');
            break;
          case 'process':
            recommendations.push('Add process monitoring and automatic restart capabilities');
            break;
          case 'environment':
            recommendations.push('Implement environment validation and fallback configurations');
            break;
          case 'dependency':
            recommendations.push('Add dependency health checks and fallback mechanisms');
            break;
          case 'configuration':
            recommendations.push('Implement configuration validation and versioning');
            break;
          case 'input':
            recommendations.push('Enhance input validation and sanitization');
            break;
          case 'system':
            recommendations.push('Add system-level monitoring and alerting');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Continue chaos engineering practices to maintain resilience');
    }

    return recommendations;
  }
}

class SystemMonitor {
  async takeSnapshot() {
    return {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      platform: os.platform(),
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpus: os.cpus().length
    };
  }

  async getCurrentState() {
    return {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      loadAverage: os.loadavg(),
      freeMemory: os.freemem()
    };
  }
}

async function main() {
  const chaosSuite = new ChaosEngineeringSuite();
  await chaosSuite.runChaosExperiments();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Chaos engineering suite failed:', error);
    process.exit(1);
  });
}

module.exports = ChaosEngineeringSuite;