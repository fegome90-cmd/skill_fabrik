export interface TemporalBiasConfig {
  enabled: boolean;
  timeWindows: {
    short: number;    // ms - immediate pattern (last hour)
    medium: number;  // ms - recent pattern (last day)
    long: number;    // ms - historical pattern (last week)
    very_long: number; // ms - very historical (last month)
  };
  decay: {
    function: 'exponential' | 'linear' | 'logarithmic' | 'sigmoid';
    halfLife: number; // ms - time for value to decay to 50%
    minWeight: number; // minimum weight for very old data
    maxWeight: number; // maximum weight for recent data
  };
  detection: {
    sensitivity: number; // 0..1, higher = more sensitive
    threshold: number; // minimum bias score to flag
    minSampleSize: number; // minimum samples for analysis
    confidenceLevel: number; // 0..1 for statistical significance
  };
  patterns: {
    seasonal: boolean;
    weekly: boolean;
    daily: boolean;
    hourly: boolean;
    userSpecific: boolean;
    contextSpecific: boolean;
  };
  alerting: {
    enabled: boolean;
    channels: ('console' | 'log' | 'webhook')[];
    thresholds: {
      temporal_drift: number; // max allowed temporal drift
      pattern_anomaly: number; // max pattern anomaly score
      bias_trend: number; // max bias trend change
    };
  };
}

export interface BiasDataPoint {
  timestamp: number;
  skillName: string;
  activationScore: number;
  success: boolean;
  duration?: number;
  context: {
    timeOfDay: number; // 0-23
    dayOfWeek: number; // 0-6
    weekOfYear: number;
    monthOfYear: number;
    season: string; // 'spring', 'summer', 'fall', 'winter'
    userContext?: string;
    projectContext?: string;
  };
  metadata: Record<string, any>;
}

export interface BiasDetectionResult {
  skillName: string;
  biasType: 'temporal_drift' | 'seasonal_bias' | 'user_specific' | 'context_bias' | 'pattern_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0..1
  biasScore: number; // 0..1
  description: string;
  evidence: {
    detectedAt: number;
    affectedPeriod: string;
    sampleSize: number;
    statisticalSignificance: number;
    patterns: string[];
    recommendations: string[];
  };
  correctiveActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface TimeSeriesAnalysis {
  skillName: string;
  dataPoints: BiasDataPoint[];
  analysis: {
    overallTrend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    trendSlope: number;
    rSquared: number; // correlation coefficient
    volatility: number;
    seasonality: {
      detected: boolean;
      patterns: SeasonalPattern[];
      strength: number;
    };
    periodicity: {
      detected: boolean;
      patterns: PeriodicPattern[];
      dominantPeriod: number | null;
    };
    userBias: {
      detected: boolean;
      affectedUsers: string[];
      biasStrength: number;
    };
    contextBias: {
      detected: boolean;
      affectedContexts: string[];
      biasStrength: number;
    };
  };
  recommendations: string[];
  timestamp: number;
}

export interface SeasonalPattern {
  period: string; // 'daily', 'weekly', 'monthly', 'yearly'
  strength: number; // 0..1
  phase: number; // 0..2π for phase shift
  amplitude: number; // 0..1
  pattern: string;
}

export interface PeriodicPattern {
  period: number; // ms
  strength: number; // 0..1
  phase: number; // 0..2π
  amplitude: number; // 0..1
  confidence: number; // 0..1
}

export class TemporalBiasDetector {
  private readonly config: TemporalConfig;
  private dataStore: Map<string, BiasDataPoint[]> = new Map();
  private analysisCache: Map<string, TimeSeriesAnalysis> = new Map();
  private lastAnalysis: Map<string, number> = new Map();
  private biasAlerts: BiasDetectionResult[] = [];

  constructor(config?: Partial<TemporalBiasConfig>) {
    this.config = this.mergeConfig(config);
  }

  // Data collection
  addDataPoint(data: BiasDataPoint): void {
    const skillData = this.dataStore.get(data.skillName) || [];
    skillData.push(data);

    // Apply retention policy
    const cutoff = Date.now() - this.config.timeWindows.very_long;
    const filteredData = skillData.filter(point => point.timestamp >= cutoff);
    this.dataStore.set(data.skillName, filteredData);

    // Trigger analysis if enough data accumulated
    if (filteredData.length >= this.config.detection.minSampleSize) {
      this.scheduleAnalysis(data.skillName);
    }
  }

