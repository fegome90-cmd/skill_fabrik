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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.WeightOptimizer = void 0;
var WeightOptimizer = /** @class */ (function () {
    function WeightOptimizer(config, abTestManager) {
        this.config = __assign({ enabled: true, optimizationStrategy: 'gradient_descent', learningRate: 0.01, maxIterations: 1000, convergenceThreshold: 1e-6, regularization: {
                enabled: true,
                lambda: 0.01,
                minWeight: 0,
                maxWeight: 1
            }, validation: {
                holdoutRatio: 0.2,
                minValidationSamples: 50,
                crossValidationFolds: 5
            }, optimizationGoals: {
                primary: 'activation_accuracy',
                weights: {
                    activation_accuracy: 0.6,
                    precision: 0.2,
                    recall: 0.1,
                    latency: 0.1
                }
            }, constraints: {
                preserveOrder: false,
                sumToOne: true,
                monotonicity: []
            } }, config);
        this.abTestManager = abTestManager;
    }
    // Main optimization method
    WeightOptimizer.prototype.optimizeWeights = function (currentWeights, trainingData) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, preparedData, _a, trainingSet, validationSet, optimizationResult, finalWeights, validationScore;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.config.enabled) {
                            return [2 /*return*/, this.createNoOptimizationResult(currentWeights)];
                        }
                        startTime = Date.now();
                        preparedData = this.prepareTrainingData(trainingData);
                        if (preparedData.inputs.length < this.config.validation.minValidationSamples) {
                            throw new Error("Insufficient training data. Need at least ".concat(this.config.validation.minValidationSamples, " samples, got ").concat(preparedData.inputs.length));
                        }
                        _a = this.splitData(preparedData), trainingSet = _a.trainingSet, validationSet = _a.validationSet;
                        return [4 /*yield*/, this.runOptimization(currentWeights, trainingSet, validationSet)];
                    case 1:
                        optimizationResult = _b.sent();
                        finalWeights = this.applyConstraints(optimizationResult.weights);
                        validationScore = this.evaluateWeights(finalWeights, validationSet);
                        return [2 /*return*/, {
                                originalWeights: __assign({}, currentWeights),
                                optimizedWeights: finalWeights,
                                improvement: this.calculateImprovement(currentWeights, finalWeights, trainingSet, validationSet),
                                convergence: optimizationResult.convergence,
                                validation: {
                                    trainingScore: optimizationResult.finalScore,
                                    validationScore: validationScore,
                                    overfittingRisk: this.assessOverfittingRisk(optimizationResult.finalScore, validationScore)
                                },
                                metadata: {
                                    optimizationTime: Date.now() - startTime,
                                    samplesUsed: preparedData.inputs.length,
                                    algorithm: this.config.optimizationStrategy,
                                    timestamp: Date.now()
                                }
                            }];
                }
            });
        });
    };
    // Optimization strategies
    WeightOptimizer.prototype.runOptimization = function (initialWeights, trainingSet, validationSet) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (this.config.optimizationStrategy) {
                    case 'gradient_descent':
                        return [2 /*return*/, this.gradientDescentOptimization(initialWeights, trainingSet)];
                    case 'bayesian':
                        return [2 /*return*/, this.bayesianOptimization(initialWeights, trainingSet)];
                    case 'genetic':
                        return [2 /*return*/, this.geneticOptimization(initialWeights, trainingSet)];
                    case 'grid_search':
                        return [2 /*return*/, this.gridSearchOptimization(initialWeights, trainingSet)];
                    default:
                        throw new Error("Unsupported optimization strategy: ".concat(this.config.optimizationStrategy));
                }
                return [2 /*return*/];
            });
        });
    };
    WeightOptimizer.prototype.gradientDescentOptimization = function (initialWeights, trainingSet) {
        var weights = __assign({}, initialWeights);
        var optimizationPath = [];
        var previousLoss = Infinity;
        for (var iteration = 0; iteration < this.config.maxIterations; iteration++) {
            // Calculate gradients
            var gradients = this.calculateGradients(weights, trainingSet);
            // Update weights
            for (var _i = 0, _a = Object.entries(gradients); _i < _a.length; _i++) {
                var _b = _a[_i], signalName = _b[0], gradient = _b[1];
                weights[signalName] = weights[signalName] - this.config.learningRate * gradient;
            }
            // Apply constraints
            weights = this.applyConstraints(weights);
            // Calculate loss
            var currentLoss = this.calculateLoss(weights, trainingSet);
            optimizationPath.push(currentLoss);
            // Check convergence
            var lossImprovement = Math.abs(previousLoss - currentLoss);
            if (lossImprovement < this.config.convergenceThreshold) {
                return {
                    weights: weights,
                    finalScore: this.evaluateWeights(weights, trainingSet),
                    convergence: {
                        iterations: iteration + 1,
                        converged: true,
                        finalLoss: currentLoss,
                        optimizationPath: optimizationPath
                    }
                };
            }
            previousLoss = currentLoss;
        }
        return {
            weights: weights,
            finalScore: this.evaluateWeights(weights, trainingSet),
            convergence: {
                iterations: this.config.maxIterations,
                converged: false,
                finalLoss: previousLoss,
                optimizationPath: optimizationPath
            }
        };
    };
    WeightOptimizer.prototype.bayesianOptimization = function (initialWeights, trainingSet) {
        // Simplified Bayesian optimization using random sampling with probabilistic model
        // In a real implementation, this would use Gaussian Processes or similar
        var candidates = this.generateWeightCandidates(initialWeights, 50);
        var bestWeights = initialWeights;
        var bestScore = this.evaluateWeights(initialWeights, trainingSet);
        var optimizationPath = [bestScore];
        for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
            var candidate = candidates_1[_i];
            var score = this.evaluateWeights(candidate, trainingSet);
            optimizationPath.push(score);
            if (score > bestScore) {
                bestWeights = candidate;
                bestScore = score;
            }
        }
        return {
            weights: bestWeights,
            finalScore: bestScore,
            convergence: {
                iterations: candidates.length,
                converged: true,
                finalLoss: -bestScore, // Convert to loss (negative score)
                optimizationPath: optimizationPath
            }
        };
    };
    WeightOptimizer.prototype.geneticOptimization = function (initialWeights, trainingSet) {
        var _this = this;
        var populationSize = 20;
        var generations = 50;
        var mutationRate = 0.1;
        var elitismRate = 0.2;
        // Initialize population
        var population = this.initializePopulation(initialWeights, populationSize);
        var optimizationPath = [];
        for (var generation = 0; generation < generations; generation++) {
            // Evaluate fitness
            var fitnessScores = population.map(function (weights) { return ({
                weights: weights,
                fitness: _this.evaluateWeights(weights, trainingSet)
            }); });
            // Sort by fitness
            fitnessScores.sort(function (a, b) { return b.fitness - a.fitness; });
            // Record best fitness
            optimizationPath.push(fitnessScores[0].fitness);
            // Selection and reproduction
            var elites = fitnessScores.slice(0, Math.floor(populationSize * elitismRate));
            var newPopulation = elites.map(function (individual) { return individual.weights; });
            // Fill rest of population
            while (newPopulation.length < populationSize) {
                var parent1 = this.selectParent(fitnessScores);
                var parent2 = this.selectParent(fitnessScores);
                var child = this.crossover(parent1.weights, parent2.weights);
                var mutatedChild = this.mutate(child, mutationRate);
                newPopulation.push(this.applyConstraints(mutatedChild));
            }
            population = newPopulation;
        }
        var finalWeights = population[0];
        var finalScore = this.evaluateWeights(finalWeights, trainingSet);
        return {
            weights: finalWeights,
            finalScore: finalScore,
            convergence: {
                iterations: generations,
                converged: true,
                finalLoss: -finalScore,
                optimizationPath: optimizationPath
            }
        };
    };
    WeightOptimizer.prototype.gridSearchOptimization = function (initialWeights, trainingSet) {
        var stepSize = 0.1;
        var signalNames = Object.keys(initialWeights);
        var optimizationPath = [];
        var bestWeights = initialWeights;
        var bestScore = this.evaluateWeights(initialWeights, trainingSet);
        optimizationPath.push(bestScore);
        // Generate grid points around initial weights
        var gridPoints = this.generateGridPoints(initialWeights, stepSize, 3); // 3 points per dimension
        for (var _i = 0, gridPoints_1 = gridPoints; _i < gridPoints_1.length; _i++) {
            var point = gridPoints_1[_i];
            var score = this.evaluateWeights(point, trainingSet);
            optimizationPath.push(score);
            if (score > bestScore) {
                bestWeights = point;
                bestScore = score;
            }
        }
        return {
            weights: bestWeights,
            finalScore: bestScore,
            convergence: {
                iterations: gridPoints.length,
                converged: true,
                finalLoss: -bestScore,
                optimizationPath: optimizationPath
            }
        };
    };
    // Helper methods for optimization
    WeightOptimizer.prototype.calculateGradients = function (weights, trainingSet) {
        var gradients = {};
        var epsilon = 1e-5;
        var baseScore = this.evaluateWeights(weights, trainingSet);
        for (var _i = 0, _a = Object.keys(weights); _i < _a.length; _i++) {
            var signalName = _a[_i];
            var perturbedWeights = __assign({}, weights);
            perturbedWeights[signalName] += epsilon;
            var perturbedScore = this.evaluateWeights(perturbedWeights, trainingSet);
            gradients[signalName] = (perturbedScore - baseScore) / epsilon;
        }
        return gradients;
    };
    WeightOptimizer.prototype.calculateLoss = function (weights, trainingSet) {
        var score = this.evaluateWeights(weights, trainingSet);
        var loss = -score; // Convert score to loss (minimize negative score)
        // Add regularization
        if (this.config.regularization.enabled) {
            var l2Penalty = Object.values(weights).reduce(function (sum, weight) { return sum + weight * weight; }, 0);
            loss += this.config.regularization.lambda * l2Penalty;
        }
        return loss;
    };
    WeightOptimizer.prototype.evaluateWeights = function (weights, data) {
        var totalScore = 0;
        var correctPredictions = 0;
        for (var i = 0; i < data.inputs.length; i++) {
            var input = data.inputs[i];
            var target = data.targets[i];
            // Calculate weighted score
            var weightedSum = 0;
            var weightSum = 0;
            for (var _i = 0, _a = Object.entries(input.signals); _i < _a.length; _i++) {
                var _b = _a[_i], signalName = _b[0], signalValue = _b[1];
                var weight = weights[signalName] || 0;
                weightedSum += signalValue * weight;
                weightSum += Math.abs(weight);
            }
            var predictedScore = weightSum > 0 ? weightedSum / weightSum : 0;
            var predictedActivation = predictedScore >= 0.5; // Default threshold
            // Calculate score based on optimization goal
            var sampleScore = 0;
            switch (this.config.optimizationGoals.primary) {
                case 'activation_accuracy':
                    sampleScore = predictedActivation === target.shouldActivate ? 1 : 0;
                    break;
                case 'precision':
                    sampleScore = predictedActivation && target.shouldActivate ? 1 : 0;
                    break;
                case 'recall':
                    sampleScore = target.shouldActivate ? (predictedActivation ? 1 : 0) : 1;
                    break;
                default:
                    sampleScore = 1 - Math.abs(predictedScore - target.actualScore);
            }
            totalScore += sampleScore;
            if (predictedActivation === target.shouldActivate) {
                correctPredictions++;
            }
        }
        return totalScore / data.inputs.length;
    };
    WeightOptimizer.prototype.applyConstraints = function (weights) {
        var constrained = __assign({}, weights);
        // Apply min/max constraints
        for (var _i = 0, _a = Object.entries(constrained); _i < _a.length; _i++) {
            var _b = _a[_i], signalName = _b[0], weight = _b[1];
            constrained[signalName] = Math.max(this.config.regularization.minWeight, Math.min(this.config.regularization.maxWeight, weight));
        }
        // Apply sum-to-one constraint
        if (this.config.constraints.sumToOne) {
            var totalWeight = Object.values(constrained).reduce(function (sum, weight) { return sum + Math.abs(weight); }, 0);
            if (totalWeight > 0) {
                for (var _c = 0, _d = Object.keys(constrained); _c < _d.length; _c++) {
                    var signalName = _d[_c];
                    constrained[signalName] = constrained[signalName] / totalWeight;
                }
            }
        }
        return constrained;
    };
    WeightOptimizer.prototype.generateWeightCandidates = function (baseWeights, count) {
        var candidates = [];
        var signalNames = Object.keys(baseWeights);
        for (var i = 0; i < count; i++) {
            var candidate = {};
            for (var _i = 0, signalNames_1 = signalNames; _i < signalNames_1.length; _i++) {
                var signalName = signalNames_1[_i];
                // Random perturbation around base weight
                var perturbation = (Math.random() - 0.5) * 0.2; // ±10% perturbation
                candidate[signalName] = Math.max(0, Math.min(1, baseWeights[signalName] + perturbation));
            }
            candidates.push(this.applyConstraints(candidate));
        }
        return candidates;
    };
    WeightOptimizer.prototype.initializePopulation = function (baseWeights, size) {
        var population = [];
        for (var i = 0; i < size; i++) {
            var individual = {};
            for (var _i = 0, _a = Object.entries(baseWeights); _i < _a.length; _i++) {
                var _b = _a[_i], signalName = _b[0], baseWeight = _b[1];
                // Random variation around base weight
                individual[signalName] = Math.max(0, Math.min(1, baseWeight + (Math.random() - 0.5) * 0.4));
            }
            population.push(this.applyConstraints(individual));
        }
        return population;
    };
    WeightOptimizer.prototype.selectParent = function (fitnessScores) {
        // Tournament selection
        var tournamentSize = 3;
        var best = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
        for (var i = 1; i < tournamentSize; i++) {
            var candidate = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
            if (candidate.fitness > best.fitness) {
                best = candidate;
            }
        }
        return best;
    };
    WeightOptimizer.prototype.crossover = function (parent1, parent2) {
        var child = {};
        for (var _i = 0, _a = Object.keys(parent1); _i < _a.length; _i++) {
            var signalName = _a[_i];
            child[signalName] = Math.random() < 0.5 ? parent1[signalName] : parent2[signalName];
        }
        return child;
    };
    WeightOptimizer.prototype.mutate = function (weights, mutationRate) {
        var mutated = __assign({}, weights);
        for (var _i = 0, _a = Object.entries(mutated); _i < _a.length; _i++) {
            var _b = _a[_i], signalName = _b[0], weight = _b[1];
            if (Math.random() < mutationRate) {
                mutated[signalName] = Math.max(0, Math.min(1, weight + (Math.random() - 0.5) * 0.2));
            }
        }
        return mutated;
    };
    WeightOptimizer.prototype.generateGridPoints = function (center, stepSize, pointsPerDimension) {
        var signalNames = Object.keys(center);
        var points = [center];
        // Generate all combinations of +/- stepSize around center
        var offsets = [];
        for (var i = -(pointsPerDimension - 1) / 2; i <= (pointsPerDimension - 1) / 2; i++) {
            if (i !== 0)
                offsets.push(i * stepSize);
        }
        // Generate Cartesian product of offsets
        var generateCombinations = function (dimension) {
            if (dimension === 0)
                return [[]];
            var rest = generateCombinations(dimension - 1);
            return rest.flatMap(function (combination) { return offsets.map(function (offset) { return __spreadArray(__spreadArray([], combination, true), [offset], false); }); });
        };
        var combinations = generateCombinations(signalNames.length);
        for (var _i = 0, combinations_1 = combinations; _i < combinations_1.length; _i++) {
            var combination = combinations_1[_i];
            var point = {};
            for (var i = 0; i < signalNames.length; i++) {
                point[signalNames[i]] = Math.max(0, Math.min(1, center[signalNames[i]] + combination[i]));
            }
            points.push(this.applyConstraints(point));
        }
        return points;
    };
    // Data preparation and validation
    WeightOptimizer.prototype.prepareTrainingData = function (data) {
        // Filter out invalid entries
        var validInputs = [];
        var validTargets = [];
        for (var i = 0; i < data.inputs.length; i++) {
            var input = data.inputs[i];
            var target = data.targets[i];
            // Validate that input has signal data and target is valid
            if (input.signals && Object.keys(input.signals).length > 0 &&
                target !== undefined && target !== null) {
                validInputs.push(input);
                validTargets.push(target);
            }
        }
        return {
            inputs: validInputs,
            targets: validTargets
        };
    };
    WeightOptimizer.prototype.splitData = function (data) {
        var shuffledIndices = Array.from({ length: data.inputs.length }, function (_, i) { return i; })
            .sort(function () { return Math.random() - 0.5; });
        var splitIndex = Math.floor(data.inputs.length * (1 - this.config.validation.holdoutRatio));
        var trainingIndices = shuffledIndices.slice(0, splitIndex);
        var validationIndices = shuffledIndices.slice(splitIndex);
        return {
            trainingSet: {
                inputs: trainingIndices.map(function (i) { return data.inputs[i]; }),
                targets: trainingIndices.map(function (i) { return data.targets[i]; })
            },
            validationSet: {
                inputs: validationIndices.map(function (i) { return data.inputs[i]; }),
                targets: validationIndices.map(function (i) { return data.targets[i]; })
            }
        };
    };
    // Result calculation and analysis
    WeightOptimizer.prototype.calculateImprovement = function (originalWeights, optimizedWeights, trainingSet, validationSet) {
        var originalScore = this.evaluateWeights(originalWeights, validationSet);
        var optimizedScore = this.evaluateWeights(optimizedWeights, validationSet);
        var relativeImprovement = ((optimizedScore - originalScore) / originalScore) * 100;
        // Calculate secondary metrics
        var secondaryMetrics = {};
        for (var _i = 0, _a = Object.keys(this.config.optimizationGoals.weights); _i < _a.length; _i++) {
            var goal = _a[_i];
            if (goal !== this.config.optimizationGoals.primary) {
                // Temporarily switch primary goal to calculate secondary metric
                var originalPrimary = this.config.optimizationGoals.primary;
                this.config.optimizationGoals.primary = goal;
                var originalSecondary = this.evaluateWeights(originalWeights, validationSet);
                var optimizedSecondary = this.evaluateWeights(optimizedWeights, validationSet);
                secondaryMetrics[goal] = ((optimizedSecondary - originalSecondary) / originalSecondary) * 100;
                this.config.optimizationGoals.primary = originalPrimary;
            }
        }
        return {
            primaryMetric: optimizedScore,
            secondaryMetrics: secondaryMetrics,
            relativeImprovement: relativeImprovement
        };
    };
    WeightOptimizer.prototype.assessOverfittingRisk = function (trainingScore, validationScore) {
        var gap = trainingScore - validationScore;
        if (gap > 0.1)
            return 'high';
        if (gap > 0.05)
            return 'medium';
        return 'low';
    };
    WeightOptimizer.prototype.createNoOptimizationResult = function (weights) {
        return {
            originalWeights: __assign({}, weights),
            optimizedWeights: __assign({}, weights),
            improvement: {
                primaryMetric: 0,
                secondaryMetrics: {},
                relativeImprovement: 0
            },
            convergence: {
                iterations: 0,
                converged: false,
                finalLoss: 0,
                optimizationPath: []
            },
            validation: {
                trainingScore: 0,
                validationScore: 0,
                overfittingRisk: 'low'
            },
            metadata: {
                optimizationTime: 0,
                samplesUsed: 0,
                algorithm: 'none',
                timestamp: Date.now()
            }
        };
    };
    // Public API methods
    WeightOptimizer.prototype.setABTestManager = function (abTestManager) {
        this.abTestManager = abTestManager;
    };
    WeightOptimizer.prototype.getOptimizationConfig = function () {
        return __assign({}, this.config);
    };
    WeightOptimizer.prototype.updateOptimizationConfig = function (updates) {
        Object.assign(this.config, updates);
    };
    // Integration with A/B testing
    WeightOptimizer.prototype.createWeightOptimizationExperiment = function (skillName, currentWeights, targetWeights, description) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.abTestManager) {
                    throw new Error('ABTestManager not configured. Cannot create weight optimization experiment.');
                }
                return [2 /*return*/, this.abTestManager.createExperiment({
                        name: "Weight Optimization - ".concat(skillName),
                        description: description || "A/B test for optimized weights vs current weights for ".concat(skillName),
                        trafficSplit: this.config.defaultTrafficSplit || { control: 0.5, treatment: 0.5 },
                        targetSkills: [skillName],
                        minSampleSize: this.config.validation.minValidationSamples,
                        confidenceLevel: 0.95,
                        statisticalPower: 0.8,
                        variants: {
                            control: {
                                weights: currentWeights,
                                description: 'Current weights'
                            },
                            treatment: {
                                weights: targetWeights,
                                description: 'Optimized weights'
                            }
                        },
                        successMetrics: [this.config.optimizationGoals.primary]
                    })];
            });
        });
    };
    return WeightOptimizer;
}());
exports.WeightOptimizer = WeightOptimizer;
//# sourceMappingURL=WeightOptimizer.js.map