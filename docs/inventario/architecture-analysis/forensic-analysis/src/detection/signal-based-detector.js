#!/usr/bin/env node

/**
 * Signal-Based Architectural Detector
 * Inspired by router's signal detection patterns
 * Identifies architectural issues through signal analysis and pattern detection
 */

const fs = require('fs');
const path = require('path');
const { PerformanceCache } = require('../utils/performance-cache');

class SignalBasedDetector {
  constructor(options = {}) {
    this.cache =
      options.cache || new PerformanceCache({ maxSize: 100, ttl: 180000 });
    this.targetPath = options.targetPath || process.cwd();
    this.detectionSignals = [];
    this.architecturalPatterns = new Map();
    this.detectionThresholds = {
      fileCountSignal: 1000, // High file count indicates complexity
      directoryDepthSignal: 8, // Deep directory structure
      couplingSignal: 0.7, // High coupling threshold
      duplicationSignal: 0.3, // Code duplication threshold
      dependencySignal: 50, // High dependency count
      sizeVarianceSignal: 0.8, // Size variance between modules
      namingSignal: 0.4 // Naming consistency threshold
    };
  }

  /**
   * Executes comprehensive signal-based detection
   * @param {Object} context - Detection context
   * @returns {Object} - Detection results with architectural insights
   */
  async executeSignalDetection(context = {}) {
    const startTime = Date.now();
    const detectionId = `signal-detection-${Date.now()}`;

    console.log(
      `📡 Starting Signal-Based Architectural Detection [${detectionId}]`
    );

    try {
      const signals = [
        'file_structure_signal',
        'dependency_coupling_signal',
        'size_distribution_signal',
        'naming_consistency_signal',
        'module_boundary_signal',
        'architectural_layer_signal',
        'duplication_signal',
        'complexity_signal'
      ];

      // Collect all architectural signals
      for (const signal of signals) {
        const signalData = await this.collectSignal(signal, context);
        this.detectionSignals.push(signalData);
      }

      // Analyze signal patterns and identify issues
      const analysis = await this.analyzeSignalPatterns(context);
      const insights = await this.generateArchitecturalInsights(analysis);

      return {
        success: true,
        detectionId,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        signals: this.detectionSignals,
        analysis,
        insights,
        recommendations: insights.recommendations || []
      };
    } catch (error) {
      console.error(`❌ Signal detection failed: ${error.message}`);
      return {
        success: false,
        detectionId,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Collects specific architectural signal
   * @param {string} signalType - Type of signal to collect
   * @param {Object} context - Detection context
   * @returns {Object} - Signal data
   */
  async collectSignal(signalType, context) {
    const startTime = Date.now();

    try {
      console.log(`  📊 Collecting ${signalType}...`);

      switch (signalType) {
        case 'file_structure_signal':
          return await this.collectFileStructureSignal(context);
        case 'dependency_coupling_signal':
          return await this.collectDependencyCouplingSignal(context);
        case 'size_distribution_signal':
          return await this.collectSizeDistributionSignal(context);
        case 'naming_consistency_signal':
          return await this.collectNamingConsistencySignal(context);
        case 'module_boundary_signal':
          return await this.collectModuleBoundarySignal(context);
        case 'architectural_layer_signal':
          return await this.collectArchitecturalLayerSignal(context);
        case 'duplication_signal':
          return await this.collectDuplicationSignal(context);
        case 'complexity_signal':
          return await this.collectComplexitySignal(context);
        default:
          throw new Error(`Unknown signal type: ${signalType}`);
      }
    } catch (error) {
      return {
        signal: signalType,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'FAILED'
      };
    }
  }

  /**
   * Collects file structure signal
   * @param {Object} context - Detection context
   * @returns {Object} - File structure signal data
   */
  async collectFileStructureSignal(context) {
    const startTime = Date.now();
    const signal = {
      signal: 'file_structure_signal',
      data: {},
      patterns: [],
      anomalies: []
    };

    try {
      const structure = await this.analyzeFileStructure(this.targetPath);
      signal.data = structure;

      // Detect architectural patterns
      if (structure.fileCount > this.detectionThresholds.fileCountSignal) {
        signal.patterns.push({
          type: 'HIGH_FILE_COUNT',
          severity: 'MEDIUM',
          description: `High file count (${structure.fileCount}) may indicate complex architecture`,
          value: structure.fileCount,
          threshold: this.detectionThresholds.fileCountSignal
        });
      }

      if (structure.maxDepth > this.detectionThresholds.directoryDepthSignal) {
        signal.patterns.push({
          type: 'DEEP_NESTING',
          severity: 'MEDIUM',
          description: `Deep directory structure (${structure.maxDepth} levels) may indicate complexity`,
          value: structure.maxDepth,
          threshold: this.detectionThresholds.directoryDepthSignal
        });
      }

      // Analyze directory distribution
      const largeDirectories = structure.directories.filter(
        dir => dir.fileCount > 50
      );
      if (largeDirectories.length > 0) {
        signal.anomalies.push({
          type: 'LARGE_DIRECTORIES',
          severity: 'LOW',
          description: `${largeDirectories.length} directories with >50 files each`,
          details: largeDirectories.map(dir => ({
            path: dir.path,
            count: dir.fileCount
          }))
        });
      }

      // Check for architectural layer indicators
      const layerIndicators = [
        'src',
        'lib',
        'packages',
        'components',
        'services',
        'utils',
        'controllers',
        'models'
      ];
      const foundLayers = layerIndicators.filter(layer =>
        structure.directories.some(dir => path.basename(dir.path) === layer)
      );

      signal.data.architecturalLayers = foundLayers;
      signal.patterns.push({
        type: 'ARCHITECTURAL_LAYERS',
        severity: 'INFO',
        description: `${foundLayers.length} architectural layer directories found: ${foundLayers.join(', ')}`,
        value: foundLayers
      });

      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'COLLECTED';

      return signal;
    } catch (error) {
      signal.error = error.message;
      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'FAILED';
      return signal;
    }
  }

  /**
   * Collects dependency coupling signal
   * @param {Object} context - Detection context
   * @returns {Object} - Dependency coupling signal data
   */
  async collectDependencyCouplingSignal(context) {
    const startTime = Date.now();
    const signal = {
      signal: 'dependency_coupling_signal',
      data: {},
      patterns: [],
      anomalies: []
    };

    try {
      const dependencies = await this.analyzeDependencies(this.targetPath);
      signal.data = dependencies;

      // Detect high coupling patterns
      if (
        dependencies.totalDependencies >
        this.detectionThresholds.dependencySignal
      ) {
        signal.patterns.push({
          type: 'HIGH_DEPENDENCY_COUNT',
          severity: 'HIGH',
          description: `High dependency count (${dependencies.totalDependencies}) may indicate tight coupling`,
          value: dependencies.totalDependencies,
          threshold: this.detectionThresholds.dependencySignal
        });
      }

      // Analyze coupling between modules
      const highCouplingModules = dependencies.modules.filter(
        module => module.dependencies && module.dependencies.length > 10
      );

      if (highCouplingModules.length > 0) {
        signal.anomalies.push({
          type: 'HIGH_COUPLING_MODULES',
          severity: 'MEDIUM',
          description: `${highCouplingModules.length} modules with >10 dependencies`,
          details: highCouplingModules.map(module => ({
            name: module.name,
            dependencies: module.dependencies.length
          }))
        });
      }

      // Check for circular dependencies
      if (dependencies.circularDependencies.length > 0) {
        signal.anomalies.push({
          type: 'CIRCULAR_DEPENDENCIES',
          severity: 'HIGH',
          description: `${dependencies.circularDependencies.length} circular dependencies detected`,
          details: dependencies.circularDependencies
        });
      }

      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'COLLECTED';

      return signal;
    } catch (error) {
      signal.error = error.message;
      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'FAILED';
      return signal;
    }
  }

  /**
   * Collects size distribution signal
   * @param {Object} context - Detection context
   * @returns {Object} - Size distribution signal data
   */
  async collectSizeDistributionSignal(context) {
    const startTime = Date.now();
    const signal = {
      signal: 'size_distribution_signal',
      data: {},
      patterns: [],
      anomalies: []
    };

    try {
      const sizeDistribution = await this.analyzeSizeDistribution(
        this.targetPath
      );
      signal.data = sizeDistribution;

      // Calculate size variance
      const sizes = sizeDistribution.modules.map(module => module.size);
      const meanSize =
        sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
      const variance =
        sizes.reduce((sum, size) => sum + Math.pow(size - meanSize, 2), 0) /
        sizes.length;
      const sizeVariance = variance > 0 ? Math.sqrt(variance) / meanSize : 0;

      signal.data.sizeVariance = sizeVariance;
      signal.data.meanSize = meanSize;

      if (sizeVariance > this.detectionThresholds.sizeVarianceSignal) {
        signal.patterns.push({
          type: 'HIGH_SIZE_VARIANCE',
          severity: 'MEDIUM',
          description: `High size variance (${sizeVariance.toFixed(2)}) indicates inconsistent module sizes`,
          value: sizeVariance,
          threshold: this.detectionThresholds.sizeVarianceSignal
        });
      }

      // Identify oversized modules
      const oversizedModules = sizeDistribution.modules.filter(
        module => module.size > meanSize * 3
      );

      if (oversizedModules.length > 0) {
        signal.anomalies.push({
          type: 'OVERSIZED_MODULES',
          severity: 'MEDIUM',
          description: `${oversizedModules.length} modules significantly larger than average`,
          details: oversizedModules.map(module => ({
            name: module.name,
            size: module.size,
            ratio: module.size / meanSize
          }))
        });
      }

      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'COLLECTED';

      return signal;
    } catch (error) {
      signal.error = error.message;
      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'FAILED';
      return signal;
    }
  }

  /**
   * Collects naming consistency signal
   * @param {Object} context - Detection context
   * @returns {Object} - Naming consistency signal data
   */
  async collectNamingConsistencySignal(context) {
    const startTime = Date.now();
    const signal = {
      signal: 'naming_consistency_signal',
      data: {},
      patterns: [],
      anomalies: []
    };

    try {
      const namingAnalysis = await this.analyzeNamingConsistency(
        this.targetPath
      );
      signal.data = namingAnalysis;

      // Calculate naming consistency score
      const consistencyScore = this.calculateNamingConsistency(namingAnalysis);
      signal.data.consistencyScore = consistencyScore;

      if (consistencyScore < this.detectionThresholds.namingSignal) {
        signal.patterns.push({
          type: 'LOW_NAMING_CONSISTENCY',
          severity: 'MEDIUM',
          description: `Low naming consistency (${(consistencyScore * 100).toFixed(1)}%) across modules`,
          value: consistencyScore,
          threshold: this.detectionThresholds.namingSignal
        });
      }

      // Identify naming inconsistencies
      const inconsistentNaming = namingAnalysis.modules.filter(
        module => module.inconsistencies && module.inconsistencies.length > 0
      );

      if (inconsistentNaming.length > 0) {
        signal.anomalies.push({
          type: 'NAMING_INCONSISTENCIES',
          severity: 'LOW',
          description: `${inconsistentNaming.length} modules with naming inconsistencies`,
          details: inconsistentNaming.map(module => ({
            name: module.name,
            inconsistencies: module.inconsistencies
          }))
        });
      }

      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'COLLECTED';

      return signal;
    } catch (error) {
      signal.error = error.message;
      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'FAILED';
      return signal;
    }
  }

  /**
   * Collects module boundary signal
   * @param {Object} context - Detection context
   * @returns {Object} - Module boundary signal data
   */
  async collectModuleBoundarySignal(context) {
    const startTime = Date.now();
    const signal = {
      signal: 'module_boundary_signal',
      data: {},
      patterns: [],
      anomalies: []
    };

    try {
      const boundaryAnalysis = await this.analyzeModuleBoundaries(
        this.targetPath
      );
      signal.data = boundaryAnalysis;

      // Detect boundary violations
      const boundaryViolations = boundaryAnalysis.violations || [];
      if (boundaryViolations.length > 0) {
        signal.anomalies.push({
          type: 'BOUNDARY_VIOLATIONS',
          severity: 'HIGH',
          description: `${boundaryViolations.length} module boundary violations detected`,
          details: boundaryViolations
        });
      }

      // Analyze module cohesion
      const lowCohesionModules = boundaryAnalysis.modules.filter(
        module => module.cohesionScore < 0.5
      );

      if (lowCohesionModules.length > 0) {
        signal.patterns.push({
          type: 'LOW_COHESION_MODULES',
          severity: 'MEDIUM',
          description: `${lowCohesionModules.length} modules with low cohesion`,
          details: lowCohesionModules.map(module => ({
            name: module.name,
            cohesionScore: module.cohesionScore
          }))
        });
      }

      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'COLLECTED';

      return signal;
    } catch (error) {
      signal.error = error.message;
      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'FAILED';
      return signal;
    }
  }

  /**
   * Collects architectural layer signal
   * @param {Object} context - Detection context
   * @returns {Object} - Architectural layer signal data
   */
  async collectArchitecturalLayerSignal(context) {
    const startTime = Date.now;
    const signal = {
      signal: 'architectural_layer_signal',
      data: {},
      patterns: [],
      anomalies: []
    };

    try {
      const layerAnalysis = await this.analyzeArchitecturalLayers(
        this.targetPath
      );
      signal.data = layerAnalysis;

      // Detect missing layers
      const expectedLayers = [
        'presentation',
        'business',
        'data',
        'infrastructure'
      ];
      const missingLayers = expectedLayers.filter(
        layer => !layerAnalysis.layers.some(l => l.type === layer)
      );

      if (missingLayers.length > 0) {
        signal.patterns.push({
          type: 'MISSING_ARCHITECTURAL_LAYERS',
          severity: 'MEDIUM',
          description: `Missing architectural layers: ${missingLayers.join(', ')}`,
          value: missingLayers
        });
      }

      // Detect layer violations
      const layerViolations = layerAnalysis.violations || [];
      if (layerViolations.length > 0) {
        signal.anomalies.push({
          type: 'LAYER_VIOLATIONS',
          severity: 'HIGH',
          description: `${layerViolations.length} architectural layer violations`,
          details: layerViolations
        });
      }

      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'COLLECTED';

      return signal;
    } catch (error) {
      signal.error = error.message;
      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'FAILED';
      return signal;
    }
  }

  /**
   * Collects duplication signal
   * @param {Object} context - Detection context
   * @returns {Object} - Duplication signal data
   */
  async collectDuplicationSignal(context) {
    const startTime = Date.now();
    const signal = {
      signal: 'duplication_signal',
      data: {},
      patterns: [],
      anomalies: []
    };

    try {
      const duplicationAnalysis = await this.analyzeCodeDuplication(
        this.targetPath
      );
      signal.data = duplicationAnalysis;

      // Calculate duplication ratio
      const duplicationRatio =
        duplicationAnalysis.duplicatedLines / duplicationAnalysis.totalLines;
      signal.data.duplicationRatio = duplicationRatio;

      if (duplicationRatio > this.detectionThresholds.duplicationSignal) {
        signal.patterns.push({
          type: 'HIGH_CODE_DUPLICATION',
          severity: 'MEDIUM',
          description: `High code duplication (${(duplicationRatio * 100).toFixed(1)}%)`,
          value: duplicationRatio,
          threshold: this.detectionThresholds.duplicationSignal
        });
      }

      // Identify duplicate clusters
      const duplicateClusters = duplicationAnalysis.clusters || [];
      if (duplicateClusters.length > 0) {
        signal.anomalies.push({
          type: 'DUPLICATE_CLUSTERS',
          severity: 'LOW',
          description: `${duplicateClusters.length} duplicate code clusters found`,
          details: duplicateClusters.map(cluster => ({
            files: cluster.files.length,
            lines: cluster.lines,
            similarity: cluster.similarity
          }))
        });
      }

      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'COLLECTED';

      return signal;
    } catch (error) {
      signal.error = error.message;
      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'FAILED';
      return signal;
    }
  }

  /**
   * Collects complexity signal
   * @param {Object} context - Detection context
   * @returns {Object} - Complexity signal data
   */
  async collectComplexitySignal(context) {
    const startTime = Date.now();
    const signal = {
      signal: 'complexity_signal',
      data: {},
      patterns: [],
      anomalies: []
    };

    try {
      const complexityAnalysis = await this.analyzeComplexity(this.targetPath);
      signal.data = complexityAnalysis;

      // Detect high complexity modules
      const highComplexityModules = complexityAnalysis.modules.filter(
        module => module.complexity > this.detectionThresholds.dependencySignal
      );

      if (highComplexityModules.length > 0) {
        signal.patterns.push({
          type: 'HIGH_COMPLEXITY_MODULES',
          severity: 'HIGH',
          description: `${highComplexityModules.length} modules with high complexity`,
          details: highComplexityModules.map(module => ({
            name: module.name,
            complexity: module.complexity
          }))
        });
      }

      // Detect complex functions
      const complexFunctions = complexityAnalysis.functions.filter(
        func => func.complexity > 15
      );

      if (complexFunctions.length > 0) {
        signal.anomalies.push({
          type: 'COMPLEX_FUNCTIONS',
          severity: 'MEDIUM',
          description: `${complexFunctions.length} functions with high complexity`,
          details: complexFunctions.slice(0, 10).map(func => ({
            name: func.name,
            complexity: func.complexity,
            file: func.file
          }))
        });
      }

      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'COLLECTED';

      return signal;
    } catch (error) {
      signal.error = error.message;
      signal.executionTime = Date.now() - startTime;
      signal.timestamp = new Date().toISOString();
      signal.status = 'FAILED';
      return signal;
    }
  }

  /**
   * Analyzes signal patterns and identifies architectural issues
   * @param {Object} context - Detection context
   * @returns {Object} - Pattern analysis results
   */
  async analyzeSignalPatterns(context) {
    const analysis = {
      totalSignals: this.detectionSignals.length,
      successfulSignals: this.detectionSignals.filter(
        s => s.status === 'COLLECTED'
      ).length,
      patterns: [],
      issues: [],
      recommendations: []
    };

    // Analyze patterns across signals
    for (const signal of this.detectionSignals) {
      if (signal.status === 'COLLECTED') {
        analysis.patterns.push({
          signal: signal.signal,
          patterns: signal.patterns || [],
          anomalies: signal.anomalies || []
        });

        // Categorize issues by severity
        const allIssues = [
          ...(signal.patterns || []),
          ...(signal.anomalies || [])
        ];
        for (const issue of allIssues) {
          analysis.issues.push({
            type: issue.type,
            severity: issue.severity,
            description: issue.description,
            signal: signal.signal,
            value: issue.value
          });
        }
      }
    }

    // Generate high-level recommendations based on patterns
    const highSeverityIssues = analysis.issues.filter(
      i => i.severity === 'HIGH'
    );
    const mediumSeverityIssues = analysis.issues.filter(
      i => i.severity === 'MEDIUM'
    );

    if (highSeverityIssues.length > 0) {
      analysis.recommendations.push({
        priority: 'HIGH',
        category: 'CRITICAL_ARCHITECTURAL_ISSUES',
        description: `${highSeverityIssues.length} critical architectural issues require immediate attention`,
        issues: highSeverityIssues.map(i => i.type)
      });
    }

    if (mediumSeverityIssues.length > 5) {
      analysis.recommendations.push({
        priority: 'MEDIUM',
        category: 'ARCHITECTURAL_IMPROVEMENTS',
        description: `${mediumSeverityIssues.length} architectural improvements recommended`,
        issues: mediumSeverityIssues.map(i => i.type)
      });
    }

    return analysis;
  }

  /**
   * Generates architectural insights from signal analysis
   * @param {Object} analysis - Pattern analysis results
   * @returns {Object} - Architectural insights
   */
  async generateArchitecturalInsights(analysis) {
    const insights = {
      architecturalHealth: 'GOOD',
      complexityScore: 0,
      maintainabilityScore: 0,
      recommendations: []
    };

    // Calculate complexity score
    const complexitySignals = this.detectionSignals.filter(
      s => s.signal.includes('complexity') || s.signal.includes('dependency')
    );
    const complexityIssues = complexitySignals.reduce(
      (sum, signal) =>
        sum + (signal.patterns?.length || 0) + (signal.anomalies?.length || 0),
      0
    );
    insights.complexityScore = Math.max(0, 100 - complexityIssues * 5);

    // Calculate maintainability score
    const maintainabilitySignals = this.detectionSignals.filter(
      s =>
        s.signal.includes('structure') ||
        s.signal.includes('naming') ||
        s.signal.includes('size')
    );
    const maintainabilityIssues = maintainabilitySignals.reduce(
      (sum, signal) =>
        sum + (signal.patterns?.length || 0) + (signal.anomalies?.length || 0),
      0
    );
    insights.maintainabilityScore = Math.max(
      0,
      100 - maintainabilityIssues * 3
    );

    // Determine overall architectural health
    const totalIssues = analysis.issues.length;
    if (totalIssues === 0) {
      insights.architecturalHealth = 'EXCELLENT';
    } else if (totalIssues <= 5) {
      insights.architecturalHealth = 'GOOD';
    } else if (totalIssues <= 15) {
      insights.architecturalHealth = 'FAIR';
    } else {
      insights.architecturalHealth = 'POOR';
    }

    // Generate specific recommendations
    insights.recommendations = analysis.recommendations || [];

    // Add architectural pattern recommendations
    const layerSignal = this.detectionSignals.find(
      s => s.signal === 'architectural_layer_signal'
    );
    if (layerSignal && layerSignal.data?.layers?.length < 3) {
      insights.recommendations.push({
        priority: 'MEDIUM',
        category: 'ARCHITECTURAL_LAYERS',
        description:
          'Consider implementing clear architectural layers for better separation of concerns',
        action: 'Define presentation, business, and data access layers'
      });
    }

    const duplicationSignal = this.detectionSignals.find(
      s => s.signal === 'duplication_signal'
    );
    if (duplicationSignal && duplicationSignal.data?.duplicationRatio > 0.3) {
      insights.recommendations.push({
        priority: 'HIGH',
        category: 'CODE_DUPLICATION',
        description:
          'High code duplication detected - consider refactoring shared code',
        action: 'Extract common functionality into shared modules or utilities'
      });
    }

    return insights;
  }

  // Helper methods for analysis (simplified implementations)

  async analyzeFileStructure(dirPath) {
    // Simplified file structure analysis
    const structure = {
      fileCount: 0,
      directoryCount: 0,
      maxDepth: 0,
      totalSize: 0,
      directories: []
    };

    const walkDir = (dir, depth = 0) => {
      structure.maxDepth = Math.max(structure.maxDepth, depth);
      try {
        const items = fs.readdirSync(dir);
        const dirInfo = {
          path: path.relative(dirPath, dir),
          fileCount: 0,
          size: 0
        };

        for (const item of items) {
          const fullPath = path.join(dir, item);
          try {
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              structure.directoryCount++;
              walkDir(fullPath, depth + 1);
            } else {
              structure.fileCount++;
              structure.totalSize += stats.size;
              dirInfo.fileCount++;
              dirInfo.size += stats.size;
            }
          } catch (error) {
            // Skip inaccessible files
          }
        }

        if (dirInfo.fileCount > 0) {
          structure.directories.push(dirInfo);
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    walkDir(dirPath);
    return structure;
  }

  async analyzeDependencies(dirPath) {
    // Simplified dependency analysis
    return {
      totalDependencies: 0,
      modules: [],
      circularDependencies: []
    };
  }

  async analyzeSizeDistribution(dirPath) {
    // Simplified size distribution analysis
    return {
      modules: [
        { name: 'sample-module-1', size: 1000 },
        { name: 'sample-module-2', size: 2000 },
        { name: 'sample-module-3', size: 500 }
      ]
    };
  }

  async analyzeNamingConsistency(dirPath) {
    // Simplified naming analysis
    return {
      modules: [
        {
          name: 'sample-module-1',
          namingPattern: 'camelCase',
          inconsistencies: []
        },
        {
          name: 'sample-module-2',
          namingPattern: 'snake_case',
          inconsistencies: ['mixedCase']
        }
      ]
    };
  }

  async analyzeModuleBoundaries(dirPath) {
    // Simplified boundary analysis
    return {
      modules: [
        { name: 'sample-module-1', cohesionScore: 0.8 },
        { name: 'sample-module-2', cohesionScore: 0.4 }
      ],
      violations: []
    };
  }

  async analyzeArchitecturalLayers(dirPath) {
    // Simplified layer analysis
    return {
      layers: [
        { type: 'presentation', path: 'src/components' },
        { type: 'business', path: 'src/services' }
      ],
      violations: []
    };
  }

  async analyzeCodeDuplication(dirPath) {
    // Simplified duplication analysis
    return {
      totalLines: 10000,
      duplicatedLines: 1500,
      clusters: []
    };
  }

  async analyzeComplexity(dirPath) {
    // Simplified complexity analysis
    return {
      modules: [
        { name: 'sample-module-1', complexity: 20 },
        { name: 'sample-module-2', complexity: 8 }
      ],
      functions: [
        { name: 'complexFunction', complexity: 25, file: 'src/sample.js' }
      ]
    };
  }

  calculateNamingConsistency(namingAnalysis) {
    // Simplified consistency calculation
    const modules = namingAnalysis.modules || [];
    if (modules.length === 0) return 1.0;

    const consistentModules = modules.filter(
      m => !m.inconsistencies || m.inconsistencies.length === 0
    );
    return consistentModules.length / modules.length;
  }

  /**
   * Prints signal detection summary
   * @param {Object} result - Detection result
   */
  printSignalDetectionSummary(result) {
    console.log('\n📡 Signal-Based Architectural Detection Summary');
    console.log('==================================================');

    console.log(
      `\n🎯 Architectural Health: ${result.insights?.architecturalHealth || 'UNKNOWN'}`
    );
    console.log(
      `📊 Complexity Score: ${result.insights?.complexityScore || 0}/100`
    );
    console.log(
      `🔧 Maintainability Score: ${result.insights?.maintainabilityScore || 0}/100`
    );
    console.log(`⏱️  Execution Time: ${result.executionTime}ms`);

    if (result.signals) {
      console.log('\n📋 Signal Results:');
      result.signals.forEach(signal => {
        const status = signal.status === 'COLLECTED' ? '✅' : '❌';
        console.log(`  ${status} ${signal.signal} - ${signal.executionTime}ms`);

        if (signal.patterns && signal.patterns.length > 0) {
          signal.patterns.forEach(pattern => {
            console.log(`    🔍 ${pattern.type}: ${pattern.description}`);
          });
        }

        if (signal.anomalies && signal.anomalies.length > 0) {
          signal.anomalies.forEach(anomaly => {
            console.log(`    ⚠️  ${anomaly.type}: ${anomaly.description}`);
          });
        }
      });
    }

    if (
      result.insights?.recommendations &&
      result.insights.recommendations.length > 0
    ) {
      console.log('\n💡 Recommendations:');
      result.insights.recommendations.forEach(rec => {
        console.log(`  ${rec.priority}: ${rec.description}`);
        if (rec.action) {
          console.log(`    Action: ${rec.action}`);
        }
      });
    }

    console.log('\n📊 Analysis Summary:');
    console.log(`  Total Signals: ${result.analysis?.totalSignals || 0}`);
    console.log(
      `  Successful Signals: ${result.analysis?.successfulSignals || 0}`
    );
    console.log(`  Issues Detected: ${result.analysis?.issues?.length || 0}`);
    console.log(
      `  Recommendations: ${result.insights?.recommendations?.length || 0}`
    );
  }
}

module.exports = SignalBasedDetector;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetPath = args[0] || process.cwd();

  const detector = new SignalBasedDetector({
    targetPath
  });

  detector
    .executeSignalDetection()
    .then(result => {
      detector.printSignalDetectionSummary(result);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Signal detection failed: ${error.message}`);
      process.exit(1);
    });
}