  addDataPoints(dataPoints: BiasDataPoint[]): void {
    for (const point of dataPoints) {
      this.addDataPoint(point);
    }
  }

  // Bias detection analysis
  async detectBiases(skillName: string): Promise<BiasDetectionResult[]> {
    const data = this.dataStore.get(skillName);
    if (!data || data.length < this.config.detection.minSampleSize) {
      return [];
    }

    const analysis = await this.performTimeSeriesAnalysis(skillName, data);
    this.analysisCache.set(skillName, analysis);
    this.lastAnalysis.set(skillName, Date.now());

    const biases: BiasDetectionResult[] = [];

    // Detect different types of biases
    const temporalDrift = this.detectTemporalDrift(analysis);
    if (temporalDrift) biases.push(temporalDrift);

    const seasonalBias = this.detectSeasonalBias(analysis);
    if (seasonalBias) biases.push(seasonalBias);

    const userBias = this.detectUserBias(analysis);
    if (userBias) biases.push(userBias);

    const contextBias = this.detectContextBias(analysis);
    if (contextBias) biases.push(contextBias);

    const patternAnomaly = this.detectPatternAnomaly(analysis);
    if (patternAnomaly) biases.push(patternAnomaly);

    // Store and alert on detected biases
    for (const bias of biases) {
      this.biasAlerts.push(bias);
      this.sendBiasAlert(bias);
    }

    return biases;
  }

  private async performTimeSeriesAnalysis(skillName: string, data: BiasDataPoint[]): Promise<TimeSeriesAnalysis> {
    const now = Date.now();
    const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate time-based features
    const timeFeatures = sortedData.map(point => ({
      ...point,
      timeFromStart: (point.timestamp - sortedData[0].timestamp),
      relativeTime: (point.timestamp - sortedData[0].timestamp) / (sortedData[sortedData.length - 1].timestamp - sortedData[0].timestamp),
      ageInMs: now - point.timestamp
    }));

    // Apply temporal decay weights
    const weightedData = this.applyTemporalDecay(timeFeatures);

    // Detect trends
    const trendAnalysis = this.detectTrend(weightedData);

    // Detect seasonality
    const seasonalityAnalysis = this.detectSeasonality(weightedData);

    // Detect periodicity
    const periodicityAnalysis = this.detectPeriodicity(weightedData);

    // Detect user-specific biases
    const userBiasAnalysis = this.detectUserBiases(weightedData);

    // Detect context-specific biases
    const contextBiasAnalysis = this.detectContextBiases(weightedData);

    const analysis: TimeSeriesAnalysis = {
      skillName,
      dataPoints: sortedData,
      analysis: {
        overallTrend: trendAnalysis.trend,
        trendSlope: trendAnalysis.slope,
        rSquared: trendAnalysis.rSquared,
        volatility: this.calculateVolatility(weightedData),
        seasonality: seasonalityAnalysis,
        periodicity: periodicityAnalysis,
        userBias: userBiasAnalysis,
        contextBias: contextBiasAnalysis
      },
      recommendations: this.generateRecommendations({
        trend: trendAnalysis,
        seasonality: seasonalityAnalysis,
        periodicity: periodicityAnalysis,
        userBias: userBiasAnalysis,
        contextBias: contextBiasAnalysis
      }),
      timestamp: now
    };

    return analysis;
  }

  private applyTemporalDecay(data: Array<BiasDataPoint & { weight: number }>): Array<BiasDataPoint & { weight: number }> {
    return data.map(point => ({
      ...point,
      weight: this.calculateTemporalWeight(point.ageInMs)
    }));
  }

  private calculateTemporalWeight(ageInMs: number): number {
    const { decay } = this.config;
    const { function: decayFunction, halfLife, minWeight, maxWeight } = decay;

    switch (decayFunction) {
      case 'exponential':
        return Math.max(minWeight, maxWeight * Math.pow(0.5, ageInMs / halfLife));

      case 'linear':
        const maxAge = Math.max(...Object.values(this.config.timeWindows));
        return Math.max(minWeight, maxWeight * Math.max(0, 1 - ageInMs / maxAge)));

      case 'logarithmic':
        const logMaxAge = Math.log(Math.max(...Object.values(this.config.timeWindows)));
        return Math.max(minWeight, maxWeight * (1 - Math.log(1 + ageInMs) / (1 + Math.exp(logMaxAge)))));

