"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABTestManager = void 0;
var ABTestManager = /** @class */ (function () {
    function ABTestManager(config) {
        this.experiments = new Map();
        this.results = [];
        this.userAssignments = new Map();
        this.config = __assign({ enabled: true, storageMode: 'memory', autoCleanup: true, retentionPeriod: 30 * 24 * 60 * 60 * 1000, defaultTrafficSplit: { control: 0.5, treatment: 0.5 }, maxConcurrentExperiments: 10, enableRealtimeAnalysis: false }, config);
    }
    // Experiment Management
    ABTestManager.prototype.createExperiment = function (config) {
        var experimentId = this.generateExperimentId();
        var now = Date.now();
        var experiment = __assign(__assign({}, config), { id: experimentId, status: 'draft', createdAt: now, updatedAt: now });
        this.experiments.set(experimentId, experiment);
        return experimentId;
    };
    ABTestManager.prototype.updateExperiment = function (experimentId, updates) {
        var experiment = this.experiments.get(experimentId);
        if (!experiment)
            return false;
        this.experiments.set(experimentId, __assign(__assign(__assign({}, experiment), updates), { updatedAt: Date.now() }));
        return true;
    };
    ABTestManager.prototype.startExperiment = function (experimentId) {
        var experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'draft')
            return false;
        if (this.getActiveExperiments().length >= this.config.maxConcurrentExperiments) {
            throw new Error("Maximum concurrent experiments (".concat(this.config.maxConcurrentExperiments, ") reached"));
        }
        return this.updateExperiment(experimentId, {
            status: 'running',
            startTime: Date.now()
        });
    };
    ABTestManager.prototype.pauseExperiment = function (experimentId) {
        var experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'running')
            return false;
        return this.updateExperiment(experimentId, {
            status: 'paused'
        });
    };
    ABTestManager.prototype.resumeExperiment = function (experimentId) {
        var experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'paused')
            return false;
        return this.updateExperiment(experimentId, {
            status: 'running'
        });
    };
    ABTestManager.prototype.completeExperiment = function (experimentId) {
        var experiment = this.experiments.get(experimentId);
        if (!experiment || !['running', 'paused'].includes(experiment.status))
            return false;
        return this.updateExperiment(experimentId, {
            status: 'completed',
            endTime: Date.now()
        });
    };
    ABTestManager.prototype.deleteExperiment = function (experimentId) {
        // Remove experiment and all associated results
        var deleted = this.experiments.delete(experimentId);
        if (deleted) {
            this.results = this.results.filter(function (r) { return r.experimentId !== experimentId; });
        }
        return deleted;
    };
    // User Assignment and Variant Selection
    ABTestManager.prototype.assignVariant = function (experimentId, userId, context) {
        var experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'running')
            return null;
        // Check if user is already assigned
        var userAssignments = this.userAssignments.get(experimentId) || new Map();
        var existingAssignment = userAssignments.get(userId);
        if (existingAssignment) {
            return existingAssignment;
        }
        // Check if experiment applies to this context
        if (experiment.targetSkills && (context === null || context === void 0 ? void 0 : context.skillName)) {
            if (!experiment.targetSkills.includes(context.skillName)) {
                return null;
            }
        }
        // Assign variant based on traffic split
        var variant = this.selectVariant(experiment.trafficSplit);
        userAssignments.set(userId, variant);
        this.userAssignments.set(experimentId, userAssignments);
        return variant;
    };
    ABTestManager.prototype.selectVariant = function (trafficSplit) {
        var random = Math.random();
        return random < trafficSplit.control ? 'control' : 'treatment';
    };
    // Result Recording and Analysis
    ABTestManager.prototype.recordResult = function (result) {
        var fullResult = __assign(__assign({}, result), { timestamp: Date.now() });
        this.results.push(fullResult);
        this.maintainResultsSize();
        if (this.config.enableRealtimeAnalysis) {
            this.performRealtimeAnalysis(result.experimentId);
        }
    };
    ABTestManager.prototype.maintainResultsSize = function () {
        if (this.config.autoCleanup) {
            var cutoff_1 = Date.now() - this.config.retentionPeriod;
            this.results = this.results.filter(function (r) { return r.timestamp >= cutoff_1; });
        }
    };
    ABTestManager.prototype.getExperimentSummary = function (experimentId) {
        var experiment = this.experiments.get(experimentId);
        if (!experiment)
            return null;
        var experimentResults = this.results.filter(function (r) { return r.experimentId === experimentId; });
        var controlResults = experimentResults.filter(function (r) { return r.variant === 'control'; });
        var treatmentResults = experimentResults.filter(function (r) { return r.variant === 'treatment'; });
        if (experimentResults.length === 0) {
            return this.createEmptySummary(experiment);
        }
        var controlMetrics = this.calculateMetrics(controlResults);
        var treatmentMetrics = this.calculateMetrics(treatmentResults);
        var statisticalSignificance = this.calculateStatisticalSignificance(controlResults, treatmentResults, experiment.confidenceLevel);
        var recommendation = this.generateRecommendation(controlMetrics, treatmentMetrics, statisticalSignificance, experiment);
        return {
            experimentId: experimentId,
            name: experiment.name,
            status: experiment.status,
            totalSamples: experimentResults.length,
            controlSamples: controlResults.length,
            treatmentSamples: treatmentResults.length,
            controlMetrics: controlMetrics,
            treatmentMetrics: treatmentMetrics,
            statisticalSignificance: statisticalSignificance,
            recommendation: recommendation,
            summary: this.generateSummary(controlMetrics, treatmentMetrics, statisticalSignificance, recommendation),
            generatedAt: Date.now()
        };
    };
    ABTestManager.prototype.calculateMetrics = function (results) {
        if (results.length === 0) {
            return { activationRate: 0, averageScore: 0, averageLatency: 0, successRate: 0 };
        }
        var activations = results.filter(function (r) { return r.activationDecision.activate; });
        var activationRate = activations.length / results.length;
        var averageScore = results.reduce(function (sum, r) { return sum + r.activationDecision.finalScore; }, 0) / results.length;
        var averageLatency = results.reduce(function (sum, r) { return sum + r.latency; }, 0) / results.length;
        var successRate = 1; // Assuming all recorded results are successful for now
        return {
            activationRate: activationRate,
            averageScore: averageScore,
            averageLatency: averageLatency,
            successRate: successRate
        };
    };
    ABTestManager.prototype.calculateStatisticalSignificance = function (controlResults, treatmentResults, confidenceLevel) {
        if (controlResults.length < 30 || treatmentResults.length < 30) {
            return {
                pValue: 1,
                isSignificant: false,
                confidenceInterval: [0, 0],
                effect: 'neutral',
                lift: 0
            };
        }
        // Calculate activation rates
        var controlRate = controlResults.filter(function (r) { return r.activationDecision.activate; }).length / controlResults.length;
        var treatmentRate = treatmentResults.filter(function (r) { return r.activationDecision.activate; }).length / treatmentResults.length;
        // Perform two-proportion z-test
        var n1 = controlResults.length;
        var n2 = treatmentResults.length;
        var p1 = controlRate;
        var p2 = treatmentRate;
        var pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
        var standardError = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
        var zScore = (p2 - p1) / standardError;
        // Calculate p-value (two-tailed test)
        var pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
        // Calculate confidence interval
        var zCritical = this.normalQuantile(1 - (1 - confidenceLevel) / 2);
        var marginOfError = zCritical * standardError;
        var difference = p2 - p1;
        var confidenceInterval = [
            difference - marginOfError,
            difference + marginOfError
        ];
        var isSignificant = pValue < (1 - confidenceLevel);
        var lift = n1 > 0 ? ((p2 - p1) / p1) * 100 : 0;
        var effect;
        if (lift > 1)
            effect = 'positive';
        else if (lift < -1)
            effect = 'negative';
        else
            effect = 'neutral';
        return {
            pValue: pValue,
            isSignificant: isSignificant,
            confidenceInterval: confidenceInterval,
            effect: effect,
            lift: lift
        };
    };
    ABTestManager.prototype.normalCDF = function (x) {
        // Approximation of normal CDF
        var a1 = 0.254829592;
        var a2 = -0.284496736;
        var a3 = 1.421413741;
        var a4 = -1.453152027;
        var a5 = 1.061405429;
        var p = 0.3275911;
        var sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);
        var t = 1 / (1 + p * x);
        var y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1 + sign * y);
    };
    ABTestManager.prototype.normalQuantile = function (p) {
        // Approximation of normal quantile function
        var a1 = -3.969683028665376e+01;
        var a2 = 2.209460984245205e+02;
        var a3 = -2.759285104469687e+02;
        var a4 = 1.383577518672690e+02;
        var a5 = -3.066479806614716e+01;
        var a6 = 2.506628277459239e+00;
        var b1 = -5.447609879822406e+01;
        var b2 = 1.615858368580409e+02;
        var b3 = -1.556989798598866e+02;
        var b4 = 6.680131188771972e+01;
        var b5 = -1.328068155288572e+01;
        var c1 = -7.784894002430293e-03;
        var c2 = -3.223964580411365e-01;
        var c3 = -2.400758277161838e+00;
        var c4 = -2.549732539343734e+00;
        var c5 = 4.374664141464968e+00;
        var c6 = 2.938163982698783e+00;
        var d1 = 7.784695709041462e-03;
        var d2 = 3.224671290700398e-01;
        var d3 = 2.445134137142996e+00;
        var d4 = 3.754408661907416e+00;
        var pLow = 0.02425;
        var pHigh = 1 - pLow;
        var q, r;
        if (p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            r = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        }
        else if (p <= pHigh) {
            q = p - 0.5;
            r = q * q;
            r = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
        }
        else {
            q = Math.sqrt(-2 * Math.log(1 - p));
            r = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        }
        return r;
    };
    ABTestManager.prototype.generateRecommendation = function (controlMetrics, treatmentMetrics, statisticalSignificance, experiment) {
        var minSamplesReached = Math.min(controlMetrics.activationRate > 0 ? 100 : 0, treatmentMetrics.activationRate > 0 ? 100 : 0) >= experiment.minSampleSize;
        if (!minSamplesReached) {
            return 'continue';
        }
        if (!statisticalSignificance.isSignificant) {
            return 'inconclusive';
        }
        if (statisticalSignificance.effect === 'positive' && statisticalSignificance.lift > 5) {
            return 'rollout';
        }
        else if (statisticalSignificance.effect === 'negative' && statisticalSignificance.lift < -5) {
            return 'rollback';
        }
        else {
            return 'inconclusive';
        }
    };
    ABTestManager.prototype.generateSummary = function (controlMetrics, treatmentMetrics, statisticalSignificance, recommendation) {
        var liftText = statisticalSignificance.lift > 0 ? "+".concat(statisticalSignificance.lift.toFixed(1), "%") : "".concat(statisticalSignificance.lift.toFixed(1), "%");
        var significanceText = statisticalSignificance.isSignificant ? 'statistically significant' : 'not statistically significant';
        return "Treatment variant shows ".concat(statisticalSignificance.effect, " effect with ").concat(liftText, " lift. Results are ").concat(significanceText, " (p=").concat(statisticalSignificance.pValue.toFixed(3), "). Recommendation: ").concat(recommendation, ".");
    };
    ABTestManager.prototype.createEmptySummary = function (experiment) {
        return {
            experimentId: experiment.id,
            name: experiment.name,
            status: experiment.status,
            totalSamples: 0,
            controlSamples: 0,
            treatmentSamples: 0,
            controlMetrics: { activationRate: 0, averageScore: 0, averageLatency: 0, successRate: 0 },
            treatmentMetrics: { activationRate: 0, averageScore: 0, averageLatency: 0, successRate: 0 },
            statisticalSignificance: {
                pValue: 1,
                isSignificant: false,
                confidenceInterval: [0, 0],
                effect: 'neutral',
                lift: 0
            },
            recommendation: 'continue',
            summary: 'No data available yet.',
            generatedAt: Date.now()
        };
    };
    ABTestManager.prototype.performRealtimeAnalysis = function (experimentId) {
        // This could trigger automatic actions based on results
        // For now, it's a placeholder for future enhancement
        var summary = this.getExperimentSummary(experimentId);
        if (summary && summary.recommendation === 'rollback') {
            console.warn("Experiment ".concat(experimentId, " shows negative results. Consider rolling back."));
        }
    };
    // Utility Methods
    ABTestManager.prototype.getExperiment = function (experimentId) {
        return this.experiments.get(experimentId);
    };
    ABTestManager.prototype.getActiveExperiments = function () {
        return Array.from(this.experiments.values()).filter(function (e) { return e.status === 'running'; });
    };
    ABTestManager.prototype.getAllExperiments = function () {
        return Array.from(this.experiments.values());
    };
    ABTestManager.prototype.getResults = function (experimentId) {
        return this.results.filter(function (r) { return r.experimentId === experimentId; });
    };
    ABTestManager.prototype.generateExperimentId = function () {
        return "exp_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 8));
    };
    // Export and Import
    ABTestManager.prototype.exportData = function () {
        var experiments = {};
        this.experiments.forEach(function (exp, id) { experiments[id] = exp; });
        var userAssignments = {};
        this.userAssignments.forEach(function (assignments, expId) {
            userAssignments[expId] = Object.fromEntries(assignments);
        });
        return {
            experiments: experiments,
            results: __spreadArray([], this.results, true),
            userAssignments: userAssignments,
            exportedAt: new Date().toISOString()
        };
    };
    ABTestManager.prototype.importData = function (data) {
        var _this = this;
        // Clear existing data
        this.experiments.clear();
        this.results = [];
        this.userAssignments.clear();
        // Import experiments
        Object.entries(data.experiments).forEach(function (_a) {
            var id = _a[0], config = _a[1];
            _this.experiments.set(id, config);
        });
        // Import results
        this.results = __spreadArray([], data.results, true);
        // Import user assignments
        if (data.userAssignments) {
            Object.entries(data.userAssignments).forEach(function (_a) {
                var expId = _a[0], assignments = _a[1];
                var assignmentMap = new Map(Object.entries(assignments));
                _this.userAssignments.set(expId, assignmentMap);
            });
        }
    };
    // Cleanup
    ABTestManager.prototype.cleanup = function () {
        if (this.config.autoCleanup) {
            var cutoff = Date.now() - this.config.retentionPeriod;
            // Clean up old experiments
            for (var _i = 0, _a = this.experiments.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], id = _b[0], experiment = _b[1];
                if (experiment.status === 'completed' && experiment.endTime && experiment.endTime < cutoff) {
                    this.deleteExperiment(id);
                }
            }
            // Clean up old results
            this.maintainResultsSize();
        }
    };
    return ABTestManager;
}());
exports.ABTestManager = ABTestManager;
//# sourceMappingURL=ABTestManager.js.map