      case 'sigmoid':
        const sigmoidMaxAge = Math.max(...Object.values(this.config.timeWindows));
        const x = (ageInMs / sigmoidMaxAge) * 10 - 5; // Scale to [-5, 5]
        return Math.max(minWeight, maxWeight / (1 + Math.exp(x)));

      default:
        return 1;
    }
  }

  private detectTrend(weightedData: Array<BiasDataPoint & { weight: number }>): {
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    slope: number;
    rSquared: number;
  } {
    if (weightedData.length < 2) {
      return { trend: 'stable', slope: 0, rSquared: 0 };
    }

    // Weighted linear regression
    let weightedSumX = 0;
    let weightedSumY = 0;
    let weightedSumXY = 0;
    let weightedSumX2 = 0;
    let totalWeight = 0;

    for (let i = 0; i < weightedData.length; i++) {
      const x = i / (weightedData.length - 1); // Normalized time
      const y = weightedData[i].activationScore;
      const weight = weightedData[i].weight;

      weightedSumX += x * weight;
      weightedSumY += y * weight;
      weightedSumXY += x * y * weight;
      weightedSumX2 += x * x * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      return { trend: 'stable', slope: 0, rSquared: 0 };
    }

    const meanX = weightedSumX / totalWeight;
    const meanY = weightedSumY / totalWeight;

    const slope = (weightedSumXY - meanX * weightedSumY) /
                  (weightedSumX2 - meanX * weightedSumX);

    const totalSumSquares = weightedData.reduce((sum, point) => {
      const residual = point.activationScore - (meanY + slope * (point.relativeTime - meanX));
      return sum + residual * residual * point.weight;
    }, 0);

    const totalSumSquaresX = weightedData.reduce((sum, point) => {
      const residual = point.relativeTime - meanX;
      return sum + residual * residual * point.weight;
    }, 0);

    const rSquared = totalSumSquaresX > 0 ? 1 - (totalSumSquares / totalSumSquaresX) : 0;

    // Determine trend based on slope and confidence
    let trend: 'stable';
    if (Math.abs(slope) > 0.1 && rSquared > 0.3) {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    } else if (rSquared < 0.1) {
      trend = 'volatile';
    }

    return { trend, slope, rSquared };
  }

  private detectSeasonality(weightedData: Array<BiasDataPoint & { weight: number }>): {
    detected: boolean;
    patterns: SeasonalPattern[];
    strength: number;
  } {
    const patterns: SeasonalPattern[] = [];

    if (!this.config.patterns.seasonal) {
      return { detected: false, patterns: [], strength: 0 };
    }

    // Detect daily patterns (24-hour cycle)
    const dailyPattern = this.detectPeriodicPattern(weightedData, 24 * 60 * 60 * 1000, 'daily');
    if (dailyPattern) {
      patterns.push({
        period: 'daily',
        strength: dailyPattern.confidence,
        phase: dailyPattern.phase,
        amplitude: dailyPattern.amplitude,
        pattern: `Daily pattern with ${dailyPattern.confidence.toFixed(2)} confidence`
      });
    }

    // Detect weekly patterns (7-day cycle)
    const weeklyPattern = this.detectPeriodicPattern(weightedData, 7 * 24 * 60 * 60 * 1000, 'weekly');
    if (weeklyPattern) {
      patterns.push({
        period: 'weekly',
        strength: weeklyPattern.confidence,
        phase: weeklyPattern.phase,
        amplitude: weeklyPattern.amplitude,
        pattern: `Weekly pattern with ${weeklyPattern.confidence.toFixed(2)} confidence`
      });
    }

    // Detect monthly patterns (30-day cycle)
    const monthlyPattern = this.detectPeriodicPattern(weightedData, 30 * 24 * 60 * 60 * 1000, 'monthly');
    if (monthlyPattern) {
      patterns.push({
        period: 'monthly',
        strength: monthlyPattern.confidence,
        phase: monthlyPattern.phase,
        amplitude: monthlyPattern.amplitude,
        pattern: `Monthly pattern with ${monthlyPattern.confidence.toFixed(2)} confidence`
      });
    }

    const detected = patterns.length > 0;
    const strength = detected ? Math.max(...patterns.map(p => p.strength)) : 0;

    return { detected, patterns, strength };
  }

  private detectPeriodicity(weightedData: Array<BiasDataPoint & { weight: number }>): {
    detected: boolean;
    patterns: PeriodicPattern[];
    dominantPeriod: number | null;
  } {
    const patterns: PeriodicPattern[] = [];
    const periods = [
      60 * 60 * 1000,      // 1 hour
      4 * 60 * 60 * 1000,  // 4 hours
      8 * 60 * 60 * 1000,  // 8 hours
      12 * 60 * 60 * 1000, // 12 hours
      24 * 60 * 60 * 1000, // 1 day
      7 * 24 * 60 * 60 * 1000  // 1 week
    ];

    for (const period of periods) {
      const pattern = this.detectPeriodicPattern(weightedData, period, 'custom');
      if (pattern && pattern.confidence > 0.5) {
        patterns.push({
          period,
          strength: pattern.confidence,
          phase: pattern.phase,
          amplitude: pattern.amplitude,
          confidence: pattern.confidence
        });
      }
    }

    const detected = patterns.length > 0;
    const dominantPeriod = detected ? patterns.reduce((max, current) =>
      current.strength > max.strength ? current : max
    ).period : null;

    return { detected, patterns, dominantPeriod };
  }

  private detectPeriodicPattern(
    data: Array<BiasDataPoint & { weight: number }>,
    period: number,
    name: string
  ): { phase: number; amplitude: number; confidence: number } | null {
    if (data.length < Math.max(3, period / (60 * 1000))) {
      return null;
    }

    // Fast Fourier Transform approximation for periodicity detection
    const samples = Math.floor(period / (60 * 1000)); // Sample every minute
    const step = (data[data.length - 1].timestamp - data[0].timestamp) / samples;

    const realPart: number[] = [];
    const imagPart: number[] = [];

    for (let n = 0; n < samples; n++) {
      const index = Math.floor(n * samples / data.length);
      const point = data[Math.min(index, data.length - 1)];

      const angle = 2 * Math.PI * n / samples;
      realPart.push(point.activationScore * point.weight * Math.cos(angle));
      imagPart.push(point.activationScore * point.weight * Math.sin(angle));
    }

    // Calculate amplitude and phase
    const amplitude = Math.sqrt(
      Math.pow(realPart.reduce((sum, val) => sum + val, 0), 2) +
      Math.pow(imagPart.reduce((sum, val) => sum + val, 0), 2)
    ) / realPart.reduce((sum, val) => sum + Math.abs(val), 0);

    const phase = Math.atan2(
      imagPart.reduce((sum, val) => sum + val, 0),
      realPart.reduce((sum, val) => sum + val, 0)
    );

    // Calculate confidence based on signal strength
    const maxAmplitude = Math.max(...data.map(p => p.activationScore * p.weight));
    const confidence = amplitude / maxAmplitude;

    return confidence > 0.3 ? { phase, amplitude, confidence } : null;
  }

  private detectUserBiases(weightedData: Array<BiasDataPoint & { weight: number }>): {
    detected: boolean;
    affectedUsers: string[];
    biasStrength: number;
  } {
    if (!this.config.patterns.userSpecific) {
      return { detected: false, affectedUsers: [], biasStrength: 0 };
    }

    // Group data by user context
    const userGroups = new Map<string, Array<BiasDataPoint & { weight: number }>>();

    for (const point of weightedData) {
      const userContext = point.metadata?.userContext || 'unknown';
      if (!userGroups.has(userContext)) {
        userGroups.set(userContext, []);
      }
      userGroups.get(userContext)!.push(point);
    }

    // Analyze each user's activation patterns
    const userBiases: Array<{ user: string; bias: number; samples: number }> = [];

    for (const [user, userData] of userGroups.entries()) {
      if (userData.length < 5) continue; // Need minimum samples

      const avgScore = userData.reduce((sum, point) => sum + point.activationScore * point.weight, 0) /
                        userData.reduce((sum, point) => sum + point.weight, 0);
      const globalAvg = weightedData.reduce((sum, point) => sum + point.activationScore * point.weight, 0) /
                        weightedData.reduce((sum, point) => sum + point.weight, 0);

      const bias = Math.abs(avgScore - globalAvg);
      userBiases.push({ user, bias, samples: userData.length });
    }

    if (userBiases.length === 0) {
      return { detected: false, affectedUsers: [], biasStrength: 0 };
    }

    const avgBias = userBiases.reduce((sum, user) => sum + user.bias, 0) / userBiases.length;
    const significantUsers = userBiases.filter(user => user.bias > 0.1);

    return {
      detected: significantUsers.length > 0,
      affectedUsers: significantUsers.map(user => user.user),
      biasStrength: avgBias
    };
  }

  private detectContextBiases(weightedData: Array<BiasDataPoint & { weight: number }>): {
    detected: boolean;
    affectedContexts: string[];
    biasStrength: number;
  } {
    if (!this.config.patterns.contextSpecific) {
      return { detected: false, affectedContexts: [], biasStrength: 0 };
    }

    // Group data by context features
    const contextGroups = new Map<string, Array<BiasDataPoint & { weight: number }>>();

    for (const point of weightedData) {
      const features = this.extractContextFeatures(point.context);
      const contextKey = features.join('|');

      if (!contextGroups.has(contextKey)) {
        contextGroups.set(contextKey, []);
      }
      contextGroups.get(contextKey)!.push(point);
    }

    // Analyze each context's activation patterns
    const contextBiases: Array<{ context: string; bias: number; samples: number }> = [];

    for (const [context, contextData] of contextGroups.entries()) {
      if (contextData.length < 3) continue;

      const avgScore = contextData.reduce((sum, point) => sum + point.activationScore * point.weight, 0) /
                        contextData.reduce((sum, point) => sum + point.weight, 0);
      const globalAvg = weightedData.reduce((sum, point) => sum + point.activationScore * point.weight, 0) /
                        weightedData.reduce((sum, point) => sum + point.weight, 0);

      const bias = Math.abs(avgScore - globalAvg);
      contextBiases.push({ context, bias, samples: contextData.length });
    }

    if (contextBiases.length === 0) {
      return { detected: false, affectedContexts: [], biasStrength: 0 };
    }

    const avgBias = contextBiases.reduce((sum, context) => sum + context.bias, 0) / contextBiases.length;
    const significantContexts = contextBiases.filter(context => context.bias > 0.1);

    return {
      detected: significantContexts.length > 0,
      affectedContexts: significantContexts.map(context => context.context),
      biasStrength: avgBias
    };
  }

  private extractContextFeatures(context: BiasDataPoint['context']): string[] {
    const features: string[] = [];

    features.push(`time:${Math.floor(context.timeOfDay / 4) * 4}`); // 4-hour blocks
    features.push(`dow:${context.dayOfWeek}`); // Day of week
    features.push(`week:${Math.floor(context.weekOfYear / 13)}`); // Bi-week blocks
    features.push(`month:${context.monthOfYear}`);
    features.push(`season:${context.season}`);

    return features;
  }

  // Bias detection methods
  private detectTemporalDrift(analysis: TimeSeriesAnalysis): BiasDetectionResult | null {
    const { overallTrend, trendSlope, rSquared } = analysis.analysis;

    if (overallTrend === 'stable' || rSquared < 0.3) {
      return null;
    }

    const severity = this.calculateSeverity(Math.abs(trendSlope), rSquared);
    const biasScore = this.calculateBiasScore(trendSlope, rSquared);

    return {
      skillName: analysis.skillName,
      biasType: 'temporal_drift',
      severity,
      confidence: rSquared,
      biasScore,
      description: `Detected ${overallTrend} trend in activation scores with ${(rSquared * 100).toFixed(1)}% confidence`,
      evidence: {
        detectedAt: Date.now(),
        affectedPeriod: this.getAffectedPeriod(analysis.dataPoints),
        sampleSize: analysis.dataPoints.length,
        statisticalSignificance: rSquared,
        patterns: [`${overallTrend} trend detected`],
        recommendations: [
          'Monitor trend progression',
          'Consider recalibrating weights if drift continues',
          'Review recent changes in activation patterns'
        ]
      },
      correctiveActions: {
        immediate: ['Increase monitoring frequency'],
        shortTerm: ['Review recent data points for anomalies', 'Validate trend significance'],
        longTerm: ['Implement trend correction mechanisms', 'Consider dynamic weight adjustment']
      }
    };
  }

  private detectSeasonalBias(analysis: TimeSeriesAnalysis): BiasDetectionResult | null {
    const { seasonality } = analysis.analysis;

    if (!seasonality.detected || seasonality.strength < 0.3) {
      return null;
    }

    const severity = this.calculateSeverity(seasonality.strength, 0.8);
    const biasScore = this.calculateBiasScore(seasonality.strength, 0.8);

    const strongestPattern = seasonality.patterns.reduce((max, current) =>
      current.strength > max.strength ? current : max
    );

    return {
      skillName: analysis.skillName,
      biasType: 'seasonal_bias',
      severity,
      confidence: seasonality.strength,
      biasScore,
      description: `Detected seasonal pattern in activation scores with ${(seasonality.strength * 100).toFixed(1)}% confidence: ${strongestPattern.pattern}`,
      evidence: {
        detectedAt: Date.now(),
        affectedPeriod: this.getAffectedPeriod(analysis.dataPoints),
        sampleSize: analysis.dataPoints.length,
        statisticalSignificance: seasonality.strength,
        patterns: seasonality.patterns.map(p => p.pattern),
        recommendations: [
          'Account for seasonal variations in activation scoring',
          'Implement seasonal weight adjustments',
          'Monitor pattern stability over time'
        ]
      },
      correctiveActions: {
        immediate: ['Apply seasonal correction factors'],
        shortTerm: ['Adjust activation weights for current season', 'Monitor pattern consistency'],
        longTerm: ['Implement automatic seasonal calibration', 'Update bias detection thresholds']
      }
    };
  }

  private detectUserBias(analysis: TimeSeriesAnalysis): BiasDetectionResult | null {
    const { userBias } = analysis.analysis;

    if (!userBias.detected || userBias.biasStrength < 0.1) {
      return null;
    }

    const severity = this.calculateSeverity(userBias.biasStrength, 0.6);
    const biasScore = this.calculateBiasScore(userBias.biasStrength, 0.6);

    return {
      skillName: analysis.skillName,
      biasType: 'user_specific',
      severity,
      confidence: Math.min(0.8, userBias.affectedUsers.length / 5), // More users = higher confidence
      biasScore,
      description: `Detected user-specific bias affecting ${userBias.affectedUsers.length} users with ${(userBias.biasStrength * 100).toFixed(1)}% bias strength`,
      evidence: {
        detectedAt: Date.now(),
        affectedPeriod: this.getAffectedPeriod(analysis.dataPoints),
        sampleSize: analysis.dataPoints.length,
        statisticalSignificance: Math.min(0.8, userBias.affectedUsers.length / 5),
        patterns: [`User bias detected for ${userBias.affectedUsers.length} users`],
        recommendations: [
          'Investigate user-specific activation patterns',
          'Consider personalized activation strategies',
          'Evaluate need for user-specific weighting'
        ]
      },
      correctiveActions: {
        immediate: ['Flag affected users for review'],
        shortTerm: ['Implement user-specific calibration', 'Create bias correction profiles'],
        longTerm: ['Personalize activation weights by user', 'Consider user segmentation']
      }
    };
  }

  private detectContextBias(analysis: TimeSeriesAnalysis): BiasDetectionResult | null {
    const { contextBias } = analysis.analysis;

    if (!contextBias.detected || contextBias.biasStrength < 0.1) {
      return null;
    }

    const severity = this.calculateSeverity(contextBias.biasStrength, 0.6);
    const biasScore = this.calculateBiasScore(contextBias.biasStrength, 0.6);

    return {
      skillName: analysis.skillName,
      biasType: 'context_bias',
      severity,
      confidence: Math.min(0.7, contextBias.affectedContexts.length / 3),
      biasScore,
      description: `Detected context-specific bias affecting ${contextBias.affectedContexts.length} contexts with ${(contextBias.biasStrength * 100).toFixed(1)}% bias strength`,
      evidence: {
        detectedAt: Date.now(),
        affectedPeriod: this.getAffectedPeriod(analysis.dataPoints),
        sampleSize: analysis.dataPoints.length,
        statisticalSignificance: Math.min(0.7, contextBias.affectedContexts.length / 3),
        patterns: [`Context bias detected for ${contextBias.affectedContexts.length} contexts`],
        recommendations: [
          'Analyze context-specific activation patterns',
          'Implement context-aware weighting strategies',
          'Review context classification accuracy'
        ]
      },
      correctiveActions: {
        immediate: ['Document affected contexts'],
        shortTerm: ['Apply context-specific corrections', 'Improve context detection'],
        longTerm: ['Implement context-aware calibration', 'Enhance context classification system']
      }
    };
  }

  private detectPatternAnomaly(analysis: TimeSeriesAnalysis): BiasDetectionResult | null {
    const { volatility, seasonality, periodicity } = analysis.analysis;

    if (volatility < 0.2) {
      return null;
    }

    const severity = this.calculateSeverity(volatility, 0.7);
    const biasScore = this.calculateBiasScore(volatility, 0.7);

    let patterns: string[] = ['High volatility detected'];
    if (seasonality.detected) {
      patterns.push('Seasonal patterns present');
    }
    if (periodicity.detected) {
      patterns.push(`Periodic pattern with ${periodicity.dominPeriod}ms period`);
    }

    return {
      skillName: analysis.skillName,
      biasType: 'pattern_anomaly',
      severity,
      confidence: Math.min(0.8, volatility),
      biasScore,
      description: `Detected anomalous activation patterns with ${(volatility * 100).toFixed(1)}% volatility`,
      evidence: {
        detectedAt: Date.now(),
        affectedPeriod: this.getAffectedPeriod(analysis.dataPoints),
        sampleSize: analysis.dataPoints.length,
        statisticalSignificance: volatility,
        patterns,
        recommendations: [
          'Investigate anomalous activation patterns',
          'Review recent changes or disruptions',
          'Check for data quality issues'
        ]
      },
      correctiveActions: {
        immediate: ['Increase monitoring frequency'],
        shortTerm: ['Investigate root causes of anomalies', 'Validate data integrity'],
        longTerm: ['Implement anomaly detection system', 'Add robust data validation']
      }
    };
  }

  // Utility methods
  private calculateSeverity(biasStrength: number, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    const combinedScore = biasesStrength * confidence;

    if (combinedScore < 0.1) return 'low';
    if (combinedScore < 0.3) return 'medium';
    if (combinedScore < 0.5) return 'high';
    return 'critical';
  }

  private calculateBiasScore(biasStrength: number, confidence: number): number {
    // Normalize bias score to 0-1 range
    return Math.min(1, Math.abs(biasStrength) * confidence);
  }

  private getAffectedPeriod(dataPoints: BiasDataPoint[]): string {
    if (dataPoints.length === 0) return 'No data';

    const start = new Date(dataPoints[0].timestamp);
    const end = new Date(dataPoints[dataPoints.length - 1].timestamp);
    const duration = end.getTime() - start.getTime();

    const days = Math.floor(duration / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Last few hours';
    if (days === 1) return 'Last day';
    if (days < 7) return `Last ${days} days`;
    if (days < 30) return `Last ${Math.floor(days / 7)} weeks`;
    return `Last ${Math.floor(days / 30)} months`;
  }

  private generateRecommendations(analysis: {
    trend: any;
    seasonality: any;
    periodicity: any;
    userBias: any;
    contextBias: any;
  }): string[] {
    const recommendations: string[] = [];

    if (analysis.trend.trend !== 'stable' && analysis.trend.rSquared > 0.5) {
      recommendations.push('Investigate trend causes and consider trend correction');
    }

    if (analysis.seasonality.detected) {
      recommendations.push('Implement seasonal awareness in activation system');
    }

    if (analysis.userBias.detected) {
      recommendations.push('Consider personalized activation strategies');
    }

    if (analysis.contextBias.detected) {
      recommendations.push('Enhance context-aware activation mechanisms');
    }

    if (analysis.periodicity.detected) {
      recommendations.push('Leverage detected periodic patterns in optimization');
    }

    return recommendations;
  }

  private scheduleAnalysis(skillName: string): void {
    // Simple implementation - in production, this would use a task queue
    setTimeout(() => {
      this.detectBiases(skillName);
    }, 1000);
  }

  private sendBiasAlert(bias: BiasDetectionResult[]): void {
    if (!this.config.alerting.enabled) return;

    for (const bias of biases) {
      if (bias.severity === 'critical' ||
          bias.biasScore > this.config.alerting.thresholds.bias_trend) {

        const message = `[${bias.severity.toUpperCase()}] Temporal Bias Alert: ${bias.description}`;

        for (const channel of this.config.alerting.channels) {
          switch (channel) {
            case 'console':
              console.log(`🚨 ${message}`);
              break;
            case 'log':
              console.log(`[BIAS ALERT] ${message}`);
              break;
            case 'webhook':
              console.log(`[WEBHOOK] ${message}`);
              break;
          }
        }
      }
    }
  }

  // Public API
  getActiveBiasAlerts(): BiasDetectionResult[] {
    // Return recent unresolved alerts
    return this.biasAlerts.filter(alert => !alert.resolved);
  }

  getAnalysisResult(skillName: string): TimeSeriesAnalysis | null {
    return this.analysisCache.get(skillName) || null;
  }

  getAllAnalysisResults(): Map<string, TimeSeriesAnalysis> {
    return new Map(this.analysisCache);
  }

  getSkillDataSize(): Record<string, number> {
    const sizes: Record<string, number> = {};
    for (const [skillName, data] of this.dataStore.entries()) {
      sizes[skillName] = data.length;
    }
    return sizes;
  }

  getDataStats(): {
    totalDataPoints: number;
    skillsTracked: number;
    oldestDataPoint: number | null;
    newestDataPoint: number | null;
    timeSpan: number | null;
  } {
    let totalDataPoints = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    for (const data of this.dataStore.values()) {
      totalDataPoints += data.length;
      for (const point of data) {
        if (point.timestamp < oldestTimestamp) oldestTimestamp = point.timestamp;
        if (point.timestamp > newestTimestamp) newestTimestamp = point.timestamp;
      }
    }

    return {
      totalDataPoints,
      skillsTracked: this.dataStore.size,
      oldestDataPoint: totalDataPoints > 0 ? oldestTimestamp : null,
      newestDataPoint: totalDataPoints > 0 ? newestTimestamp : null,
      timeSpan: totalDataPoints > 0 ? newestTimestamp - oldestTimestamp : null
    };
  }

  // Cleanup
  cleanup(): void {
    this.dataStore.clear();
    this.analysisCache.clear();
    this.lastAnalysis.clear();
    this.biasAlerts = [];
  }

  // Utility methods
  private mergeConfig(userConfig?: Partial<TemporalBiasConfig>): TemporalBiasConfig {
    const defaultConfig: TemporalBiasConfig = {
      enabled: true,
      timeWindows: {
        short: 60 * 60 * 1000,      // 1 hour
        medium: 24 * 60 * 60 * 1000,   // 1 day
        long: 7 * 24 * 60 * 60 * 1000,    // 1 week
        very_long: 30 * 24 * 60 * 60 * 1000 // 1 month
      },
      decay: {
        function: 'exponential',
        halfLife: 24 * 60 * 60 * 1000, // 1 day
        minWeight: 0.01,
        maxWeight: 1.0
      },
      detection: {
        sensitivity: 0.5,
        threshold: 0.3,
        minSampleSize: 10,
        confidenceLevel: 0.95
      },
      patterns: {
        seasonal: true,
        weekly: true,
        daily: false,
        hourly: false,
        userSpecific: true,
        contextSpecific: true
      },
      alerting: {
        enabled: true,
        channels: ['console', 'log'],
        thresholds: {
          temporal_drift: 0.2,
          pattern_anomaly: 0.3,
          bias_trend: 0.3
        }
      }
    };

    return this.deepMerge(defaultConfig, userConfig || {});
  }

  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }

    return result;
  }
}